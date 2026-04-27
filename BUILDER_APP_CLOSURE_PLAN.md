# Stylyf Builder Closure Plan

## Goal

Make `apps/builder` a usable internal Stylyf app builder for Depths AI team members.

The intended product flow is:

1. A team member signs in with Supabase email/password.
2. They land on a clean dashboard with existing app drafts and one obvious create action.
3. Creating a project asks only for the app name.
4. The server derives slug, workspace, GitHub repo state, initial Stylyf spec files, status, and preview metadata.
5. The studio opens with chat and live preview as the primary workspace.
6. Advanced controls expose plain-English app outline panes that write explicit Stylyf IR chunks.
7. The builder runs Stylyf composition, validation, generation, install, typecheck, build, preview, Webknife screenshots, git commit, and push as visible lifecycle steps.
8. Generated app deployment remains manual dev-team work after review.

This app is internal tooling, not a public no-code product. The quality bar is still product-grade because non-technical teammates should not need to understand SolidStart, Supabase, Tigris, Git, Codex, Webknife, or Stylyf IR to get a useful app draft.

## Current Codebase Facts

Current branch: `v1.1-internal-builder`.

Builder app:

- [apps/builder](/root/stylyf/apps/builder) is a SolidStart app with routes for `/login`, `/`, `/projects/new`, and `/projects/:id`.
- [apps/builder/src/lib/auth.ts](/root/stylyf/apps/builder/src/lib/auth.ts) uses Supabase email/password and OTP helpers, though only password login is in the current UI.
- [apps/builder/src/lib/supabase.ts](/root/stylyf/apps/builder/src/lib/supabase.ts) creates cookie-aware SSR clients and a server-only admin client.
- [apps/builder/src/middleware.ts](/root/stylyf/apps/builder/src/middleware.ts) protects UI routes but skips all `/api/*`, so every API route must self-authorize.
- [apps/builder/src/lib/server/projects.ts](/root/stylyf/apps/builder/src/lib/server/projects.ts) lists, reads, and bootstraps projects via Supabase and `@depths/stylyf-builder-core`.
- [apps/builder/src/lib/server/specs.ts](/root/stylyf/apps/builder/src/lib/server/specs.ts) saves chunk JSON and supports `stylyf compose`, `stylyf validate`, and `stylyf plan`.
- [apps/builder/src/lib/server/specs.ts](/root/stylyf/apps/builder/src/lib/server/specs.ts) does not yet expose the full `stylyf generate`, `npm install`, `npm run check`, and `npm run build` lifecycle.
- [apps/builder/src/lib/server/studio.ts](/root/stylyf/apps/builder/src/lib/server/studio.ts) sends prompts to a Codex adapter, starts preview processes, runs screenshot review, and commits/pushes project changes.
- [apps/builder/src/lib/server/studio.ts](/root/stylyf/apps/builder/src/lib/server/studio.ts) currently runs agent work synchronously in a server action and keeps preview process handles in an in-memory map.
- [apps/builder/src/lib/server/attachments.ts](/root/stylyf/apps/builder/src/lib/server/attachments.ts) implements browser-direct Tigris/S3-compatible reference uploads with presigned PUT, confirm, list, presigned GET, and delete.
- [apps/builder/src/routes/projects/[id]/index.tsx](/root/stylyf/apps/builder/src/routes/projects/[id]/index.tsx) has the right three-pane shape, but still contains static chat messages and hardcoded fallback preview copy tied to a social-rating example.
- [apps/builder/src/app.css](/root/stylyf/apps/builder/src/app.css) contains the current builder visual system. It is better than the old generated CRUD shell, but still needs final route-specific polish and state fidelity.
- [apps/builder/supabase/schema.sql](/root/stylyf/apps/builder/supabase/schema.sql) and [apps/builder/supabase/policies.sql](/root/stylyf/apps/builder/supabase/policies.sql) define the current Supabase schema and RLS policies.
- [apps/builder/README.md](/root/stylyf/apps/builder/README.md) is the consolidated builder app documentation.

Builder core:

- [packages/stylyf-builder-core/src/index.ts](/root/stylyf/packages/stylyf-builder-core/src/index.ts) creates project workspaces, writes project `AGENTS.md`, initializes git, optionally creates GitHub repos, runs allowlisted commands, allocates ports, and starts managed preview processes.
- [packages/stylyf-builder-core/src/project-agents.ts](/root/stylyf/packages/stylyf-builder-core/src/project-agents.ts) renders the project-local operating contract that tells Codex to use Stylyf IR before raw source edits.
- [packages/stylyf-builder-core/src/codex.ts](/root/stylyf/packages/stylyf-builder-core/src/codex.ts) has manual, app-server, and `codex exec` adapters.
- [packages/stylyf-builder-core/src/codex.ts](/root/stylyf/packages/stylyf-builder-core/src/codex.ts) still treats `codex exec resume --last` as session continuity, which is not strong enough for reliable per-project resumption.

