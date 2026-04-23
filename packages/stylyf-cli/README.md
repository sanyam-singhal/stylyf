# @depths/stylyf-cli

Stylyf is a JSON-driven full-stack assembly line for SolidStart. Its job is to let a coding agent describe the intended app once, generate a real working source tree, and then keep iterating inside that emitted app without redoing the repetitive setup work by hand.

`@depths/stylyf-cli` is the publishable CLI package. The generated app is a separate destination project and does not depend on this repo or on `@depths/stylyf-cli` at runtime.

## Backend Modes

- portable mode: `better-auth + drizzle + postgres/sqlite + s3-compatible storage`
- hosted mode: `supabase auth + supabase data sdk + tigris-compatible s3 storage`
- storage stays presigned-URL based in both modes, so the browser never receives raw object-storage credentials

## What Stylyf Does

- turns a shallow JSON IR into a standalone SolidStart app
- emits app shell, route files, page shells, layout wrappers, global styling, and copied registry components
- emits backend capability files for both supported backend branches when requested
- the portable branch uses PostgreSQL or SQLite via Drizzle plus Better Auth
- the hosted branch uses Supabase SDKs for both auth and data access, and emits `supabase/schema.sql` instead of Drizzle files
- emits S3-compatible storage helpers for both branches, including AWS-compatible aliases that fit Tigris well
- installs dependencies and runs post-generate auth/db scaffolding so the target app is runnable immediately
- exposes search and intro commands so an agent can orient itself quickly during follow-up work

## Operator Workflow

1. Search the bundled inventory to find the right building blocks.
2. Write or refine a shallow JSON IR describing app shell, routes, page shells, layout wrappers, component composition, and any required backend capabilities.
3. Validate the IR before generation.
4. Generate the app into a clean target directory.
5. Move into the generated app and iterate there like a normal SolidStart codebase.
6. Use `stylyf intro --project <path>` whenever a coding agent needs a compact refresher on the generated app structure.
7. Treat `auth.protect` as the route/API/server default policy surface; explicit `auth` fields on API routes and server modules still win when set.

## Can An Agent Start Cold With This?

Yes. The intended operator is a coding agent with little or no prior project context. Stylyf is meant to provide enough structure that an agent can:

- understand the available shells, layouts, themes, components, and backend capabilities
- write valid JSON IR without reopening the full Stylyf source tree first
- generate a SolidStart scaffold quickly
- continue iterative UI development inside the emitted app

## Install

```bash
npm install -g @depths/stylyf-cli
```

Or use it directly:

```bash
npx @depths/stylyf-cli --help
```

## Core Commands

```bash
stylyf intro
stylyf intro --project ./my-app --output STYLYF_INTRO.md
stylyf search dashboard filters table
stylyf validate --ir app.json
stylyf generate --ir app.json --target ./my-app
stylyf serve-search --port 4310
```

## JSON IR DSL

Stylyf uses a shallow JSON IR. The root shape is:

```json
{
  "name": "string",
  "shell": ["sidebar-app", "topbar-app", "docs-shell", "marketing-shell"],
  "theme": {
    "preset": ["amber", "emerald", "pearl", "opal"],
    "mode": ["light", "dark", "system"],
    "radius": ["edge", "trim", "soft", "mellow"],
    "density": ["comfortable", "compact", "relaxed"],
    "spacing": ["tight", "balanced", "airy"],
    "fonts": {
      "fancy": "string",
      "sans": "string",
      "mono": "string"
    }
  },
  "database": {
    "provider": ["drizzle", "supabase"],
    "dialect": ["postgres", "sqlite", "(omit for supabase)"],
    "migrations": ["drizzle-kit", "(omit for supabase)"],
    "schema": "DatabaseSchemaIR[]"
  },
  "resources": "ResourceIR[]",
  "workflows": "WorkflowIR[]",
  "auth": {
    "provider": ["better-auth", "supabase"],
    "mode": ["session"],
    "features": { "emailPassword": "boolean", "emailOtp": "boolean", "magicLink": "boolean" }
  },
  "storage": {
    "provider": ["s3"],
    "mode": ["presigned-put"]
  },
  "apis": "ApiRouteIR[]",
  "server": "ServerModuleIR[]",
  "routes": [
    {
      "path": "string",
      "shell": "optional per-route app shell override",
      "page": ["dashboard", "resource-index", "resource-detail", "settings", "auth", "blank"],
      "title": "string",
      "sections": "SectionIR[]"
    }
  ]
}
```

