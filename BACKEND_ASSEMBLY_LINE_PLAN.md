# Backend Assembly Line Plan

## Objective

Build Phase 2 of Stylyf as a backend scaffolding layer for `@depths/stylyf-cli`
so that generated apps are not only frontend drafts, but baseline full-stack
SolidStart apps.

`v0.1.0` proved the frontend assembly line.

`v0.2.0` should add code generation for:

- database wiring
- authentication wiring
- object storage wiring
- server functions
- API routes
- typed environment contracts

The result should still be ordinary checked-in SolidStart source code, not a
runtime meta-framework.

## Scope

Phase 2 is intentionally opinionated and narrow.

Included in `v0.2.0`:

- `PostgreSQL` as the only supported database
- `Drizzle ORM` as the database layer
- `Better Auth` as the only auth system
- `AWS SDK v3` S3 client as the storage base
- support for S3-compatible providers through endpoint-style configuration
- SolidStart server functions using `"use server"`
- SolidStart API routes for external callbacks, auth handlers, uploads, and
  webhook-style endpoints
- generated typed env helpers and capability modules

Explicitly excluded from `v0.2.0`:

- MySQL / SQLite / other databases
- alternate auth providers/frameworks
- payment gateways
- queueing / cron / background jobs
- RBAC-heavy enterprise permission systems
- provider-specific storage SDKs beyond the S3-compatible interface
- business-domain schema generation beyond baseline examples

## Grounding

This plan is grounded in the latest relevant official docs as of `21 Apr 2026`.

### SolidStart / Solid Router

- SolidStart distinguishes between UI routes and API routes.
- `"use server"` is the core primitive for server-only functions.
- Solid Router still prefers `query` + `createAsync` for reads and `action` for
  writes.

Sources:

- https://docs.solidjs.com/solid-start/building-your-application/routing
- https://docs.solidjs.com/solid-start/building-your-application/api-routes
- https://docs.solidjs.com/solid-start/reference/server/use-server
- https://docs.solidjs.com/solid-start/building-your-application/data-mutation
- https://docs.solidjs.com/solid-router/reference/data-apis/query
- https://docs.solidjs.com/solid-router/reference/data-apis/create-async

### Better Auth

- Better Auth has an official SolidStart integration.
- The handler is mounted through `/routes/api/auth/[...auth].ts`.
- Better Auth supports a Drizzle adapter.
- Better Auth can generate required schema and migrations from the auth config.

Sources:

- https://better-auth.com/docs/integrations/solid-start
- https://better-auth.com/docs/installation
- https://better-auth.com/docs/adapters/drizzle
- https://better-auth.com/docs/concepts/client

### Drizzle ORM

- Drizzle officially supports PostgreSQL-first TypeScript workflows.
- Drizzle Kit is the migration/config tool we should wire into generated apps.

Sources:

- https://orm.drizzle.team/docs/get-started
- https://orm.drizzle.team/docs/drizzle-kit-generate
- https://orm.drizzle.team/docs/drizzle-kit-migrate

### AWS SDK v3 / S3

- AWS SDK v3 provides the `S3Client` and the TypeScript-first modular packages
  we need.
- Presigned uploads are the right baseline pattern for browser uploads.
- The same approach works for S3-compatible object stores when endpoint and
  path-style configuration are surfaced.

Sources:

- https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/creating-and-calling-service-objects.html
- https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html

## Core Product Take

`v0.2.0` should not try to generate “the whole backend”.

It should generate a clean baseline capability layer:

- a real DB client and schema layout
- a real auth instance and client
- a real storage client and upload handshake
- a real env contract
- real API routes and server functions

That gives Codex a stable full-stack starting point and removes the most
repeated baseline work, while leaving domain logic to later prompts.

## What The CLI Should Generate

Generated apps should receive explicit source files such as:

```text
src/
  app.tsx
  app.css
  lib/
    env.ts
    db.ts
    auth.ts
    auth-client.ts
    storage.ts
    server/
      queries/
      actions/
      guards/
  routes/
    api/
      auth/
        [...auth].ts
      uploads/
        presign.ts
      webhooks/
        ...
```

