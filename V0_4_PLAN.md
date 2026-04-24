Below is a Codex-handoff implementation plan for **Stylyf v0.4 as a clean-break agent-operated scaffolding compiler**, not an incremental evolution of v0.3.x

# Stylyf v0.4 implementation plan

## 0. Design intent

v0.4 should replace the public IR with a cleaner agent-facing **Spec DSL**:

```text
SpecV04 -> ExpandedApp -> BuildPlan -> SolidStart source
```

Do **not** preserve v0.3 compatibility.

The current source is useful as implementation substrate, but the public authoring surface should no longer expose `database.schema`, `server`, `apis`, route section layout trees, or generic escape hatches as first-class concepts. Today those all sit beside `resources`, `workflows`, `auth`, `storage`, and `routes` in the IR schema, which is exactly the confusion v0.4 should remove. 

v0.4 user-facing app kinds:

1. `generic`
2. `internal-tool`
3. `cms-site`
4. `free-saas-tool`

Backend modes:

1. `portable`: Better Auth + Drizzle + SQLite/Postgres DB + Tigris/S3 object storage
2. `hosted`: Supabase Auth + Supabase data SDK + Tigris/S3 object storage

For dogfooding, every step should smoke test the **portable Better Auth + Drizzle SQLite path** first. Hosted Supabase and object-storage smoke tests happen at the end.

---

# Current codebase seams

## Keep and adapt

These are strong implementation assets:

| Area                    | Current seam                            | v0.4 treatment                                                                                                                                                                         |
| ----------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CLI dispatch            | `packages/stylyf-cli/src/index.ts`      | Replace command set with v0.4 commands while keeping simple dispatch style. Current dispatch is clean and easy for Codex to modify.                                                    |
| Generated project shell | `generators/project.ts`                 | Keep package/scaffold generation; adapt from `AppIR` to internal build model. It already handles scripts, deps, SolidStart, Drizzle, Supabase, Better Auth, and S3 deps.               |
| Backend resources       | `generators/backend/resources.ts`       | Keep logic, but feed it from v0.4 expansion instead of user-authored low-level IR. It already derives schema, server modules, ownership columns, asset tables, and Supabase policies.  |
| Workflows               | `generators/backend/workflows.ts`       | Keep and simplify as generated capability. It already creates event/notification tables and transition actions.                                                                        |
| Attachments             | `generators/backend/attachments.ts`     | Keep; v0.4 media modes should compile into this. Existing code already supports presigned upload intent, confirm, replace, delete, metadata, and hosted/portable branches.             |
| Forms                   | `generators/backend/forms.ts`           | Keep as first generated CRUD form substrate. It already generates form catalogs, server form actions, parsing, validation, and Solid components.                                       |
| Better Auth             | `generators/backend/auth.ts`            | Keep as portable auth branch.                                                                                                                                                          |
| Supabase                | `generators/backend/supabase.ts`        | Keep as hosted branch.                                                                                                                                                                 |
| Env generation          | `generators/backend/env.ts`             | Keep; map v0.4 backend/media capabilities into env entries. It already covers Supabase, Better Auth, DB, and S3/Tigris-compatible vars.                                                |
| Search                  | `search/index.ts` + manifests           | Keep and extend to app kinds, patterns, generated capabilities. Current fuzzy search is simple and useful for terminal agents.                                                         |
| Package verification    | `scripts/verify-stylyf-cli-package.mjs` | Rewrite around v0.4 specs. It is already the right end-to-end packaging dogfood harness.                                                                                               |

## Replace

| Area                 | Current seam                       | v0.4 treatment                                                                                                                                         |
| -------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Public IR types      | `ir/types.ts`                      | Replace with v0.4 spec types. Current flat `AppIR` should become private/generated or removed.                                                         |
| Public JSON schema   | `ir/schema.ts`                     | Replace with `spec/schema.ts`. Current schema exposes too much implementation.                                                                         |
| Fragment composition | `ir/compose.ts`                    | Remove as public workflow. v0.4 does not need backward-compatible fragment merge. Current merge semantics are useful learning but not the new design.  |
| `validate --ir`      | `commands/validate.ts`             | Replace with `validate --spec`. Current command validates composed IR fragments.                                                                       |
| `generate --ir`      | `commands/generate.ts`             | Replace with `generate --spec`. Current command composes fragments then generates.                                                                     |
| Intro content        | `generators/intro.ts`              | Rewrite around progressive exposure by kind/topic. Current intro proves the interaction model, but content is v0.3-centric.                            |
| Verify IR examples   | examples and package verify script | Replace with v0.4 specs for internal, CMS, free SaaS.                                                                                                  |

