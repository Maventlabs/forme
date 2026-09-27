import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildProviderEndpointUrl,
  normalizeProviderBaseUrl,
  requestProviderJson,
  type ProviderDnsAddress,
  type ProviderUrlDependencies,
} from './provider-url'

const publicAddress: ProviderDnsAddress = { address: '93.184.216.34', family: 4 }

test('normalizes OpenAI-compatible and Qwen base URL forms', () => {
  const cases: Array<[string, string]> = [
    ['https://provider.invalid', 'https://provider.invalid'],
    ['https://provider.invalid/', 'https://provider.invalid'],
    ['https://provider.invalid/v1', 'https://provider.invalid/v1'],
    ['https://provider.invalid/v1/', 'https://provider.invalid/v1'],
    ['https://provider.invalid/v1/chat/completions', 'https://provider.invalid/v1'],
    ['https://provider.invalid/chat/completions', 'https://provider.invalid'],
    ['https://provider.invalid/compatible-mode/v1', 'https://provider.invalid/compatible-mode/v1'],
    ['https://provider.invalid/compatible-mode/v1/chat/completions/', 'https://provider.invalid/compatible-mode/v1'],
  ]

  for (const [input, expected] of cases) {
    assert.equal(normalizeProviderBaseUrl(input), expected)
  }
})

test('joins model and chat endpoints without duplicating version or completion paths', () => {
  const cases: Array<[string, string, string]> = [
    ['https://provider.invalid', 'https://provider.invalid/models', 'https://provider.invalid/chat/completions'],
    ['https://provider.invalid/v1', 'https://provider.invalid/v1/models', 'https://provider.invalid/v1/chat/completions'],
    ['https://provider.invalid/v1/chat/completions', 'https://provider.invalid/v1/models', 'https://provider.invalid/v1/chat/completions'],
    ['https://provider.invalid/chat/completions', 'https://provider.invalid/models', 'https://provider.invalid/chat/completions'],
    [
      'https://provider.invalid/compatible-mode/v1',
      'https://provider.invalid/compatible-mode/v1/models',
      'https://provider.invalid/compatible-mode/v1/chat/completions',
    ],
  ]

  for (const [base, models, chat] of cases) {
    assert.equal(buildProviderEndpointUrl(base, 'models').href, models)
    assert.equal(buildProviderEndpointUrl(base, 'chat/completions').href, chat)
  }
})

test('rejects unsafe or malformed base URLs without echoing the supplied value', () => {
  const invalidInputs = [
    'http://provider.invalid/v1',
    'https://user:password@provider.invalid/v1',
    'https://provider.invalid/v1?key=secret',
    'https://provider.invalid/v1#fragment',
    'https://93.184.216.34/v1',
    'https://[2606:4700:4700::1111]/v1',
    'https://provider.invalid:0/v1',
    'https://provider.invalid:65536/v1',
    'https://provider.invalid:not-a-port/v1',
    'https://',
    'not a URL',
    'https://provider.invalid/a/../v1',
    'https://provider.invalid/%2e%2e/v1',
    'https://provider.invalid/v1/v1',
    'https://provider.invalid/v1/v1/chat/completions',
    'https://provider.invalid/v1/chat/completions/chat/completions',
    'https://provider.invalid/v1/chat/completions/v1',
    'https://provider.invalid/v1/models',
  ]

  for (const input of invalidInputs) {
    assert.throws(
      () => normalizeProviderBaseUrl(input),
      (error: unknown) => error instanceof Error && !error.message.includes(input),
    )
  }
})

test('rejects the whole request if any DNS answer is not public', async () => {
  const unsafeAddresses: ProviderDnsAddress[] = [
    { address: '10.0.0.8', family: 4 },
    { address: '192.0.2.8', family: 4 },
    { address: '198.51.100.8', family: 4 },
    { address: '224.0.0.1', family: 4 },
    { address: '240.0.0.1', family: 4 },
    { address: 'fc00::8', family: 6 },
    { address: 'fe80::8', family: 6 },
    { address: '2001:2::8', family: 6 },
    { address: '2001:db8::8', family: 6 },
    { address: '2002:c000:0201::8', family: 6 },
    { address: '5f00::8', family: 6 },
  ]

  for (const unsafeAddress of unsafeAddresses) {
    let transportCalls = 0
    const dependencies: ProviderUrlDependencies = {
      resolveDns: async () => [publicAddress, unsafeAddress],
      transport: async () => {
        transportCalls += 1
        return { statusCode: 200, body: Buffer.from('{}') }
      },
    }

    await assert.rejects(
      requestProviderJson(buildProviderEndpointUrl('https://provider.invalid/v1', 'models'), { method: 'GET' }, dependencies),
      (error: unknown) => error instanceof Error && !error.message.includes('provider.invalid'),
    )
    assert.equal(transportCalls, 0)
  }
})