Known stale/broken items:

- [apps/builder/scripts/seed.ts](/root/stylyf/apps/builder/scripts/seed.ts) imports a missing `src/lib/server/seed`.
- [apps/builder/tests/smoke/routes.spec.ts](/root/stylyf/apps/builder/tests/smoke/routes.spec.ts) still references removed generated routes like `/agent-events`, `/settings`, and edit pages.
- [apps/builder/tests/smoke/resource-forms.spec.ts](/root/stylyf/apps/builder/tests/smoke/resource-forms.spec.ts) still references removed generated resource forms.
- [apps/builder/tests/factories/resources.ts](/root/stylyf/apps/builder/tests/factories/resources.ts) still reflects the old generated CRUD resources.
- [apps/builder/stylyf.spec.json](/root/stylyf/apps/builder/stylyf.spec.json) and [apps/builder/stylyf.plan.json](/root/stylyf/apps/builder/stylyf.plan.json) are stale scaffold artifacts and are not the current builder source of truth.
- [apps/builder/archive](/root/stylyf/apps/builder/archive) is intentionally retained as a temporary reference archive until final cleanup.

Validated state before this closure plan:

- `npm --prefix apps/builder run check` passed.
- `npm --prefix packages/stylyf-builder-core run check` passed.
- `npm --prefix apps/builder run build` passed.
- `npm --prefix apps/builder run seed` failed because the seed module no longer exists.
- Full Tigris object lifecycle was validated manually through browser-direct presigned PUT, confirm, list, presigned GET, delete, and post-delete GET failure.

## External Grounding

Codex:

- OpenAI documents `codex exec` for automation, CI-like workflows, explicit sandbox/approval settings, JSONL output, and resuming previous runs.
- OpenAI documents `AGENTS.md` as project instruction context loaded before work, including project-level instructions discovered from the Git root downward.
- OpenAI documents `codex app-server` as a JSON-RPC app integration seam over stdio or websocket, including richer future support for events and approvals.

SolidStart:

- SolidStart uses file-based UI routes and API routes under `src/routes`.
- SolidStart `"use server"` functions run only in the server context and can be called by client components through server-function RPC.
- Privileged work such as Supabase service-role operations, filesystem access, AWS SDK calls, and command execution must stay behind API routes or server functions.

Supabase:

- Supabase SSR auth requires sessions in cookies rather than browser local storage.
- `@supabase/ssr` is the intended helper package, but its API is still marked beta, so wrapper isolation in `src/lib/supabase.ts` is correct.
- RLS must stay enabled for tables in exposed schemas, and service keys must never be exposed to the browser.

Object storage:

- S3 presigned PUT URLs let the browser upload without receiving AWS/Tigris credentials.
- Browser-direct object storage requires bucket CORS for the builder origin, methods, and headers.
- Tigris supports the AWS SDK v3 with endpoint `https://t3.storage.dev`, `region: "auto"`, and presigned GET/PUT/DELETE through `@aws-sdk/s3-request-presigner`.

GitHub:

- `gh repo create` supports non-interactive private/org repo creation with `OWNER/REPO`, `--private`, `--source`, and `--remote`.

Primary references:

- https://developers.openai.com/codex/noninteractive
- https://developers.openai.com/codex/guides/agents-md
- https://developers.openai.com/codex/app-server
- https://docs.solidjs.com/solid-start/building-your-application/routing
- https://docs.solidjs.com/solid-start/reference/server/use-server
- https://supabase.com/docs/guides/auth/server-side
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html
- https://docs.aws.amazon.com/AmazonS3/latest/userguide/cors.html
- https://www.tigrisdata.com/docs/sdks/s3/aws-js-sdk/
- https://cli.github.com/manual/gh_repo_create

## Product Acceptance Criteria

The builder is done when these are true:

