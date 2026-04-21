# Frontend Assembly Line Plan

## Objective

Build a JSON-driven npm CLI that Codex can use to assemble the frontend draft of
a SolidJS + SolidStart app without writing bespoke SolidJS by hand.

The CLI should:

1. read a compact JSON IR
2. generate app shell
3. generate global style and theme wiring
4. generate routes
5. generate page shells
6. generate layout structure and component composition per page
7. install dependencies as the closing step

This is frontend-only for Phase 1. No database, auth, storage, or payments in
this implementation pass.

This repo is the authoring codebase for the tool, not the destination app. The
generated project must not depend on this repo at runtime or source time.

## Grounding

This plan is grounded in:

- SolidStart file-based routing and nested layouts
- Solid Router `query` / `createAsync` / `action` patterns, even though this
  phase is frontend-heavy
- Tailwind CSS v4 theme variables and CSS-first theming
- Vite’s dynamic imports and `import.meta.glob`
- npm package `bin` support for publishable CLIs

Relevant docs:

- SolidStart routing: https://docs.solidjs.com/solid-start/building-your-application/routing
- SolidStart data fetching: https://docs.solidjs.com/solid-start/guides/data-fetching
- Solid Router queries: https://docs.solidjs.com/solid-router/data-fetching/queries
- Solid Router actions: https://docs.solidjs.com/solid-router/concepts/actions
- SolidStart `"use server"`: https://docs.solidjs.com/solid-start/reference/server/use-server
- Tailwind CSS v4: https://tailwindcss.com/blog/tailwindcss-v4
- Tailwind theme variables: https://tailwindcss.com/docs/theme
- Vite features: https://vite.dev/guide/features.html
- npm `package.json` `bin`: https://docs.npmjs.com/cli/v11/configuring-npm/package-json

## What This Tool Is

This tool is a publishable app assembler, not a runtime framework.

Codex should be able to produce a 2-3k token JSON intent document and let the
CLI emit the actual SolidStart source code.

That means:

- JSON is the IR
- code templates live in the CLI package
- manifests and snippets are bundled into the CLI package
- output is plain checked-in source
- no runtime schema interpreter is added to the generated app
- generated apps do not import from this repo

## What This Tool Must Eliminate

The repeatable work we want to eliminate:

- wiring the same app shell structure again and again
- copying theme boilerplate
- hand-authoring route files for standard pages
- hand-authoring page-shell scaffolds
- manually nesting layout wrappers
- repeatedly locating the right registry components and their imports
- repeatedly guessing the right cluster/component combinations

## Phase 1 Scope

Phase 1 covers only the frontend assembly line.

Included:

- app shell generation
- global style generation
- theme preset/font selection
- route generation
- page shell generation
- layout generation
- component composition generation
- component/codeblock search endpoint for Codex
- dependency installation

Excluded:

- backend capabilities
- data queries/actions generation
- auth generation
- object storage generation
- billing generation

## Core Strategy

The best approach is:

1. normalize Stylyf into machine-readable manifests
2. build a searchable catalog over those manifests and codeblocks
3. define a shallow JSON IR
4. map IR nodes to code templates
5. emit a full SolidStart app structure into a target project
6. run `npm install`

Codex should mostly write JSON like:

```json
{
  "app": {
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
    }
  },
  "routes": [
    {
      "path": "/",
      "page": "dashboard",
      "sections": [
        { "layout": "stack", "children": ["page-header", "stat-grid", "activity-feed"] }
      ]
    }
  ]
}
```

The CLI turns that into files.

## Package Strategy

This repo should produce a publishable npm package.

Recommended package:

- package name: `@stylyf/cli`
- bin command: `stylyf`

This repo is the source for that package. The generated app is a separate
destination.

Recommended shape:

```text
packages/
  stylyf-cli/
    package.json
    src/
      bin.ts
      commands/
      generators/
      ir/
      manifests/
      search/
      templates/
      assets/
```

Why this shape:

- keeps CLI logic separate from the registry site
- makes npm packaging straightforward via a `bin` entry
- lets the package bundle its own manifests, templates, and starter assets

Recommended usage:

- `npx @stylyf/cli generate --ir app.json --target my-app`
- later optionally `npm init stylyf@latest my-app`

## CLI Commands

Phase 1 should ship with these commands:

### `stylyf generate`

Primary command.

Input:

- `--ir path/to/app.json`
- `--target path/to/project`

Behavior:

- validates IR
- resolves components/layouts/shells
- emits source files
- updates `package.json`
- runs `npm install`

The emitted project must be runnable on its own and must not import from
`@stylyf/cli`.

### `stylyf validate`

Input:

- `--ir path/to/app.json`

Behavior:

- schema validation
- semantic validation
- unresolved component/layout checks

### `stylyf search`

Input:

- free-text query

Behavior:

- returns best matching components, layouts, page shells, and code blocks
- emits JSON or readable text

This is the most important operator command for Codex.

### `stylyf serve-search`

Behavior:

- starts a local HTTP endpoint over the search index

Suggested endpoints:

- `GET /health`
- `GET /search?q=dashboard+filters+table&limit=10`
- `GET /item/:id`

This lets Codex hit it with `curl` and retrieve only the most relevant blocks
without re-reading full source files.

### `stylyf build-index`

Behavior:

- scans the registry and template manifests
- rebuilds the search index

### `stylyf intro`

Behavior:

- emits a rich standalone markdown briefing for a coding agent
- explains how to set up a SolidStart app with Stylyf
- explains how to navigate and iteratively extend a generated app
- optionally inspects a local project path and includes project-specific context

This command is intended to reduce repeated re-orientation work for Codex and
other coding agents during both initial generation and iterative UI development.

## JSON IR Design

The IR must stay shallow.

Do not let it become a large DSL.

Recommended layers:

### 1. App Layer

```ts
type AppIR = {
  name: string;
  shell: AppShellId;
  theme: ThemeIR;
  routes: RouteIR[];
};
```

### 2. Theme Layer

```ts
type ThemeIR = {
  preset: "amber" | "emerald" | "pearl" | "opal";
  mode: "light" | "dark" | "system";
  radius: "edge" | "trim" | "soft" | "mellow";
  density: "compact" | "comfortable" | "relaxed";
  spacing: "tight" | "balanced" | "airy";
  fonts: {
    fancy: string;
    sans: string;
    mono: string;
  };
};
```

### 3. Route Layer

```ts
type RouteIR = {
  path: string;
  shell?: AppShellId;
  page: PageShellId;
  title?: string;
  sections: SectionIR[];
};
```

### 4. Page / Section Layer

```ts
type SectionIR = {
  id?: string;
  layout: LayoutNodeId;
  children: Array<LayoutNodeIR | ComponentRefIR | string>;
};
```

### 5. Layout / Component Layer

```ts
type LayoutNodeIR = {
  layout: "stack" | "grid" | "split" | "row" | "column" | "panel";
  props?: Record<string, string | number | boolean>;
  children?: Array<LayoutNodeIR | ComponentRefIR | string>;
};

type ComponentRefIR = {
  component: string;
  variant?: string;
  props?: Record<string, unknown>;
  items?: Record<string, unknown>[];
};
```

Important design decision:

- allow string shorthand for common blocks
- allow object form when the generator needs more control

That keeps Codex’s JSON compact.

## Styling Grammar

The styling grammar should be extracted from `src/app.css`, not duplicated by
hand in the CLI.

Phase 1 should formalize a generated manifest from `src/app.css`:

```ts
type ThemeGrammar = {
  presets: string[];
  modes: string[];
  radii: string[];
  density: string[];
  spacing: string[];
  tokenGroups: {
    colors: string[];
    surfaces: string[];
    motion: string[];
    sizing: string[];
  };
  fontRoles: ["fancy", "sans", "mono"];
};
```

### Font Strategy

We should promote three explicit font roles into the app shell grammar:

- `fancy`
- `sans`
- `mono`

And reflect them in generated CSS variables:

- `--font-fancy`
- `--font-sans`
- `--font-mono`

The generated app stylesheet should import or declare only those font roles and
then wire them into semantic utilities.

At package build time, the CLI should snapshot the style grammar into bundled
assets so it can be used in any destination project without reading this repo.

## Registry Manifest Strategy

The CLI needs more than today’s display registry.

We need a codegen manifest layer that sits alongside the existing registry.

Suggested artifact:

```ts
type AssemblyItem = {
  id: string;
  label: string;
  kind: "component" | "layout" | "page-shell" | "app-shell";
  cluster: string;
  keywords: string[];
  description: string;
  sourcePath: string;
  importPath: string;
  exportName: string;
  slots?: string[];
  props?: string[];
  demoHints?: string[];
  searchText: string;
};
```

