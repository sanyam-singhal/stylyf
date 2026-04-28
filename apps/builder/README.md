# Stylyf Builder

Stylyf Builder is the internal AI app-builder workbench for Depths AI. It is a hosted Supabase + Tigris/S3-compatible SolidStart app generated from Stylyf and then hand-refined into a product-specific control plane.

The app is for non-technical team members to create and iterate on small fullstack apps through a clean dashboard, a chat-driven studio, Stylyf IR panes, a live preview, Webknife screenshots, and git-tracked project workspaces. Deployment of generated apps remains a manual dev-team responsibility after review.

## Product Shape

- `/login`: internal email/password login.
- `/`: project dashboard with existing apps and a simple new-project path.
- `/projects/new`: one-field project creation. The user supplies a name; implementation details are derived server-side.
- `/projects/:id`: app-builder studio with chat, preview controls, Stylyf IR panes, reference assets, Webknife review, timeline, and git handoff.

Old generated standalone CRUD routes, especially implementation resources such as `agent_events`, are not part of the product surface. Timeline and events belong inside the project studio.

## Backend

- mode: hosted
- auth: Supabase Auth
- data: Supabase SDK + Supabase Postgres
- storage: Tigris/S3-compatible object storage through AWS SDK v3
- project workspaces: local filesystem under `STYLYF_BUILDER_ROOT` or `.stylyf-builder`
- agent execution: VPS-local Codex harness, with workspace-level `AGENTS.md`
- repository operations: authenticated `gh` CLI

The VPS owns the Codex login for this internal v1.1 builder. Generated app previews bind to `127.0.0.1`; public deployment of generated apps is intentionally detached from the builder.

## Workspace Contract

Each generated project workspace contains:

- `AGENTS.md`: injected instructions that force a Stylyf-first loop before raw source edits.
- `specs/`: first-class Stylyf IR chunks for app composition.
- `app/`: standalone generated app source.
- `logs/`: process and agent logs.
- `.webknife/`: Webknife artifacts.
- `screenshots/`: screenshot outputs.
- git metadata for commit/push handoff.

Codex runs from the workspace root so it sees the injected `AGENTS.md`. Accepted iterations should commit and push when a remote exists. Generated apps must remain ordinary source code and must not depend on this repo or `@depths/stylyf-cli` at runtime.

Prefer changing explicit Stylyf IR chunks and regenerating before raw source edits. Raw edits should record their reason in the project handoff.

## Required Host Tools

The internal builder assumes these tools are installed globally and authenticated where needed:

```bash
npm i -g @depths/stylyf-cli@latest @depths/webknife@latest @openai/codex@latest
stylyf --version
webknife --help
codex --version
gh auth status
```

## Environment

Do not print secret values in logs, screenshots, or issue notes.

