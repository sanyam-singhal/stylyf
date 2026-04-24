# Stylyf CLI Examples

Stylyf v0.4 examples are small intent-level specs. They are not private app
models and they do not expose database schemas, API files, server modules, or
layout trees as the first authoring surface. When the defaults are too coarse,
use explicit additive chunks with `stylyf compose`.

## Canonical v0.4 Specs

- `v0.4/internal-tool.basic.json`
- `v0.4/internal-tool.rich.json`
- `v0.4/generic.basic.json`
- `v0.4/cms-site.basic.json`
- `v0.4/cms-site.rich.json`
- `v0.4/free-saas-tool.basic.json`
- `v0.4/internal-tool.hosted.rich.json`
- `v0.4/composition.base.json`
- `v0.4/composition.ui.chunk.json`
- `v0.4/composition.backend.chunk.json`

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

## Generic Path

Use `v0.4/generic.basic.json` when the requested app should stay general:
resource-backed routes, auth/data/storage primitives, and explicit high-level
surfaces without the assumptions of internal tools, CMS publishing, or free
utility apps.

## Layered Composition Path

Use the composition examples when an agent needs a compact base spec plus
controlled deeper route/layout/backend additions:

```bash
stylyf compose \
  --base packages/stylyf-cli/examples/v0.4/composition.base.json \
  --with packages/stylyf-cli/examples/v0.4/composition.ui.chunk.json \
  --with packages/stylyf-cli/examples/v0.4/composition.backend.chunk.json \
  --output ./stylyf.composed.json

stylyf plan --spec ./stylyf.composed.json --resolved
stylyf generate --spec ./stylyf.composed.json --target ./generated-composed
```