### Section And Layout Nodes

```json
{
  "id": "optional section id",
  "layout": ["stack", "row", "column", "grid", "split", "panel", "section", "toolbar", "content-frame"],
  "children": [
    "string component shorthand",
    {
      "component": "string",
      "variant": "optional string",
      "props": { "anyProp": "any JSON-serializable value" },
      "items": [{ "anyItemShape": "array data for components that accept items" }]
    },
    {
      "layout": "nested layout id",
      "props": { "anyLayoutProp": "string | number | boolean" },
      "children": ["recursive child nodes"]
    }
  ]
}
```

### Composition Rules

- `shell` sets the default app shell for all routes
- each route must choose a `page` shell
- each route contains one or more `sections`
- each section starts with one layout wrapper
- child nodes can be component strings, component objects, or nested layout objects
- string component children are shorthand for `{ "component": "..." }`
- use `props` when a component or layout needs named values
- use `items` when a component expects repeatable data collections
- add `database`, `auth`, `storage`, `apis`, and `server` only when the app actually needs those backend capabilities
- add `resources` and `workflows` when you want Stylyf's v0.3 generalized app-mechanics layer instead of only raw backend primitives
- `auth.protect` supplies default protection rules for generated routes, API routes, and server modules
- for API routes and server modules, an explicit `auth` field on the item overrides any matching `auth.protect` entry

### v0.3 Resource And Workflow DSL

The v0.3 surface is deliberately broad. It is meant to describe generalized app mechanics, not a niche product category.

```json
{
  "resources": [
    {
      "name": "records",
      "visibility": "mixed",
      "fields": [
        { "name": "title", "type": "varchar", "required": true },
        { "name": "status", "type": "enum", "enumValues": ["draft", "review", "published"] }
      ],
      "ownership": { "model": "user", "ownerField": "owner_id" },
      "access": {
        "list": "owner-or-public",
        "read": "owner-or-public",
        "create": "user",
        "update": "owner",
        "delete": "owner"
      },
      "relations": [{ "target": "profiles", "kind": "belongs-to", "field": "owner_id" }],
      "attachments": [{ "name": "coverImage", "kind": "image" }],
      "workflow": "recordLifecycle"
    }
  ],
  "workflows": [
    {
      "name": "recordLifecycle",
      "resource": "records",
      "field": "status",
      "initial": "draft",
      "states": ["draft", "review", "published"],
      "transitions": [
        {
          "name": "submitForReview",
          "from": "draft",
          "to": "review",
          "actor": "owner",
          "emits": ["record.submitted"],
          "notifies": ["owner", "admins"]
        }
      ]
    }
  ]
}
```

### v0.3 Mechanics Semantics

- `resources`: generalized app entities that Stylyf maps to schema, CRUD surfaces, route shells, and generated server modules
- `ownership`: whether a resource is unowned, user-owned, or workspace-owned
- `access`: broad policy presets for list/read/create/update/delete surfaces
- `relations`: explicit links between resources without forcing a deep ORM-specific DSL into the top-level IR
- `attachments`: generalized file/media attachment declarations on top of the shared S3/Tigris substrate
- `workflows`: state machines for approvals, publishing, onboarding, or other repeatable transitions
- `transitions.emits`: event names that Stylyf maps to event-log records and notification fan-out
- `transitions.notifies`: notification audiences kept broad so they fit internal apps as well as customer-facing products

### v0.3 Supported Vocabulary

- ownership models: `none`, `user`, `workspace`
- access presets: `public`, `user`, `owner`, `owner-or-public`, `workspace-member`, `admin`
- visibility presets: `private`, `public`, `mixed`
- relation kinds: `belongs-to`, `has-many`, `many-to-many`
- attachment kinds: `file`, `image`, `video`, `audio`, `document`
- workflow notification audiences: `owner`, `workspace`, `watchers`, `admins`
- note: the `admin` access preset is reserved for explicit role-aware customization; generated defaults fail closed until you wire app-specific admin logic

### What v0.3 Generates From That DSL

- resource-derived schema in both backend branches
- generated list/detail/create/update/delete server modules
- generated `resource-create` and `resource-edit` route/page shells when requested
- generated resource form components and server-side form parsing helpers
- ownership-aware guard helpers for the portable branch
- Supabase RLS policy SQL for the hosted branch
- attachment metadata tables plus presign, confirm, replace, and delete flows
- workflow definitions, transition actions, event log queries, and notification queries/actions

