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

For authenticated builder UI review:

- Do not keep re-testing login after the Supabase email/password path has been proven.
- Start the local builder on `localhost:3000`; Supabase auth redirect is configured for that port.
- Use the repo-root `.env` keys without printing values: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `SUPABASE_USER_EMAIL`, and `SUPABASE_USER_PASSWORD`.
- For local UI screenshots, set `STYLYF_BUILDER_AGENT_ADAPTER=manual` and `STYLYF_BUILDER_CREATE_GITHUB_REPOS=false` to avoid real Codex/GitHub side effects.
- Seed an authenticated Playwright/Webknife browser context by calling `POST http://localhost:3000/api/auth/sign-in/password` with the test email/password, then add the returned Supabase auth cookie to the browser context.
- Go directly to the product surfaces after seeding the cookie: `/` for dashboard and `/projects/:id` for the studio/workbench.
- Screenshot and inspect the dashboard, studio top, chat/editor area, and live preview area before declaring builder UI work acceptable.
- Treat repeated form-login attempts as a red flag unless the task is explicitly auth-related.
- Remove or ignore local smoke artifacts such as `apps/builder/.stylyf-builder/` and `/tmp/stylyf-builder-*`; do not commit them unless explicitly requested.

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
