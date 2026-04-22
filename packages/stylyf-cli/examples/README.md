# Stylyf CLI Examples

These example IR files are the primary dogfood targets for the `v0.2.0`
backend scaffolding pass.

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

## `field-manual-docs-fullstack.json`

Content/docs baseline covering:

- docs shell
- PostgreSQL + Drizzle
- Better Auth
- lighter server-side surface
- no storage capability

Both examples should generate successfully with one `stylyf generate` command
and build without importing from this repo or from `@depths/stylyf-cli`.
