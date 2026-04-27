# Stylyf Handoff

Generated app: Stylyf Builder
App kind: internal-tool

## Backend

- mode: hosted
- auth: supabase
- data: supabase sdk
- storage: tigris/s3-compatible

## Product Routes

- `/login`: internal email/password login.
- `/`: clean project dashboard.
- `/projects/new`: one-field project creation.
- `/projects/:id`: app-builder workbench with chat, IR panes, preview controls, Webknife, timeline, and git handoff.
- `/settings`: internal settings.

The old generated `agent_events` CRUD routes are implementation vestiges. They should not be linked in primary navigation; timeline events belong inside the project workbench.

## Workspace Contract

- New projects bootstrap a workspace root with `AGENTS.md`, `specs/`, `app/`, `logs/`, `.webknife/`, `screenshots/`, and git metadata.
- Codex runs from the workspace root so it sees the injected `AGENTS.md`.
- Stylyf IR chunks under `specs/` are the first-class composition layer.
- Generated app source lives in `app/` and remains standalone.
- Webknife artifacts stay in `.webknife/` and are referenced from builder timeline records.
- Accepted iterations commit and push through the workspace repository.

## Source Ownership

The builder app was generated from Stylyf, then hand-refined. Generated project apps are ordinary source code and do not import this repo or depend on `@depths/stylyf-cli` at runtime.

For generated projects, prefer changing explicit Stylyf IR chunks and regenerating before raw source edits. Raw edits should record their reason in the project `handoff.md`.
