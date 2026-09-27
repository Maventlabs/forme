# Temporary Netlify Deployment — FORME

**Purpose:** temporary hosted production-like environment while self-hosting is prepared. This guide describes configuration only; no Netlify site has been created or deployed from this workspace.

## Readiness estimate

**Approximately 50% ready for a full public product launch.** This is a rounded engineering estimate, not a measured release score. The coarse denominator is ten equally weighted core launch slices: five have at least a real production-path vertical slice (brand/landing, auth/private projects, persisted semantic canvas, responsive persistence boundary, and one scoped Gemini edit); five remain absent or not release-verified (presets/`DESIGN.md`, uploads/storage, share/export, full UI/QA/security/observability, and actual hosted deployment/operations). The first group is not all fully finished, so 50% is an upper-level progress signal, not proof of launch readiness.

Verified against real local production builds, Better Auth, Neon `forme-dev`, and (for Phase 5) the live Gemini API:

- Landing page and its local preview behavior.
- Email/password signup/login, session persistence, private projects, and ownership denial.
- Semantic canvas persistence, revision conflict/replay, and custom block reuse through production HTTP paths.
- Responsive override persistence and cross-breakpoint identity at the API/durable boundary.
- Gemini live model discovery, encrypted credential storage, and one selected-node text-edit operation, including invalid-key recovery, idempotency, read-back, and owner isolation.

Still missing or incomplete for a full launch: a Netlify deployment and production-domain smoke test; isolated production database/credentials; complete UI-only visual and keyboard QA; broader canvas interactions; full responsive UI verification; scoped AI node creation/restructure and timeout recovery; presets and `DESIGN.md` application; uploads/storage; real share/export; approval of commercial terms and real checkout (displayed prices remain proposals); and release-grade security, observability, and dependency review. OAuth credentials are not currently required for the implemented email/password path; Google/GitHub OAuth is not yet implemented.

The five largest product slices have each reached some real implementation, but several core release journeys are absent or partial. The 50% estimate must not be interpreted as permission to accept public users or real production data yet.

## Netlify compatibility and limits

Netlify's current Next.js OpenNext adapter supports App Router, SSR, Route Handlers, Server Actions, and image optimization. The current Gemini edit is synchronous and relatively small. Netlify documents a **60-second synchronous function execution limit**; if generation becomes long-running or exceeds that budget, route it through the planned worker/job architecture rather than assuming Netlify will wait longer.

The Neon `forme-dev` project is an isolated development/E2E database, not a clean production database. Do not point a public site with real users at that development database. Before any public launch, provision a dedicated production Neon database/branch and set its production credentials directly in Netlify. Keep staging and production records isolated.

### Suggested Netlify site settings

Connect the repository in Netlify and configure the monorepo so the repository/workspace root remains the base directory (the root `pnpm-workspace.yaml` and lockfile are required). Set the web app package directory to `apps/web` if the Netlify UI requests it.

| Setting | Value |
|---|---|
| Framework | Next.js |
| Base directory | Repository root |
| Package directory | `apps/web` when requested by the UI |
| Build command | `pnpm --filter @forme/web build` |
| Publish directory | Leave to Netlify's Next.js adapter/framework detection; do not publish `apps/web/.next` as a static site |
| Node.js build version | 24, matching the verified local Node 24 runtime |

Do not pin/install a separate Next.js Netlify plugin unless a deploy error establishes that the automatic adapter is not detected. Netlify's adapter is designed to provision the Next.js runtime automatically.

## Variables to fill in locally

`apps/web/.env.local` already exists in this workspace and is ignored by Git. It was left untouched because it contains private local configuration. For a blank reference, use `apps/web/.env.example`; copy it only if you intentionally need a separate local environment. Do not paste secret values into chat or commit them.

| Variable | Required? | What to put there |
|---|---|---|
| `DATABASE_URL` | Yes | Pooled PostgreSQL URL for the environment being run. Use the dedicated production database for public Netlify traffic. |
| `DATABASE_URL_UNPOOLED` | Local migrations | Direct (non-pooler) URL for running Drizzle migrations manually from a trusted machine. Not needed by the app runtime. |
| `BETTER_AUTH_SECRET` | Yes | Independently generated random secret, at least 32 bytes. Keep the value stable for that environment. |
| `BETTER_AUTH_URL` | Yes | Local origin during local development, e.g. `http://localhost:3100`. In Netlify production, set the canonical HTTPS site URL. |
| `PROVIDER_SECRET_ENCRYPTION_KEY` | Yes for provider-key storage | Independent random 32-byte base64url key. Back it up securely; losing it prevents decrypting saved user provider keys. Never reuse the auth secret. |
| `PROVIDER_SECRET_ENCRYPTION_KEY_ID` | Yes | Start with `v1`; only change as part of a planned encryption-key rotation. |
| `PROVIDER_SECRET_ENCRYPTION_KEYRING` | No | Only during a key-rotation/re-encryption window, as JSON mapping previous key IDs to their previous keys. Omit initially. |
| `GEMINI_API_KEY` | Local E2E only | Optional key for the production-path E2E script. Regular app users supply their own Gemini key through the provider UI, so this does not belong in Netlify's runtime settings. |
| `E2E_*` | Local/staging E2E only | Test-run configuration; do not configure as application production variables. The E2E script has explicit guards for remote/production writes. |

