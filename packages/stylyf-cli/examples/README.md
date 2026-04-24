# Stylyf CLI Examples

Stylyf v0.4 examples are small intent-level specs. They are not private app
models and they do not expose database schemas, API files, server modules, or
layout trees as the primary authoring surface.

## Canonical v0.4 Specs

- `v0.4/internal-tool.basic.json`
- `v0.4/internal-tool.rich.json`
- `v0.4/cms-site.basic.json`
- `v0.4/cms-site.rich.json`
- `v0.4/free-saas-tool.basic.json`
- `v0.4/internal-tool.hosted.rich.json`

## Portable Local Path

Use this first when dogfooding v0.4:

```bash
stylyf validate --spec packages/stylyf-cli/examples/v0.4/internal-tool.rich.json
stylyf plan --spec packages/stylyf-cli/examples/v0.4/internal-tool.rich.json
stylyf generate --spec packages/stylyf-cli/examples/v0.4/internal-tool.rich.json --target ./generated-internal
```

This compiles to:

- Better Auth
- Drizzle
- SQLite/libsql
- Tigris/S3-compatible storage when media is enabled

## Hosted Managed Path

Use this for Supabase + Tigris validation:

```bash
stylyf validate --spec packages/stylyf-cli/examples/v0.4/internal-tool.hosted.rich.json
stylyf plan --spec packages/stylyf-cli/examples/v0.4/internal-tool.hosted.rich.json
stylyf generate --spec packages/stylyf-cli/examples/v0.4/internal-tool.hosted.rich.json --target ./generated-hosted
```

After generation, apply:

- `supabase/schema.sql`
- `supabase/policies.sql`

Then run hosted CRUD/runtime checks with real Supabase and Tigris env values.

## Reference v0.3 Files

The older v0.3 files remain in this package as implementation reference while
v0.4 stabilizes, but they are no longer the preferred authoring surface.