and at the project root:

```text
drizzle.config.ts
.env.example
```

Generated apps must remain standalone:

- no imports from this repo
- no imports from `@depths/stylyf-cli`
- no hidden runtime dependency on the generator

## Backend Capability Model

Phase 2 should introduce backend capabilities as explicit generator-owned
artifacts.

Recommended capability families:

- `database`
- `auth`
- `storage`
- `server-functions`
- `api-routes`
- `env`

These capabilities should be generated from a shallow IR, not configured by a
deep runtime DSL.

## IR Extension Design

The existing frontend IR should be extended, not replaced.

Recommended additions:

```ts
type BackendIR = {
  env?: EnvIR;
  database?: DatabaseIR;
  auth?: AuthIR;
  storage?: StorageIR;
  apis?: ApiRouteIR[];
  server?: ServerModuleIR[];
};

type DatabaseIR = {
  dialect: "postgres";
  migrations?: "drizzle-kit";
  schema?: DatabaseSchemaIR[];
};

type AuthIR = {
  provider: "better-auth";
  mode?: "session";
  features?: {
    emailPassword?: boolean;
    magicLink?: boolean;
  };
  protect?: AuthProtectionIR[];
};

type StorageIR = {
  provider: "s3";
  mode?: "presigned-put";
  bucketAlias?: string;
};

type ApiRouteIR = {
  path: string;
  method: "GET" | "POST" | "PATCH" | "DELETE";
  type: "json" | "webhook" | "presign-upload";
  name: string;
};

type ServerModuleIR = {
  name: string;
  type: "query" | "action";
  resource?: string;
};
```

Important constraints:

- `database.dialect` must be fixed to `"postgres"` in `v0.2.0`
- `auth.provider` must be fixed to `"better-auth"` in `v0.2.0`
- `storage.provider` must be fixed to `"s3"` in `v0.2.0`
- API route generation should support named route modules and route type
  templates, not arbitrary server code

This keeps the IR future-extensible without pretending to support more than we
actually do.

## Generated Dependency Strategy

Generated apps should install, in addition to the frontend stack:

- `drizzle-orm`
- `drizzle-kit`
- `postgres`
- `better-auth`
- `@aws-sdk/client-s3`
- `@aws-sdk/s3-request-presigner`
- any minimal helper packages needed for env validation if we choose one

My recommendation for `v0.2.0`:

- use `postgres` as the initial PostgreSQL driver
- use Drizzle with PostgreSQL only
- keep env handling as generated typed helpers first, not a heavy framework

## Auth Scope For v0.2.0

Keep auth narrow and reliable.

Recommended baseline:

- Better Auth with session-based auth
- email/password enabled
- client wrapper in `src/lib/auth-client.ts`
- SolidStart handler in `src/routes/api/auth/[...auth].ts`
- Drizzle adapter wired to the generated DB client
- route/server guard helpers for “require session” and “optional session”

Do not make `v0.2.0` depend on OAuth or multi-tenant org plugins.

Those can come later as additive templates once the baseline is stable.

## Database Scope For v0.2.0

Database generation should provide:

- `src/lib/db.ts`
- `src/lib/db/schema.ts` or `src/lib/db/schema/*.ts`
- `drizzle.config.ts`
- migration scripts in `package.json`
- example domain tables only when requested by IR

The DB layer should distinguish between:

- baseline infrastructure schema
- optional domain schema emitted from IR

The auth schema should be wired to the same Drizzle/Postgres setup.

Recommended posture:

- generated apps should contain explicit Drizzle schema source
- migration flow should use Drizzle Kit
- Stylyf may invoke Better Auth’s schema generation during generation or via a
  controlled post-generate step, but the resulting source and migrations must
  live in the generated app

## Storage Scope For v0.2.0

Storage should be modeled as a server-owned capability.

Generated baseline should provide:

- `src/lib/storage.ts`
- `getStorageClient()`
- `createPresignedUpload(...)`
- `deleteObject(...)`
- `buildObjectUrl(...)` or equivalent helper

Recommended baseline upload flow:

1. client asks app server for a presigned upload
2. app server signs a `PUT` upload for a key and content type
3. client uploads directly to object storage
4. app optionally stores metadata in Postgres later

This is the right default because it avoids shipping object-store credentials to
the browser and matches the official presigned URL guidance.

Configuration should also support S3-compatible providers through env values
such as:

- endpoint
- region
- bucket
- access key
- secret key
- force path style
- public base URL

## SolidStart Backend Pattern Strategy

The generator should support both of SolidStart’s important server-side shapes.

### 1. Server Functions

Use for app-internal reads and writes:

- resource queries
- form actions
- protected mutations
- upload handshake helpers

Recommended generated shape:

- `query(...)` + `"use server"` for reads
- `action(...)` + `"use server"` for writes
- `createAsync(...)` on the page/component side

### 2. API Routes

Use for:

- Better Auth handler mount
- webhook receivers
- public JSON endpoints
- upload signing endpoints when explicit route exposure is preferable

This distinction should be explicit in the generator and the IR.

## Env Contract Strategy

Phase 2 should add a first-class env contract plane.

Generated apps should receive:

- `.env.example`
- `src/lib/env.ts`
- clear separation of required vs optional variables
- helpers that fail fast on missing server env

Recommended baseline variables:

### App / Core

- `APP_BASE_URL`
- `NODE_ENV`

### Better Auth

- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`

### Database

- `DATABASE_URL`

### Storage

- `S3_REGION`
- `S3_BUCKET`
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`
- `S3_ENDPOINT`
- `S3_FORCE_PATH_STYLE`
- `S3_PUBLIC_BASE_URL`

The generator should emit only the env blocks needed for enabled capabilities.

## Search / Manifest Expansion

The CLI’s search system should be expanded for backend assembly.

It should index:

- app shell templates
- route templates
- API route templates
- server function templates
- auth templates
- db schema templates
- storage helpers
- env blocks

This matters because Codex should be able to search for:

- “protected resource detail page”
- “presigned upload api route”
- “drizzle table with timestamps”
- “better-auth session guard”

without reopening large source trees.

## Step-by-Step Implementation Plan

### Step 1. Create Backend Manifest Families

Add bundled manifest families for:

- backend capabilities
- API route templates
- server function templates
- env blocks
- database/auth/storage snippets

Deliverables:

- manifest sources under `packages/stylyf-cli/src/manifests`
- bundled build output in `dist`
- search metadata for backend artifacts

### Step 2. Extend The IR Schema

Implement backend IR support in:

- TypeScript types
- JSON schema
- runtime validation

Add validation rules such as:

- only `postgres` allowed for `database.dialect`
- only `better-auth` allowed for `auth.provider`
- only `s3` allowed for `storage.provider`
- API route path collisions
- reserved auth route protection

Deliverables:

- updated `validate`
- updated schema export
- IR examples covering backend-enabled apps

### Step 3. Add Env Contract Generation

Implement generation for:

- `.env.example`
- `src/lib/env.ts`
- server-safe env helpers

Deliverables:

- emitted env files based on enabled capabilities
- typed env access for DB/auth/storage modules

### Step 4. Add PostgreSQL + Drizzle Project Scaffolding

Generate:

- `src/lib/db.ts`
- `src/lib/db/schema.ts` or split schema files
- `drizzle.config.ts`
- package scripts for Drizzle

Recommended scripts:

- `db:generate`
- `db:migrate`
- `db:studio`

Deliverables:

- generated project builds with DB modules present
- Drizzle config is valid and points to `DATABASE_URL`

### Step 5. Add Better Auth + Drizzle Integration

Generate:

- `src/lib/auth.ts`
- `src/lib/auth-client.ts`
- `src/routes/api/auth/[...auth].ts`
- guard helpers for server functions and route data

Recommended baseline auth config:

- email/password enabled
- session auth
- Drizzle adapter using the generated DB module

Important design decision:

- Stylyf should keep the Better Auth surface explicit and readable
- Stylyf should not hide Better Auth behind its own runtime wrapper

Deliverables:

- generated app contains complete Better Auth wiring
- DB/auth integration is source-visible and editable

