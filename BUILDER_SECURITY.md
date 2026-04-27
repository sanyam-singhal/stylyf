# Builder Security

The v1.1 builder is internal-only, single-server, and operated through one controlled Codex harness. It should still fail closed.

## Auth And Roles

- Supabase Auth gates the builder app.
- Users are manually onboarded in Supabase.
- Profiles carry `admin`, `builder`, or `viewer` roles.
- Project access uses owner/member RLS policies in `apps/builder/supabase/policies.sql`.

## Command Safety

All server-side process execution goes through `packages/stylyf-builder-core`:

- allowed commands: `node`, `npm`, `npx @depths/webknife`, `git`, `stylyf`
- allowed npm scripts: `check`, `build`, `dev`, `test:smoke`, `test`, `env:check`
- allowed git subcommands: `status`, `diff`, `add`, `commit`, `push`, `init`, `remote`, `branch`, `config`
- command stdout/stderr is written to log files with token redaction

## Approval Boundary

The workbench queues approvals for prompts that mention sensitive operations:

- dependency/package installs
- env/secret/token changes
- SQL/migration execution
- destructive/delete operations
- git/repo/push actions

The first adapter is intentionally conservative. Real Codex App Server integration should map tool approvals into the same `approvals` table.

## Environment Handling

- Secret values must stay in runtime env or server-local files.
- Do not print `.env` values in logs, UI, or agent transcripts.
- Public Supabase values must be exported during production build as `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
- Storage keys are server-only.

## Storage

Tigris/S3-compatible storage is accessed through AWS SDK v3 presigned URLs. Postgres stores metadata and object keys only. Raw bucket credentials are never sent to browsers.

## Previews

Preview servers are dev processes for generated apps. Local development can iframe direct ports. Production should prefer authenticated reverse-proxy paths before broad preview exposure.

## GitHub

Use a narrow GitHub token or GitHub App installation scoped to Depths AI generated-app repositories. The builder should create private repos only.

## Telemetry

Telemetry is Supabase-only and internal. There is no external analytics pipeline. Keep summaries short and never include secret values.
