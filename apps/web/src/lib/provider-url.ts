import { lookup as dnsLookup } from 'node:dns/promises'
import { request as httpsRequest, type RequestOptions as HttpsRequestOptions } from 'node:https'
import { isIP } from 'node:net'

export type ProviderHttpMethod = 'GET' | 'POST'

export interface ProviderDnsAddress {
  address: string
  family: 4 | 6
}

export interface ProviderLookupOptions {
  all?: boolean
  family?: number
  hints?: number
  verbatim?: boolean
  order?: string
}

export type ProviderPinnedLookup = (
  hostname: string,
  options: ProviderLookupOptions | number,
  callback: (
    error: NodeJS.ErrnoException | null,
    address: string | ProviderDnsAddress[],
    family?: number,
  ) => void,
) => void

export interface ProviderTransportOptions {
  method: ProviderHttpMethod
  headers: Readonly<Record<string, string>>
  body?: string
  timeoutMs: number
  maxResponseBytes: number
  lookup: ProviderPinnedLookup
  signal: AbortSignal
}

export interface ProviderTransportResponse {
  statusCode: number
  body: Uint8Array
}

export type ProviderHttpsTransport = (
  url: URL,
  options: ProviderTransportOptions,
) => Promise<ProviderTransportResponse>

export interface ProviderUrlDependencies {
  resolveDns?: (hostname: string) => Promise<readonly ProviderDnsAddress[]>
  transport?: ProviderHttpsTransport
}

export interface ProviderJsonRequestOptions<T> {
  method: ProviderHttpMethod
  headers?: Readonly<Record<string, string>>
  body?: unknown
  timeoutMs?: number
  maxResponseBytes?: number
  validate?: (value: unknown) => T
}