Generate new values on your own machine; run each command separately so you can keep the two secrets distinct:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

Use one generated value for `BETTER_AUTH_SECRET` and a separately generated value for `PROVIDER_SECRET_ENCRYPTION_KEY`. Both are local-only examples until you set the chosen per-environment values in Netlify.

## Variables to set in Netlify

Netlify does **not** automatically read `.env.local` or `.env.example` during cloud builds. Add values in **Project configuration → Environment variables**, using the production deploy context and runtime/function availability. Add the following for the deployed web application:

1. `DATABASE_URL` — dedicated production Neon pooled URL.
2. `BETTER_AUTH_SECRET` — new production-only random secret.
3. `BETTER_AUTH_URL` — exact canonical HTTPS URL users will open, for example the stable Netlify site domain. The app currently trusts this configured origin.
4. `PROVIDER_SECRET_ENCRYPTION_KEY` — new production-only independent 32-byte base64url key.
5. `PROVIDER_SECRET_ENCRYPTION_KEY_ID` — `v1` for the initial key.

Do not add local `E2E_*` values or `DATABASE_URL_UNPOOLED` to the site by default. Run migrations manually against the intended database using the direct URL and the existing Drizzle migration command, then set the pooled runtime URL in Netlify. Do not run schema migrations automatically as part of every deployment.

After adding/updating environment variables, trigger a fresh deploy; Netlify documents that changes take effect after a build/deploy. Add real secrets through the Netlify UI/CLI/API only, not `netlify.toml`, the repository, or chat. Set the sensitive-variable policy so untrusted Deploy Previews cannot access production secrets.

### Not required now

- **Upstash / Redis / QStash:** no queue/Redis integration is currently used by the app. Do not create an Upstash database or add its credentials for this deployment. Revisit only when the BullMQ/worker path is actually implemented.
- **Google/GitHub OAuth client IDs/secrets:** not needed for current email/password login and not implemented in the active auth module.
- **`GEMINI_API_KEY` on Netlify:** not needed for current BYOK behavior. Users provide provider credentials through the server-side encrypted connection flow.
- **S3 storage credentials:** uploads/object storage are not yet implemented in this app slice.

## Auth domain and deploy previews

Set `BETTER_AUTH_URL` to the stable primary Netlify domain before testing signup/login. The current auth configuration trusts the configured base URL; a random Deploy Preview URL may not match it. First verify auth on the stable production URL. Do not send production credentials to fork/untrusted preview builds.

## Suggested rollout order

1. Create a Netlify site and set monorepo build/package directories.
2. Provision a separate production Neon database/branch and back it up; do not reuse the E2E database for real users.
3. Generate unique production auth/encryption secrets and store them in a password manager/secret store.
4. Apply the current Drizzle migrations once to the intended production database from a controlled environment.
5. Add the five runtime variables in Netlify and set the stable `BETTER_AUTH_URL`.
6. Deploy to the stable Netlify domain, then smoke-test signup/login, session reload, project create/reload, owner isolation, provider connection, and server-side error handling with uniquely created test data.
7. Record deploy URL, exact environment, E2E evidence, and any failures in `SESSION.md` before calling the deployment production-ready.

## Current blockers to actual deployment

- No Netlify site/domain or credentials were supplied; no deployment has been made.
- A clean production Neon database/branch and its credentials have not been provisioned.
- Production secrets must be generated and entered by the owner in Netlify.
- The full P0 feature set and QA/security/release checklist are incomplete.

## Official references checked 2026-09-26

- [Next.js on Netlify](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/) — OpenNext adapter and App Router/Route Handler support.
- [Netlify environment variables](https://docs.netlify.com/build/environment-variables/get-started/) — `.env` files are not automatically loaded by cloud builds; set variables in Netlify and redeploy.
- [Netlify function configuration](https://docs.netlify.com/build/functions/configuration/) — synchronous execution default/maximum is 60 seconds.
- [Netlify Node.js build/runtime](https://docs.netlify.com/build/configure-builds/manage-dependencies/#node-js-and-javascript) — runtime/build Node version configuration.
