# Stylyf Expansion Guide

## Purpose

Stylyf v0.2.0 completes the baseline full-stack scaffold:

- frontend shell, routes, layouts, styling, and UI composition
- portable backend path:
  - Better Auth
  - Drizzle
  - Postgres or SQLite/libsql
- hosted backend path:
  - Supabase Auth
  - Supabase SDK data access
- shared object storage path:
  - S3-compatible storage through AWS SDK v3 presigned URLs

That is enough to get a real app off the ground. It is not yet enough to make
basic SaaS building consistently 50% easier for coding agents across product
categories like:

- user-generated content platforms
- review/rating systems
- visual critique tools
- lightweight team/admin products

The next step is to remove the *heaviest remaining repeatable work* without
introducing runtime magic or opaque frameworks. The target is still the same:

- shallow JSON IR
- generated explicit source files
- ordinary SolidStart apps
- no runtime dependency on Stylyf

This document defines the cleanest expansion path from the current codebase.

## Current Seams In The Codebase

Stylyf already has strong expansion seams. We should build on those, not around
them.

### IR seams

- [packages/stylyf-cli/src/ir/schema.ts](./packages/stylyf-cli/src/ir/schema.ts)
- [packages/stylyf-cli/src/ir/types.ts](./packages/stylyf-cli/src/ir/types.ts)
- [packages/stylyf-cli/src/ir/validate.ts](./packages/stylyf-cli/src/ir/validate.ts)

This is where new DSL surfaces belong.

### Generator seams

- [packages/stylyf-cli/src/generators/generate.ts](./packages/stylyf-cli/src/generators/generate.ts)
- [packages/stylyf-cli/src/generators/backend](./packages/stylyf-cli/src/generators/backend)
- [packages/stylyf-cli/src/generators/templates.ts](./packages/stylyf-cli/src/generators/templates.ts)
- [packages/stylyf-cli/src/templates](./packages/stylyf-cli/src/templates)

This is where the new source-emission work belongs.

### Search and intro seams

- [packages/stylyf-cli/src/manifests/backend.ts](./packages/stylyf-cli/src/manifests/backend.ts)
- [packages/stylyf-cli/src/manifests/catalog.ts](./packages/stylyf-cli/src/manifests/catalog.ts)
- [packages/stylyf-cli/src/generators/intro.ts](./packages/stylyf-cli/src/generators/intro.ts)
- [packages/stylyf-cli/README.md](./packages/stylyf-cli/README.md)

This is where discoverability and agent self-orientation need to expand.

### Current backend seams

- portable branch:
  - [packages/stylyf-cli/src/generators/backend/auth.ts](./packages/stylyf-cli/src/generators/backend/auth.ts)
  - [packages/stylyf-cli/src/generators/backend/database.ts](./packages/stylyf-cli/src/generators/backend/database.ts)
  - [packages/stylyf-cli/src/generators/backend/auth-schema.ts](./packages/stylyf-cli/src/generators/backend/auth-schema.ts)
- hosted branch:
  - [packages/stylyf-cli/src/generators/backend/supabase.ts](./packages/stylyf-cli/src/generators/backend/supabase.ts)
- shared storage:
  - [packages/stylyf-cli/src/generators/backend/storage.ts](./packages/stylyf-cli/src/generators/backend/storage.ts)
- server/API scaffolds:
  - [packages/stylyf-cli/src/generators/backend/server-functions.ts](./packages/stylyf-cli/src/generators/backend/server-functions.ts)
  - [packages/stylyf-cli/src/generators/backend/api-routes.ts](./packages/stylyf-cli/src/generators/backend/api-routes.ts)

This matters because Stylyf already has the right architectural split. v0.3
should extend these branches symmetrically instead of inventing a third model.

## Guiding Principles For Expansion

1. Expand the DSL only where the abstraction removes obviously repeatable work.
2. Prefer resource and policy grammar over deeper generic programming DSLs.
3. Generate explicit source, SQL, helpers, and middleware. Do not hide behavior
   behind runtime registries.
4. Keep the portable and hosted branches parallel where possible, but do not
   force artificial sameness where the provider models genuinely differ.