---

# Target v0.4 CLI

## Commands

```bash
stylyf intro
stylyf intro --kind internal-tool
stylyf intro --kind cms-site
stylyf intro --kind free-saas-tool
stylyf intro --topic backend
stylyf intro --topic media
stylyf intro --topic generated-output

stylyf new internal-tool --name "Acme Ops" --backend portable --media rich --output stylyf.spec.json
stylyf new cms-site --name "Field Notes" --backend portable --media rich --output stylyf.spec.json
stylyf new free-saas-tool --name "Resize Kit" --backend portable --media basic --output stylyf.spec.json

stylyf validate --spec stylyf.spec.json
stylyf plan --spec stylyf.spec.json
stylyf plan --spec stylyf.spec.json --json
stylyf generate --spec stylyf.spec.json --target ./generated-app --no-install
stylyf generate --spec stylyf.spec.json --target ./generated-app
stylyf search internal approvals table
```

## Removed public v0.3 commands/flags

Remove or hard-fail with clear v0.4 error:

```bash
--ir
--print-resolved
--write-resolved
```

Do not support old IR files.

Suggested error:

```text
Stylyf v0.4 no longer accepts --ir fragments.
Use --spec stylyf.spec.json. Run `stylyf intro --topic spec` for the v0.4 DSL.
```

---

# Target v0.4 spec shape

## Top-level

Create:

```ts
packages/stylyf-cli/src/spec/types.ts
packages/stylyf-cli/src/spec/schema.ts
packages/stylyf-cli/src/spec/validate.ts
packages/stylyf-cli/src/spec/read.ts
```

Initial type shape:

```ts
export type AppKind = "generic" | "internal-tool" | "cms-site" | "free-saas-tool";
export type BackendMode = "portable" | "hosted";
export type MediaMode = "none" | "basic" | "rich";

export type StylyfSpecV04 = {
  version: "0.4";
  app: {
    name: string;
    kind: AppKind;
    description?: string;
  };
  backend: {
    mode: BackendMode;
    portable?: {
      database?: "sqlite" | "postgres";
    };
  };
  media?: {
    mode: MediaMode;
  };
  experience?: {
    theme?: "amber" | "emerald" | "pearl" | "opal";
    mode?: "light" | "dark" | "system";
    density?: "compact" | "comfortable" | "relaxed";
    spacing?: "tight" | "balanced" | "airy";
    radius?: "edge" | "trim" | "soft" | "mellow";
  };
  actors?: ActorSpec[];
  objects?: ObjectSpec[];
  flows?: FlowSpec[];
  surfaces?: SurfaceSpec[];
};
```

## Actor spec

```ts
export type ActorSpec = {
  name: string;
  kind?: "public" | "user" | "member" | "admin" | "editor" | "owner";
  description?: string;
};
```

## Object spec

```ts
export type ObjectSpec = {
  name: string;
  label?: string;
  purpose?: string;
  ownership?: "none" | "user" | "workspace";
  visibility?: "private" | "public" | "mixed";
  fields?: FieldSpec[];
  media?: MediaAttachmentSpec[];
};
```

## Field spec

```ts
export type FieldSpec = {
  name: string;
  label?: string;
  type:
    | "short-text"
    | "long-text"
    | "rich-text"
    | "number"
    | "boolean"
    | "date"
    | "datetime"
    | "status"
    | "slug"
    | "json";
  required?: boolean;
  unique?: boolean;
  options?: string[];
};
```

## Flow spec

```ts
export type FlowSpec = {
  name: string;
  object: string;
  kind:
    | "crud"
    | "approval"
    | "publishing"
    | "onboarding"
    | "saved-results";
  states?: string[];
  transitions?: Array<{
    name: string;
    from: string | string[];
    to: string;
    actor?: string;
  }>;
};
```

## Surface spec

```ts
export type SurfaceSpec = {
  name: string;
  kind:
    | "dashboard"
    | "list"
    | "detail"
    | "create"
    | "edit"
    | "settings"
    | "landing"
    | "content-index"
    | "content-detail"
    | "tool";
  object?: string;
  path?: string;
  audience?: "public" | "user" | "admin" | "editor";
};
```

---

# Internal compiler model

