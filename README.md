# Stylyf

Stylyf is the authoring repo for [`@depths/stylyf-cli`](https://www.npmjs.com/package/@depths/stylyf-cli), a JSON-driven assembly-line CLI for generating standalone full-stack SolidStart apps.

The intended operator is a coding agent. Stylyf exists to remove repeatable setup work so an agent can describe an app once, emit a real source tree, and then keep iterating inside the generated app instead of redoing scaffolding by hand.

Generated apps:

- are ordinary checked-in SolidStart source code
- run on their own
- do not import from this repo
- do not depend on `@depths/stylyf-cli` at runtime

## What The CLI Generates

- app shell, route files, page shells, layout wrappers, and global styling
- copied registry components and composition-ready UI surfaces
- backend capability files when requested by the IR
- typed env scaffolding for frontend and backend capabilities
- explicit API routes and server modules

## Backend Paths

Stylyf currently supports two full-stack branches.

### Portable

- Better Auth
- Drizzle ORM
- PostgreSQL or SQLite/libsql
- S3-compatible object storage via AWS SDK v3 presigned URLs

This is the provider-agnostic path.

### Hosted

- Supabase Auth
- Supabase SDK data access
- Tigris-compatible S3 object storage via AWS SDK v3 presigned URLs

This is the fastest deployment path.

In both branches, object storage stays presigned-URL based so the browser never receives raw bucket credentials.

## Choosing A Path

- choose `portable` for provider-agnostic auth/data control, Better Auth plugins, Drizzle-owned schema, and local SQLite smoke testing
- choose `hosted` for the fastest managed deployment path with Supabase for auth+data and Tigris for object storage
- the portable branch is the better fit when you want long-term portability
- the hosted branch is the better fit when you want the shortest path from scaffold to deployed app

## Package

Install globally:

```bash
npm install -g @depths/stylyf-cli
```

Or use it directly:

```bash
npx @depths/stylyf-cli --help
```

Core commands:

```bash
stylyf intro
stylyf search dashboard filters table
stylyf validate --ir app.json
stylyf generate --ir app.json --target ./my-app
stylyf serve-search --port 4310
```

## Repo Structure

- [packages/stylyf-cli](./packages/stylyf-cli): publishable CLI package
- [src](./src): Stylyf registry site and source-owned component inventory used to build bundled manifests/assets
- [scripts](./scripts): manifest sync, package verification, and related build tooling
- [DEPLOYMENT.md](./DEPLOYMENT.md): deployment notes for the Stylyf site

## Local Development

Build the published CLI from this repo:

```bash
npm run cli:build
```

Verify the packaged CLI end to end:

```bash
npm run cli:verify-pack
```

Run the registry site locally:

```bash
npm run dev
```

Run the local UI review loop:

```bash
npm run dev:ui
npm run ui:interact
```

## Release Status

- npm package: [`@depths/stylyf-cli`](https://www.npmjs.com/package/@depths/stylyf-cli)
- current codebase milestone: `v0.3.0`
- GitHub releases: [Depths-AI/stylyf releases](https://github.com/Depths-AI/stylyf/releases)

## License

The CLI package is released under MIT. See [packages/stylyf-cli/LICENSE](./packages/stylyf-cli/LICENSE).