5. Keep object storage presigned and server-controlled in both branches.
6. Use SolidStart-native primitives for reads, writes, sessions, middleware,
   and server logic.
7. Treat Supabase RLS and Better Auth/Drizzle ownership checks as first-class
   generated security layers, not optional afterthoughts.

## The Top 5 Heavy Lifters For v0.3

These are the five expansions that will move Stylyf the furthest toward
“basic SaaS building is at least 50% easier.”

## 1. Ownership And Policy Scaffolds

### Why This Is A Heavy Lifter

This is the single biggest gap between “baseline scaffold” and “serious SaaS.”

Almost every real app repeats some combination of:

- owner-scoped resources
- team or workspace membership
- public/private visibility
- authenticated-only write access
- admin/moderator override
- “my records” vs “shared records”

Today, Stylyf scaffolds auth and data access, but not enough of the policy
layer that sits between them.

### What We Should Add

Add a first-class `policy` / `ownership` surface to the IR.

Example direction:

```json
{
  "resource": "records",
  "ownership": {
    "model": "user",
    "ownerField": "owner_id"
  },
  "access": {
    "read": "owner-or-public",
    "create": "user",
    "update": "owner",
    "delete": "owner"
  }
}
```

We should support a small, explicit vocabulary:

- ownership models:
  - `user`
  - `workspace`
  - `none`
- access presets:
  - `public`
  - `user`
  - `owner`
  - `owner-or-public`
  - `workspace-member`
  - `admin`

### Clean Fit In The Current Codebase

- extend [packages/stylyf-cli/src/ir/schema.ts](./packages/stylyf-cli/src/ir/schema.ts)
- drive generated guards in:
  - [packages/stylyf-cli/src/generators/backend/server-functions.ts](./packages/stylyf-cli/src/generators/backend/server-functions.ts)
  - [packages/stylyf-cli/src/generators/backend/api-routes.ts](./packages/stylyf-cli/src/generators/backend/api-routes.ts)
- add policy helpers in:
  - portable branch auth/data helpers
  - hosted Supabase auth/data helpers

### Provider-Specific Output

Portable path:

- generate ownership-aware query filters and mutation guards
- generate helper functions for:
  - `requireUser`
  - `requireOwner`
  - `requireWorkspaceMember`
- where relevant, generate transaction-safe ownership checks

Hosted path:

- generate `supabase/policies.sql`
- enable RLS on generated tables
- emit baseline policies using `auth.uid()`
- keep service-role/admin client out of normal user-path CRUD

### Why The Docs Support This

- Supabase’s own security model strongly centers on RLS and `auth.uid()`
- Drizzle now has explicit Postgres RLS support and policy representation
- Better Auth has an Organization plugin with teams and roles, which means the
  portable branch can grow into workspace-aware patterns cleanly

### Expected Impact

This one expansion alone would materially reduce the hardest repetitive code in
auth-gated SaaS apps.

## 2. Resource Recipes

### Why This Is A Heavy Lifter

A huge amount of product work is repeated “resource system” work:

- list
- detail
- create
- edit
- delete
- filters
- ownership
- related uploads

We already have pieces of this:

- page shells
- server query/action templates
- API route templates
- schema generation

But the resource itself is not yet first-class.

### What We Should Add

Introduce a `resources` layer in the IR and let routes/pages/server/API derive
from it.

Example direction:

```json
{
  "resources": [
    {
      "name": "records",
      "title": "Records",
      "fields": [
        { "name": "name", "type": "varchar" },
        { "name": "status", "type": "varchar" }
      ],
      "views": ["table", "detail", "form"],
      "ownership": {
        "model": "user",
        "ownerField": "owner_id"
      }
    }
  ]
}
```

Then derive:

- schema
- CRUD server modules
- CRUD API routes
- page shells
- forms
- filters
- section compositions

### Clean Fit In The Current Codebase

- IR: add `resources`
- manifests: add `resource-recipe` catalog entries
- generators:
  - database schema generation becomes resource-aware
  - server/API generation becomes resource-aware
  - route generation can synthesize resource index/detail/create/edit pages