### Recommended Starting Points

- portable v0.3 path: `examples/atlas-dashboard-v0.3-local.json`
- hosted v0.3 path: `examples/atlas-dashboard-v0.3-supabase.json`
- broad contract reference: `examples/atlas-dashboard-v0.3.json`

### Backend Capability DSL

```json
{
  "database": {
    "provider": "drizzle",
    "dialect": "sqlite",
    "migrations": "drizzle-kit",
    "schema": [
      {
        "table": "records",
        "columns": [
          { "name": "id", "type": "uuid", "primaryKey": true },
          { "name": "name", "type": "varchar" }
        ],
        "timestamps": true
      }
    ]
  },
  "auth": {
    "provider": "better-auth",
    "mode": "session",
    "features": { "emailPassword": true, "emailOtp": false }
  },
  "storage": {
    "provider": "s3",
    "mode": "presigned-put",
    "bucketAlias": "uploads"
  },
  "apis": [
    {
      "path": "/api/uploads/presign",
      "method": "POST",
      "type": "presign-upload",
      "name": "create-record-upload",
      "auth": "user"
    }
  ],
  "server": [
    {
      "name": "records.list",
      "type": "query",
      "resource": "records",
      "auth": "user"
    }
  ]
}
```

### Hosted Supabase + Tigris Example IR

```json
{
  "name": "Atlas Hosted",
  "shell": "sidebar-app",
  "theme": {
    "preset": "opal",
    "mode": "light",
    "radius": "trim",
    "density": "comfortable",
    "spacing": "tight",
    "fonts": {
      "fancy": "Fraunces",
      "sans": "Manrope",
      "mono": "IBM Plex Mono"
    }
  },
  "database": {
    "provider": "supabase",
    "schema": [
      {
        "table": "records",
        "timestamps": true,
        "columns": [
          { "name": "id", "type": "uuid", "primaryKey": true },
          { "name": "name", "type": "varchar" },
          { "name": "status", "type": "varchar" },
          { "name": "owner_id", "type": "uuid" }
        ]
      }
    ]
  },
  "auth": {
    "provider": "supabase",
    "mode": "session",
    "features": { "emailPassword": true, "emailOtp": true }
  },
  "storage": {
    "provider": "s3",
    "mode": "presigned-put",
    "bucketAlias": "uploads"
  },
  "apis": [
    {
      "path": "/api/uploads/presign",
      "method": "POST",
      "type": "presign-upload",
      "name": "create-record-upload",
      "auth": "user"
    }
  ],
  "server": [
    {
      "name": "records.list",
      "type": "query",
      "resource": "records",
      "auth": "user"
    },
    {
      "name": "records.create",
      "type": "action",
      "resource": "records",
      "auth": "user"
    }
  ],
  "routes": [
    {
      "path": "/",
      "page": "dashboard",
      "title": "Atlas Overview",
      "sections": [
        {
          "layout": "grid",
          "children": [
            "stat-card",
            { "component": "stat-grid" }
          ]
        },
        {
          "layout": "stack",
          "children": [
            { "component": "activity-feed" },
            { "component": "notification-list" }
          ]
        }
      ]
    }
  ]
}
```

Portable local development: use `database.provider: "drizzle"`, `database.dialect: "sqlite"`, and `DATABASE_URL=file:./local.db`. `DATABASE_AUTH_TOKEN` stays optional and is only needed later for remote libsql providers such as Turso.

Hosted fast path: pair `database.provider: "supabase"` with `auth.provider: "supabase"`. That branch emits `src/lib/supabase.ts`, `src/lib/supabase-browser.ts`, auth API routes, middleware, and `supabase/schema.sql` instead of Drizzle files.

For email OTP on the Supabase branch, Stylyf scaffolds the code path with `signInWithOtp` and `verifyOtp`. Per Supabase's current docs, whether users receive an OTP code or a magic link depends on the email template variables configured in Supabase.

## Example IRs

- `examples/atlas-dashboard-v0.3-local.json`: best starting point for the portable Better Auth + Drizzle path with local SQLite/libsql
- `examples/atlas-dashboard-v0.3-supabase.json`: best starting point for the hosted Supabase + Tigris path
- `examples/atlas-dashboard-v0.3.json`: compact contract reference for the generalized v0.3 mechanics without fully choosing one runtime path
- `examples/field-manual-docs-fullstack.json`: docs/content-oriented example when you want a lighter backend surface

