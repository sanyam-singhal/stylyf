# Stylyf CLI Examples

Stylyf now has two example stories:

- **canonical** examples for the cleanest operator starting points
- **reference** examples for broader coverage and deeper capability reminders

## Canonical Examples

### Portable canonical example

Monolithic:

- `atlas-dashboard-v0.3-local.json`

Additive:

- `atlas-dashboard-portable.app.core.json`
- `atlas-dashboard-portable.backend.json`
- `atlas-dashboard-portable.resources.json`
- `atlas-dashboard-portable.routes.json`

This is the clearest starting point for:

- Better Auth
- Drizzle
- local SQLite development
- Tigris-friendly S3 storage
- resource/workflow-driven scaffolding

Validate or generate it additively like this:

```bash
stylyf validate \
  --ir packages/stylyf-cli/examples/atlas-dashboard-portable.app.core.json \
  --ir packages/stylyf-cli/examples/atlas-dashboard-portable.backend.json \
  --ir packages/stylyf-cli/examples/atlas-dashboard-portable.resources.json \
  --ir packages/stylyf-cli/examples/atlas-dashboard-portable.routes.json \
  --print-resolved
```

### Hosted canonical example

Monolithic:

- `atlas-dashboard-v0.3-supabase.json`

Additive:

- `atlas-dashboard-hosted.app.core.json`
- `atlas-dashboard-hosted.backend.json`
- `atlas-dashboard-hosted.resources.json`
- `atlas-dashboard-hosted.routes.json`

This is the clearest starting point for:

- Supabase auth
- Supabase data access
- Tigris-friendly S3 storage
- resource/workflow-driven hosted scaffolding

Validate or generate it additively like this:

```bash
stylyf generate \
  --ir packages/stylyf-cli/examples/atlas-dashboard-hosted.app.core.json \
  --ir packages/stylyf-cli/examples/atlas-dashboard-hosted.backend.json \
  --ir packages/stylyf-cli/examples/atlas-dashboard-hosted.resources.json \
  --ir packages/stylyf-cli/examples/atlas-dashboard-hosted.routes.json \
  --target ./atlas-hosted
```

## Reference Examples

These remain useful as broader reminders of the system surface.

### Frontend and pre-v0.3 baselines

- `atlas-dashboard.json`
- `atlas-dashboard-local.json`
- `atlas-dashboard-fullstack.json`
- `atlas-dashboard-supabase.json`
- `field-manual-docs.json`
- `field-manual-docs-fullstack.json`

### v0.3 reference contracts

- `atlas-dashboard-v0.3.json`
- `atlas-dashboard-v0.3-local.json`
- `atlas-dashboard-v0.3-supabase.json`

## Hosted Example Note

For the hosted Supabase path, generation is only the first half of the setup.
After generating the app, apply:

- `supabase/schema.sql`
- `supabase/policies.sql`

and only then treat hosted CRUD/runtime testing as representative of the
generated scaffold.

## Why Keep Both Monolithic And Additive Examples?

- monolithic examples are fast to scan
- additive examples teach the cleaner composition workflow
- both resolve to the same final `AppIR`

The additive examples are the preferred teaching surface for `v0.3.1`.
