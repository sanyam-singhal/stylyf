# Operations

Service: Stylyf Builder

## Health

- `GET /api/health`: lightweight liveness check; does not touch external services.
- `GET /api/readiness`: checks required environment presence without printing secret values.

## Logging

- `src/lib/server/observability.ts` emits JSON logs through `logInfo` and `logError`.
- Keep request IDs, user IDs, and domain identifiers explicit in log metadata.
- Never log raw auth tokens, database URLs, object-storage keys, or signed URLs.

## Backend

- auth: supabase
- database: supabase
- storage: s3

## Required Host Tools

The internal builder assumes the VPS has these tools installed globally and authenticated where needed:

```bash
npm i -g @depths/stylyf-cli@latest @depths/webknife@latest @openai/codex@latest
stylyf --version
webknife --help
codex --version
gh auth status
```

## Runtime Assumptions

- Supabase users are builder operators.
- The VPS owns the Codex login for v1.1.
- Generated project workspaces live under `STYLYF_BUILDER_ROOT` or `.stylyf-builder` in development.
- New project workspaces receive a generated `AGENTS.md` that forces a Stylyf-first loop before raw source edits.
- Generated app previews bind to `127.0.0.1`; public deployment of generated apps remains a manual dev-team decision.
- GitHub repo creation and pushes use the authenticated `gh` CLI.

## Useful Env Key Names

Do not print values in logs.

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `AWS_S3_BUCKET`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_ENDPOINT_URL_S3`
- `AWS_REGION`
- `APP_BASE_URL`
- `STYLYF_BUILDER_ROOT`
- `STYLYF_BUILDER_GITHUB_ORG`
- `STYLYF_BUILDER_CREATE_GITHUB_REPOS`
- `STYLYF_BUILDER_AGENT_ADAPTER`
- `CODEX_RUN_FLAGS`
