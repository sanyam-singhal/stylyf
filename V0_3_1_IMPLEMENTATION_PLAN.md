# Stylyf v0.3.1 Implementation Plan

## Purpose

`v0.3.1` is a composition and operator-experience release.

The goal is to make Stylyf easier for a fresh coding agent to use without
removing any capability or perturbing the existing generator core.

This release should:

- keep the current full-stack scaffolding power intact
- keep the current `AppIR` generation contract intact
- keep the current backend branches intact
- reduce cognitive load in the docs and `intro` flow
- let agents compose the app from explicit additive IR chunks instead of one
  large monolithic JSON file

This release should **not**:

- invent new backend or frontend capabilities
- change generated app architecture materially
- replace the current full `AppIR`
- introduce implicit directory-based composition or hidden config discovery

The composition model should stay explicit:

- one or more `--ir <path>` flags
- deterministic merge order
- explicit resolved output when the operator wants to inspect what Stylyf will
  actually generate

## Current Codebase Seams

The current CLI already has the right internal structure for this release.

### Stable seams to preserve

- `packages/stylyf-cli/src/ir/types.ts`
  - defines the final `AppIR` contract
- `packages/stylyf-cli/src/ir/schema.ts`
  - defines the final JSON schema
- `packages/stylyf-cli/src/ir/validate.ts`
  - validates a final resolved IR
- `packages/stylyf-cli/src/generators/generate.ts`
  - expects a valid full `AppIR`
- `packages/stylyf-cli/src/generators/intro.ts`
  - already owns the operator briefing surface
- `packages/stylyf-cli/src/commands/*.ts`
  - already keep command concerns thin

### Key architectural decision

We should add a new composition layer **before** validation and generation:

1. load one or more IR fragments
2. merge them into one resolved `AppIR`
3. validate the resolved `AppIR`
4. pass the resolved `AppIR` into the existing generator

That keeps the generator core stable.

## v0.3.1 Goals

### Goal 1: Layer the operator docs

The default docs surface should become shorter and more decision-oriented.

The default `stylyf intro` output should answer:

- what Stylyf is
- what the two backend paths are
- when to choose each path
- the two canonical examples
- the minimum shape of a usable composition
- how to continue iterating inside the generated app

Deeper material should become opt-in.

### Goal 2: Make IR authoring explicitly composable

Agents should be able to build the app from several JSON fragments without
directory magic or hidden discovery.

Target usage:

```bash
stylyf validate \
  --ir app.core.json \
  --ir backend.portable.json \
  --ir resources.json \
  --ir routes.json
```

```bash
stylyf generate \
  --ir app.core.json \
  --ir backend.hosted.json \
  --ir resources.json \
  --ir routes.json \
  --target ./my-app
```

Merge order must be explicit:

- later `--ir` inputs win over earlier ones where overrides are allowed

### Goal 3: Keep examples rich, but present a clearer happy path

The examples should still cover current power, but the operator-facing story
should emphasize:

- one canonical portable stack example
- one canonical hosted stack example
- optional deeper examples for reference, not as the first thing a fresh agent
  sees

## Implementation Principles

### 1. Preserve `AppIR` as the internal truth

We should not replace the current final IR contract.

Instead:

- allow fragment input
- merge fragments into a full `AppIR`
- validate the final resolved result using the existing validator

This keeps the current generation and verification surfaces trustworthy.

### 2. Keep composition explicit

Do not add:

- automatic `--ir-dir`
- implicit file loading by convention
- hidden inheritance chains

The operator should always know exactly which fragments are being composed and
in what order.

### 3. Use semantic merge rules, not generic deep merge

Raw JSON deep merge is too ambiguous.

We should merge according to the meaning of each field.

## Merge Model

The merge layer should resolve an ordered list of IR fragments into one final
`AppIR`.

### Scalar or object roots

These should merge by replacement or deep object merge:

- `name`
- `shell`
- `theme`
- `database`
- `auth`
- `storage`
- `env`

Rule:

- later fragment overrides earlier fragment
- nested objects deep-merge unless a field is scalar

### Keyed arrays

These should merge by semantic identity:

- `routes` by `path`
- `resources` by `name`
- `workflows` by `name`
- `server` by `name`
- `apis` by `method + path`
- `auth.protect` by `kind + target`
- `env.extras` by `name`
- `database.schema` by `table`
- `database.schema[].columns` by `name`

Rule:

- if a keyed item is new, append it
- if a keyed item repeats, merge or replace that item by its own rules

### Route merge behavior

For `v0.3.1`, keep this simple:

- routes are keyed by `path`
- if a route repeats, the later fragment replaces the entire route object

This avoids section-level patch semantics and keeps the model legible.

### Resource merge behavior

Resources are keyed by `name`.

Resource object fields should merge as follows:

- scalar fields (`table`, `visibility`, `workflow`) override
- `ownership` deep-merges
- `access` deep-merges
- `fields` keyed by `name`
- `relations` keyed by `target + kind + field/through`
- `attachments` keyed by `name`

### Workflow merge behavior

Workflows are keyed by `name`.

- scalar fields override
- `states` merge as unique ordered values
- `transitions` keyed by `name`

### Conflict discipline

The merge layer should stay deterministic and strict.

If two fragments produce an obviously invalid combination, the merged result
should simply fail validation afterward.

We do not need a patch DSL in `v0.3.1`.

## Commands To Extend

### `stylyf validate`

Current state:

- supports a single `--ir <path>`

Target:

- allow repeated `--ir <path>`
- merge inputs in argument order
- validate the resolved `AppIR`
- optionally print or write the resolved IR