Do not expose this as public DSL.

Create:

```text
packages/stylyf-cli/src/compiler/
  expand.ts
  plan.ts
  defaults.ts
  generated-app.ts
  kinds/internal-tool.ts
  kinds/cms-site.ts
  kinds/free-saas-tool.ts
  adapters/to-generator-app.ts
```

Use a private model initially close to current `AppIR`, because that allows reuse of generator backend code. But rename it so Codex does not confuse it with user DSL:

```ts
export type GeneratedAppModel = { ... };
```

Short-term pragmatic path:

* move current `ir/types.ts` concepts to `compiler/generated-app.ts`;
* update generator imports from `../ir/types.js` to `../compiler/generated-app.js`;
* keep current backend generators mostly intact;
* delete public `compose.ts`.

This is not backward compatibility because users cannot author `GeneratedAppModel`. It is a private compiler target.

---

# Expansion rules by kind

## `internal-tool`

Default expansion:

* shell: `sidebar-app`
* auth: required
* default root: `/`
* default routes:

  * `/`
  * `/<object>`
  * `/<object>/new`
  * `/<object>/:id/edit`
  * `/settings`
* default actors:

  * `admin`
  * `member`
* default object if none provided:

  * `records`
* default fields:

  * `title`
  * `status`
  * `summary`
* default workflow if approval flow requested:

  * `draft -> review -> approved`
* default components:

  * `stat-grid`
  * `activity-feed`
  * `notification-list`
  * `filter-toolbar`
  * `data-table-shell`
  * `detail-panel`

## `cms-site`

Default expansion:

* shell:

  * public routes: `marketing-shell` or `docs-shell`
  * admin routes: `sidebar-app`
* auth: required for admin, public for published content
* default objects:

  * `articles`
  * `pages`
  * `media_assets` if media rich
* default fields:

  * `title`
  * `slug`
  * `excerpt`
  * `body`
  * `status`
  * `published_at`
* default publishing flow:

  * `draft -> review -> published -> archived`
* default routes:

  * `/`
  * `/articles`
  * `/articles/:slug`
  * `/admin/content`
  * `/admin/content/new`
  * `/admin/content/:id/edit`

## `free-saas-tool`

Default expansion:

* shell:

  * public landing: `marketing-shell`
  * app dashboard/tool: `topbar-app` or `sidebar-app`
* auth: optional? For v0.4 initial, make auth required if saved results are enabled; otherwise public tool can exist.
* no payment gateway/billing.
* default objects:

  * `tool_runs` if saved results enabled
  * `profiles` if auth enabled
* default routes:

  * `/`
  * `/tool`
  * `/dashboard`
  * `/settings`
* default flows:

  * onboarding
  * saved results
* default media:

  * upload input if media mode is `basic` or `rich`

---

# Step-by-step implementation plan

## Step 1 — v0.4 version + CLI command reset

### Files

Modify:

```text
packages/stylyf-cli/src/index.ts
packages/stylyf-cli/package.json
README.md
packages/stylyf-cli/README.md
```

Change version from `0.3.1` to `0.4.0`.

Replace help text with v0.4 model:

```text
Stylyf CLI

Agent-operated scaffolding compiler for SolidStart apps.

Usage:
  stylyf <command> [options]

Commands:
  intro       Layered briefing for coding agents
  new         Create a v0.4 spec for an app kind
  validate    Validate a v0.4 spec
  plan        Explain what a spec will generate
  generate    Generate a SolidStart app from a v0.4 spec
  search      Search bundled capabilities, patterns, and components
  serve-search
  build-index
```

### Acceptance

```bash
npm run cli:build
node packages/stylyf-cli/dist/bin.js --version
node packages/stylyf-cli/dist/bin.js --help
```

### Local smoke

No generated app yet. Confirm old `--ir` is not advertised.

---

## Step 2 — create v0.4 spec types/schema/validator

### Files

Add:

```text
packages/stylyf-cli/src/spec/types.ts
packages/stylyf-cli/src/spec/schema.ts
packages/stylyf-cli/src/spec/validate.ts
packages/stylyf-cli/src/spec/read.ts
```

Remove:

```text
packages/stylyf-cli/src/ir/schema.ts
packages/stylyf-cli/src/ir/compose.ts
packages/stylyf-cli/src/ir/types.ts
packages/stylyf-cli/src/ir/validate.ts
```

Generator-facing types now live under `compiler/generated-app.ts`, not `src/ir`.