- A manually provisioned Supabase user can log in and stay logged in across dashboard, create, and studio routes.
- Dashboard displays real projects and a clear empty state without implementation jargon.
- Create project asks for only `name` and handles all workspace/repo/spec initialization server-side.
- A newly created project gets a valid workspace with `AGENTS.md`, `specs/base.json`, `app/`, `logs/`, `screenshots/`, `.webknife/`, `handoff.md`, and git initialized.
- If GitHub repo creation is enabled, the workspace is connected to a private Depths AI repo and bootstrap commit is pushed.
- Studio renders real project state, real chat/timeline events, real preview state, real attached references, and real spec chunks.
- The user can save outline panes and run the full Stylyf loop: compose, validate, plan, generate.
- The builder can install generated app dependencies when needed, then run typecheck and build.
- Preview can start, stop, restart, and recover from stale/crashed state.
- Webknife can capture screenshots against the preview and record artifacts.
- Reference assets use browser-direct presigned object storage, while raw credentials stay server-only.
- Large artifacts use filesystem or Tigris object pointers; Postgres stores scalar metadata and pointers only.
- A successful agent iteration produces a local git commit and pushes when a remote exists.
- Stale generated tests and artifacts are removed or replaced with actual builder smoke tests.
- `npm --prefix apps/builder run preflight`, `check`, `build`, and relevant smoke tests pass.
- The deployed internal builder on `stylyf.com` is auth-gated.

## Commit-By-Commit Plan

### Commit 1: `docs: replace builder plans with closure plan`

Scope:

- Delete old root planning docs.
- Add this single current closure plan.
- Keep operational docs such as `README.md`, `ISSUES.md`, `BUILDER_OPERATIONS.md`, `BUILDER_SECURITY.md`, `DEPLOYMENT.md`, and `apps/builder/README.md`.

Validation:

- `git status --short`
- Verify only stale planning docs were removed.

### Commit 2: `chore(builder): remove stale generated scaffolding leftovers`

Scope:

- Remove or rewrite `apps/builder/scripts/seed.ts`.
- Remove the `seed` package script unless a new real seed implementation is added.
- Delete stale generated route/resource smoke tests.
- Delete or archive stale `apps/builder/stylyf.spec.json` and `apps/builder/stylyf.plan.json` if they are no longer used by the app.
- Confirm `apps/builder/archive` remains excluded from TypeScript and build.
- Update `apps/builder/README.md` so validation commands do not mention dead scripts.

Validation:

- `npm --prefix apps/builder run check`
- `npm --prefix apps/builder run build`
- `npm --prefix packages/stylyf-builder-core run check`

### Commit 3: `test(builder): add real smoke test foundation`

Scope:

- Replace stale Playwright tests with actual routes: `/login`, `/`, `/projects/new`, `/projects/demo`, and a real project studio when credentials are available.
- Add authenticated browser-context helper that signs in through `/api/auth/sign-in/password` and reuses returned cookies.
- Add smoke assertions that fail on 404, visible auth loops, client-side uncaught errors, and missing primary UI landmarks.
- Add a lightweight API auth smoke proving protected attachment/spec/studio paths reject unauthenticated users.

Validation:

- `npm --prefix apps/builder run test:types`
- `npm --prefix apps/builder run test:smoke` with local env when credentials are available.

### Commit 4: `build(builder): add host preflight and tool readiness checks`

Scope:

- Add a `tool:check` script that checks `stylyf`, `webknife`, `codex`, and `gh` versions/status without printing secrets.
- Extend `env:check` to cover builder-specific keys: `STYLYF_BUILDER_ROOT`, `STYLYF_BUILDER_GITHUB_ORG`, `STYLYF_BUILDER_CREATE_GITHUB_REPOS`, `STYLYF_BUILDER_AGENT_ADAPTER`, `CODEX_RUN_FLAGS`, and preview base keys.
- Keep env checking key-name-only.
- Add a `preflight` script that runs env, tool, type, and package sanity checks.

Validation:

- `npm --prefix apps/builder run env:check`
- `npm --prefix apps/builder run tool:check`
- `npm --prefix apps/builder run preflight`

### Commit 5: `db(builder): tighten Supabase schema and RLS alignment`

Scope:

- Review `schema.sql` and `policies.sql` against current code paths.
- Add missing tables/columns needed for real chat messages, agent turns, generated app build status, preview process state, and artifact pointers if absent.
- Remove unused generated/backward-compat tables only if no current code uses them.
- Ensure all public tables have RLS enabled.
- Ensure policies distinguish read and edit roles.
- Ensure service-role operations remain server-only.
- Add comments in SQL documenting no variable-sized binary/media payloads in Postgres.

Validation:

- SQL lint by manual review.
- Apply to Supabase staging/internal project.
- Smoke login, list projects, create project, read timeline, save spec chunk.