Recommended options:

- `--ir <path>` repeatable
- `--print-resolved`
- `--write-resolved <path>`

### `stylyf generate`

Current state:

- supports a single `--ir <path>`

Target:

- allow repeated `--ir <path>`
- merge inputs in argument order
- validate the resolved IR
- generate exactly as today from the resolved IR

Recommended options:

- `--ir <path>` repeatable
- `--write-resolved <path>` optional for inspection/debugging

### `stylyf intro`

Current state:

- emits one long reference-style markdown document

Target:

- default overview mode is short and decision-oriented
- opt-in drilldowns expose fuller material

Recommended options:

- `--topic overview` default
- `--topic dsl`
- `--topic components`
- `--topic portable`
- `--topic hosted`
- `--topic examples`
- `--topic generated-output`
- `--topic full` for the current all-in-one style

## Docs Restructure

### Package README

The README should become layered too.

Recommended structure:

1. what Stylyf is
2. two backend paths
3. canonical quick starts
4. minimal composition example
5. explicit additive composition example
6. where to go deeper

The README should emphasize exactly two first-class examples:

- portable: Better Auth + Drizzle + Tigris
- hosted: Supabase + Tigris

### Example docs

`packages/stylyf-cli/examples/README.md` should become clearer about:

- canonical examples
- reference examples
- portable vs hosted
- monolithic IR vs additive IR fragments

### Root repo docs

Only update root docs as needed for consistency with the CLI story.

The CLI remains the primary product.

## Example Strategy

We should keep current examples, but add a cleaner composition story on top.

### Canonical examples

Create or designate exactly two primary examples:

- `portable`
- `hosted`

Each should have:

- a monolithic example
- an additive composition form using several files

Recommended additive file grouping:

- `app.core.json`
- `backend.portable.json` or `backend.hosted.json`
- `resources.json`
- `routes.json`

This keeps composition explicit and teachable.

### Reference examples

Keep richer examples as secondary/reference examples.

They remain useful for:

- validation coverage
- pack verification
- search/index richness

But they should not be the first story a cold-start agent sees.

## Step-by-Step Implementation Plan

### Step 1: Add IR composition layer

Add a new IR composition module, likely under:

- `packages/stylyf-cli/src/ir/compose.ts`

Responsibilities:

- load multiple JSON files
- parse them as partial IR fragments
- merge them deterministically
- return a final resolved `AppIR`

This step should not change generation behavior yet.

Validation:

- unit-like sanity by invoking compose through `validate`
- ensure repeated fields merge as designed
- ensure final output still validates against existing `validate.ts`

### Step 2: Extend `validate` and `generate` to accept repeated `--ir`

Update command argument handling so both commands can accept:

- one or many `--ir` flags

Rules:

- preserve single-file behavior
- multi-file behavior merges in CLI argument order

Also add:

- `validate --print-resolved`
- `validate --write-resolved <path>`
- `generate --write-resolved <path>`

Validation:

- single-file path still works
- multi-file path works
- resolved JSON is inspectable

### Step 3: Refactor `intro` into topics

Keep all current information, but split it into:

- overview
- dsl
- portable
- hosted
- components
- examples
- generated-output
- full

Default output should be much shorter than today.

Validation:

- `stylyf intro`
- `stylyf intro --topic full`
- `stylyf intro --topic portable`
- `stylyf intro --project <path>`

### Step 4: Rewrite package README around the layered operator flow

Make the README support the same composition story as `intro`.

Add:

- two canonical backend paths
- minimal fullstack examples
- additive IR composition example
- “when to drill deeper” pointers

Validation:

- check alignment between README and `intro`
- ensure no stale one-big-JSON-first framing remains

### Step 5: Rework examples into canonical + reference sets

Without dropping current richness:

- clearly designate primary portable and hosted examples
- add additive fragment versions of both
- keep current examples as deeper/reference cases

Validation:

- `stylyf validate` against canonical monolithic examples
- `stylyf validate` against canonical additive examples
- `stylyf generate` from additive examples

### Step 6: Search and discoverability pass

Update operator-facing descriptions so search helps with the new composition
story.

Specifically:

- searchable references to portable vs hosted
- searchable references to additive IR composition
- searchable references to canonical examples

Validation:

- `stylyf search portable`
- `stylyf search hosted`
- `stylyf search resources workflow attachments`
- `stylyf search additive composition`

### Step 7: Verification and dogfooding

Run the usual package validation with the new operator surface:

- `npm run cli:build`
- `npm run cli:verify-pack`

Also explicitly dogfood:

- generate from canonical portable additive fragments
- generate from canonical hosted additive fragments
- inspect resolved IR output

This is the final confidence gate for `v0.3.1`.

## Non-Goals For v0.3.1

To keep this clean, we should explicitly avoid:

- section-level patch operations for route internals
- implicit fragment discovery from directories
- environment inheritance systems
- profile/preset macros
- changing generated app runtime architecture
- adding new backend capability branches

## Success Criteria

`v0.3.1` is successful if:

- a fresh agent can start from `stylyf intro` without getting buried in detail
- the two backend paths are immediately legible
- additive IR composition is explicit and deterministic
- the current generator behavior stays intact
- the package examples tell a clearer “happy path” story
- generated apps still build exactly as they do now

## Recommended Execution Order

1. add IR composition layer
2. extend `validate` and `generate`
3. refactor `intro`
4. rewrite README and example docs
5. add canonical additive examples
6. search/discoverability pass
7. build, verify-pack, and dogfood

This order minimizes risk because the composition core lands first, and the
operator-facing documentation then builds on a real implementation.