### Behavior

`validateSpecV04(value)` should:

* enforce `version: "0.4"`;
* enforce `app.kind`;
* default `backend.mode` to `portable` only in `new`, not in validator;
* reject unknown fields;
* reject unsupported `kind`;
* reject payment/billing concepts for `free-saas-tool`.

### CLI

Modify:

```text
packages/stylyf-cli/src/commands/validate.ts
```

New usage:

```bash
stylyf validate --spec stylyf.spec.json
```

### Acceptance

Create fixtures:

```text
packages/stylyf-cli/examples/v0.4/internal-tool.basic.json
packages/stylyf-cli/examples/v0.4/cms-site.basic.json
packages/stylyf-cli/examples/v0.4/free-saas-tool.basic.json
```

Run:

```bash
node packages/stylyf-cli/dist/bin.js validate --spec packages/stylyf-cli/examples/v0.4/internal-tool.basic.json
node packages/stylyf-cli/dist/bin.js validate --spec packages/stylyf-cli/examples/v0.4/cms-site.basic.json
node packages/stylyf-cli/dist/bin.js validate --spec packages/stylyf-cli/examples/v0.4/free-saas-tool.basic.json
```

### Local smoke

Use portable backend in all three fixtures:

```json
{
  "backend": {
    "mode": "portable",
    "portable": {
      "database": "sqlite"
    }
  }
}
```

---

## Step 3 — implement `stylyf new`

### Files

Add:

```text
packages/stylyf-cli/src/commands/new.ts
packages/stylyf-cli/src/spec/presets.ts
```

Modify:

```text
packages/stylyf-cli/src/index.ts
```

### Behavior

Commands:

```bash
stylyf new generic --name "Atlas" --backend portable --media basic --output stylyf.spec.json
stylyf new internal-tool --name "Acme Ops" --backend portable --media rich --output stylyf.spec.json
stylyf new cms-site --name "Field Notes" --backend portable --media rich --output stylyf.spec.json
stylyf new free-saas-tool --name "Resize Kit" --backend portable --media basic --output stylyf.spec.json
```

`new` should write a clean, small spec. It should not emit expanded implementation details.

### Acceptance

```bash
rm -rf /tmp/stylyf-v04-new
mkdir -p /tmp/stylyf-v04-new
node packages/stylyf-cli/dist/bin.js new internal-tool --name "Acme Ops" --backend portable --media rich --output /tmp/stylyf-v04-new/internal.json
node packages/stylyf-cli/dist/bin.js validate --spec /tmp/stylyf-v04-new/internal.json
```

### Local smoke

Repeat for all three kinds, portable SQLite.

---

## Step 4 — create compiler private model

### Files

Add:

```text
packages/stylyf-cli/src/compiler/generated-app.ts
packages/stylyf-cli/src/compiler/defaults.ts
packages/stylyf-cli/src/compiler/expand.ts
packages/stylyf-cli/src/compiler/kinds/internal-tool.ts
packages/stylyf-cli/src/compiler/kinds/cms-site.ts
packages/stylyf-cli/src/compiler/kinds/free-saas-tool.ts
```

### Move/refactor

Move current generator-facing types from `ir/types.ts` into `compiler/generated-app.ts`.

Update imports in:

```text
packages/stylyf-cli/src/generators/generate.ts
packages/stylyf-cli/src/generators/project.ts
packages/stylyf-cli/src/generators/backend/*.ts
packages/stylyf-cli/src/generators/templates.ts
packages/stylyf-cli/src/manifests/catalog.ts
```

Current generator imports all point to `../ir/types.js` or `../../ir/types.js`; replace with compiler private model. Current `generate.ts` imports many `AppIR`, `RouteIR`, shell/page/layout/component types from `../ir/types.js`. 

### Acceptance

No behavioral change yet; compile must pass:

```bash
npm run cli:build
```

### Local smoke

Use a hand-authored temporary `GeneratedAppModel` test inside a small script or unit-style fixture to call `generateFrontendDraftFromApp` until the next step wires full expansion.

---

## Step 5 — implement `SpecV04 -> GeneratedAppModel` expansion

### Files

Implement:

```text
packages/stylyf-cli/src/compiler/expand.ts
packages/stylyf-cli/src/compiler/kinds/internal-tool.ts
packages/stylyf-cli/src/compiler/kinds/cms-site.ts
packages/stylyf-cli/src/compiler/kinds/free-saas-tool.ts
```

