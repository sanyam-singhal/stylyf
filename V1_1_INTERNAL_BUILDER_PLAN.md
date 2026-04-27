# Stylyf v1.1 Internal App Factory Plan

## Goal

Stylyf v1.1 turns `stylyf.com` from a public landing page into an auth-gated internal AI app factory for non-technical Depths AI team members.

The product is not a no-code editor. It is a controlled agentic workbench:

- non-technical users describe and refine small apps through a friendly GUI
- Stylyf IR remains the explicit operating layer
- a single controlled Codex harness on the VPS provides the coding runtime
- `@depths/stylyf-cli` provides deterministic scaffolding
- `@depths/webknife` provides screenshot, interaction, runtime-signal, and UI-review feedback
- generated apps remain ordinary standalone SolidStart source trees
- generated apps are tracked in private GitHub repositories under the Depths AI organization
- every accepted builder iteration ends with a visible git commit followed by an automatic push

The internal builder should dogfood Stylyf itself. The first implementation target is an internal SolidStart app generated from Stylyf, then hand-refined inside this monorepo.

The builder does not deploy generated apps. It produces reviewed, reproducible, git-tracked app repositories. Deployment remains a manual dev-team responsibility after review, because each generated app may deserve a different deployment strategy.

## Current Codebase Seams

- `packages/stylyf-cli` is the primary product and already exposes the needed primitives:
  - `stylyf intro` for cold-start agent context
  - `stylyf search` and `stylyf serve-search` for capability lookup
  - `stylyf new`, `compose`, `validate`, `plan`, and `generate` for spec-driven app generation
  - v1.0 spec support for app kind, backend mode, media, resources, flows, surfaces, routes, APIs, server modules, env extras, fixtures, navigation, and deployment metadata
- `packages/stylyf-source` is the source-owned UI/styling grammar and should stay the upstream source for copied UI inventory.
- `apps/landing` is currently the deployed SolidStart app. For v1.1, either replace it with `apps/builder` on `stylyf.com` or convert it into the internal builder once the generated baseline is proven.
- Generated apps currently run their own `npm install`, `check`, `build`, Playwright smoke tests, typed env contracts, and backend scaffolds.
- Root validation today is:
  - `npm run cli:build`
  - `npm run cli:verify-pack`
  - `npm run build`
  - `npm run check`

## External Technical Grounding

- OpenAI Codex App Server exposes Codex through JSON-RPC, including threads, turns, events, approvals, filesystem/tool activity, stdio transport, and an experimental websocket transport. The v1.1 builder should target this seam rather than scrape terminal output long-term.
- OpenAI describes the Codex harness as reusable infrastructure behind IDE/app surfaces: sandboxed command execution, file edits, approvals, model discovery, and ChatGPT/API-key auth flows.
- OpenCode by SST validates the shape we want: a server-first agent core, SDK-controlled sessions, permissions, web UI, tools, and multiple clients over one coding runtime.
- OpenCode also validates the need to separate agent runtime, server API, UI client, workspace state, permission handling, and git/process activity instead of treating the GUI as a terminal wrapper.
- Supabase is the right internal metadata substrate for v1.1 because it gives us auth, Postgres tables, RLS, service-role server access, and straightforward SolidStart SSR integration.
- Webknife is the right visual QA substrate because it emits deterministic artifacts under `.webknife/`: screenshots, scripted interaction traces, console errors, page errors, request failures, typecheck/lint/test outputs, a11y/perf audits, and UI review reports.

Primary references:

- Codex App Server: https://developers.openai.com/codex/app-server
- Codex harness overview: https://openai.com/index/unlocking-the-codex-harness/
- OpenCode SDK: https://opencode.ai/docs/sdk/
- OpenCode web mode: https://opencode.ai/docs/web/
- OpenCode permissions/tools: https://opencode.ai/docs/agents/ and https://opencode.ai/docs/tools
- Supabase SSR auth: https://supabase.com/docs/guides/auth/server-side
- Supabase JavaScript client: https://supabase.com/docs/reference/javascript/introduction
- Webknife npm package: https://www.npmjs.com/package/@depths/webknife

## Product Shape

The internal app should optimize for non-technical users. Technical users can keep using VS Code and Codex CLI directly.

The main screen should be a project workbench:

- left: friendly chat and guidance
- center/right: iframe preview of the generated app
- lower/right rail: activity timeline, command logs, screenshots, and approvals
- optional panes: Brief, Style, IA/Routes, Surfaces, Data/API, IR, Files, Settings

Every GUI pane should write explicit Stylyf IR or explicit project metadata. No hidden builder state should be required to reproduce a project.

## Operating Model