This should be generated from:

- registry metadata
- known exports
- optional hand-authored keyword/hint manifests

At package build time, this manifest should be bundled into `@stylyf/cli` so
search and generation work anywhere.

## Search Endpoint Design

This is a first-class operator feature, not an afterthought.

Codex should not need to re-open 20 files to decide between:

- `PageHeader` vs `AppHeader`
- `DataTableShell` vs `Table`
- `FilterToolbar` vs `SearchField`

### Search Index Content

The index should contain:

- item id
- label
- cluster
- description
- style params
- state params
- source path
- import path
- short usage summary
- extracted code snippet
- keywords
- shell/category tags

### Search Ranking

Use layered scoring:

1. exact token match
2. prefix match
3. fuzzy text similarity
4. keyword overlap
5. cluster/page-shell relevance boosts

### Search Output

Each result should return:

```ts
type SearchResult = {
  id: string;
  label: string;
  score: number;
  cluster: string;
  reason: string[];
  importPath: string;
  sourcePath: string;
  summary: string;
  snippet?: string;
};
```

That is enough for Codex to choose relevant codeblocks without reopening full
files.

## Generator Architecture

Phase 1 generators should be layered.

### 1. Manifest Loaders

Load:

- style grammar
- registry assembly manifest
- layout manifest
- page shell manifest
- app shell manifest

### 2. IR Validation

Validate:

- schema correctness
- supported shell IDs
- supported layout IDs
- supported component IDs
- route path collisions

### 3. Resolution

Resolve:

- shell IDs to templates
- layout nodes to templates
- component IDs to imports/usages
- theme config to CSS/token output

### 4. Emission

Emit:

- `package.json`
- `src/app.tsx`
- `src/app.css`
- `src/lib/theme-system.ts`
- route files
- page shell files if needed
- layout wrapper files
- generated page compositions
- copied/generated component source used by the app

### 5. Install

Run:

- `npm install`

This must be the final step, not an early one.

## Output Strategy

The generated app should still look like a normal SolidStart app.

Recommended output:

```text
src/
  app.tsx
  app.css
  lib/
    theme-system.ts
  components/
    layout/
    shells/
    generated/
    registry/
  routes/
    index.tsx
    settings.tsx
    ...
```

Keep generated artifacts explicit.

Do not hide them in a database or runtime registry.

The generated app must be self-sufficient:

- no imports from this repo
- no imports from `@stylyf/cli`
- no runtime dependency on the CLI package after generation

## Template Strategy

Use code templates, not AST generation, for Phase 1.

Why:

- faster to implement
- easier to inspect
- easier to diff
- easier for Codex to refine later

Template families:

- app shell templates
- page shell templates
- route templates
- layout node templates
- component composition templates
- style templates

Each template should receive a normalized intermediate object and emit string
code.

The CLI package should bundle:

- app shell templates
- page shell templates
- layout templates
- component composition templates
- starter app assets
- copied component source templates where needed

## Page Shell Inventory For Phase 1

We should start with a small but high-yield page shell inventory:

- `dashboard`
- `resource-index`
- `resource-detail`
- `settings`
- `auth`
- `blank`

Each page shell should define:

- outer container
- header treatment
- content width
- standard section spacing
- optional sidebar/detail pane slots

## App Shell Inventory For Phase 1

We should start with:

- `sidebar-app`
- `topbar-app`
- `docs-shell`
- `marketing-shell`

These are enough to unlock most frontend drafts.

## Layout Inventory For Phase 1

We should add explicit assembly-level layout components:

- `stack`
- `row`
- `column`
- `grid`
- `split`
- `panel`
- `section`
- `toolbar`
- `content-frame`

These should be structural, token-driven, and boring in the good sense.

## Dependency Strategy

The CLI should own dependency injection.

For Phase 1, generated apps should install:

- `solid-js`
- `@solidjs/start`
- `@solidjs/router`
- `@solidjs/meta`
- `tailwindcss`
- `@tailwindcss/postcss`
- `class-variance-authority`
- `clsx`
- `tailwind-merge`
- `lucide-solid`

If the target project is Stylyf-based, the CLI can also wire local registry
components into the generated app by copying or rendering source files.

