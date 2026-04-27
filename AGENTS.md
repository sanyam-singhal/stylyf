# AGENTS

## Mission

This repo is a monorepo for the published npm package
`@depths/stylyf-cli`.

The repo contains:

- `packages/stylyf-cli`: the publishable CLI
- `packages/stylyf-source`: the internal source-owned UI inventory and styling grammar used to build CLI assets
- `packages/stylyf-builder-core`: internal server-only builder orchestration helpers
- `apps/builder`: the auth-gated internal app factory deployed at `stylyf.com`
- `apps/landing`: retained landing app source, not the default live site

Generated apps must:

- be ordinary checked-in source code
- run on their own
- not import from this repo
- not import from `@depths/stylyf-cli` after generation

## Working Rules

- Treat the CLI as the primary product.
- Treat `packages/stylyf-source` as the source of truth for bundled UI inventory and styling grammar.
- Do not make `apps/landing` the source of truth for CLI assets.
- Keep generated app contracts explicit and source-owned.
- Prefer validating with real package builds and generated app builds over source-only assumptions.
- Never squash merge PRs in this repo. Preserve the branch's intermediate commit history unless the user explicitly requests a squash.
- Never delete release/work branches after merge unless the user explicitly requests branch deletion.

## Core Validation

For CLI/package work:

- `npm run cli:build`
- `npm run cli:verify-pack`

For builder app work:

- `npm run builder:check`
- `npm run builder:build`

For landing app work:

- `npm --prefix apps/landing run check`
- `npm --prefix apps/landing run build`

For repo-level sanity:

- `npm run build`
- `npm run check`

## Packaging Rules

The CLI package must bundle its own:

- manifests
- templates
- assets
- starter snippets

The generated app must not depend on this repo.

## Current Shape

- The root package is a workspace orchestrator.
- The CLI is the public package product.
- The builder app is the live internal control plane at `stylyf.com`.
- The old registry showcase is no longer a product surface.