### Shared expansion rules

Map backend:

```ts
portable + sqlite -> {
  database: { provider: "drizzle", dialect: "sqlite", migrations: "drizzle-kit" },
  auth: { provider: "better-auth", mode: "session", features: { emailPassword: true } }
}
```

Map hosted:

```ts
hosted -> {
  database: { provider: "supabase" },
  auth: { provider: "supabase", mode: "session", features: { emailPassword: true, emailOtp: true } }
}
```

Map media:

```ts
media.none -> no storage, no attachments
media.basic -> storage + one attachment on media-capable objects
media.rich -> storage + image/document attachments + metadata
```

Storage should continue compiling to current S3-compatible storage because `project.ts` already adds AWS SDK dependencies when `app.storage` exists. 

### Internal tool expansion

Input object:

```json
{
  "name": "tickets",
  "ownership": "user",
  "fields": [
    { "name": "title", "type": "short-text", "required": true },
    { "name": "priority", "type": "status", "options": ["low", "medium", "high"] }
  ]
}
```

Generated resource:

```ts
{
  name: "tickets",
  visibility: "private",
  ownership: { model: "user", ownerField: "owner_id" },
  access: {
    list: "owner",
    read: "owner",
    create: "user",
    update: "owner",
    delete: "owner"
  }
}
```

Generated routes:

* `/`
* `/tickets`
* `/tickets/new`
* `/tickets/:id/edit`
* `/settings`

### CMS expansion

Generated resources:

* `articles`
* optionally `pages`
* optionally `media_assets`

Generated workflow:

* `contentPublishing`

Generated public routes:

* `/`
* `/articles`
* `/articles/:slug`

Generated admin routes:

* `/admin/content`
* `/admin/content/new`
* `/admin/content/:id/edit`

### Free SaaS tool expansion

Generated routes:

* `/`
* `/tool`
* `/dashboard`
* `/settings`

No billing/payment gateway.

If saved results enabled by default, generate `tool_runs`:

```ts
{
  name: "tool_runs",
  ownership: { model: "user", ownerField: "owner_id" },
  visibility: "private",
  fields: [
    { name: "input", type: "jsonb" },
    { name: "output", type: "jsonb" }
  ]
}
```

### Acceptance

Add `plan --json` temporarily or direct debug script to inspect expanded model.

```bash
node packages/stylyf-cli/dist/bin.js validate --spec examples/v0.4/internal-tool.basic.json
node packages/stylyf-cli/dist/bin.js plan --spec examples/v0.4/internal-tool.basic.json --json
```

### Local smoke

Verify generated model has:

* Better Auth;
* Drizzle SQLite;
* `storage` only when media enabled;
* at least one route;
* at least one resource for internal/CMS;
* no billing/payment concepts for free SaaS.

---

## Step 6 — implement `stylyf plan`

### Files

Add:

```text
packages/stylyf-cli/src/commands/plan.ts
packages/stylyf-cli/src/compiler/plan.ts
```

Modify:

```text
packages/stylyf-cli/src/index.ts
```

### Output

Human plan:

```text
Stylyf v0.4 generation plan

App:
  name: Acme Ops
  kind: internal-tool

Backend:
  mode: portable
  auth: better-auth
  data: drizzle sqlite
  storage: tigris/s3-compatible enabled

Generated resources:
  - tickets
  - ticket_assets

Generated flows:
  - ticketApproval

Generated routes:
  - / dashboard
  - /tickets list
  - /tickets/new create
  - /tickets/:id/edit edit
  - /settings settings

Generated files:
  - package.json
  - src/lib/auth.ts
  - src/lib/db.ts
  - src/lib/db/schema.ts
  - src/routes/...
```

JSON plan should be stable and testable.

### Acceptance

```bash
node packages/stylyf-cli/dist/bin.js plan --spec examples/v0.4/internal-tool.basic.json
node packages/stylyf-cli/dist/bin.js plan --spec examples/v0.4/internal-tool.basic.json --json
```

### Local smoke

Assert `plan --json` can be parsed and includes:

```text
kind
backend
resources
routes
files
postGenerateSteps
```

---

## Step 7 — rewire `generate --spec`

### Files

Modify:

```text
packages/stylyf-cli/src/commands/generate.ts
packages/stylyf-cli/src/generators/generate.ts
```

Remove `generateFrontendDraft(irPaths...)`.

Add:

```ts
export async function generateFromSpec(specPath: string, targetPath: string, options?: { install?: boolean })
```

Flow:

```text
read spec
validate spec
expand spec
generateFrontendDraftFromApp(expanded.generatedAppModel)
write stylyf.plan.json
write stylyf.spec.json copy into target
generate files
install/build steps
```

Do not write “resolved IR.” Write:

```text
stylyf.spec.json
stylyf.plan.json
```

### Acceptance

```bash
rm -rf /tmp/stylyf-v04-internal
node packages/stylyf-cli/dist/bin.js generate \
  --spec packages/stylyf-cli/examples/v0.4/internal-tool.basic.json \
  --target /tmp/stylyf-v04-internal \
  --no-install
```

Expected files:

```text
package.json
app.config.ts
src/app.tsx
src/lib/env.ts
src/lib/auth.ts
src/lib/db.ts
src/lib/db/schema.ts
src/routes/api/auth/[...auth].ts
src/routes/index.tsx
stylyf.spec.json
stylyf.plan.json
```

### Local smoke

```bash
cd /tmp/stylyf-v04-internal
npm install
npm run auth:generate
npm run db:generate
npm run check
npm run build
```

---

## Step 8 — rewrite intro as progressive exposure

### Files

Modify heavily:

```text
packages/stylyf-cli/src/generators/intro.ts
packages/stylyf-cli/src/commands/intro.ts
```

### Required topics

```text
overview
spec
internal-tool
cms-site
free-saas-tool
backend
media
generated-output
full
```

### Philosophy

`stylyf intro` should be short and useful:

```text
Stylyf v0.4 is an agent-operated scaffolding compiler.

Default operator loop:
1. choose an app kind
2. create a spec
3. inspect plan
4. generate
5. run local smoke tests
6. customize emitted app
```

Each kind intro should show a minimal spec and a recommended smoke-test loop.

### Acceptance

```bash
node packages/stylyf-cli/dist/bin.js intro
node packages/stylyf-cli/dist/bin.js intro --kind internal-tool
node packages/stylyf-cli/dist/bin.js intro --topic backend
node packages/stylyf-cli/dist/bin.js intro --topic media
```

### Local smoke

Update package verification to assert intro mentions:

* `internal-tool`
* `cms-site`
* `free-saas-tool`
* `portable`
* `hosted`
* `Tigris/S3-compatible`

---

## Step 9 — v0.4 search expansion

### Files

Modify:

```text
packages/stylyf-cli/src/search/index.ts
packages/stylyf-cli/src/manifests/index.ts
scripts/build-stylyf-cli-manifests.ts
```

Add:

```text
packages/stylyf-cli/src/manifests/kinds.ts
packages/stylyf-cli/src/manifests/patterns.ts
```

Add searchable kinds:

```ts
| "app-kind"
| "pattern"
| "capability"
| "generated-surface"
```

The current search already indexes components, layouts, page shells, app shells, backend capabilities, server functions, API routes, env blocks, and snippets.  Extend it rather than replacing it.

### Acceptance

```bash
node packages/stylyf-cli/dist/bin.js search internal approvals table
node packages/stylyf-cli/dist/bin.js search cms publishing media
node packages/stylyf-cli/dist/bin.js search free saas saved results
```

### Local smoke

Search output must include at least one app-kind/pattern result before component-level results for kind-specific queries.

---

## Step 10 — improve route generation for kind-derived surfaces

### Files

Modify:

```text
packages/stylyf-cli/src/generators/generate.ts
packages/stylyf-cli/src/generators/templates.ts
packages/stylyf-cli/src/manifests/catalog.ts
```

Current route generation renders route sections from explicit layout/component trees.  In v0.4, routes should be generated from surfaces.

Add private helpers:

```ts
surfaceToRoute(surface, appKind, object?)
surfaceToSections(surface, appKind, object?)
```

Do **not** expose layout trees in user spec.

### Acceptance

For internal tool, object `tickets` should generate:

* dashboard route with stats/activity;
* list route with filter toolbar/table/detail panel;
* create/edit routes with generated forms.

### Local smoke

```bash
stylyf generate --spec examples/v0.4/internal-tool.basic.json --target /tmp/internal --no-install
rg -n "DataTableShell|FilterToolbar|TicketsForm|ActivityFeed" /tmp/internal/src
```

---

## Step 11 — tighten generated project handoff artifacts

### Files

Add generator:

```text
packages/stylyf-cli/src/generators/handoff.ts
```

