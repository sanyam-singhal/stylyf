# Web Coding Assembly Line

## Purpose

Stylyf already gives us a source-owned UI registry for SolidJS and SolidStart.
The next step is broader: reduce bespoke web-app coding by turning recurring
application concerns into composable, check-in-able assembly artifacts.

The intended operator is Codex. The goal is not "no code"; it is "less fresh
code per app". We want a workflow where an agent assembles:

1. global style language
2. route and layout shells
3. standard page compositions
4. server data/query/action patterns
5. provider-backed infrastructure interfaces

The point is to eliminate repeatable work while keeping the output as ordinary,
editable source code inside the repo.

## Baseline Assumptions

As of April 21, 2026, the relevant current platform baseline appears to be:

- `solid-js` `1.9.9`
- `@solidjs/start` `1.1.7`
- Tailwind CSS v4 token-driven theming

The framework guidance that matters most for this proposal:

- SolidStart uses file-based routing and nested layouts. Any route generator
  should therefore emit actual files, not hide routing behind runtime magic.
- Solid Router's current data model prefers `query` + `createAsync` for reads
  and `action` for writes.
- `"use server"` is the right primitive for server-only logic colocated with
  app code.
- API routes still matter for webhooks, external clients, and callback-style
  integrations.
- Middleware exists and should be used for cross-cutting concerns such as CSP,
  auth gating, request context, tracing, locale, and multitenancy.

## Core Take

Yes, this can and should be systematized.

The right level of abstraction is a set of stable assembly artifacts:

- stable design tokens
- stable UI building blocks
- stable layout grammar
- stable route/page recipes
- stable data access verbs
- stable provider adapters

Then Codex assembles those pieces into a product-specific app with minimal new
code and thin bespoke glue where needed.

That is the assembly line.

## What To Standardize

### 1. Style Language

This is the most obvious win and Stylyf already started it.

We should formalize:

- semantic color tokens
- radius scale
- density scale
- spacing cadence
- typography roles
- surface roles
- interaction roles
- motion roles

The important detail is that these are not raw colors or spacing values. They
are app-level semantics:

- `canvas`
- `surface`
- `surface-muted`
- `surface-elevated`
- `border`
- `input`
- `ring`
- `foreground`
- `muted-foreground`
- `danger`
- `success`
- `warning`
- `info`

And for spacing/layout:

- `section-gap`
- `stack-gap`
- `cluster-gap`
- `panel-padding`
- `control-height`
- `header-height`
- `sidebar-width`

### 2. Layout Grammar

This is the next major win.

Most apps are repeated combinations of:

- row
- column
- stack
- grid
- split
- shell
- inset
- rail
- panel
- section
- toolbar
- content frame

We should create a stable app-level layout grammar with predictable props and
token hooks. Not visual components for marketing polish, but structural
components that Codex can snap together quickly.

Examples:

```ts
type StackProps = {
  gap?: "tight" | "comfortable" | "loose";
  align?: "start" | "center" | "stretch";
};

type GridProps = {
  cols?: 1 | 2 | 3 | 4;
  gap?: "tight" | "comfortable" | "loose";
  min?: "panel" | "card" | "metric";
};

type AppShellProps = {
  nav?: "sidebar" | "topbar" | "hybrid";
  chrome?: "quiet" | "standard" | "dense";
};
```

These should live at the app shell level, not be hidden inside product code.

### 3. Route Recipes

SolidStart is file-route based, so route generation should be explicit and
check-in-able.

We should treat routes as generated source from a route manifest.

Example artifact:

```ts
type RouteRecipe = {
  path: string;
  shell: "app" | "docs" | "marketing" | "auth";
  page: "table-index" | "settings-form" | "dashboard" | "detail";
  data: string[];
  actions: string[];
  blocks: string[];
  auth?: "public" | "user" | "admin";
};
```

This would emit real files under `src/routes/**` plus the matching page shell
composition. The generator should stay conservative:

- generate files once
- preserve checked-in source
- mark generated regions if needed
- avoid opaque runtime registries

### 4. Page Recipes

A large share of web apps are variations on a small set of page archetypes:

- dashboard overview
- resource index
- resource detail
- create/edit form
- settings page
- auth page
- onboarding flow
- empty-first-run page
- search/results page

Each should become a route-ready page recipe built from Stylyf components plus
layout grammar, with named slots rather than giant prop bags.

Example:

```ts
type ResourceIndexRecipe = {
  header: "page-header";
  filters: "filter-toolbar";
  body: "table" | "data-list";
  sidecar?: "detail-panel";
  pagination?: boolean;
};
```

This is where the "lego blocks" idea becomes real for an agent.

