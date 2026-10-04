// Production E2E orchestrator — the single completion gate command.
//
// Guarantees the journeys never exercise a stale artifact:
//   1. fresh production build (`next build`)
//   2. read the Next.js build identity from `.next/BUILD_ID`
//   3. start a controlled production server (`next start`) on a unique free
//      port with a unique run id, tagged with that build identity
//   4. poll `/api/health` until ready and assert the served build id matches
//      the freshly built one (fails loudly on mismatch)
//   5. run all journeys against that server
//   6. always shut the server down
//
// Usage (local):  pnpm e2e:production
// Remote targets still require the existing E2E_ALLOW_REMOTE / E2E_TARGET
// guards; secrets are never printed.
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { randomUUID } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { createRequire } from 'node:module'
import { config as loadEnv } from 'dotenv'

loadEnv({ path: '.env.local' })
loadEnv({ path: '.env' })

const appRoot = resolve(process.cwd())
const requireFromApp = createRequire(join(appRoot, 'package.json'))
const nextBin = join(dirname(requireFromApp.resolve('next/package.json')), 'dist', 'bin', 'next')
const buildIdPath = join(appRoot, '.next', 'BUILD_ID')
const readinessTimeoutMs = 120_000
const runId = randomUUID()

function log(message: string) {
  process.stdout.write(`${message}\n`)
}

function freePort(): Promise<number> {
  return new Promise((resolvePort, reject) => {
    const server = createServer()
    server.unref()
    server.on('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      if (address === null || typeof address === 'string') {
        server.close(() => reject(new Error('Could not allocate a free port')))
        return
      }
      const { port } = address
      server.close(() => resolvePort(port))
    })
  })
}

function gitHead(): string | null {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: appRoot, encoding: 'utf8' }).trim()
  } catch {
    return null
  }
}

function runBuild() {
  log('E2E | building fresh production artifact…')
  execFileSync(process.execPath, [nextBin, 'build'], {
    cwd: appRoot,
    stdio: 'inherit',
    env: process.env,
  })
}

async function waitForHealth(baseUrl: URL, expectedBuildId: string) {
  const deadline = Date.now() + readinessTimeoutMs
  let lastError = 'no response'
  while (Date.now() < deadline) {
    try {
      const response = await fetch(new URL('/api/health', baseUrl), {
        headers: { origin: baseUrl.origin },
        signal: AbortSignal.timeout(5_000),
      })
      if (response.ok) {
        const health = await response.json() as { buildId?: string | null }
        assert.equal(
          health.buildId,
          expectedBuildId,
          `Served build identity ${String(health.buildId)} does not match fresh build ${expectedBuildId}. Refusing to test a stale server.`,
        )
        return
      }
      lastError = `HTTP ${response.status}`
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'unknown error'
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error(`Production server did not become ready in ${readinessTimeoutMs}ms (last: ${lastError})`)
}

async function main() {
  const databaseUrl = process.env.E2E_DATABASE_URL ?? process.env.DATABASE_URL?.trim()
  if (!databaseUrl) throw new Error('DATABASE_URL (or E2E_DATABASE_URL) is required')

  runBuild()
  assert.ok(existsSync(buildIdPath), 'Fresh build did not produce .next/BUILD_ID')
  const buildId = readFileSync(buildIdPath, 'utf8').trim()
  const commit = gitHead()
  log(`E2E | fresh build identity ${buildId}${commit ? ` (commit ${commit.slice(0, 7)})` : ''}`)

  const port = await freePort()
  const baseUrl = new URL(`http://127.0.0.1:${port}`)
  const server = spawn(process.execPath, [nextBin, 'start', '-p', String(port)], {
    cwd: appRoot,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      NODE_ENV: 'production',
      BETTER_AUTH_URL: baseUrl.origin,
      E2E_BASE_URL: baseUrl.origin,
      FORME_E2E_BUILD_ID: buildId,
      FORME_E2E_RUN_ID: runId,
      // Fault injection is opt-in and only enabled when the run explicitly
      // requires real-provider verification. The injected fault never fakes
      // provider success: the bounded retry still performs a real API call.
      ...(process.env.E2E_REQUIRE_GEMINI === 'true' ? { FORME_E2E_PROVIDER_FAULTS: '1' } : {}),
      ...(commit ? { FORME_E2E_COMMIT: commit } : {}),
    },
  })

  let serverOutput = ''
  server.stdout?.on('data', (chunk: Buffer) => { serverOutput += chunk.toString() })
  server.stderr?.on('data', (chunk: Buffer) => { serverOutput += chunk.toString() })

  let exitCode = 0
  try {
    await waitForHealth(baseUrl, buildId)
    log(`E2E | controlled production server ready on ${baseUrl.origin} (run ${runId.slice(0, 8)})`)
    process.env.E2E_NO_AUTORUN = '1'
    process.env.FORME_E2E_NO_AUTORUN = '1'
    process.env.E2E_BASE_URL = baseUrl.origin
    process.env.BETTER_AUTH_URL = baseUrl.origin
    const { runProductionE2E } = await import('./auth-projects')
    await runProductionE2E(baseUrl, databaseUrl)
    exitCode = typeof process.exitCode === 'number' ? process.exitCode : 0
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown failure'
    process.stderr.write(`FAIL | production E2E orchestration: ${message}\n`)
    exitCode = 1
  } finally {
    server.kill('SIGTERM')
    await new Promise((r) => setTimeout(r, 500))
    if (server.exitCode === null) server.kill('SIGKILL')
    if (exitCode !== 0 && serverOutput.trim()) {
      process.stderr.write('FAIL | production server output (tail):\n')
      process.stderr.write(`${serverOutput.split('\n').slice(-20).join('\n')}\n`)
    }
    log('E2E | controlled production server stopped')
  }

  process.exitCode = exitCode
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'unknown failure'
  process.stderr.write(`FAIL | production E2E setup error: ${message}\n`)
  process.exitCode = 1
})