## Quick Start

```bash
stylyf search internal dashboard analytics
stylyf validate --ir atlas.json
stylyf generate --ir atlas.json --target ./atlas
cd atlas
npm run dev
```

## Generated App Structure

```text
src/
  app.tsx
  app.css
  entry-client.tsx
  entry-server.tsx
  .env.example
  lib/
    env.ts
    theme-system.ts
    cn.ts
    auth.ts
    auth-client.ts
    storage.ts
    # portable branch:
    db.ts
    db/schema.ts
    # hosted branch:
    supabase.ts
    supabase-browser.ts
    server/
      guards.ts
      queries/
      actions/
  routes/
    api/
    auth/callback.ts
  components/
    layout/
    shells/
      app/
      page/
    registry/
```

## How To Navigate A Generated App

- start with `src/routes/` to understand the app surface area
- inspect `src/components/shells/app/` for the global shell pattern applied to routes
- inspect `src/components/shells/page/` for page rhythm and framing
- inspect `src/components/layout/` for spatial composition wrappers
- inspect `src/components/registry/` for the copied UI building blocks used by the generated routes
- inspect `src/app.css` and `src/lib/theme-system.ts` for the styling grammar and default theme behavior
- inspect `src/lib/env.ts`, `src/lib/auth.ts`, and `src/lib/storage.ts` for the generated backend capability surface
- if the app uses the portable branch, inspect `src/lib/db.ts`, `src/lib/db/schema.ts`, and `drizzle.config.ts`
- if the app uses the hosted branch, inspect `src/lib/supabase.ts`, `src/lib/supabase-browser.ts`, and `supabase/schema.sql`
- inspect `src/routes/api/` and `src/lib/server/` for explicit machine-facing API routes and server functions

## Iterative UI Development With Stylyf

Stylyf is not just for the first scaffold. A good working loop is:

- use Stylyf to generate the first draft quickly
- continue refining the emitted app directly like any normal SolidStart project
- use `stylyf search` to locate better component/layout candidates when the UI needs another pass
- regenerate into a fresh scratch directory when comparing alternate shells or route plans
- keep the destination app as the source of truth once bespoke refinement starts

## Theme And Styling Grammar

The styling grammar is emitted from the bundled `src/app.css` baseline. Theme choices remain declarative in the IR, while the generated app gets ordinary CSS and theme bootstrap code it can keep evolving independently.

Current grammar surface:

- presets: `amber`, `emerald`, `pearl`, `opal`
- modes: `light`, `dark`, `system`
- radii: `edge`, `trim`, `soft`, `mellow`
- density: `comfortable`, `compact`, `relaxed`
- spacing: `tight`, `balanced`, `airy`
- font roles: `fancy`, `sans`, `mono`

### Theme Control Meanings

- `preset`: picks the color palette family emitted into the generated app
- `mode`: sets default light, dark, or system-following startup behavior
- `radius`: controls corner sharpness across cards, controls, panels, and surfaces
- `density`: controls macro and control sizing such as header height, control height, and horizontal padding
- `spacing`: controls overall breathing room and section rhythm
- `fonts.fancy`: display or editorial type role
- `fonts.sans`: primary UI copy role
- `fonts.mono`: code, metrics, and tabular detail role

### Radius Semantics

- `edge`: nearly square, just barely softened
- `trim`: sharp but not harsh; good default for serious product UIs
- `soft`: visibly rounded but still restrained
- `mellow`: the most rounded option in the current grammar

### Density Semantics

- `compact`: tighter controls and denser layout rhythm
- `comfortable`: default balance for most apps
- `relaxed`: roomier controls and section spacing

### Spacing Semantics

- `tight`: close section rhythm and compact page pacing
- `balanced`: more even editorial spacing
- `airy`: the loosest built-in rhythm

## Template Inventory

- app shells: `sidebar-app`, `topbar-app`, `docs-shell`, `marketing-shell`
- page shells: `dashboard`, `resource-index`, `resource-detail`, `settings`, `auth`, `blank`
- layouts: `stack`, `row`, `column`, `grid`, `split`, `panel`, `section`, `toolbar`, `content-frame`

### Backend Capability Inventory