const DEFAULT_TIMEOUT_MS = 15_000
const MAX_TIMEOUT_MS = 120_000
const DEFAULT_MAX_RESPONSE_BYTES = 2 * 1024 * 1024
const MAX_RESPONSE_BYTES = 5 * 1024 * 1024
const DNS_NAME_LABEL = /^[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?$/i

export class ProviderUrlError extends Error {
  constructor(
    message: string,
    readonly statusCode?: number,
    readonly outcomeUnknown = false,
  ) {
    super(message)
    this.name = 'ProviderUrlError'
  }
}

function invalidUrl(): ProviderUrlError {
  return new ProviderUrlError('Invalid provider URL')
}

function parseHttpsUrl(input: string | URL): URL {
  let source: string
  if (input instanceof URL) source = input.href
  else if (typeof input === 'string') source = input
  else throw invalidUrl()

  if (!source || source !== source.trim() || /[\r\n\t\\?#]/.test(source)) throw invalidUrl()
  const rawPath = /^https:\/\/[^/?#]*(\/[^?#]*)?/i.exec(source)?.[1] ?? '/'
  if (rawPath.split('/').some((segment) => segment === '.' || segment === '..' || segment.includes('%'))) {
    throw invalidUrl()
  }

  let url: URL
  try {
    url = new URL(source)
  } catch {
    throw invalidUrl()
  }

  if (
    url.protocol !== 'https:' ||
    url.username !== '' ||
    url.password !== '' ||
    url.search !== '' ||
    url.hash !== ''
  ) {
    throw invalidUrl()
  }

  const hostname = url.hostname.replace(/^\[|\]$/g, '')
  if (!hostname || isIP(hostname) !== 0) throw invalidUrl()
  const dnsName = hostname.endsWith('.') ? hostname.slice(0, -1) : hostname
  const labels = dnsName.split('.')
  if (
    dnsName.length > 253 ||
    labels.some((label) => label.length === 0 || !DNS_NAME_LABEL.test(label))
  ) {
    throw invalidUrl()
  }

  const authority = /^https:\/\/([^/?#]*)/i.exec(source)?.[1]
  if (!authority || authority.includes('@')) throw invalidUrl()
  const portSeparator = authority.lastIndexOf(':')
  if (portSeparator >= 0) {
    const rawPort = authority.slice(portSeparator + 1)
    const port = Number(rawPort)
    if (!/^\d+$/.test(rawPort) || !Number.isInteger(port) || port < 1 || port > 65_535) {
      throw invalidUrl()
    }
  }
  if (url.port && (!/^\d+$/.test(url.port) || Number(url.port) < 1 || Number(url.port) > 65_535)) {
    throw invalidUrl()
  }
  if (url.port && url.port !== '443') throw invalidUrl()

  return url
}

function pathSegments(pathname: string): string[] {
  const trimmed = pathname.replace(/\/+$/, '')
  if (trimmed === '') return []
  if (!trimmed.startsWith('/')) throw invalidUrl()
  const segments = trimmed.slice(1).split('/')
  if (segments.some((segment) => !segment || segment === '.' || segment === '..' || segment.includes('%'))) {
    throw invalidUrl()
  }
  return segments
}

function terminalChatCompletions(segments: readonly string[]): boolean {
  const length = segments.length
  return length >= 2 &&
    segments[length - 2]?.toLowerCase() === 'chat' &&
    segments[length - 1]?.toLowerCase() === 'completions'
}

function validatePathComponents(segments: readonly string[]): void {
  const versionCount = segments.filter((segment) => segment.toLowerCase() === 'v1').length
  const completionPairIndexes = segments.flatMap((segment, index) =>
    segment.toLowerCase() === 'chat' && segments[index + 1]?.toLowerCase() === 'completions'
      ? [index]
      : [],
  )
  const hasChatOrCompletions = segments.some((segment) =>
    segment.toLowerCase() === 'chat' || segment.toLowerCase() === 'completions',
  )

  if (
    versionCount > 1 ||
    completionPairIndexes.length > 1 ||
    (hasChatOrCompletions && !terminalChatCompletions(segments))
  ) {
    throw invalidUrl()
  }
}

export function normalizeProviderBaseUrl(input: string | URL): string {
  const url = parseHttpsUrl(input)
  const segments = pathSegments(url.pathname)
  validatePathComponents(segments)

  if (segments.at(-1)?.toLowerCase() === 'models') throw invalidUrl()
  if (terminalChatCompletions(segments)) segments.splice(-2)

  const path = segments.length === 0 ? '' : `/${segments.join('/')}`
  return `${url.origin}${path}`
}

export function buildProviderEndpointUrl(
  baseUrl: string | URL,
  endpoint: 'models' | 'chat/completions',
): URL {
  const base = normalizeProviderBaseUrl(baseUrl)
  if (endpoint !== 'models' && endpoint !== 'chat/completions') throw invalidUrl()
  return new URL(`${base}/${endpoint}`)
}

function ipv4InCidr(address: string, network: number, prefix: number): boolean {
  const value = address.split('.').reduce((total, octet) => ((total << 8) | Number(octet)) >>> 0, 0)
  const mask = (0xffff_ffff << (32 - prefix)) >>> 0
  return ((value & mask) >>> 0) === ((network & mask) >>> 0)
}

const NON_PUBLIC_IPV4: ReadonlyArray<readonly [number, number]> = [
  [0x0000_0000, 8], // Current network
  [0x0a00_0000, 8], // Private
  [0x6440_0000, 10], // Shared address space
  [0x7f00_0000, 8], // Loopback
  [0xa9fe_0000, 16], // Link-local
  [0xac10_0000, 12], // Private
  [0xc000_0000, 24], // IETF protocol assignments
  [0xc000_0200, 24], // Documentation
  [0xc058_6300, 24], // Deprecated 6to4 relay anycast
  [0xc0a8_0000, 16], // Private
  [0xc612_0000, 15], // Benchmarking
  [0xc633_6400, 24], // Documentation
  [0xcb00_7100, 24], // Documentation
  [0xe000_0000, 4], // Multicast
  [0xf000_0000, 4], // Reserved / broadcast
]

function parseIpv6(address: string): bigint | null {
  let normalized = address.toLowerCase()
  if (normalized.includes('.')) {
    const lastColon = normalized.lastIndexOf(':')
    const ipv4 = normalized.slice(lastColon + 1)
    const octets = ipv4.split('.').map(Number)
    if (lastColon < 0 || octets.length !== 4) return null
    const high = ((octets[0]! << 8) | octets[1]!).toString(16)
    const low = ((octets[2]! << 8) | octets[3]!).toString(16)
    normalized = `${normalized.slice(0, lastColon + 1)}${high}:${low}`
  }

  const halves = normalized.split('::')
  if (halves.length > 2) return null
  const left = halves[0] ? halves[0].split(':') : []
  const right = halves.length === 2 && halves[1] ? halves[1].split(':') : []
  const zeroCount = 8 - left.length - right.length
  if ((halves.length === 1 && zeroCount !== 0) || (halves.length === 2 && zeroCount < 1)) return null
  const parts = [...left, ...Array.from({ length: zeroCount }, () => '0'), ...right]
  if (parts.length !== 8 || parts.some((part) => !/^[a-f\d]{1,4}$/i.test(part))) return null
  return parts.reduce((value, part) => (value << BigInt(16)) | BigInt(`0x${part}`), BigInt(0))
}

function ipv6InCidr(address: bigint, network: bigint, prefix: number): boolean {
  const mask = ((BigInt(1) << BigInt(prefix)) - BigInt(1)) << BigInt(128 - prefix)
  return (address & mask) === (network & mask)
}

function isPublicAddress(address: ProviderDnsAddress): boolean {
  const parsedFamily = isIP(address.address)
  if (parsedFamily !== address.family) return false

  if (address.family === 4) {
    return !NON_PUBLIC_IPV4.some(([network, prefix]) => ipv4InCidr(address.address, network, prefix))
  }

  const parsed = parseIpv6(address.address)
  if (parsed === null || !ipv6InCidr(parsed, BigInt('0x20000000000000000000000000000000'), 3)) return false

  const nonPublicRanges: ReadonlyArray<readonly [bigint, number]> = [
    [BigInt('0x20010000000000000000000000000000'), 23], // IETF protocol assignments
    [BigInt('0x20010002000000000000000000000000'), 48], // Benchmarking
    [BigInt('0x20010db8000000000000000000000000'), 32], // Documentation
    [BigInt('0x20020000000000000000000000000000'), 16], // 6to4
    [BigInt('0x3fff0000000000000000000000000000'), 20], // Documentation
  ]
  return !nonPublicRanges.some(([network, prefix]) => ipv6InCidr(parsed, network, prefix))
}

function validateEndpointUrl(input: string | URL): URL {
  const url = parseHttpsUrl(input)
  const segments = pathSegments(url.pathname)
  validatePathComponents(segments)

  const isModelsEndpoint = segments.at(-1)?.toLowerCase() === 'models' &&
    segments.filter((segment) => segment.toLowerCase() === 'models').length === 1
  if (!isModelsEndpoint && !terminalChatCompletions(segments)) throw invalidUrl()
  return url
}

function createPinnedLookup(url: URL, address: ProviderDnsAddress): ProviderPinnedLookup {
  return (hostname, options, callback) => {
    if (hostname.toLowerCase() !== url.hostname.toLowerCase()) {
      const error = Object.assign(new Error('Provider lookup failed'), { code: 'ENOTFOUND' })
      callback(error, '', 0)
      return
    }

    if (typeof options === 'object' && options?.all) callback(null, [address])
    else callback(null, address.address, address.family)
  }
}

function makeRequestHeaders(
  headers: Readonly<Record<string, string>> | undefined,
  body: string | undefined,
): Record<string, string> {
  const normalized = Object.create(null) as Record<string, string>
  if (headers !== undefined) {
    for (const [name, value] of Object.entries(headers)) {
      if (
        !/^[!#$%&'*+.^_`|~\da-z-]+$/i.test(name) ||
        typeof value !== 'string' ||
        /[\r\n]/.test(value) ||
        ['host', 'content-length', 'transfer-encoding'].includes(name.toLowerCase())
      ) {
        throw new ProviderUrlError('Invalid provider request headers')
      }
      normalized[name.toLowerCase()] = value
    }
  }
  if (!('accept' in normalized)) normalized.accept = 'application/json'
  if (body !== undefined) {
    if (!('content-type' in normalized)) normalized['content-type'] = 'application/json'
    normalized['content-length'] = String(Buffer.byteLength(body))
  }
  return normalized
}

function defaultHttpsTransport(url: URL, options: ProviderTransportOptions): Promise<ProviderTransportResponse> {
  return new Promise((resolve, reject) => {
    let settled = false
    let request: ReturnType<typeof httpsRequest> | undefined
    let response: import('node:http').IncomingMessage | undefined

    const finish = (callback: () => void) => {
      if (settled) return
      settled = true
      options.signal.removeEventListener('abort', onAbort)
      callback()
    }
    const fail = (message: string) => finish(() => reject(new ProviderUrlError(message)))
    const onAbort = () => {
      request?.destroy()
      response?.destroy()
      fail('Provider request aborted')
    }

    try {
      request = httpsRequest(
        url,
        {
          agent: false,
          method: options.method,
          headers: options.headers,
          rejectUnauthorized: true,
          servername: url.hostname,
          lookup: options.lookup as NonNullable<HttpsRequestOptions['lookup']>,
        },
        (incoming) => {
          response = incoming
          const chunks: Buffer[] = []
          let byteCount = 0

          incoming.on('data', (chunk: Uint8Array | string) => {
            if (settled) return
            const bytes = Buffer.from(chunk)
            byteCount += bytes.byteLength
            if (byteCount > options.maxResponseBytes) {
              request?.destroy()
              incoming.destroy()
              fail('Provider response exceeds the size limit')
              return
            }
            chunks.push(bytes)
          })
          incoming.once('aborted', () => fail('Provider response was interrupted'))
          incoming.once('error', () => fail('Provider request failed'))
          incoming.once('end', () => {
            finish(() => resolve({
              statusCode: incoming.statusCode ?? 0,
              body: Buffer.concat(chunks, byteCount),
            }))
          })
        },
      )
      request.once('error', () => fail('Provider request failed'))
      options.signal.addEventListener('abort', onAbort, { once: true })
      if (options.signal.aborted) {
        onAbort()
        return
      }
      if (options.body === undefined) request.end()
      else request.end(options.body)
    } catch {
      fail('Provider request failed')
    }
  })
}

export async function requestProviderJson<T = unknown>(
  input: string | URL,
  options: ProviderJsonRequestOptions<T>,
  dependencies: ProviderUrlDependencies = {},
): Promise<T> {
  const url = validateEndpointUrl(input)
  if (options.method !== 'GET' && options.method !== 'POST') {
    throw new ProviderUrlError('Unsupported provider request method')
  }
  if (options.method === 'GET' && options.body !== undefined) {
    throw new ProviderUrlError('GET provider requests cannot include a body')
  }

  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const maxResponseBytes = options.maxResponseBytes ?? DEFAULT_MAX_RESPONSE_BYTES
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > MAX_TIMEOUT_MS) {
    throw new ProviderUrlError('Invalid provider request timeout')
  }
  if (!Number.isInteger(maxResponseBytes) || maxResponseBytes < 1 || maxResponseBytes > MAX_RESPONSE_BYTES) {
    throw new ProviderUrlError('Invalid provider response size limit')
  }

  let serializedBody: string | undefined
  if (options.body !== undefined) {
    try {
      serializedBody = JSON.stringify(options.body)
    } catch {
      throw new ProviderUrlError('Invalid provider request body')
    }
    if (serializedBody === undefined) throw new ProviderUrlError('Invalid provider request body')
  }
  const headers = makeRequestHeaders(options.headers, serializedBody)
  const resolveDns = dependencies.resolveDns ?? (async (hostname: string) =>
    await dnsLookup(hostname, { all: true, verbatim: true }) as ProviderDnsAddress[]
  )
  const transport = dependencies.transport ?? defaultHttpsTransport
  const controller = new AbortController()
  let timedOut = false
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined

  const timeout = new Promise<never>((_resolve, reject) => {
    timeoutHandle = setTimeout(() => {
      timedOut = true
      reject(new ProviderUrlError('Provider request timed out'))
      controller.abort()
    }, timeoutMs)
  })

  const task = async (): Promise<ProviderTransportResponse> => {
    let addresses: readonly ProviderDnsAddress[]
    try {
      addresses = await resolveDns(url.hostname)
    } catch {
      throw new ProviderUrlError('Provider hostname could not be resolved')
    }
    if (controller.signal.aborted) throw new ProviderUrlError('Provider request timed out')
    if (!Array.isArray(addresses) || addresses.length === 0 || addresses.some((answer) => !isPublicAddress(answer))) {
      throw new ProviderUrlError('Provider hostname resolved to an unsafe address')
    }

    try {
      return await transport(url, {
        method: options.method,
        headers,
        body: serializedBody,
        timeoutMs,
        maxResponseBytes,
        lookup: createPinnedLookup(url, addresses[0]!),
        signal: controller.signal,
      })
    } catch {
      throw new ProviderUrlError('Provider request failed')
    }
  }

  let response: ProviderTransportResponse
  try {
    response = await Promise.race([task(), timeout])
  } catch (error) {
    if (timedOut) throw new ProviderUrlError('Provider request timed out')
    if (error instanceof ProviderUrlError) throw error
    throw new ProviderUrlError('Provider request failed')
  } finally {
    if (timeoutHandle !== undefined) clearTimeout(timeoutHandle)
  }

  if (!Number.isInteger(response.statusCode) || response.statusCode < 100 || response.statusCode > 599) {
    throw new ProviderUrlError('Invalid provider response')
  }
  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new ProviderUrlError(
      response.statusCode >= 300 && response.statusCode < 400
        ? 'Provider redirects are not followed'
        : 'Provider request was unsuccessful',
      response.statusCode,
      options.method === 'POST' && response.statusCode >= 500,
    )
  }
  if (!(response.body instanceof Uint8Array) || response.body.byteLength > maxResponseBytes) {
    throw new ProviderUrlError('Provider response exceeds the size limit', 502)
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(response.body))
  } catch {
    throw new ProviderUrlError('Provider returned invalid JSON', 502)
  }
  if (options.validate === undefined) return parsed as T
  try {
    return options.validate(parsed)
  } catch {
    throw new ProviderUrlError('Provider response failed validation', 502)
  }
}