It should not emit imports that point back to this repo.

## Step-by-Step Implementation Plan

### Step 1. Create the CLI Package

Create:

- `packages/stylyf-cli/package.json`
- `packages/stylyf-cli/src/bin.ts`
- `packages/stylyf-cli/src/index.ts`

Add:

- npm `bin` field
- local dev script to run the CLI from the monorepo
- package build config for publishing `@stylyf/cli`

Deliverable:

- `node packages/stylyf-cli/dist/bin.js --help`

### Step 2. Extract Theme Grammar

Build a script that converts `src/app.css` into a machine-readable theme
grammar manifest.

Also add the three font roles explicitly.

Deliverables:

- `packages/stylyf-cli/src/manifests/theme-grammar.json`
- parser/generator script
- bundled build artifact inside the published package

### Step 3. Build Registry Assembly Manifest

Convert the current registry into an assembly manifest that includes:

- ids
- descriptions
- keywords
- import paths
- source paths
- snippet summaries

Deliverables:

- `assembly-registry.json`
- extraction script
- bundled search/generation manifest inside the published package

### Step 4. Define and Validate the JSON IR

Implement:

- TypeScript types
- JSON schema export
- runtime validator

Deliverables:

- `src/ir/schema.ts`
- `src/ir/validate.ts`
- `stylyf validate`

### Step 5. Build the Search Index

Implement:

- index builder
- fuzzy scoring
- result summarizer

Deliverables:

- `stylyf build-index`
- `stylyf search`

### Step 6. Expose the Search HTTP Endpoint

Implement:

- lightweight local HTTP server
- `/search`
- `/item/:id`

Deliverable:

- `stylyf serve-search --port 4310`

### Step 7. Create Layout and Shell Templates

Add generator templates for:

- app shells
- page shells
- layout wrappers

Deliverables:

- template directory
- renderer functions

### Step 8. Create Route and Page Generators

Generate:

- `src/routes/**`
- shell imports
- page compositions
- copied/generated layout and registry component files required by those pages

Deliverable:

- `stylyf generate --ir app.json --target ./demo-app`

### Step 9. Add Style Emission

Generate:

- `src/app.css`
- font role wiring
- theme system wiring

Deliverable:

- generated app reflects selected preset/radius/density/spacing/fonts

### Step 10. Add Dependency Installation

After emission:

- patch or create `package.json`
- run `npm install`

Deliverable:

- target app is runnable immediately after generation

### Step 11. Add Agent Intro Output

Implement:

- `stylyf intro`
- markdown output suitable for direct agent consumption
- project-aware introspection for a generated app

Deliverable:

- `stylyf intro --project ./demo-app --output STYLYF_INTRO.md`

### Step 12. Dogfood With Two Example Apps

Generate at least:

- one dashboard-style app
- one docs-style app

This is required before calling Phase 1 complete.

### Step 13. Publishability Pass

Ensure:

- package build bundles manifests/templates/assets
- `npx @stylyf/cli --help` works outside this repo
- generation works in a clean temp directory

This is required before treating the CLI as real.

## Suggested Milestones

### Milestone A

- CLI package exists
- theme grammar extracted
- registry manifest extracted
- package assets are bundled for distribution

### Milestone B

- IR validation works
- search works in CLI and over HTTP

### Milestone C

- app shell + route + page shell generation works

### Milestone D

- full frontend draft generation works
- `npm install` succeeds

### Milestone E

- agent intro output works
- two generated apps build successfully
- packaged CLI works in a clean temp directory
- generated app runs
- generated app has no dependency on this repo or the CLI package

## Success Criteria

Phase 1 is successful when Codex can:

1. write a compact JSON IR
2. query the search endpoint for relevant components/codeblocks
3. run one CLI command
4. receive a runnable SolidStart frontend app draft

And the generated app should:

- use the selected theme preset and token grammar
- have real routes
- have real page shells
- have real layout structure
- use Stylyf components where appropriate
- require only refinement, not re-scaffolding
- be fully standalone after generation

## Recommended Immediate Next Move

Start with the infrastructure that every later step depends on:

1. create `packages/stylyf-cli`
2. extract theme grammar from `src/app.css`
3. extract the registry assembly manifest
4. bundle those assets into the package build
5. build the fuzzy search command and HTTP endpoint

That gives Codex the operator surface first, which is the right foundation for
the generators that come after.
