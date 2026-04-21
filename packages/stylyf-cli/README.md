# @depths/stylyf-cli

Stylyf is a JSON-driven full-stack assembly line for SolidStart. Its job is to let a coding agent describe the intended app once, generate a real working source tree, and then keep iterating inside that emitted app without redoing the repetitive setup work by hand.

`@depths/stylyf-cli` is the publishable CLI package. The generated app is a separate destination project and does not depend on this repo or on `@depths/stylyf-cli` at runtime.

## What Stylyf Does

- turns a shallow JSON IR into a standalone SolidStart app
- emits app shell, route files, page shells, layout wrappers, global styling, and copied registry components
- emits backend capability files for PostgreSQL + Drizzle, Better Auth, S3 storage, API routes, and server functions when requested
- installs dependencies and runs post-generate auth/db scaffolding so the target app is runnable immediately
- exposes search and intro commands so an agent can orient itself quickly during follow-up work

## Operator Workflow

1. Search the bundled inventory to find the right building blocks.
2. Write or refine a shallow JSON IR describing app shell, routes, page shells, layout wrappers, component composition, and any required backend capabilities.
3. Validate the IR before generation.
4. Generate the app into a clean target directory.
5. Move into the generated app and iterate there like a normal SolidStart codebase.
6. Use `stylyf intro --project <path>` whenever a coding agent needs a compact refresher on the generated app structure.

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
    "dialect": ["postgres"],
    "migrations": ["drizzle-kit"],
    "schema": "DatabaseSchemaIR[]"
  },
  "auth": {
    "provider": ["better-auth"],
    "mode": ["session"]
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

### Backend Capability DSL

```json
{
  "database": {
    "dialect": "postgres",
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
    "features": { "emailPassword": true }
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

### Example IR

```json
{
  "name": "Atlas",
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
    db.ts
    auth.ts
    auth-client.ts
    storage.ts
    server/
      guards.ts
      queries/
      actions/
  routes/
    api/
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
- inspect `src/lib/env.ts`, `src/lib/db.ts`, `src/lib/auth.ts`, and `src/lib/storage.ts` for the generated backend capability surface
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

- database: `postgres` with `drizzle-kit` migrations
- auth: `better-auth` in session mode, wired to Drizzle
- storage: `s3` with presigned PUT upload helpers
- api route types: `json`, `webhook`, `presign-upload`, plus the generated Better Auth mount route
- server module types: `query`, `action`

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