- portable database: `drizzle` provider with `postgres` or `sqlite`
- hosted database: `supabase` provider using generated Supabase SDK clients
- portable auth: `better-auth` in session mode, wired to Drizzle
- hosted auth: `supabase` in session mode, with `emailPassword` and optional `emailOtp` scaffolding
- storage: `s3` with presigned PUT upload helpers and AWS-compatible aliases that fit Tigris
- api route types: `json`, `webhook`, `presign-upload`, plus generated auth routes for the selected auth provider
- server module types: `query`, `action`
- generated route protection is enforced in middleware rather than by embedding auth checks into page components

### App Shell Intent

- `sidebar-app`: internal tools, dashboards, admin products
- `topbar-app`: lighter app shells with more horizontal emphasis
- `docs-shell`: documentation and knowledge-base surfaces
- `marketing-shell`: public-facing site shells

### Page Shell Intent

- `dashboard`: overview-heavy operational or analytics pages
- `resource-index`: lists, tables, collections, and filtered indexes
- `resource-detail`: detail pages and article-like surfaces
- `settings`: grouped forms and configuration pages
- `auth`: focused authentication and entry flows
- `blank`: minimal frame when the route wants to control most of its own structure

### Layout Intent

- `stack`: vertical flow
- `row`: horizontal flow
- `column`: constrained vertical column
- `grid`: responsive grid composition
- `split`: two-region split layouts
- `panel`: framed surface wrapper
- `section`: titled grouped content region
- `toolbar`: filter/action/control row
- `content-frame`: max-width and page content framing

## Registry Inventory

Stylyf currently bundles `70` components across these clusters:

- Actions & Navigation: `Button`, `IconButton`, `LinkButton`, `Toggle`, `ToggleGroup`, `Breadcrumb`, `Pagination`
- Data Views: `ActivityFeed`, `BulkActionBar`, `ColumnVisibilityMenu`, `CommentThread`, `DataList`, `DataTableShell`, `DetailPanel`, `NotificationList`, `Table`, `Timeline`
- Disclosure & Overlay: `Accordion`, `AlertDialog`, `Collapsible`, `CommandMenu`, `ContextMenu`, `Dialog`, `Drawer`, `DropdownMenu`, `Menubar`, `Popover`, `Tabs`, `Tooltip`
- Feedback & Display: `Avatar`, `Badge`, `Progress`, `Separator`, `Skeleton`, `Toast`
- Form Inputs & Selection: `Calendar`, `Checkbox`, `Combobox`, `DatePicker`, `NumberField`, `OTPField`, `RadioGroup`, `Select`, `Slider`, `Switch`, `TextArea`, `TextField`
- Form Systems: `FieldRow`, `FieldsetCard`, `FileUploader`, `FilterToolbar`, `FormSection`, `InlineEditableField`, `MediaUploader`, `SearchField`, `SettingsPanel`, `SettingsRow`, `SortMenu`
- Information & States: `EmptyState`, `ErrorState`, `LoadingState`, `PageHeader`, `SectionHeader`, `StatCard`, `StatGrid`
- Navigation & Workflow: `AppHeader`, `SidebarNav`, `Stepper`, `TopNavBar`, `WizardShell`

## Search Tips

- search by user intent first, not exact component name
- combine route shape and UI intent terms, for example `settings panel toggle form`
- use the local HTTP endpoint when an agent wants small targeted reads instead of reopening source trees
- use `stylyf search` first, then only open the files or blocks you actually plan to use

```bash
curl 'http://127.0.0.1:4310/search?q=docs+sidebar+article&limit=5'
curl 'http://127.0.0.1:4310/item/data-views/table'
```

## Agent Rules Of Thumb

- treat the emitted app as a normal SolidStart codebase
- preserve the styling grammar unless there is a clear reason to extend it
- prefer composing from copied registry components before inventing new base primitives
- choose one backend branch per generated app: portable (`better-auth + drizzle`) or hosted (`supabase + tigris`)
- prefer request-scoped auth/data clients by default; treat the Supabase secret/admin client as an explicit escape hatch for privileged operations only
- keep changes source-owned in the generated app rather than trying to reintroduce runtime abstraction

## How To Efficiently Scaffold An App With Zero Prior Context

1. Choose the app shell that matches the product surface.
2. Choose the default theme values and three font roles.
3. Sketch routes using page shells first, before thinking about specific components.
4. Choose one layout wrapper per section.
5. Fill each section with the smallest set of relevant components.
6. Generate the app.
7. Move into the generated app and continue normal UI development there.

If uncertain about which components fit, start with `stylyf search` and query by page intent rather than component label.

## About

Stylyf is built by Depths AI.

Repository:

- https://github.com/Depths-AI/stylyf

## License

MIT
