# Stylyf

Stylyf is a monorepo centered on [`@depths/stylyf-cli`](https://www.npmjs.com/package/@depths/stylyf-cli), an agent-operated scaffolding compiler for generating standalone full-stack SolidStart apps.

The repo now has a simple split:

- `packages/stylyf-cli`: the publishable CLI
- `packages/stylyf-source`: the internal source-owned UI inventory and styling grammar used to build CLI manifests and bundled assets
- `apps/landing`: the public landing page for the CLI

Generated apps:

- are ordinary checked-in SolidStart source trees
- run on their own
- do not import this repo
- do not depend on `@depths/stylyf-cli` at runtime

## Install

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
stylyf plan --spec stylyf.spec.json
stylyf generate --spec stylyf.spec.json --target ./my-app
stylyf search auth supabase tigris
stylyf serve-search --port 4310
```

## Backend Modes

### Portable

- Better Auth
- Drizzle ORM
- PostgreSQL or SQLite/libsql
- S3-compatible object storage via AWS SDK v3 presigned URLs

### Hosted

- Supabase Auth
- Supabase SDK data access
- Tigris-compatible S3 object storage via AWS SDK v3 presigned URLs

Both modes keep storage presigned-URL based so browsers never receive raw bucket credentials.

## Monorepo Layout

- [apps/landing](./apps/landing): small SolidStart landing page for Stylyf
- [packages/stylyf-cli](./packages/stylyf-cli): published CLI package
- [packages/stylyf-source](./packages/stylyf-source): internal source inventory used to build bundled assets/manifests
- [scripts](./scripts): repo-level manifest sync and package verification tooling

## Local Development

Run the landing page:

```bash
npm run dev
```

Build the landing page:

```bash
npm run build
```

Build the CLI package from repo source:

```bash
npm run cli:build
```

Verify the packaged CLI end to end:

```bash
npm run cli:verify-pack
```

## Deployment

The public site is the landing app in `apps/landing`. See [DEPLOYMENT.md](./DEPLOYMENT.md).

## Releases

- npm package: [`@depths/stylyf-cli`](https://www.npmjs.com/package/@depths/stylyf-cli)
- GitHub releases: [Depths-AI/stylyf releases](https://github.com/Depths-AI/stylyf/releases)

## License

The CLI package is released under MIT. See [packages/stylyf-cli/LICENSE](./packages/stylyf-cli/LICENSE).