test('allows globally reachable special-purpose DNS ranges', async () => {
  const globallyReachable: ProviderDnsAddress[] = [
    { address: '192.31.196.10', family: 4 },
    { address: '192.52.193.10', family: 4 },
    { address: '192.175.48.10', family: 4 },
    { address: '2620:4f:8000::10', family: 6 },
  ]

  for (const address of globallyReachable) {
    let transportCalls = 0
    const result = await requestProviderJson(
      buildProviderEndpointUrl('https://provider.invalid/v1', 'models'),
      { method: 'GET' },
      {
        resolveDns: async () => [address],
        transport: async () => {
          transportCalls += 1
          return { statusCode: 200, body: Buffer.from('{}') }
        },
      },
    )
    assert.deepEqual(result, {})
    assert.equal(transportCalls, 1)
  }
})

test('pins the selected validated DNS address while retaining the original TLS hostname', async () => {
  let pinnedAddress: ProviderDnsAddress | undefined
  const publicIpv6Address: ProviderDnsAddress = { address: '2001:4860:4860::8888', family: 6 }
  const dependencies: ProviderUrlDependencies = {
    resolveDns: async (hostname) => {
      assert.equal(hostname, 'provider.invalid')
      return [publicIpv6Address]
    },
    transport: async (url, options) => {
      assert.equal(url.hostname, 'provider.invalid')
      assert.equal(url.pathname, '/compatible-mode/v1/models')
      pinnedAddress = await new Promise<ProviderDnsAddress>((resolve, reject) => {
        options.lookup(url.hostname, {}, (error, address, family) => {
          if (error) {
            reject(error)
            return
          }
          if (typeof address !== 'string' || (family !== 4 && family !== 6)) {
            reject(new Error('Expected one pinned DNS answer'))
            return
          }
          resolve({ address, family })
        })
      })
      return { statusCode: 200, body: Buffer.from('{"data":[{"id":"model-a"}]}') }
    },
  }

  const result = await requestProviderJson(
    buildProviderEndpointUrl('https://provider.invalid/compatible-mode/v1', 'models'),
    {
      method: 'GET',
      validate: (value) => {
        assert.deepEqual(value, { data: [{ id: 'model-a' }] })
        return 'validated-model-list'
      },
    },
    dependencies,
  )

  assert.equal(result, 'validated-model-list')
  assert.deepEqual(pinnedAddress, publicIpv6Address)
})

test('supports bounded JSON POST requests', async () => {
  const dependencies: ProviderUrlDependencies = {
    resolveDns: async () => [publicAddress],
    transport: async (_url, options) => {
      assert.equal(options.method, 'POST')
      assert.equal(options.body, '{"model":"qwen-test","messages":[]}')
      assert.equal(options.headers['content-type'], 'application/json')
      assert.equal(options.headers['content-length'], String(Buffer.byteLength(options.body)))
      return { statusCode: 200, body: Buffer.from('{"ok":true}') }
    },
  }

  const result = await requestProviderJson(
    buildProviderEndpointUrl('https://provider.invalid/v1', 'chat/completions'),
    { method: 'POST', body: { model: 'qwen-test', messages: [] } },
    dependencies,
  )

  assert.deepEqual(result, { ok: true })
})

test('rejects caller overrides for the pinned host or request framing', async () => {
  const endpoint = buildProviderEndpointUrl('https://provider.invalid/v1', 'chat/completions')
  const dependencies: ProviderUrlDependencies = {
    resolveDns: async () => [publicAddress],
    transport: async () => ({ statusCode: 200, body: Buffer.from('{}') }),
  }

  for (const headers of [{ host: 'localhost' }, { 'content-length': '1' }, { 'transfer-encoding': 'chunked' }] as Array<Record<string, string>>) {
    await assert.rejects(
      requestProviderJson(endpoint, { method: 'POST', body: {}, headers }, dependencies),
      /headers/i,
    )
  }
})

test('rejects redirects and responses exceeding the configured byte cap', async () => {
  const dependencies: ProviderUrlDependencies = {
    resolveDns: async () => [publicAddress],
    transport: async () => ({ statusCode: 302, body: Buffer.from('redirect') }),
  }

  await assert.rejects(
    requestProviderJson(buildProviderEndpointUrl('https://provider.invalid/v1', 'models'), { method: 'GET' }, dependencies),
    /redirect/i,
  )

  await assert.rejects(
    requestProviderJson(
      buildProviderEndpointUrl('https://provider.invalid/v1', 'models'),
      { method: 'GET', maxResponseBytes: 4 },
      {
        ...dependencies,
        transport: async () => ({ statusCode: 200, body: Buffer.from('12345') }),
      },
    ),
    /size/i,
  )
})

test('times out if the injected request transport never settles', async () => {
  await assert.rejects(
    requestProviderJson(
      buildProviderEndpointUrl('https://provider.invalid/v1', 'models'),
      { method: 'GET', timeoutMs: 5 },
      {
        resolveDns: async () => [publicAddress],
        transport: () => new Promise(() => {}),
      },
    ),
    /timed out/i,
  )
})