### Commit 6: `core(builder): harden workspace bootstrap and GitHub repo handoff`

Scope:

- Strengthen `bootstrapProjectWorkspace` in `packages/stylyf-builder-core`.
- Guarantee deterministic workspace layout.
- Guarantee project-local `AGENTS.md` includes Stylyf-first, Webknife, object-storage, validation, commit, and push rules.
- Make GitHub repo creation explicitly optional and environment-controlled.
- Record repo metadata and default branch accurately.
- Redact logs and command output before persisting.
- Ensure accepted bootstrap commits and pushes are recorded as events.

Validation:

- `npm --prefix packages/stylyf-builder-core run check`
- `npm --prefix packages/stylyf-builder-core run smoke`
- Create a local project with GitHub disabled.
- Create a project with GitHub enabled on a throwaway private repo if safe.

### Commit 7: `feat(builder): implement full Stylyf generation lifecycle`

Scope:

- Add server actions for `stylyf generate --spec stylyf.spec.json --target app`.
- Add dependency install action that runs only when `app/package.json` exists and dependencies need installation.
- Add generated app `npm run check` and `npm run build` actions.
- Record every lifecycle command in `commands` and `agent_events`.
- Add human-readable lifecycle states: checking outline, planning draft, generating source, installing dependencies, typechecking, building.
- Update studio controls so a non-technical user sees “Build draft” instead of raw command names.

Validation:

- Create a project.
- Save at least one spec pane.
- Compose, validate, plan, generate.
- `cd <workspace>/app && npm run check && npm run build`.

### Commit 8: `feat(builder): make studio chat and timeline real`

Scope:

- Replace static chat messages in `/projects/:id` with `agent_events` and `agent_sessions`.
- Render system/builder/user/command/result events as plain-language messages.
- Add visible pending state while a turn is running.
- Add failure summaries that point to recorded logs without dumping secrets or full logs into UI.
- Keep advanced event details behind a review trail or collapsible detail.

Validation:

- Manual adapter prompt creates visible session/event messages.
- Failed command creates visible failure.
- Timeline refreshes after prompt, spec, preview, screenshot, and git actions.

### Commit 9: `feat(builder): harden Codex execution and project session continuity`

Scope:

- Capture Codex JSONL output into per-session log files.
- Persist `thread_id` from JSONL events when available.
- Resume by explicit session/thread id when available, not only `--last`.
- Mark sessions `running`, `completed`, `error`, or `cancelled`.
- Add cancellation/stop path for long-running turns.
- Keep `codex app-server` as a future adapter but do not block closure on it unless current `codex exec` proves insufficient.
- Keep `danger-full-access` only for the controlled VPS harness and never for generated app public deployment.

Validation:

- Manual adapter smoke.
- `codex exec --json` smoke on a test workspace.
- Resume smoke if a session id is emitted by installed Codex.
- Secret redaction smoke.

### Commit 10: `feat(builder): make preview lifecycle durable`

Scope:

- Replace purely in-memory preview state with DB-backed `preview_processes` updates.
- Track port, pid, status, started/stopped timestamps, and log path.
- Detect stale/crashed preview when process is gone or port is closed.
- Add restart action.
- Update iframe chrome to show the real preview URL or user-friendly state.
- Prefer an authenticated preview proxy route for deployed builder use; direct local URL is acceptable for local smoke.

Validation:

- Start preview after generated app exists.
- Stop preview.
- Restart preview.
- Crash/kill preview process and confirm UI marks stale/crashed.
- Screenshot studio with preview open.

### Commit 11: `feat(builder): route Webknife artifacts through review trail`

Scope:

- Keep Webknife execution server-side.
- Record screenshot run status, artifact path, stdout/stderr paths, and summary.
- Add review trail UI for latest screenshots and Webknife results.
- Store large screenshots/artifacts in filesystem or Tigris and only pointers in Supabase.
- Avoid making non-technical users read Webknife or command jargon.

Validation:

- Run screenshot review against a live preview.
- Confirm artifact exists.
- Confirm timeline/review trail shows plain-language result.
- Confirm no raw signed URLs or secret values appear in UI/log summaries.

### Commit 12: `feat(builder): complete object-storage artifact model`

Scope:

- Extend current reference asset flow to screenshots, large logs, generated handoff bundles, and optional media references.
- Keep browser-direct reference uploads via presigned PUT/GET/DELETE.
- Keep server-side generation/upload for server-created artifacts when browser direct upload is not relevant.
- Ensure DB rows store bucket, key, purpose, content type, size, summary, and owner/project only.
- Add lifecycle smoke for reference assets and at least one server-created artifact.