The builder is an internal GUI over a controlled agentic development loop:

1. A team member creates a project from a brief.
2. The builder turns the brief and pane state into explicit Stylyf IR.
3. Stylyf validates, plans, and generates or updates a standalone SolidStart app.
4. Codex runs inside the project workspace through the server-side harness and refines the app.
5. Webknife inspects the local preview through screenshots, interaction traces, console errors, page errors, and UI review output.
6. The builder runs typecheck/build/smoke checks and records logs.
7. If the iteration is accepted, the builder creates a git commit and immediately pushes it to the project's GitHub repository.
8. A dev team member reviews the repository and decides the deployment strategy manually.

The Codex harness is intentionally server-controlled. For v1.1, the VPS uses one dedicated Depths AI ChatGPT/Codex subscription login. Supabase users are builder operators, not separate Codex identities. Per-user Codex subscriptions can be explored later only if we need strict per-user model-account attribution.

## Architecture

### Apps

- `apps/builder`: the new auth-gated internal app factory.
- `apps/landing`: keep temporarily as the old public landing source unless we explicitly remove it later.

### Packages

- `packages/stylyf-cli`: unchanged as the deterministic scaffolding engine.
- `packages/stylyf-source`: unchanged as the source-owned UI inventory.
- `packages/stylyf-builder-core`: new internal package for workspace/session/process orchestration.
- `packages/stylyf-builder-db`: optional new internal package for Supabase typed DB helpers and SQL schema ownership. This can be folded into `apps/builder/src/lib/server` if the first pass benefits from fewer packages.

### Runtime Services On One VPS

- SolidStart builder app server.
- Builder worker process or in-process server actions with a strict job queue.
- Per-project generated app dev servers on allocated localhost ports.
- Codex App Server sessions launched per project/session through the single server-side Codex login.
- Webknife runs against project preview URLs and writes artifacts into the project workspace.
- GitHub repository orchestration for private Depths AI org repos.

### Directory Layout On VPS

```txt
/var/lib/stylyf-builder/
  workspaces/
    <projectId>/
      app/
      specs/
      logs/
      screenshots/
      .webknife/
      metadata.json
      handoff.md
      repo.json
  tmp/
  locks/
```

Development can use `.stylyf-builder/` in the repo root, but deployment should use `/var/lib/stylyf-builder`.

### Supabase Tables

Minimum metadata schema:

- `profiles`
  - `id uuid primary key references auth.users(id)`
  - `email text`
  - `display_name text`
  - `role text check in ('admin','builder','viewer')`
  - timestamps
- `projects`
  - `id uuid primary key`
  - `owner_id uuid references profiles(id)`
  - `name text`
  - `slug text unique`
  - `status text check in ('draft','generating','ready','error','archived')`
  - `workspace_path text`
  - `preview_port int`
  - `preview_url text`
  - `github_repo_full_name text`
  - `github_default_branch text default 'main'`
  - `last_pushed_sha text`
  - timestamps
- `project_members`
  - `project_id uuid references projects(id)`
  - `user_id uuid references profiles(id)`
  - `role text check in ('owner','editor','viewer')`
- `briefs`
  - `project_id uuid references projects(id)`
  - `content jsonb`
  - `version int`
- `stylyf_specs`
  - `project_id uuid references projects(id)`
  - `kind text`
  - `spec jsonb`
  - `version int`
  - `is_active boolean`
- `agent_sessions`
  - `project_id uuid references projects(id)`
  - `provider text`
  - `thread_id text`
  - `status text`
  - timestamps
- `agent_events`
  - `project_id uuid references projects(id)`
  - `session_id uuid references agent_sessions(id)`
  - `type text`
  - `payload jsonb`
  - `created_at timestamptz`
- `commands`
  - `project_id uuid references projects(id)`
  - `session_id uuid`
  - `command text`
  - `cwd text`
  - `status text`
  - `exit_code int`
  - `stdout_path text`
  - `stderr_path text`
  - timestamps
- `git_events`
  - `project_id uuid references projects(id)`
  - `kind text check in ('repo_created','commit_created','push_completed','push_failed','handoff_ready')`
  - `repo_full_name text`
  - `branch text`
  - `commit_sha text`
  - `summary text`
  - `payload jsonb`
  - timestamps
- `previews`
  - `project_id uuid references projects(id)`
  - `port int`
  - `pid int`
  - `status text`
  - timestamps
- `webknife_runs`
  - `project_id uuid references projects(id)`
  - `kind text`
  - `artifact_path text`
  - `summary jsonb`
  - timestamps