### 5. Data Access Grammar

This should follow current Solid Router patterns, not invent a parallel state
model.

Recommended standard:

- reads: `query(...)`
- page consumption: `createAsync(...)`
- writes: `action(...)`
- revalidation: router-native `revalidate(...)` or redirect-driven refresh
- server-only work: `"use server"`

We should package common patterns into reusable artifact shapes:

- list query
- detail query
- search query
- create action
- update action
- delete action
- bulk action
- form validation action
- upload handshake action

The target is to remove repetitive boilerplate while keeping the app visibly
aligned with SolidStart.

### 6. Backend Capability Interfaces

This is worth doing. The right abstraction is capability-oriented interfaces.

#### Database Interface

Preferred shape:

- keep Drizzle or equivalent as the concrete query engine
- expose app-level repositories/services for common resource operations
- standardize transaction and pagination helpers
- standardize list filter parsing
- standardize audit/event emission around mutations

Better shape:

```ts
type ListResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

interface ResourceStore<TSummary, TDetail, TInput> {
  list(input: Record<string, unknown>): Promise<ListResult<TSummary>>;
  get(id: string): Promise<TDetail | null>;
  create(input: TInput): Promise<{ id: string }>;
  update(id: string, input: Partial<TInput>): Promise<void>;
  remove(id: string): Promise<void>;
}
```

This is enough for assembly and keeps the generated app straightforward.

#### Auth Interface

This should standardize application-facing auth verbs, not just login screens.

Suggested stable surface:

```ts
interface AuthCapability {
  getSession(): Promise<{ userId: string | null; orgId?: string | null }>;
  requireUser(): Promise<{ userId: string; orgId?: string | null }>;
  requireRole(role: string): Promise<void>;
  signOut(): Promise<void>;
}
```

Underneath, use a real provider. Better Auth looks like a sensible default for
this style of stack because it already supports SolidStart, cookie sessions,
email/password, OAuth, and plugin-driven expansion.

#### Object Storage Interface

This is a strong candidate for standardization.

The default pattern should be direct-to-object-storage upload via signed URLs,
not proxying large files through the app server.

Suggested surface:

```ts
interface ObjectStorageCapability {
  createUpload(input: {
    filename: string;
    contentType: string;
    size: number;
    scope: "public" | "private";
  }): Promise<{
    objectKey: string;
    uploadUrl: string;
    headers?: Record<string, string>;
    publicUrl?: string;
  }>;
  finalizeUpload(objectKey: string): Promise<void>;
  deleteObject(objectKey: string): Promise<void>;
}
```

This interface is stable across S3 and S3-compatible vendors.

#### Payments Interface

This can come later, but the correct surface is not "charge card". It is
commercial lifecycle:

- create checkout session
- open billing portal
- handle webhook
- sync subscription state
- enforce entitlement

That should remain adapter-backed and event-driven.

## What Not To Standardize

Areas that should remain intentionally product-shaped:

- domain-specific business rules
- unusual workflows
- fine-grained query logic
- advanced reporting queries
- multistep transactional edge cases
- product-specific IA
- copy-heavy marketing pages

The assembly line should cover the recurring 70-80% of application structure so
that the remaining 20-30% is where bespoke work is spent.

## Proposed Artifact Families

Here is the assembly-line shape I would recommend for this repo family.

### A. Registry UI Artifacts

These already exist in Stylyf:

- foundational components
- compositional blocks
- demos
- source display

### B. Layout Artifacts

Add:

- `stack.tsx`
- `cluster.tsx`
- `grid.tsx`
- `split.tsx`
- `shell.tsx`
- `panel.tsx`
- `toolbar.tsx`
- `section.tsx`
- `content-frame.tsx`

These should be app-structural and token-driven.

### C. Route Recipe Artifacts

Add a checked-in manifest layer:

- `src/assembly/routes/*.ts`
- generator that emits `src/routes/**`
- stable shells: app/docs/marketing/auth

### D. Data Recipe Artifacts

Add:

- `src/assembly/data/list-query.ts`
- `src/assembly/data/detail-query.ts`
- `src/assembly/data/form-action.ts`
- `src/assembly/data/bulk-action.ts`
- validation wrappers
- pagination/filter parsing helpers

### E. Capability Artifacts

Add adapter interfaces:

- `database`
- `auth`
- `object-storage`
- later `payments`

Each should have:

- contract types
- default implementation
- mock implementation
- app wiring point

### F. App Blueprint Artifacts

A blueprint is a higher-order assembly preset:

- internal SaaS app
- docs portal
- admin console
- marketing site
- dashboard app

A blueprint should select:

- shell
- nav strategy
- route recipes
- data recipes
- auth requirement
- capability adapters

## Proposed Folder Shape

```text
src/
  assembly/
    blueprints/
    routes/
    pages/
    layouts/
    data/
    capabilities/
  components/
    registry/
    layout/
    page/
  lib/
    theme-system.ts
    app-config.ts
  routes/
    ...
```

This keeps the assembly-line layer visible and distinct from the raw component
registry.

## How Codex Should Operate In This Model

If Codex is the intended operator, the repo needs machine-friendly artifacts.

That means:

- small manifest files
- stable naming
- checked-in generators
- typed recipe contracts
- explicit capability boundaries
- few hidden conventions

The ideal flow is:

1. choose blueprint
2. choose route recipes
3. choose page/layout recipes
4. bind data/query/action recipes
5. bind capabilities
6. fill in bespoke business logic only where necessary

In other words, the agent should mostly compose, not invent.

## Recommended Implementation Order

### Phase 1. Finish the Frontend Grammar

Build:

- layout primitives
- page shells
- route shell presets
- route recipe manifest + generator

This is the highest-confidence win.

### Phase 2. Standardize Data Recipes

Build:

- query/action wrappers
- pagination/search/filter helpers
- validation boundaries
- form mutation patterns

Keep this aligned with current Solid Router docs.

### Phase 3. Add Capability Interfaces

Build:

- database capability
- auth capability
- object storage capability

Do not start with payments.

### Phase 4. Add Blueprints

Build:

- internal app blueprint
- docs blueprint
- marketing blueprint

These should assemble the lower layers, not bypass them.

## Design Boundaries

To keep the assembly line fast and maintainable:

- database abstractions should stay operation-oriented, not pseudo-generic
- route generation should emit real route files
- manifests should stay small and typed rather than turning into large DSLs
- registry components should stay pure, with assembly behavior living in app,
  page, route, and capability layers

## Recommended Default Stack

If we want a default opinionated path for rapid app assembly:

- UI: Stylyf registry
- Styling: Tailwind CSS v4 token system
- Reads: Solid Router `query` + `createAsync`
- Writes: Solid Router `action`
- Server-only logic: `"use server"`
- API endpoints: SolidStart API routes
- Sessions: Vinxi session helpers or provider-backed auth sessions
- Auth provider: Better Auth
- Database provider: Drizzle-backed SQL database
- Object storage: S3-compatible presigned upload flow
- Payments later: Stripe-backed billing capability

## Final Recommendation

We should proceed with this assembly-line idea.

But we should build it in this order:

1. layout grammar
2. route/page recipes
3. data recipes
4. capability adapters
5. blueprints

That sequence matches where SolidStart is most structurally stable and where
Codex gains the largest reduction in bespoke coding effort.

The biggest win is a repository full of stable, composable, typed artifacts
that let an agent assemble a serious app quickly while still leaving the result
as ordinary source code with far less repeated effort.

That is the right kind of assembly line.

## References

- Solid JS package: https://www.npmjs.com/package/solid-js
- SolidStart package: https://www.npmjs.com/package/@solidjs/start
- SolidStart routing: https://docs.solidjs.com/solid-start/building-your-application/routing
- SolidStart data fetching: https://docs.solidjs.com/solid-start/guides/data-fetching
- Solid Router queries: https://docs.solidjs.com/solid-router/data-fetching/queries
- Solid Router actions: https://docs.solidjs.com/solid-router/concepts/actions
- Solid Router `createAsync`: https://docs.solidjs.com/solid-router/reference/data-apis/create-async
- SolidStart `"use server"`: https://docs.solidjs.com/solid-start/reference/server/use-server
- SolidStart API routes: https://docs.solidjs.com/solid-start/building-your-application/api-routes
- SolidStart middleware: https://docs.solidjs.com/solid-start/advanced/middleware
- SolidStart sessions: https://docs.solidjs.com/solid-start/advanced/session
- SolidStart security: https://docs.solidjs.com/solid-start/guides/security
- Tailwind CSS v4: https://tailwindcss.com/blog/tailwindcss-v4
- Tailwind theme variables: https://tailwindcss.com/docs/theme
- Vite glob imports and dynamic loading: https://vite.dev/guide/features.html
- Drizzle ORM querying: https://orm.drizzle.team/docs/data-querying
- Drizzle ORM transactions: https://orm.drizzle.team/docs/transactions
- Better Auth installation: https://better-auth.com/docs/installation
- Better Auth session management: https://better-auth.com/docs/concepts/session-management
- AWS S3 presigned uploads: https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html
- Stripe subscription webhooks: https://docs.stripe.com/billing/subscriptions/webhooks
