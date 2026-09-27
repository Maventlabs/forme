# ADR-0001: Use Netlify as temporary web host

## Status
Accepted for temporary hosting; self-hosting remains the intended next hosting phase.

## Date
2026-09-26

## Context
The owner cannot currently access the Vercel account and wants a temporary hosted environment while preparing to deploy FORME on their own server. FORME is a Next.js App Router application with server-rendered pages, route handlers, Better Auth, Neon PostgreSQL, and a synchronous first Gemini edit path.

## Decision
Use Netlify for the temporary web deployment. Keep the application framework, database, auth, provider adapter, and worker architecture unchanged. Configure production secrets in Netlify's environment-variable UI/API, not in the repository. Treat the existing Neon `forme-dev` database as development/E2E only; public traffic requires a separate production database/branch.

## Alternatives considered

### Wait for Vercel account access
- Pros: Matches the originally named web host.
- Cons: Blocks the owner's requested temporary deployment.
- Rejected for the temporary environment only.

### Self-host immediately
- Pros: Matches the eventual hosting goal.
- Cons: The owner intends to prepare the server separately; it is not ready as the immediate temporary target.
- Deferred.

## Consequences
- Netlify's Next.js OpenNext adapter supports the current App Router and route-handler requirements; the deployment still needs an actual site/domain and production credentials.
- Netlify documents a 60-second synchronous function execution limit. Long-running AI/export work must use the worker/job architecture instead of assuming unlimited request duration.
- A stable canonical HTTPS domain must be configured as `BETTER_AUTH_URL`; arbitrary Deploy Preview URLs may not be in Better Auth's trusted origins.
- Deployment readiness remains unverified until a real Netlify deploy and production-path smoke/E2E succeed.
- This is temporary; revise the deployment decision when the owner's server is ready.

## References
- [Next.js on Netlify](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/)
- [Netlify environment variables](https://docs.netlify.com/build/environment-variables/get-started/)
- [Netlify function configuration](https://docs.netlify.com/build/functions/configuration/)