- `approvals`
  - `project_id uuid references projects(id)`
  - `type text`
  - `requested_by text`
  - `payload jsonb`
  - `status text check in ('pending','approved','denied','expired')`
  - timestamps

Use Supabase Auth for the builder app itself. The first version can rely on manual onboarding in the Supabase dashboard and email/password login.

## Security Model

This is internal-only, single-server, single Codex login, but should still be strict.

- One workspace per project.
- One process group per project preview.
- Preview servers bind to `127.0.0.1`; Caddy reverse proxies authenticated preview paths or per-project subpaths.
- All shell commands run through an allowlisted command runner.
- Default allowlist:
  - `stylyf`
  - `npm install`
  - `npm run check`
  - `npm run build`
  - `npm run dev`
  - `npm run test:smoke`
  - `npx webknife ...`
  - `git status`, `git diff`, `git add`, `git commit`, `git push`
- Human approval required for:
  - dependency changes after initial generation
  - env writes
  - DB migration execution
  - network-facing preview exposure
  - destructive workspace cleanup
- GitHub repository creation and pushes should use a narrow server-side GitHub token or GitHub App installation scoped to Depths AI repositories.
- A successful accepted iteration must create a local commit and push it immediately. The app must never accumulate unpushed accepted changes.
- Generated app deployment must not be exposed as a non-technical user action in v1.1.
- Logs must redact environment variable values and known token patterns.
- The builder app must never expose raw `.env` values in UI or agent transcripts.
- Per-project env values should be encrypted at rest or only stored in server-local files with `0600` permissions for v1.1.

## Commit-By-Commit Implementation Plan

### Commit 1: `docs: plan stylyf internal builder v1.1`

- Add this plan.
- Do not change runtime code yet.
- Validate no accidental secret reads or `.env` leakage.

### Commit 2: `build: add internal builder workspace app`

- Dogfood the published/local Stylyf CLI to generate an `internal-tool` hosted Supabase app baseline.
- Target `apps/builder`.
- Use `backend.mode: "hosted"`, `media.mode: "basic"` initially.
- App intent: "auth-gated internal app factory for generating and iterating SolidStart apps through Stylyf and Codex."
- Keep generated code ordinary and editable.
- Update root workspace scripts:
  - `builder:dev`
  - `builder:check`
  - `builder:build`
  - `builder:start`
- Keep `apps/landing` untouched in this commit.
- Validate:
  - `npm --prefix apps/builder run check`
  - `npm --prefix apps/builder run build`

### Commit 3: `db: add supabase metadata schema for builder`

- Add builder-owned Supabase SQL files under `apps/builder/supabase/`.
- Tables:
  - profiles
  - projects
  - project_members
  - briefs
  - stylyf_specs
  - agent_sessions
  - agent_events
  - commands
  - previews
  - webknife_runs
  - approvals
- Add conservative RLS:
  - authenticated users can read their own profile
  - project members can read project metadata
  - only owner/editor can mutate project-facing records
  - service role performs worker mutations
- Add seed/example SQL comments for manual Supabase setup.
- Validate:
  - SQL syntax review
  - generated TS typecheck

### Commit 4: `auth: gate builder app with supabase`

- Wire Supabase SSR auth into `apps/builder`.
- Add login/logout screens.
- Add middleware route protection.
- Add user profile bootstrap on first login.
- Add role-aware access checks for admin/builder/viewer.
- Do not yet expose project workspaces.
- Validate:
  - `npm --prefix apps/builder run check`
  - manual local auth route smoke if env is available

### Commit 5: `core: add workspace and process orchestration package`

- Add `packages/stylyf-builder-core`.
- Implement:
  - workspace path resolver
  - safe slug/project directory creation
  - port allocator
  - process registry
  - command runner with allowlist
  - log writer
  - env redactor
  - process kill/restart helpers
- Export pure server-side APIs only.
- No browser imports.
- Validate:
  - `npm --prefix packages/stylyf-builder-core run check`
  - small node smoke script for workspace creation and redaction

### Commit 6: `projects: add builder project dashboard`

- Add project list/create/detail UI in `apps/builder`.
- Store metadata in Supabase.
- Project creation creates:
  - DB project row
  - workspace directory
  - initial brief JSON
- GUI panes:
  - Brief
  - Style
  - Routes/IA
  - Data/API
  - IR
- These panes can be simple forms and JSON editors in v1.1.
- Validate:
  - app check/build
  - project create server action smoke with local mock if Supabase env is absent

### Commit 7: `stylyf: integrate spec generation and validation loop`

- Add server actions for:
  - draft spec from pane state
  - write spec to workspace
  - run `stylyf validate`
  - run `stylyf plan --resolved`
  - run `stylyf generate --target workspace/app`
