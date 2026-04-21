# AGENTS

## Mission

This repo is the authoring codebase for the publishable npm package
`@stylyf/cli` with bin command `stylyf`.

The package is a frontend assembly-line CLI for generating standalone
SolidJS + SolidStart apps from a shallow JSON IR.

Generated apps must:

- be ordinary checked-in source code
- be runnable on their own
- not import from this repo
- not import from `@stylyf/cli` after generation

## Source Of Truth

The implementation order and deliverables are defined in:

- [FRONTEND_ASSEMBLY_LINE_PLAN.md](./FRONTEND_ASSEMBLY_LINE_PLAN.md)

That plan must be followed strictly in order.

Do not jump ahead to a later step because it seems convenient.
Do not partially implement later-step ideas before the current step is fully
completed, validated, and committed.

## Required Execution Discipline

For every step:

1. re-read the relevant section of `FRONTEND_ASSEMBLY_LINE_PLAN.md`
2. inspect the current code already in the repo
3. implement only the current step's scope
4. validate the step locally using real package builds/CLI execution
5. commit the step cleanly
6. only then move to the next step

If a later step depends on a design choice, document it, but do not start
implementing that later step early.

## Current Ordered Status

Completed on branch `assembly-tool`:

- Step 1: create the publishable `@stylyf/cli` package scaffold
- Step 2: extract theme grammar from `src/app.css`
- Step 3: build the bundled registry assembly manifest
- Steps 4-6: implement IR validation, search, search index, and local search HTTP endpoint
- Step 7: create layout and shell templates
- Step 8: create route and page generators
- Step 9: add style emission
- Step 10: add project scaffold and dependency installation
- Step 11: add `stylyf intro`
- Step 12: dogfood with two generated example apps
- Step 13: publishability pass

Phase 1 is now implemented and validated end to end.

The next allowed work is:

- tighten docs
- improve release ergonomics
- refine generated app quality
- start Phase 2 planning

## Validation Gates

### For package-level steps

Use real local verification from the built package, not source-only assumptions.

Expected checks include:

- `npm run cli:build`
- `node packages/stylyf-cli/dist/bin.js --help`
- command-specific verification such as:
  - `validate`
  - `search`
  - `build-index`
  - `serve-search`

### For generation steps

The CLI must be tested against a real target directory.

At minimum:

1. generate a target app into a clean directory
2. run `npm install` in that target
3. run the target app build
4. confirm the generated app does not import from this repo or from `@stylyf/cli`

### For dogfooding

Before calling Phase 1 done:

- generate one dashboard-style app
- generate one docs-style app
- build both successfully

## Packaging Rules

The package must bundle its own:

- manifests
- templates
- assets
- starter snippets

The repo is the source of those bundled artifacts, but the generated app must
not depend on the repo.

## Design Rules

- JSON is the IR
- keep the IR shallow
- avoid inventing deep DSLs
- generate real route files
- generate explicit source files
- use the styling grammar derived from `src/app.css`
- support the three font roles:
  - `fancy`
  - `sans`
  - `mono`

## Commit Rules

Make a git commit after each completed plan step or grouped checkpoint exactly
as discussed in `FRONTEND_ASSEMBLY_LINE_PLAN.md`.

Do not collapse multiple major steps into one commit unless the plan already
groups them together.

## If There Is Drift

If implementation starts drifting from the plan:

1. stop
2. re-read `FRONTEND_ASSEMBLY_LINE_PLAN.md`
3. compare completed work against the step list
4. correct course before writing more code
