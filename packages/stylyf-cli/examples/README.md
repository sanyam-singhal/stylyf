# Stylyf CLI Examples

These example IR files are the primary dogfood targets for the current Stylyf
scaffolding passes.

## `atlas-dashboard-local.json`

Local baseline covering:

- sidebar app shell
- SQLite + libsql
- Better Auth
- full local auth + DB development path
- query + action server modules

## `atlas-dashboard-fullstack.json`

Internal app baseline covering:

- sidebar app shell
- PostgreSQL + Drizzle
- Better Auth
- S3 storage
- presigned upload API route
- query + action server modules

## `atlas-dashboard-supabase.json`

Hosted fast-path baseline covering:

- sidebar app shell
- Supabase for both auth and data access
- email + password auth enabled
- email OTP scaffolding enabled for later passwordless flows
- Tigris-friendly S3-compatible storage wiring
- generated `supabase/schema.sql` instead of Drizzle files
- query + action server modules backed by the Supabase SDK

## `atlas-dashboard-v0.3.json`

Validation-first v0.3 foundation example covering:

- generalized `resources` grammar
- ownership and access presets
- resource relations
- attachment declarations
- workflow transitions with emitted events and notification audiences
- compatibility with the existing portable full-stack scaffold

## `atlas-dashboard-v0.3-local.json`

Local portable v0.3 validation example covering:

- SQLite + libsql
- Better Auth
- resource-driven schema and CRUD generation
- owner/public policy defaults on a local development stack
- generated create/edit routes and resource form scaffolds
- attachment metadata plus presign/confirm/delete lifecycles
- workflow transitions, event logging, and notifications

## `atlas-dashboard-v0.3-supabase.json`

Hosted v0.3 foundation example covering:

- resource-first IR with Supabase data/auth
- derived `supabase/schema.sql` from `resources`
- derived query/action server modules from `resources`
- ownership, relation, attachment, and workflow declarations
- generated create/edit routes and resource form scaffolds
- hosted RLS policy SQL plus request-scoped server clients
- workflow transitions, event logging, and notifications

## Recommended v0.3 starting points

- portable branch: `atlas-dashboard-v0.3-local.json`
- hosted branch: `atlas-dashboard-v0.3-supabase.json`
- broad contract reference: `atlas-dashboard-v0.3.json`

## Hosted example note

For the hosted Supabase path, generation is only the first half of the setup.
After generating the app, apply:

- `supabase/schema.sql`
- `supabase/policies.sql`

and only then treat hosted CRUD/runtime testing as representative of the
generated scaffold.

## `field-manual-docs-fullstack.json`

Content/docs baseline covering:

- docs shell
- PostgreSQL + Drizzle
- Better Auth
- lighter server-side surface
- no storage capability

Both examples should generate successfully with one `stylyf generate` command
and build without importing from this repo or from `@depths/stylyf-cli`.