Generate:

```text
HANDOFF.md
SECURITY_NOTES.md
LOCAL_SMOKE.md
stylyf.spec.json
stylyf.plan.json
```

Content should include:

* backend mode;
* required env vars;
* local setup;
* generated routes;
* generated resources;
* generated object storage notes;
* “generated app has no runtime dependency on Stylyf.”

The package verifier already checks generated apps do not import the repo or CLI package. Preserve that check. 

### Acceptance

```bash
test -f /tmp/internal/HANDOFF.md
test -f /tmp/internal/LOCAL_SMOKE.md
test -f /tmp/internal/SECURITY_NOTES.md
```

### Local smoke

Run generated local smoke from `LOCAL_SMOKE.md`.

---

## Step 12 — internal tool complete smoke

### Fixture

```text
packages/stylyf-cli/examples/v0.4/internal-tool.rich.json
```

Should include:

* object: `tickets`
* media: rich
* approval flow
* portable SQLite backend

### Command

```bash
rm -rf /tmp/stylyf-internal-rich
node packages/stylyf-cli/dist/bin.js generate \
  --spec packages/stylyf-cli/examples/v0.4/internal-tool.rich.json \
  --target /tmp/stylyf-internal-rich
cd /tmp/stylyf-internal-rich
npm run check
npm run build
```

### Verify

```bash
test -f src/lib/db/schema.ts
test -f src/lib/auth.ts
test -f src/lib/storage.ts
test -f src/lib/attachments.ts
test -f src/lib/workflows.ts
test -f src/lib/server/workflows.ts
test -f src/routes/api/auth/[...auth].ts
test -f src/routes/api/attachments/intent.ts
test -f src/routes/tickets/new.tsx
test -f src/routes/tickets/[id]/edit.tsx
```

---

## Step 13 — CMS complete smoke

### Fixture

```text
packages/stylyf-cli/examples/v0.4/cms-site.rich.json
```

Should include:

* `articles`
* `pages`
* publishing flow
* rich media
* public article routes
* admin content routes
* portable SQLite backend

### Command

```bash
rm -rf /tmp/stylyf-cms-rich
node packages/stylyf-cli/dist/bin.js generate \
  --spec packages/stylyf-cli/examples/v0.4/cms-site.rich.json \
  --target /tmp/stylyf-cms-rich
cd /tmp/stylyf-cms-rich
npm run check
npm run build
```

### Verify

```bash
test -f src/routes/articles.tsx
test -f src/routes/articles/[slug].tsx
test -f src/routes/admin/content.tsx
test -f src/routes/admin/content/new.tsx
test -f src/lib/workflows.ts
test -f src/lib/attachments.ts
```

---

## Step 14 — free SaaS tool complete smoke

### Fixture

```text
packages/stylyf-cli/examples/v0.4/free-saas-tool.basic.json
```

Should include:

* public landing;
* public/free tool route;
* optional saved results;
* no billing/payment gateway;
* portable SQLite backend if saved results enabled.

### Command

```bash
rm -rf /tmp/stylyf-free-tool
node packages/stylyf-cli/dist/bin.js generate \
  --spec packages/stylyf-cli/examples/v0.4/free-saas-tool.basic.json \
  --target /tmp/stylyf-free-tool
cd /tmp/stylyf-free-tool
npm run check
npm run build
```

### Verify

```bash
rg -n "stripe|billing|checkout|payment" . && exit 1 || true
test -f src/routes/index.tsx
test -f src/routes/tool.tsx
```

---

## Step 15 — hosted Supabase smoke

### Fixture

```text
packages/stylyf-cli/examples/v0.4/internal-tool.hosted.rich.json
```

Backend:

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

### Command

```bash
rm -rf /tmp/stylyf-hosted
node packages/stylyf-cli/dist/bin.js generate \
  --spec packages/stylyf-cli/examples/v0.4/internal-tool.hosted.rich.json \
  --target /tmp/stylyf-hosted
cd /tmp/stylyf-hosted
cat > .env <<'EOF'
APP_BASE_URL=http://127.0.0.1:3000
NODE_ENV=development
SUPABASE_URL=https://example.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_example
SUPABASE_SECRET_KEY=sb_secret_example
VITE_SUPABASE_URL=https://example.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_example
S3_BUCKET=verify-bucket
AWS_REGION=auto
AWS_ACCESS_KEY_ID=test-access-key
AWS_SECRET_ACCESS_KEY=test-secret-key
AWS_ENDPOINT_URL_S3=https://t3.storage.dev
EOF
npm run check
npm run build
```