- Store active spec versions in `stylyf_specs`.
- Store command results in `commands`.
- Show plan output and validation errors in the UI.
- Validate:
  - generate a builder-owned dogfood project
  - run generated app `npm run check`

### Commit 8: `preview: add managed iframe previews`

- Add preview server manager:
  - run `npm run dev -- --host 127.0.0.1 --port <allocated>`
  - persist pid/port/status
  - stop/restart controls
- Add iframe preview panel in project detail.
- Add reverse proxy design notes in `DEPLOYMENT.md`.
- For local dev, use direct localhost ports.
- For deployed VPS, use authenticated app route/proxy or Caddy internal reverse proxy.
- Validate:
  - start preview for generated project
  - iframe loads locally
  - stop preview kills process group

### Commit 9: `agent: add codex app-server adapter skeleton`

- Add Codex adapter in `packages/stylyf-builder-core`.
- Target App Server JSON-RPC over stdio first.
- Model concepts:
  - start session
  - send user turn
  - stream events
  - request approval
  - attach workspace path
  - record tool/command/file events
- Add a `manual` fallback adapter for development when Codex is unavailable.
- Do not overfit to raw terminal scraping.
- Validate:
  - adapter compiles
  - mock session emits events into builder UI

### Commit 10: `agent: wire chat timeline and approval queue`

- Add chat panel to project workbench.
- Persist agent/user messages as `agent_events`.
- Add approval UI for:
  - command execution
  - file writes
  - env writes
  - dependency installs
- Initial system prompt should instruct Codex:
  - read `stylyf intro --topic operator`
  - use Stylyf IR first
  - keep changes visible
  - run checks before claiming completion
  - use Webknife for visual feedback when UI changes
- Validate:
  - mock chat loop
  - approval state transitions
  - no secrets in persisted payloads

### Commit 11: `webknife: add visual QA loop`

- Install/use `@depths/webknife` in generated/dogfood project context or builder worker context.
- Add actions:
  - screenshot current preview
  - run scripted interaction from YAML/JSON
  - collect console errors/page errors/request failures
  - run `ui:review`
- Store artifact paths and summaries in `webknife_runs`.
- Show latest screenshots and runtime signals in the project workbench.
- Validate:
  - run `webknife shot` against a generated preview
  - display screenshot artifact in builder UI
  - surface console/page errors

### Commit 12: `ir-ui: add friendly pane-to-ir editors`

- Replace raw-only JSON editing with controlled panes:
  - product brief
  - visual style
  - route map
  - surfaces
  - data objects
  - API/server modules
  - media/storage
- Each pane writes explicit JSON fragments.
- Add "show generated IR" and "copy JSON" controls.
- Add "apply chunk" using `stylyf compose`.
- Keep raw IR escape hatch.
- Validate:
  - pane state composes into a valid v1.0 spec
  - generated app still checks/builds

### Commit 13: `templates: enrich app-pattern presets for builder use`

- Extend `packages/stylyf-cli` examples/patterns without bloating runtime:
  - internal ops dashboard
  - rating/review app
  - media submission queue
  - lightweight CMS
  - public utility with saved results
- Expose these via search/intro so the builder can suggest them.
- Keep them generalized, not niche-locked.
- Validate:
  - `npm run cli:check`
  - `npm run cli:build`
  - `npm run cli:verify-pack`

### Commit 14: `telemetry: add internal event logging`

- Add minimal telemetry events:
  - project created
  - spec validated
  - generation started/completed/failed
  - preview started/stopped
  - webknife run completed
  - check/build completed
  - commit created
- Store in Supabase only.
- Do not add external telemetry.
- Add admin-only simple metrics view.
- Validate:
  - event writes through service role
  - no prompt/env secret leakage

### Commit 15: `git: add repository lifecycle and auto-push workflow`

- Add controlled git actions:
  - create private GitHub repository under the Depths AI organization
  - initialize the generated app repository
  - configure remote origin
  - status
  - diff summary
  - add selected files
  - commit
  - push immediately after every accepted commit
- Add handoff actions:
  - generate `handoff.md`
  - mark project ready for dev review
  - optionally open a GitHub issue or PR for dev review later
- GitHub PR integration is optional and approval-gated in v1.1; repository tracking and push-after-commit are mandatory.
- Never squash internal commits by default.
- Validate:
  - create a private test repository in the configured org or mock the GitHub adapter locally
  - create commit in generated workspace
  - push commit to remote
  - persist commit hash in project timeline

### Commit 16: `ops: replace stylyf.com landing with internal builder`

