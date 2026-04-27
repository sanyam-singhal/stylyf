# Stylyf

Stylyf is a monorepo centered on [`@depths/stylyf-cli`](https://www.npmjs.com/package/@depths/stylyf-cli), an agent-operated scaffolding compiler for generating standalone full-stack SolidStart apps.

The CLI remains the public package product. The repo also now contains an internal dogfood control plane for Depths AI:

- `packages/stylyf-cli`: the publishable CLI
- `packages/stylyf-source`: the source-owned UI inventory and styling grammar used to build CLI manifests and bundled assets
- `packages/stylyf-builder-core`: internal server-side workspace/process/agent orchestration helpers
- `apps/builder`: auth-gated internal app factory deployed at `stylyf.com`
- `apps/landing`: retained small landing app source, no longer the live default site

Generated apps:

- are ordinary checked-in SolidStart source trees
- run on their own
- do not import this repo
- do not depend on `@depths/stylyf-cli` at runtime

## CLI Install

```bash
npm install -g @depths/stylyf-cli
```

or:

```bash
npx @depths/stylyf-cli --help
```

## Core CLI Commands

```bash
stylyf intro
stylyf new generic --name "Atlas" --backend portable --media basic --output stylyf.spec.json
stylyf validate --spec stylyf.spec.json
stylyf plan --spec stylyf.spec.json --resolved
stylyf generate --spec stylyf.spec.json --target ./my-app
stylyf search auth supabase tigris
stylyf serve-search --port 4310
```

## Backend Modes

Portable:

- Better Auth
- Drizzle ORM
- PostgreSQL or SQLite/libsql
- S3-compatible object storage via AWS SDK v3 presigned URLs

Hosted:

- Supabase Auth
- Supabase SDK data access
- Tigris-compatible S3 object storage via AWS SDK v3 presigned URLs

Both modes keep storage presigned-URL based so browsers never receive raw bucket credentials.

## Internal Builder

`apps/builder` is the v1.1 internal GUI layer for non-technical operators. It provides:

- Supabase email/password auth
- project workspaces
- friendly IR panes plus raw JSON escape hatch
- Stylyf validate/plan/generate controls
- managed local previews
- Codex App Server adapter seam with manual fallback
- Webknife screenshot QA loop
- git commit/push handoff workflow
- Supabase-only internal telemetry

Deployment remains limited to the builder control plane. Generated apps are committed/pushed for dev review; deployment of generated apps is intentionally manual.

## Local Development

Run the internal builder:

```bash
npm run dev
```

Build the internal builder:

```bash
npm run build
```

Build and verify the CLI package:

```bash
npm run cli:build
npm run cli:verify-pack
```

Run the old landing app explicitly:

```bash
npm run landing:dev
npm run landing:build
```

## Operations

- Builder app operations, deployment, security, smoke testing, and dogfood lessons: [apps/builder/README.md](./apps/builder/README.md)
- Dogfood/scaffold issues: [ISSUES.md](./ISSUES.md)

## Releases

- npm package: [`@depths/stylyf-cli`](https://www.npmjs.com/package/@depths/stylyf-cli)
- GitHub releases: [Depths-AI/stylyf releases](https://github.com/Depths-AI/stylyf/releases)

## License

The CLI package is released under MIT. See [packages/stylyf-cli/LICENSE](./packages/stylyf-cli/LICENSE).