Validation:

- `npm --prefix apps/builder run storage:cors:check`
- Browser-direct reference lifecycle smoke.
- Server-created artifact pointer smoke.
- Post-delete read failure for deleted reference objects.

### Commit 13: `ui(builder): final dashboard and studio product polish`

Scope:

- Remove remaining explanatory implementation copy from user-facing screens.
- Keep dashboard language about what users can build, not the tech stack.
- Keep create route one-field.
- Make studio preview dominant by default.
- Make controls collapsible and advanced JSON collapsed by default.
- Keep moodboard-aligned visual tone: warm ivory, deep ink, restrained coral, teal accents, low radii, crisp editorial panels.
- Ensure responsive behavior works on laptop and tablet widths.

Validation:

- Screenshot `/login`.
- Screenshot `/`.
- Screenshot `/projects/new`.
- Screenshot `/projects/demo`.
- Screenshot a real `/projects/:id`.
- Compare against `apps/builder/design/moodboards`.
- Fix UI until screenshots are acceptable.

### Commit 14: `test(builder): add end-to-end internal builder dogfood smoke`

Scope:

- Add a gated smoke that exercises: login, create project, save spec chunk, compose, validate, plan, generate, install/check/build, start preview, Webknife screenshot, attach reference, open reference, delete reference, commit status.
- Keep cloud-dependent pieces gated by env keys.
- Make failures precise: auth failed, schema missing, CORS missing, tool missing, generate failed, build failed, preview failed.
- Ensure tests do not require deploying generated apps.

Validation:

- `npm --prefix apps/builder run test:smoke`
- Dedicated lifecycle smoke script if Playwright alone is too clumsy.

### Commit 15: `ops(builder): prepare internal deployment on stylyf.com`

Scope:

- Add builder deployment notes to `apps/builder/README.md`.
- Configure systemd/Caddy deployment for `apps/builder` as the auth-gated internal app.
- Keep generated app deployment out of the builder.
- Keep preview servers bound to `127.0.0.1`.
- If a preview proxy is implemented, require authenticated builder access.
- Confirm no builder secrets are exposed in generated public assets.

Validation:

- `npm --prefix apps/builder run build`
- systemd service starts.
- `curl` local health/readiness if added.
- `https://stylyf.com/login` loads.
- Authenticated dashboard and studio smoke on deployed domain.

### Commit 16: `docs(builder): finalize handoff and known follow-ups`

Scope:

- Update [apps/builder/README.md](/root/stylyf/apps/builder/README.md) with final operating model, env keys, Supabase setup, Tigris CORS, validation, deployment, and incident/debug paths.
- Update [ISSUES.md](/root/stylyf/ISSUES.md) with any new Stylyf CLI/source learnings discovered while closing the builder.
- Remove obsolete temporary notes.
- Keep only durable docs.

Validation:

- Read docs as a cold-start operator.
- Confirm every documented command exists.
- `git status --short`

## Explicit Non-Goals

- Do not expose generated-app deployment to non-technical users in this pass.
- Do not optimize for multi-tenant Codex accounts yet.
- Do not make `apps/builder` a generic SaaS template.
- Do not store variable-sized blobs, screenshots, or media in Postgres.
- Do not make generated apps depend on this repo at runtime.
- Do not let app-builder UI force non-technical users to edit raw JSON for normal usage.

## Risk Register

- Codex session continuity may be weaker than product expectations if installed CLI does not emit or accept stable session ids in the way we need.
- Long-running Codex work inside server actions may time out or block UX; a queue/background worker may be needed before deployment.
- Browser-direct Tigris uploads are architecturally correct but still depend on exact bucket CORS.
- Supabase RLS policy bugs can make local smokes pass with service-role operations while user-scoped UI fails.
- Preview process state is currently server-process-local and must be made durable enough for restart/redeploy.
- Webknife artifacts can become large; the closure pass must move large artifacts to filesystem/Tigris pointers rather than Postgres text/blob fields.
- GitHub repo creation/push relies on authenticated `gh`; tool checks must fail clearly when auth is missing.

## Current Plan Source Of Truth

This file supersedes:

- `V1_1_INTERNAL_BUILDER_PLAN.md`
- `APP_BUILDER_REVAMP_PLAN.md`
- `APP_BUILDER_UI_OVERHAUL_PLAN.md`
- `APP_BUILDER_VISUAL_INTENT.md`

