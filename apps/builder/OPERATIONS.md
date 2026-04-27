# Operations

Service: Stylyf Builder

## Validation

Run these from the repo root:

```bash
npm --prefix apps/builder run env:check
npm --prefix apps/builder run check
npm --prefix apps/builder run build
```

The env check prints key names only. It must never print raw Supabase keys, object-storage credentials, cookies, or signed URLs.

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
- Browser presigned uploads require Tigris/S3 bucket CORS for the exact page origin. The server only signs URLs; browser bytes go directly to object storage.
- Every accepted project iteration should create a workspace git commit and push when a remote exists.

## Object Storage CORS

Direct browser uploads need the storage bucket to allow the builder origin for `PUT`. This is not a server CORS setting; it is bucket CORS.

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

The rule should allow `GET`, `PUT`, and `HEAD`, allow headers `content-type` and `x-amz-*`, and expose `ETag`.

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
- `STYLYF_BUILDER_CORS_ORIGINS`
- `APP_BASE_URL`
- `STYLYF_BUILDER_ROOT`
- `STYLYF_BUILDER_GITHUB_ORG`
- `STYLYF_BUILDER_CREATE_GITHUB_REPOS`
- `STYLYF_BUILDER_AGENT_ADAPTER`
- `CODEX_RUN_FLAGS`