This should *not* replace the existing lower-level fields immediately. It
should sit above them and compile down to the current primitives.

### Provider-Specific Output

Portable path:

- Drizzle schema and migrations
- resource repositories / server queries / actions

Hosted path:

- `supabase/schema.sql`
- resource-specific Supabase CRUD modules using the request-scoped client

### Why The Docs Support This

- SolidStart’s read/write model maps cleanly to list/detail queries and
  create/update/delete actions
- Drizzle relations and transactions fit naturally around resource-centric data
- Supabase SDK data access is simplest when wrapped around explicit resources

### Expected Impact

This is likely the biggest *breadth* saver after policy. It turns Stylyf from
“good scaffold generator” into a real product assembly line.

## 3. Storage Metadata And Asset Lifecycle Patterns

### Why This Is A Heavy Lifter

Stylyf already handles the bucket side well. The repetitive work that remains
is the app-side metadata and lifecycle:

- asset table
- owner linkage
- MIME / size / key / status
- pending upload vs confirmed upload
- public/private visibility
- replacement and soft delete
- attachment to a domain resource

For multimedia SaaS, this work repeats constantly.

### What We Should Add

Introduce an `assets` or `media` recipe layer.

Example direction:

```json
{
  "storage": {
    "provider": "s3",
    "mode": "presigned-put",
    "bucketAlias": "uploads"
  },
  "assets": [
    {
      "name": "design_assets",
      "attachTo": "records",
      "ownership": "user",
      "variants": ["original", "preview"],
      "fields": ["alt", "caption", "visibility"]
    }
  ]
}
```

### Generated Output

Portable path:

- asset tables through Drizzle
- server actions:
  - create upload intent
  - confirm upload
  - delete asset
- owner-aware asset queries

Hosted path:

- asset tables in `supabase/schema.sql`
- Supabase data modules for asset metadata
- Tigris/AWS helpers stay shared

Shared:

- object key conventions
- metadata record shape
- presign handshake
- optional confirm/finalize flow
- safe delete helpers

### Clean Fit In The Current Codebase

- extend [packages/stylyf-cli/src/generators/backend/storage.ts](./packages/stylyf-cli/src/generators/backend/storage.ts)
- add resource-linked asset generation into:
  - database generator
  - Supabase SQL generator
  - server/API generators

### Why The Docs Support This

- AWS SDK v3 presign flow remains the right object-store substrate
- Tigris works cleanly via S3-compatible endpoints
- Supabase docs and SSR guidance support server-owned token/cookie flows, so
  storage access should continue to stay app-controlled instead of browser-keyed

### Expected Impact

This is the key unlock for content and multimedia apps. Without it, upload-based
products still require too much bespoke plumbing.

## 4. Form And Mutation Recipes

### Why This Is A Heavy Lifter

A lot of product work is still repetitive create/edit plumbing:

- field mapping
- defaults
- create vs edit forms
- validation and error return shapes
- action wiring
- optimistic or success-state updates

Stylyf already generates UI, routes, and backend operations. It should now
bridge them more directly.

### What We Should Add

Add a generated form recipe layer that derives from resource and field schema.

Example direction:

```json
{
  "resources": [
    {
      "name": "records",
      "forms": {
        "create": true,
        "edit": true
      }
    }
  ]
}
```

Generated output:

- `CreateRecordForm`
- `EditRecordForm`
- field rendering from schema type
- wired server actions / API calls
- standard error/success display

### Clean Fit In The Current Codebase

- build on page shell generation
- use the existing component inventory:
  - `TextField`
  - `TextArea`
  - `Select`
  - `Checkbox`
  - `RadioGroup`
  - `Switch`
  - `DatePicker`
  - form-system compositions
- add form-specific generators instead of inventing a giant runtime form engine

### Why The Docs Support This

- SolidStart actions are the right mutation primitive
- single-flight mutations and server actions are explicitly designed for this
  kind of ergonomic mutation flow

### Expected Impact

This is a high-frequency saver across almost every product category. It will not
solve advanced validation design, but it will remove a large amount of boring
first-pass mutation code.

## 5. Interaction And Feed Primitives

### Why This Is A Heavy Lifter