Required or supported key names:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `AWS_S3_BUCKET`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_ENDPOINT_URL_S3`
- `AWS_REGION`
- `STYLYF_BUILDER_CORS_ORIGINS`
- `APP_BASE_URL`
- `STYLYF_BUILDER_ROOT`
- `STYLYF_BUILDER_GITHUB_ORG`
- `STYLYF_BUILDER_CREATE_GITHUB_REPOS`
- `STYLYF_BUILDER_AGENT_ADAPTER`
- `CODEX_RUN_FLAGS`

The builder env checker loads app-local env files and the repo-root `.env` for monorepo dogfooding. It prints key names only.

## Supabase Setup

Apply the SQL files before running a real authenticated smoke:

```bash
apps/builder/supabase/schema.sql
apps/builder/supabase/policies.sql
```

Supabase users are builder operators. For local authenticated smoke, manually provision the test user in Supabase and make sure the configured email/password in env matches the provisioned user. If login returns `Authentication failed: Bad Request`, fix the test credentials or Supabase auth settings before trusting dashboard or studio screenshots.

Review RLS policies before production use, tighten ownership/role policy for the target domain, and configure real email delivery before relying on auth email flows.

## Object Storage

Reference assets use a browser-direct presigned URL lifecycle:

1. Server authorizes the user and creates a presigned PUT intent.
2. Browser uploads bytes directly to Tigris/S3-compatible storage.
3. Server confirms the pointer after browser upload success.
4. API lists attached object pointers.
5. Server creates presigned GET URLs for reads.
6. Browser downloads bytes directly from object storage.
7. Server deletes the object and marks/deletes pointer state.

Raw object-storage credentials stay server-side. Postgres stores object pointers, ownership, status, scalar metadata, and compact summaries only. Variable-sized media, screenshots, logs, and large metadata belong in object storage and should be referenced by key or path.

Bucket CORS is required because browser bytes go directly to object storage. This is not a server CORS setting.

Check the effective bucket rule:

```bash
npm --prefix apps/builder run storage:cors:check
```

Apply the normal local rule:

```bash
npm --prefix apps/builder run storage:cors:apply
```

Apply explicit local and deployed origins:

```bash
npm --prefix apps/builder run storage:cors:apply -- --origins http://127.0.0.1:3000,https://stylyf.com
```

The rule should allow `GET`, `PUT`, and `HEAD`, allow request headers `content-type` and `x-amz-*`, and expose `ETag`. Prefer exact origins over wildcard origins for normal operation.

## Validation

Run these from the repo root:

```bash
npm --prefix apps/builder run env:check
npm --prefix apps/builder run schema:check
npm --prefix apps/builder run storage:cors:check
npm --prefix apps/builder run check
npm --prefix apps/builder run build
```

For generated project workspace smoke, run these from the workspace root:

```bash
stylyf intro --topic operator
stylyf validate --spec stylyf.spec.json
stylyf plan --spec stylyf.spec.json --resolved
cd app
npm install
npm run check
npm run build
```

For UI smoke, start the builder locally and use Webknife:

```bash
STYLYF_BUILDER_AGENT_ADAPTER=manual STYLYF_BUILDER_CREATE_GITHUB_REPOS=false npm --prefix apps/builder run dev -- --host 127.0.0.1 --port 3000
webknife shot http://localhost:3000/login --ci --json
```

Screenshot-gated routes:

- `/login`
- `/`
- `/projects/new`
- `/projects/demo`
- one real `/projects/:id` workspace when Supabase credentials are available

Object storage lifecycle smoke must cover intent, direct PUT, confirm, list, presigned GET, delete, and post-delete read failure. Do not call the upload path complete after PUT/confirm alone.

Full internal dogfood smoke is intentionally gated because it creates a real project workspace and runs the generated app lifecycle:

```bash
npm --prefix apps/builder run test:dogfood
```

If `schema:check` fails, apply `apps/builder/supabase/schema.sql` and `apps/builder/supabase/policies.sql` before trying real project routes. Demo routes can pass while real project routes fail if Supabase is stale.

The latest validated full lifecycle produced:

- presigned PUT: `200`
- list attached pointer: `200`
- presigned GET: `200` with payload match
- delete: `200`
- old presigned GET after delete: `404`

## Build And Deployment

`stylyf.com` runs only the auth-gated builder control plane. Generated apps remain local workspaces and GitHub repos for dev-team review; their deployment is intentionally manual.

Common commands from `apps/builder`:

```bash
npm install
npm run preflight
npm run build
npm run start
```

For repo-root operation, prefer:

```bash
npm --prefix apps/builder run preflight
npm --prefix apps/builder run build
systemctl restart stylyf
systemctl reload caddy
```

The production service should run `apps/builder/.output/server/index.mjs` behind Caddy on `127.0.0.1:3001`, with preview servers bound to `127.0.0.1` only.

## Security Rules

- Secrets are read server-side through `src/lib/env.server.ts` and re-exported from `src/lib/env.ts`.
- Browser code only receives public/publishable values.
- Raw object-storage credentials must never reach the browser.
- Signed URLs must not be logged.
- Bucket CORS permits browser requests to already-presigned URLs; it does not expose storage credentials.
- Generated route protection is explicit in middleware when auth-protected routes exist.
- Use least-privilege object-storage keys.
- Rotate any smoke-test credentials used during dogfooding.
- Keep generated app previews local by default; deployment is a dev-team decision.

## App Development Lessons

These lessons came from dogfooding the builder itself and should guide future app work.

- Generated hosted media must not store derived object URLs as read paths for private storage. Store scalar pointers and generate presigned GET URLs.
- Postgres must not become a sink for large JSON or variable-sized media metadata. Store `metadata_path` or object keys for large artifacts.
- Storage env contracts need provider-compatible aliases. Tigris/AWS SDK-compatible values such as `AWS_S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `AWS_ENDPOINT_URL_S3` are valid and should not be rejected just because generic `S3_*` names are absent.
- Public Supabase browser config needs a safe alias strategy. Local and production builds may provide `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` rather than `VITE_*` aliases.
- Monorepo dogfooding may require repo-root env fallback when the generated app lives under `apps/builder`.
- `APP_BASE_URL` can default to `http://localhost:3000` for local smoke, but production should set it explicitly.
- App-dependent smoke scripts should run from the generated app workspace so dependencies resolve correctly.
- User-facing app-builder forms should hide implementation fields. Non-technical operators should provide intent, not slugs, statuses, paths, repo names, or pushed SHAs.
- AI workbench apps need stronger product-specific shells than generic CRUD scaffolds. The builder should feel like an authoring cockpit, not an admin table.
- Upload intent should validate storage config before inserting DB rows. Failed storage configuration must not create misleading attached records.
- Browser-direct uploads require bucket CORS for the exact origin. If CORS is missing, the app can be architecturally correct and still fail at browser preflight.
- Validate the entire object lifecycle, not only upload confirmation.
- Client routes must not import storage-capable server modules. Keep AWS SDK, server env, and filesystem env loaders behind API or server-action boundaries.
- If a package or app script advertises `env:check`, the checker file must exist and be part of validation.

## CLI Source Follow-Ups

The builder app has local fixes for several scaffold issues. These should be handled in CLI/source work later rather than re-patched per app.

- Emit Better Auth-only env comparisons only when Better Auth is selected.
- Type empty generated definition arrays so downstream mapping does not narrow to `never`.
- Decide and document canonical field-to-column naming for generated database schemas.
- Add richer IR affordances for project-scoped child resources and nested routes.
- Make hosted media emit private presigned PUT/GET/DELETE flows by default.
- Enforce the scalar-pointer object storage rule in generated media modules.
- Generate either/or env contracts for AWS-compatible and generic S3 key names.
- Bridge Supabase publishable env aliases safely in generated hosted apps.
- Document or support monorepo-root env fallback for dogfood workspaces.
- Emit safe local `APP_BASE_URL` defaults while requiring production explicitness.
- Generate smoke tooling that runs from the app root.
- Add app-builder/dashboard shell presets for product-grade internal tools.
- Add an explicit test-user contract for authenticated screenshot smoke.
- Include object-storage CORS requirements in hosted-media docs, `stylyf intro --topic media`, generated handoff, local smoke, and security notes.
- Make generated media smoke expectations cover create intent, direct PUT, confirm pointer, list pointer, presigned GET, delete, and post-delete read failure.
- Ensure generated browser routes do not import AWS SDK, server env, or filesystem env loaders.
