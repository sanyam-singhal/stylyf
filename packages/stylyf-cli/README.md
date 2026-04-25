# @depths/stylyf-cli

Stylyf is an agent-operated scaffolding compiler for SolidStart.

Its job is to let a coding agent describe the intended app in a small v1.0
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
stylyf intro --topic operator
stylyf intro --kind generic
stylyf intro --kind internal-tool
stylyf intro --topic spec
stylyf intro --topic ui
stylyf intro --topic data
stylyf intro --topic api
stylyf intro --topic backend
stylyf intro --topic media
stylyf intro --topic composition
stylyf intro --topic operations
stylyf intro --topic generated-output
stylyf intro --topic full
```

Use search when you need a component, shell, layout, backend snippet, or
capability reminder:

```bash
stylyf search dashboard filters table
stylyf search upload attachment presign
stylyf search auth session route protection
stylyf inspect component filter-toolbar
```

For a cold-start coding agent, `stylyf intro --topic operator` is the real
playbook. It explains how to move from prompt intent to app kind, resources,
flows, surfaces, explicit UI sections, backend/API additions, validation, and
generated-app checks.

## Canonical Starting Points

Use `stylyf new` to create a small v1.0 spec:

```bash
stylyf new generic --name "Atlas" --backend portable --media basic --output stylyf.spec.json
stylyf compose --base stylyf.spec.json --with route-chunk.json --output stylyf.composed.json
stylyf validate --spec stylyf.spec.json
stylyf plan --spec stylyf.spec.json
stylyf plan --spec stylyf.spec.json --resolved
stylyf generate --spec stylyf.spec.json --target ./my-app
```

## Minimal Composition Flow

1. choose the app kind: `generic`, `internal-tool`, `cms-site`, or `free-saas-tool`
2. choose the backend path: `portable` or `hosted`
3. choose media depth: `none`, `basic`, or `rich`
4. define `objects`, `flows`, and coarse `surfaces`
5. run `stylyf plan --resolved` and add explicit chunks only where defaults are too coarse
6. use `stylyf search` and `stylyf inspect component <id>` before passing component props
7. validate the spec
8. generate into a clean target directory
9. run generated-app `npm run check` and `npm run build`
10. perform an app-specific design pass inside the emitted app

## Minimal Spec Shape

```json
{
  "version": "1.0",
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

## Layered Composition

Start with `surfaces` as high-level route hints. When the default output is too
coarse, add explicit chunks with `stylyf compose`. Chunks can add or replace
surface sections, explicit routes, API routes, server modules, env vars, and
database schema additions.

```json
{
  "surfaces": [
    {
      "name": "Records",
      "kind": "list",
      "object": "records",
      "path": "/records",
      "audience": "user",
      "sections": [
        {
          "id": "records-workspace",
          "layout": "stack",
          "props": { "gap": "var(--space-6)" },
          "children": [
            { "component": "page-header", "props": { "title": "Records", "description": "Review and organize records." } },
            { "layout": "grid", "props": { "columns": 2 }, "children": ["filter-toolbar", "bulk-action-bar"] },
            "data-table-shell"
          ]
        }
      ]
    }
  ],
  "routes": [
    {
      "path": "/about",
      "shell": "marketing-shell",
      "page": "blank",
      "sections": [{ "layout": "stack", "children": ["page-header", "empty-state"] }]
    }
  ]
}
```

Supported layout nodes are `stack`, `row`, `column`, `grid`, `split`, `panel`,
`section`, `toolbar`, and `content-frame`. Component references resolve through
the bundled registry by id, slug, label, export name, or `cluster/slug`.

## Backend DSL Examples

Portable mode is authored in the public spec as `backend.mode: "portable"`.
Use SQLite for the fastest local smoke path, or Postgres when the generated app
should target a production database from the start.

```json
{
  "backend": {
    "mode": "portable",
    "portable": {
      "database": "sqlite"
    }
  },
  "media": {
    "mode": "rich"
  }
}
```

This compiles to Better Auth, Drizzle, SQLite/libsql, generated auth/database
modules, and Tigris/S3-compatible presigned storage when media is enabled.

Hosted mode is authored as `backend.mode: "hosted"`. Supabase owns auth and
data access; Tigris/S3-compatible storage remains the object substrate.

```json
{
  "backend": {
    "mode": "hosted"
  },
  "media": {
    "mode": "rich"
  }
}
```

This compiles to Supabase Auth, Supabase SDK data helpers, generated Supabase
SQL/policy files, and Tigris/S3-compatible presigned storage when media is
enabled. The generated compiler model is private, but the public spec can now
author controlled additions through `database.schema`, `env.extras`, `apis`,
and `server`.

## App Mechanics Layer

When you want more than just raw backend primitives, Stylyf supports:

- `objects`
- `ownership`
- `access`
- `relations`
- `media` and resource attachments
- `flows`
- `surfaces`
- `routes`
- `apis`
- `server`
- `database.schema`
- `env.extras`
- `fixtures`
- `navigation`
- `deployment`

That generalized layer drives:

- schema output
- CRUD server modules
- resource form scaffolds
- ownership/policy helpers
- attachment metadata and presign flows
- workflow actions, event logs, and notification surfaces
- explicit API routes and server query/action modules
- route-derived or custom navigation
- deployment handoff notes

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
- `stylyf intro --topic operator`
- `stylyf intro --topic ui`
- `stylyf intro --topic data`
- `stylyf intro --topic api`
- `stylyf intro --kind generic`
- `stylyf intro --kind internal-tool`
- `stylyf intro --kind cms-site`
- `stylyf intro --kind free-saas-tool`
- `stylyf intro --topic backend`
- `stylyf intro --topic media`
- `stylyf intro --topic composition`
- `stylyf intro --topic operations`
- `stylyf intro --topic generated-output`
- `stylyf intro --topic full`

Also see:

- [examples/README.md](./examples/README.md)