For the kinds of tools Depths wants to ship, repeated interaction mechanics are
core product infrastructure:

- comments
- votes / likes
- ratings
- bookmarks
- reports
- notifications
- activity feeds

This is not “nice to have.” These are recurring product mechanics across
content-driven SaaS.

### What We Should Add

Introduce optional interaction recipes.

Example direction:

```json
{
  "interactions": {
    "comments": { "resource": "records" },
    "ratings": { "resource": "records", "scale": 10 },
    "bookmarks": { "resource": "records" },
    "activity": { "resource": "records" }
  }
}
```

Generated output should include:

- schema / SQL
- server functions
- API endpoints where appropriate
- baseline UI blocks:
  - comment thread
  - rating control
  - bookmark toggle
  - activity list

### Clean Fit In The Current Codebase

- the UI side already has strong seeds in the registry:
  - `CommentThread`
  - `ActivityFeed`
  - `NotificationList`
- the backend side can grow through:
  - resource-aware generated schema
  - action/query templates

### Provider-Specific Output

Portable path:

- Drizzle tables + queries/actions

Hosted path:

- Supabase SQL + SDK-backed query/action modules
- later, RLS-aware interaction policies

### Why The Docs Support This

- Better Auth organization/team model can later support scoped interactions
- Supabase auth/RLS model fits user-scoped interactions well
- SolidStart actions + queries match these mechanics naturally

### Expected Impact

This is the most product-facing of the top 5 and the most important for
Depths’ distribution strategy.

## Why These Five And Not Others

There are other valid expansion targets:

- workflow recipes
- deployment profiles
- billing adapters
- analytics/event pipelines
- content moderation pipelines

But the top 5 above are heavier lifters because they:

- compound across almost every SaaS app
- directly reduce bespoke logic, not just setup
- fit our current architecture cleanly
- raise both productivity and consistency

## Recommended v0.3 Implementation Order

1. Ownership and policy scaffolds
2. Resource recipes
3. Storage metadata and asset lifecycle patterns
4. Form and mutation recipes
5. Interaction and feed primitives

That order matters.

Why:

- policy is the security foundation
- resources are the structural backbone
- storage metadata is essential for media-heavy products
- forms ride on top of resources
- interactions become dramatically easier once resources and policies exist

## What v0.3 Should Explicitly Avoid

To keep the expansion clean, v0.3 should avoid:

- deep nested DSLs
- runtime plugin systems in generated apps
- “admin panel generator” style abstraction that hides app code
- provider-specific magic leaking into the IR everywhere
- generating policies that silently over-grant access
- browser-side raw object storage credentials

## Definition Of Success For v0.3

Stylyf v0.3 is successful if a coding agent can scaffold a basic SaaS product
with:

- auth
- owned resources
- CRUD surfaces
- upload-backed assets
- comments/ratings/activity
- baseline policy enforcement

and reach a serious first deliverable in roughly half the turns previously
required.

That is the right threshold for this expansion wave.

## Source References

These references matter most for the expansion path above:

- SolidStart sessions:
  - https://docs.solidjs.com/solid-start/advanced/session
- SolidStart data mutation and server actions:
  - https://docs.solidjs.com/solid-start/building-your-application/data-mutation
- Better Auth organization plugin:
  - https://better-auth.com/docs/plugins/organization
- Drizzle relations and transactions:
  - https://orm.drizzle.team/docs/relations-v2
  - https://orm.drizzle.team/docs/transactions
- Drizzle Postgres row-level security:
  - https://orm.drizzle.team/docs/rls
- Supabase auth:
  - https://supabase.com/docs/guides/auth
- Supabase SSR:
  - https://supabase.com/docs/guides/auth/server-side/oauth-with-pkce-flow-for-ssr
  - https://supabase.com/docs/guides/auth/server-side/sveltekit
- Supabase email OTP:
  - https://supabase.com/docs/guides/auth/auth-email-passwordless
- Supabase RLS:
  - https://supabase.com/docs/guides/database/postgres/row-level-security
  - https://supabase.com/docs/guides/api/securing-your-api
- AWS SDK / S3 baseline:
  - https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/migrate-s3.html
