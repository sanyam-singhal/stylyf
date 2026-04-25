# Stylyf CLI Examples

Stylyf v1.0 examples are small intent-level specs. They are not private app
models and they do not expose database schemas, API files, server modules, or
layout trees as the first authoring surface. When the defaults are too coarse,
use explicit additive chunks with `stylyf compose`.

For cold-start usage, pair examples with the operator manual:

```bash
stylyf intro --topic operator
stylyf intro --topic ui
stylyf intro --topic data
stylyf intro --topic api
stylyf intro --topic full
```

## Canonical v1.0 Specs

- `v1.0/internal-tool.basic.json`
- `v1.0/internal-tool.rich.json`
- `v1.0/generic.basic.json`
- `v1.0/cms-site.basic.json`
- `v1.0/cms-site.rich.json`
- `v1.0/free-saas-tool.basic.json`
- `v1.0/internal-tool.hosted.rich.json`
- `v1.0/composition.base.json`
- `v1.0/composition.ui.chunk.json`
- `v1.0/composition.backend.chunk.json`

## Portable Local Path

Use this first when dogfooding v1.0:

```bash
stylyf validate --spec packages/stylyf-cli/examples/v1.0/internal-tool.rich.json
stylyf plan --spec packages/stylyf-cli/examples/v1.0/internal-tool.rich.json
stylyf generate --spec packages/stylyf-cli/examples/v1.0/internal-tool.rich.json --target ./generated-internal
```

This compiles to:

- Better Auth
- Drizzle
- SQLite/libsql
- Tigris/S3-compatible storage when media is enabled

## Hosted Managed Path

Use this for Supabase + Tigris validation:

```bash
stylyf validate --spec packages/stylyf-cli/examples/v1.0/internal-tool.hosted.rich.json
stylyf plan --spec packages/stylyf-cli/examples/v1.0/internal-tool.hosted.rich.json
stylyf generate --spec packages/stylyf-cli/examples/v1.0/internal-tool.hosted.rich.json --target ./generated-hosted
```

After generation, apply:

- `supabase/schema.sql`
- `supabase/policies.sql`

Then run hosted CRUD/runtime checks with real Supabase and Tigris env values.

## Generic Path

Use `v1.0/generic.basic.json` when the requested app should stay general:
resource-backed routes, auth/data/storage primitives, and explicit high-level
surfaces without the assumptions of internal tools, CMS publishing, or free
utility apps.

## Layered Composition Path

Use the composition examples when an agent needs a compact base spec plus
controlled deeper route/layout/backend additions:

```bash
stylyf compose \
  --base packages/stylyf-cli/examples/v1.0/composition.base.json \
  --with packages/stylyf-cli/examples/v1.0/composition.ui.chunk.json \
  --with packages/stylyf-cli/examples/v1.0/composition.backend.chunk.json \
  --output ./stylyf.composed.json

stylyf plan --spec ./stylyf.composed.json --resolved
stylyf generate --spec ./stylyf.composed.json --target ./generated-composed
```

## Authoring Guidance

- Use `stylyf search <intent>` to discover components, layouts, backend snippets, and capability reminders.
- Use `stylyf inspect component <id>` before passing props into explicit sections.
- Use `stylyf validate` after every composed chunk, not only before final generation.
- Use `stylyf plan --resolved` to confirm the expanded private app model before installing generated-app dependencies.
