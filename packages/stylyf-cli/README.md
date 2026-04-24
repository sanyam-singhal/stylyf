# @depths/stylyf-cli

Stylyf is an agent-operated scaffolding compiler for SolidStart.

Its job is to let a coding agent describe the intended app in a small v0.4
spec, inspect the generation plan, generate a real source tree, and then keep
iterating inside that emitted app without redoing repetitive setup work by hand.

The generated app is a separate destination project. It does not import from
this repo and does not depend on `@depths/stylyf-cli` at runtime.

## What Stylyf Generates

- app shell, route files, page shells, layout wrappers, and copied registry UI
- theme system, global styling, and emitted app-owned CSS
- backend capability files for either supported backend path
- explicit source files for auth, data, storage, API routes, and server modules
- resource-driven app mechanics when `objects`, `flows`, and `surfaces` are used

## App Paths

- `generic`: general full-stack app scaffolding without niche assumptions
- `internal-tool`: authenticated operational apps, dashboards, approval queues, and admin-style CRUD
- `cms-site`: public publishing surfaces plus authenticated editorial management
- `free-saas-tool`: public/free utility surfaces with optional saved results and no billing gateway

## Two Backend Paths

### Portable

- `better-auth + drizzle + postgres/sqlite + s3-compatible storage`
- best when you want provider-agnostic auth/data control
- best when you want Better Auth plugins or Drizzle schema ownership
- best when you want easy local SQLite smoke testing

### Hosted

- `supabase auth + supabase data sdk + tigris-compatible s3 storage`
- best when you want the fastest managed deployment path
- best when you are comfortable treating Supabase as both the auth and data platform

In both paths, storage remains presigned-URL based, so the browser never
receives raw object-storage credentials.

## Install

```bash
npm install -g @depths/stylyf-cli
```

or:

```bash
npx @depths/stylyf-cli --help
```

## Start Here

Use the layered intro:

```bash
stylyf intro
stylyf intro --kind generic
stylyf intro --kind internal-tool
stylyf intro --topic spec
stylyf intro --topic backend
stylyf intro --topic media
stylyf intro --topic generated-output
stylyf intro --topic full
```

Use search when you need a component, shell, layout, backend snippet, or
capability reminder:

```bash
stylyf search dashboard filters table
stylyf search upload attachment presign
stylyf search auth session route protection
```

## Canonical Starting Points

Use `stylyf new` to create a small v0.4 spec:

```bash
stylyf new generic --name "Atlas" --backend portable --media basic --output stylyf.spec.json
stylyf validate --spec stylyf.spec.json
stylyf plan --spec stylyf.spec.json
stylyf generate --spec stylyf.spec.json --target ./my-app
```

## Minimal Composition Flow

1. choose the backend path
2. choose an app kind: `generic`, `internal-tool`, `cms-site`, or `free-saas-tool`
3. define `objects`, `flows`, and optional `surfaces`
4. let Stylyf expand surfaces into routes, shells, forms, backend modules, and handoff docs
5. validate the spec
6. generate into a clean target directory
7. move into the emitted app and keep developing there

## Minimal Spec Shape

```json
{
  "version": "0.4",
  "app": {
    "name": "Atlas",
    "kind": "generic"
  },
  "backend": {
    "mode": "portable",
    "portable": {
      "database": "sqlite"
    }
  },
  "media": {
    "mode": "rich"
  },
  "objects": [
    {
      "name": "records",
      "ownership": "user",
      "fields": [
        { "name": "title", "type": "short-text", "required": true },
        { "name": "status", "type": "status", "options": ["draft", "review", "published"] }
      ]
    }
  ]
}
```

## Surface-Driven Routes

`surfaces` are high-level route hints. They intentionally do not expose layout
trees or route files, but they do drive generated routes.

```json
{
  "surfaces": [
    { "name": "Home", "kind": "dashboard", "path": "/", "audience": "user" },
    { "name": "Records", "kind": "list", "object": "records", "path": "/records", "audience": "user" },
    { "name": "New Record", "kind": "create", "object": "records", "path": "/records/new", "audience": "user" }
  ]
}
```

Supported surface kinds are `dashboard`, `list`, `detail`, `create`, `edit`,
`settings`, `landing`, `content-index`, `content-detail`, and `tool`.

## Portable Quick Sketch

```json
{
  "database": {
    "dialect": "sqlite",
    "migrations": "drizzle-kit"
  },
  "auth": {
    "provider": "better-auth",
    "mode": "session",
    "features": {
      "emailPassword": true
    }
  },
  "storage": {
    "provider": "s3",
    "mode": "presigned-put",
    "bucketAlias": "uploads"
  }
}
```

## Hosted Quick Sketch

```json
{
  "database": {
    "provider": "supabase"
  },
  "auth": {
    "provider": "supabase",
    "mode": "session",
    "features": {
      "emailPassword": true,
      "emailOtp": true
    }
  },
  "storage": {
    "provider": "s3",
    "mode": "presigned-put",
    "bucketAlias": "uploads"
  }
}
```

## App Mechanics Layer

When you want more than just raw backend primitives, Stylyf supports:

- `objects`
- `ownership`
- `access`
- `relations`
- `attachments`
- `flows`
- `surfaces`

That generalized layer drives:

- schema output
- CRUD server modules
- resource form scaffolds
- ownership/policy helpers
- attachment metadata and presign flows
- workflow actions, event logs, and notification surfaces

## Hosted Apply Checklist

For the hosted Supabase path:

1. fill in `.env` with the Supabase and S3/Tigris values
2. apply `supabase/schema.sql`
3. review and apply `supabase/policies.sql`
4. only then treat hosted CRUD/runtime testing as representative

## What Stylyf Still Expects The Agent To Decide

- product-specific domain rules and business logic
- final authorization and role design beyond the bundled presets
- final Supabase RLS shape for production-grade hosted apps
- email delivery wiring for OTP or notification delivery
- storage retention, moderation, and lifecycle policy beyond the generated baseline

## Where To Drill Deeper

- `stylyf intro --topic spec`
- `stylyf intro --kind generic`
- `stylyf intro --kind internal-tool`
- `stylyf intro --kind cms-site`
- `stylyf intro --kind free-saas-tool`
- `stylyf intro --topic backend`
- `stylyf intro --topic media`
- `stylyf intro --topic generated-output`
- `stylyf intro --topic full`

Also see:

- [examples/README.md](./examples/README.md)