### Verify

```bash
test -f src/lib/supabase.ts
test -f src/lib/supabase-browser.ts
test -f supabase/schema.sql
test -f supabase/policies.sql
test -f src/routes/api/auth/sign-up/password.ts
test -f src/routes/api/auth/sign-in/password.ts
test -f src/routes/auth/callback.ts
```

This mirrors the existing packaged hosted verification shape, which already checks Supabase/Tigris files and hosted app build. 

---

## Step 16 — object storage smoke

### Goal

Validate generated object-storage code compiles and routes are present for both backend modes.

Current env generator already emits S3/Tigris-compatible variables including `S3_BUCKET`, `AWS_S3_BUCKET`, access keys, endpoint, and `AWS_ENDPOINT_URL_S3`. 

### Portable storage smoke

Use internal rich fixture:

```bash
rm -rf /tmp/stylyf-storage-portable
stylyf generate --spec examples/v0.4/internal-tool.rich.json --target /tmp/stylyf-storage-portable
cd /tmp/stylyf-storage-portable
test -f src/lib/storage.ts
test -f src/lib/attachments.ts
test -f src/lib/server/attachments.ts
test -f src/routes/api/attachments/intent.ts
test -f src/routes/api/attachments/confirm.ts
test -f src/routes/api/attachments/delete.ts
npm run check
npm run build
```

### Hosted storage smoke

Use hosted rich fixture:

```bash
rm -rf /tmp/stylyf-storage-hosted
stylyf generate --spec examples/v0.4/internal-tool.hosted.rich.json --target /tmp/stylyf-storage-hosted
cd /tmp/stylyf-storage-hosted
test -f src/lib/storage.ts
test -f src/lib/attachments.ts
test -f src/lib/server/attachments.ts
test -f supabase/policies.sql
npm run check
npm run build
```

No real object upload required for default CI smoke. Real Tigris live smoke can be separate and opt-in via env.

---

## Step 17 — rewrite package verifier for v0.4

### File

Rewrite:

```text
scripts/verify-stylyf-cli-package.mjs
```

Current verifier is excellent structurally: build package, pack tarball, install in temp dir, run binary outside repo, generate portable and hosted apps, run check/build, verify generated app does not import repo/CLI.  Keep that shape.

### New verifier matrix

1. installed binary help/version;
2. `intro` overview/kind/topic works;
3. `new` creates valid specs for all three kinds;
4. `validate --spec` works;
5. `plan --spec` works;
6. portable internal rich generation checks/builds;
7. portable CMS rich generation checks/builds;
8. portable free tool generation checks/builds and contains no billing/payment text;
9. hosted internal rich generation checks/builds with fake env;
10. storage files/routes exist in both portable and hosted rich apps;
11. generated apps do not import `@depths/stylyf-cli` or repo paths.

### Command

```bash
npm run cli:verify-pack
```

---

# Implementation order for Codex

Recommended branch sequence:

```text
01-cli-v04-reset
02-spec-v04-schema-validator
03-new-command-presets
04-private-generated-app-model
05-spec-expansion
06-plan-command
07-generate-spec
08-intro-v04
09-search-v04
10-kind-surface-generation
11-handoff-docs
12-smoke-fixtures
13-package-verifier
```

Each branch should end with:

```bash
npm run cli:build
```

From branch `07` onward, also run at least one generated app check/build.

---

# Quality bar

Codex should maintain these invariants:

1. **No v0.3 compatibility.**
2. **No public low-level escape hatches.**
3. **User spec remains small and intent-level.**
4. **The generic path preserves broad full-stack primitives without niche assumptions.**
5. **Generated app remains ordinary source with no runtime Stylyf dependency.**
6. **Portable SQLite path is the default local dogfood path.**
7. **Hosted path remains Supabase SDK + Supabase auth.**
8. **Tigris/S3-compatible storage remains common object substrate.**
9. **Free SaaS tool path has no billing/payment gateway.**
10. **`intro`, `search`, `plan`, and generated handoff docs are first-class agent UX, not afterthought docs.**
11. **Every meaningful step has a local smoke test.**

The essential implementation move is: **replace public AppIR with SpecV04, but reuse the generator backend through a private compiler target.** This gets the clean v0.4 ergonomics without discarding the strongest working code.