- Update deployment config so `stylyf.com` serves `apps/builder`.
- Keep Caddy/systemd simple:
  - builder app service
  - preview routing strategy
  - no bespoke state scripts
- Update `DEPLOYMENT.md`.
- Add environment checklist:
  - Supabase URL/anon/service role
  - workspace root
  - Codex auth expectation
  - GitHub org/repo token expectation
  - preview port range
  - allowed hostnames
- Explicitly document that this deploys only the builder control plane, not generated apps.
- Generated-app deployment remains a manual dev-team handoff after repository review.
- Validate:
  - `npm --prefix apps/builder run build`
  - systemd restart
  - auth-gated live app loads

### Commit 17: `docs: document internal operator workflow`

- Update root README to reflect:
  - CLI remains the package product
  - `apps/builder` is internal dogfood/control plane
  - generated apps remain standalone
- Add `BUILDER_OPERATIONS.md`:
  - onboarding team members
  - creating projects
  - approvals
  - preview lifecycle
  - commit and push lifecycle
  - dev review handoff
  - workspace cleanup
  - failure recovery
- Add `BUILDER_SECURITY.md`:
  - command allowlist
  - env handling
  - Supabase roles/RLS
  - preview isolation
  - Codex single-login assumption
  - GitHub token scope
  - deployment out-of-scope boundary
- Validate docs against implementation.

### Commit 18: `test: add builder end-to-end dogfood smoke`

- Add a repeatable internal smoke script:
  - create test project
  - write brief
  - draft spec
  - validate/plan/generate
  - install/check/build generated app
  - start preview
  - run Webknife screenshot
  - commit generated app
  - push generated app commit through mock or real GitHub adapter
  - write handoff summary
  - stop preview
- Keep secrets optional by supporting local/mock mode.
- Validate:
  - root `npm run check`
  - root `npm run build`
  - CLI verification
  - builder smoke script

## Initial Dogfood Spec Sketch

Use Stylyf to generate the first `apps/builder` baseline:

```json
{
  "version": "1.0",
  "app": {
    "name": "Stylyf Builder",
    "kind": "internal-tool",
    "description": "An auth-gated internal AI app factory for non-technical team members."
  },
  "backend": {
    "mode": "hosted"
  },
  "media": {
    "mode": "basic"
  },
  "experience": {
    "theme": "opal",
    "mode": "light",
    "radius": "trim",
    "density": "comfortable",
    "spacing": "balanced"
  },
  "objects": [
    {
      "name": "projects",
      "ownership": "user",
      "visibility": "private",
      "fields": [
        { "name": "name", "type": "short-text", "required": true },
        { "name": "status", "type": "status", "options": ["draft", "generating", "ready", "error", "archived"], "default": "draft" },
        { "name": "previewUrl", "type": "short-text" }
      ]
    },
    {
      "name": "agent_events",
      "ownership": "user",
      "visibility": "private",
      "fields": [
        { "name": "type", "type": "short-text", "required": true },
        { "name": "payload", "type": "json" }
      ]
    }
  ],
  "surfaces": [
    { "name": "Projects", "kind": "list", "object": "projects", "path": "/", "audience": "user" },
    { "name": "New Project", "kind": "create", "object": "projects", "path": "/projects/new", "audience": "user" },
    { "name": "Project Workbench", "kind": "detail", "object": "projects", "path": "/projects/:id", "audience": "user" },
    { "name": "Settings", "kind": "settings", "path": "/settings", "audience": "user" }
  ]
}
```

This is intentionally only the baseline. The real builder experience comes from the follow-up commits, not from pretending the first scaffold is the whole product.

## Non-Goals For v1.1

- No public multi-tenant builder.
- No billing.
- No broad provider marketplace.
- No drag/drop canvas before the IR panes are solid.
- No production deployment automation for generated apps.
- No non-technical-user deploy button.
- No hidden generated app state outside git, workspace files, and Supabase metadata.
- No reliance on undocumented Codex token extraction.
- No hidden runtime dependency from generated apps back to this monorepo.

## Release Readiness Criteria

v1.1 is ready when:

- team members can log in to `stylyf.com`
- an authenticated user can create a project
- the builder can generate a Stylyf spec from GUI pane state
- `stylyf validate`, `plan`, and `generate` run visibly
- generated app install/check/build logs are visible
- iframe preview works
- Webknife screenshot and runtime-signal capture works
- a project timeline records commands, agent events, approvals, visual runs, commits, pushes, and handoff state
- Codex adapter has a working real or mocked session path
- each accepted iteration creates a git commit and pushes it to the Depths AI project repository
- generated apps are not deployed by the builder
- the builder control-plane deployment is Caddy/systemd simple
- docs explain operations and failure recovery