### Step 6. Add Better Auth Schema + Migration Flow

We need a deterministic strategy for auth schema.

Recommended implementation order:

1. emit Better Auth config
2. run the official Better Auth schema generation step in the generated app
3. run Drizzle migration generation
4. keep the resulting schema/migrations in the generated app

This should be wrapped by the CLI so the user does not manually rediscover the
flow.

Deliverables:

- generated auth schema exists in the target app
- migration files are created or generation instructions are explicit
- generated app contains no hidden dependency on the Stylyf repo

### Step 7. Add S3 Storage Capability

Generate:

- `src/lib/storage.ts`
- storage env helpers
- presigned upload helper
- delete/read URL helpers

Recommended baseline mode:

- `presigned-put`

Deliverables:

- generated app can issue a presigned upload URL from server code
- generated code supports S3-compatible endpoints via env config

### Step 8. Add Server Function Templates

Create generator templates for:

- list query
- detail query
- create action
- update action
- delete action
- upload handshake action
- require-session guard wrappers

These should follow SolidStart’s `"use server"` and Solid Router
`query`/`action` patterns directly.

Deliverables:

- bundled templates
- emitted source files in generated apps

### Step 9. Add API Route Templates

Create generator templates for:

- `json`
- `webhook`
- `presign-upload`
- auth mount route

API route IR should include:

- route path
- route name
- route type
- HTTP method

Deliverables:

- generated `src/routes/api/**` files
- route handlers export the correct method names

### Step 10. Extend `stylyf generate`

Update generation orchestration so one CLI run can:

1. validate frontend + backend IR
2. emit app shell and frontend files
3. emit backend capability files
4. patch `package.json`
5. install dependencies
6. run post-generate auth/db scaffolding steps as needed

Deliverable:

- one command generates a runnable baseline full-stack app

### Step 11. Add Search Coverage For Backend Assembly

Expand `search`, `build-index`, and `serve-search` so Codex can search backend
artifacts just as efficiently as frontend ones.

Deliverables:

- backend templates appear in search results
- reasons/snippets explain why a backend artifact matched

### Step 12. Dogfood With Two Full-Stack Example Apps

Generate at least:

- one internal app with auth + DB + storage
- one content/docs app with auth + DB but lighter backend needs

Minimum validation:

1. generation succeeds
2. `npm install` succeeds
3. project build succeeds
4. Better Auth handler route exists
5. Drizzle config exists
6. storage helpers exist when enabled

### Step 13. Publishability Pass For `v0.2.0`

Verify from the packaged CLI, outside this repo:

- `stylyf intro` reflects the new backend capabilities
- backend-enabled generation works in a clean temp directory
- the generated app builds
- generated app does not import from this repo or the CLI package

## Validation Gates

Before calling `v0.2.0` done, we should verify all of:

### Package-Level

- `npm run cli:build`
- packaged CLI contains manifests/templates/assets for backend scaffolding
- `stylyf --help` and `stylyf intro` describe backend options clearly

### Generated Project-Level

- `npm install`
- `npm run build`
- `drizzle.config.ts` is valid
- Better Auth mount route exists
- env contract files exist

### Capability-Level

- auth wiring compiles
- storage helper compiles
- at least one generated API route compiles
- at least one generated `query` and one generated `action` compile

## Success Criteria

`v0.2.0` is successful when Codex can:

1. write a shallow JSON IR including backend capabilities
2. search for relevant backend assembly artifacts
3. run one `stylyf generate` command
4. receive a standalone SolidStart app with:
   - frontend shell and routes
   - database wiring
   - Better Auth wiring
   - storage wiring
   - server functions
   - API routes

And the generated app should require refinement of business logic, not
re-scaffolding of core full-stack capabilities.

## Recommended Immediate Next Move

Start with the assets that unblock every later backend step:

1. backend manifest families
2. IR extension + validation
3. env contract generation
4. PostgreSQL + Drizzle scaffolding
5. Better Auth + Drizzle integration

That gives Stylyf a real backend baseline quickly, while still keeping the
scope tight enough for a disciplined `v0.2.0`.
