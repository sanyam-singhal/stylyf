# Stylyf Dogfood Issues

This file tracks issues discovered while dogfooding Stylyf against real app work. The goal is to preserve scaffold-level defects and product gaps so they can be fixed in the CLI/source layer instead of being forgotten as one-off generated app patches.

## 2026-04-27: Builder Baseline Generation

### Generated Supabase env check includes Better Auth-only comparison

- **Context:** `apps/builder` was generated from a hosted Supabase Stylyf spec.
- **Symptom:** `npm run builder:check` failed in `apps/builder/src/lib/env.check.ts` with TS2367 because the generated `requiredEnv` union could never equal `"BETTER_AUTH_URL"`.
- **Local fix:** Removed the Better Auth-only URL guard from the generated builder app.
- **Likely source fix:** Update the CLI env-check generator so Better Auth-only env names are only emitted or compared when `app.auth.provider === "better-auth"`.
- **Status:** Locally patched in generated builder app. CLI generator still needs hardening.

### Generated empty workflow definitions narrow to `never`

- **Context:** `apps/builder` has resources but no workflows.
- **Symptom:** `npm run builder:check` failed in `apps/builder/src/lib/resources.ts` because `workflowDefinitions` was emitted as `[] as const`, causing `workflow.name` access inside `Object.fromEntries(workflowDefinitions.map(...))` to narrow to `never`.
- **Local fix:** Added an explicit `WorkflowDefinition` type and emitted `workflowDefinitions` as `readonly WorkflowDefinition[]`.
- **Likely source fix:** Update the CLI resource generator to type empty generated definition arrays when downstream helper code maps over them.
- **Status:** Locally patched in generated builder app. CLI generator still needs hardening.

### Generated resource field names use camelCase while planned database schema prefers snake_case

- **Context:** The builder spec used fields such as `workspacePath`, `previewUrl`, `githubRepoFullName`, and `lastPushedSha`.
- **Symptom:** The generated Supabase app code reads and writes those exact camelCase property names, while the hand-authored v1.1 builder schema initially used snake_case columns from the planning document.
- **Local fix:** Kept the builder SQL compatible with generated app code by quoting the camelCase project columns for now.
- **Likely source fix:** Decide and document the canonical database column naming convention for Stylyf specs, then teach the generator to map app/form field names to database column names explicitly.
- **Status:** Locally aligned in builder SQL. CLI generator still needs a clear naming policy.

### Generated project-scoped timeline resource appears as standalone CRUD

- **Context:** The builder baseline includes `agent_events` as a resource because the early spec requested timeline storage.
- **Symptom:** The generic scaffold exposes standalone `agent_events` list/create/edit routes, but the real builder model needs events scoped under projects and sessions.
- **Local fix:** None yet. The v1.1 follow-up UI/core commits should replace this scaffold surface with project-scoped timeline modules.
- **Likely source fix:** Add richer IR affordances for project-scoped child resources and route nesting, or make generator defaults more conservative for internal timeline/log resources.
- **Status:** Known product/scaffold gap for upcoming builder refinement.

### Generated hosted media path stores derived object URLs instead of presigned-read-only pointers

- **Context:** The builder uses Tigris as the S3-compatible object store. Supabase should store only asset pointers and compact metadata.
- **Symptom:** The generic scaffold generated an `object_url` column and filled it during attachment confirmation, implying direct URL reads instead of explicit presigned GET flows.
- **Local fix:** Removed `object_url` from the builder schema, added explicit `storage_provider` and `bucket_name` pointer columns, kept `object_key`, and added a presigned download endpoint.
- **Likely source fix:** Update the CLI hosted media generator so private object storage never emits public/derived object URL persistence. Generate presigned PUT/GET/DELETE flows by default.
- **Status:** Locally patched in builder schema and attachment server code. CLI generator still needs hardening.

### Generated hosted media metadata allows arbitrary JSON in Postgres

- **Context:** Media assets may have arbitrary metadata, but the database should not become a sink for variable-sized blobs or large structured payloads.
- **Symptom:** The generic scaffold emitted `metadata jsonb` on asset tables and accepted metadata JSON through attachment APIs.
- **Local fix:** Replaced asset `metadata jsonb` with `metadata_path text` in the builder schema and stopped persisting attachment metadata JSON in the server path.
- **Likely source fix:** Add a Stylyf media rule: Postgres stores only scalar pointers, statuses, ownership, and compact text summaries; large metadata/artifacts go to object storage and are referenced by key/path.
- **Status:** Locally patched in builder schema and attachment server code. CLI generator still needs hardening.

### Generated env contract requires generic S3 names even when provider-native AWS-compatible keys are configured

- **Context:** The repo root `.env` uses Tigris/AWS SDK-compatible keys: `AWS_S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_ENDPOINT_URL_S3`, and `AWS_REGION`.
- **Symptom:** The generated builder env contract required `S3_BUCKET`, even though the storage adapter already supported `AWS_S3_BUCKET` at runtime. This would make env preflight fail despite a valid Tigris configuration.
- **Local fix:** Made `S3_BUCKET` optional, required either the AWS-compatible or generic S3 key names in env preflight, and updated examples to prefer Tigris/AWS-compatible names.
- **Likely source fix:** Update the CLI env generator so hosted media scaffolds model provider-compatible env aliases as an either/or contract, not duplicated hard requirements.
- **Status:** Locally patched in generated builder app. CLI generator still needs hardening.

### Generated Supabase browser env assumes `VITE_` aliases even when server keys are present

- **Context:** The repo root `.env` contains `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`, but not `VITE_SUPABASE_URL` or `VITE_SUPABASE_PUBLISHABLE_KEY`.
- **Symptom:** The generated browser Supabase env module required only `VITE_` names, so the scaffold could fail even though the needed publishable Supabase values were configured under the server/public names.
- **Local fix:** Added fallback support for `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` in the generated builder public env module and env preflight.
- **Likely source fix:** Update the CLI env generator to either emit both aliases into generated env examples or generate a safe fallback path for publishable Supabase values.
- **Status:** Locally patched in generated builder app. CLI generator still needs hardening.

### Generated app env loader only reads app-local env files in monorepo dogfood

- **Context:** The builder app lives at `apps/builder`, while real Supabase/Tigris smoke-test values are configured in the repo root `.env`.
- **Symptom:** Running `npm --prefix apps/builder run env:check` failed every required env check because the generated loader only read `apps/builder/.env.local` and `apps/builder/.env`.
- **Local fix:** Added `../../.env` as a fallback env-file candidate in the generated builder server env and env-check modules.
- **Likely source fix:** Make generated app env loading configurable or document/apply monorepo-root env fallback when Stylyf dogfoods generated apps inside a workspace.
- **Status:** Locally patched in generated builder app. CLI generator still needs hardening.

### Generated local env contract requires `APP_BASE_URL` even for local smoke tests

- **Context:** The builder app uses `APP_BASE_URL` for auth callback URLs, but local smoke testing can safely use `http://localhost:3000`.
- **Symptom:** After loading the repo-root `.env`, env preflight still failed only on missing `APP_BASE_URL`.
- **Local fix:** Defaulted `APP_BASE_URL` to `http://localhost:3000` in the generated builder server env and env-check path when absent.
- **Likely source fix:** Emit a safe development default for `APP_BASE_URL` in generated apps while still requiring an explicit production value.
- **Status:** Locally patched in generated builder app. CLI generator still needs hardening.

### One-off smoke scripts run outside generated app context cannot resolve generated dependencies

- **Context:** Supabase auth/DB smoke testing was first attempted from `/tmp` using a one-off Node script.
- **Symptom:** Node could not resolve `@supabase/supabase-js` because module resolution started outside the generated app workspace.
- **Local fix:** Ran the same smoke from `apps/builder`, where the generated app dependencies are installed and resolvable.
- **Likely source fix:** Generated smoke tooling should always live in or execute from the generated app root, and CLI docs should avoid examples that run app-dependent checks from arbitrary temp directories.
- **Status:** Smoke passed when executed from the generated app context. CLI validation guidance still needs hardening.

### Workspace package-local `node_modules` was not ignored

- **Context:** Adding `packages/stylyf-builder-core` and running `npm install` created a package-local `node_modules` directory.
- **Symptom:** Root `.gitignore` ignored `apps/*/node_modules` and root `node_modules`, but not `packages/*/node_modules`, making it possible to accidentally stage package-local dependency folders.
- **Local fix:** Added `packages/*/node_modules` to `.gitignore` and removed the staged/tracked package-local dependency tree in a follow-up commit.
- **Likely source fix:** Keep monorepo ignore rules symmetric for all workspace directories before adding new workspaces.
- **Status:** Repository hygiene fixed.

### Builder production build can overwrite public Supabase env without Vite aliases

- **Context:** `apps/builder` needs publishable Supabase values in browser-facing code, while the repo root `.env` stores them as `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`.
- **Symptom:** A plain production build without exporting `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` produced server output that crashed on start with `Missing required public env`.
- **Local fix:** Added server-runtime fallback from `process.env` in `env.public.ts`, documented the deployment build exports, and rebuilt the live service with explicit `VITE_` aliases.
- **Likely source fix:** Update the CLI hosted Supabase generator so generated apps either emit public aliases into `.env` examples or safely bridge publishable server/public names during production builds.
- **Status:** Builder app locally hardened and deployment docs updated. CLI generator still needs hardening.

### Generated internal app forms expose operator-unfriendly implementation fields

- **Context:** The internal builder is intended for non-technical team members who should describe the app they want, not manage scaffold internals.
- **Symptom:** The generated `projects` create form asked for `slug`, `status`, workspace path, preview URL, GitHub repo name, and last pushed SHA. These fields are implementation state and make the first-run authoring experience feel like CRUD administration instead of an AI app builder.
- **Local fix:** Partial worktree pass started to simplify create-project intake toward project name plus plain-English brief, derive slugs/status server-side, and keep implementation fields out of the create flow.
- **Likely source fix:** Add IR/generator rules for audience-friendly create forms: user-authored product intent fields should be visible; system-owned lifecycle fields should be derived, hidden, or edit-only/admin-only.
- **Status:** Planning required before committing the UI rewrite.

### Generated builder shell reads as a generic scaffold, not an AI workbench

- **Context:** Stylyf-generated primitives are visually competent in isolation, but an internal app-builder control plane needs a stronger product metaphor and page hierarchy.
- **Symptom:** Webknife screenshots of `/login` and the post-login dashboard showed generic boxed headers, a plain sidebar, weak hierarchy, and empty states that do not communicate a Lovable/Bolt/v0-style authoring loop.
- **Local fix:** Partial worktree pass started on a darker command rail, richer auth panel, builder cockpit cards, and stronger page hierarchy.
- **Likely source fix:** Add higher-level app-builder/dashboard shell presets and guidance so generated apps can compose primitives into product-grade control planes instead of literal CRUD surfaces.
- **Status:** Planning required before committing the UI rewrite.

### Authenticated Webknife smoke depends on valid provisioned Supabase credentials

- **Context:** During the v1.1 builder revamp, login screenshots succeeded but the authenticated dashboard screenshot pass could not complete with the locally available test credential assumptions.
- **Symptom:** Supabase returned `Authentication failed: Bad Request`, so Webknife could not reach the dashboard/workbench routes through the normal login flow.
- **Local fix:** Recorded the failure honestly and kept unauthenticated login screenshots as the visual checkpoint for this pass.
- **Likely source fix:** Builder smoke tooling should have an explicit test-user contract and a safe credential-loading path that validates auth before starting screenshot tours.
- **Status:** Needs a valid Supabase test user before authenticated screenshot assertions can be trusted.

### Builder reference upload must fail before DB writes when storage bucket config is invalid

- **Context:** The active builder studio now uploads reference assets through a presigned Tigris/S3 PUT and then confirms a Postgres pointer.
- **Symptom:** A browser smoke upload reached the presigned PUT but storage returned `NoSuchBucket`, while the first implementation had already created a pending DB asset row during upload-intent creation.
- **Local fix:** Added S3 bucket-name validation before presigning or inserting upload rows, and made the UI surface storage upload status instead of a generic failure.
- **Likely source fix:** Hosted media scaffolds should validate object-storage env shape before creating asset pointer rows, and generated upload UIs should report storage-step failures distinctly from app/API failures.
- **Status:** Locally hardened in the builder app. CLI hosted-media generator should absorb the same validation rule.

### Browser presigned uploads require explicit bucket CORS

- **Context:** After correcting the Tigris bucket name, the builder generated a valid presigned PUT URL for the configured bucket endpoint.
- **Symptom:** Browser upload smoke failed at preflight from `http://127.0.0.1:3000` because the Tigris bucket did not return `Access-Control-Allow-Origin`.
- **Local fix:** Added repeatable `storage:cors:check` and `storage:cors:apply` scripts, documented the required exact-origin bucket CORS rule, and validated the full browser upload path after the bucket returned an effective S3 CORS rule.
- **CLI source issue:** The generated media/handoff context currently explains presigned uploads but does not explicitly tell the operator that browser-direct uploads require bucket CORS on the S3/Tigris bucket. A fresh agent can correctly generate server-side presign routes and still fail runtime upload smoke because the object-store origin policy is missing.
- **CLI remedy:** In a later CLI-focused pass, update hosted-media docs, `stylyf intro --topic media`, and generated `SECURITY_NOTES.md`/`LOCAL_SMOKE.md`/handoff text to state that the server signs URLs while browser bytes go directly to object storage. Include the minimum bucket CORS rule: allow the exact local/deployed app origins, methods `PUT`, `GET`, and `HEAD`, request headers `content-type` and `x-amz-*`, and expose `ETag`. Do not add compatibility bloat or server-mediated upload fallbacks.
- **Status:** Resolved for the builder app. Browser smoke confirmed direct upload and confirmation with `Attached stylyf-builder-cors-final.txt.`

### Object storage lifecycle must validate PUT, list, GET, and delete, not just upload confirmation

- **Context:** The builder storage path is intentionally presigned and browser-direct: the server signs object URLs, the browser sends/receives bytes with Tigris, and Postgres stores scalar pointers.
- **Symptom:** Initial smoke validation only covered upload intent, direct `PUT`, and DB confirmation. It did not prove presigned read or delete semantics.
- **Local fix:** Added owned reference listing, presigned download URL creation, and reference deletion endpoints. The studio now lists attached reference pointers and exposes open/delete actions without exposing raw storage credentials.
- **Validation:** Full lifecycle smoke passed: presigned `PUT` returned `200`, API list returned `200`, presigned `GET` returned `200` with payload match, delete returned `200`, and the old presigned `GET` returned `404` after deletion.
- **CLI source issue:** Hosted media scaffolds should be validated against the entire object lifecycle, not only upload confirmation.
- **CLI remedy:** In a later CLI-focused pass, make generated media smoke/handoff expectations cover create intent -> browser direct PUT -> confirm pointer -> list pointer -> presigned GET -> delete object/pointer -> post-delete read failure.
- **Status:** Resolved for the builder app; pending CLI generator hardening.

### Attachment listing must not import server-only storage modules into client routes

- **Context:** The studio route needed to show attached references after upload.
- **Symptom:** Importing the attachment server module into the route pulled server-only env/S3 code toward the client build. `npm --prefix apps/builder run build` failed when Vite tried to externalize `node:fs` from `env.server.ts`.
- **Local fix:** Kept attachment storage/auth operations behind API routes and made the client fetch `/api/attachments/list` instead of importing the attachment server module. Production build now passes.
- **CLI source issue:** Generated apps with media routes can accidentally cross server/client boundaries if UI pages import storage-capable server modules directly.
- **CLI remedy:** In a later CLI-focused pass, generated browser routes should call API/server actions through explicit route boundaries for media lifecycle operations. Server modules that import AWS SDK, storage env, or filesystem env loaders must not be imported into client-compiled route code.
- **Status:** Resolved for the builder app; pending CLI generator hardening.

### Generated app script advertised env check without emitting the checker

- **Context:** The builder app `package.json` included `env:check` and `preflight` scripts.
- **Symptom:** Running `npm --prefix apps/builder run env:check` failed because `src/lib/env.check.ts` was not present.
- **Local fix:** Added a builder env checker that loads app-local and repo-root env files, validates required key names, validates bucket naming shape, and never prints secret values.
- **Likely source fix:** Stylyf CLI generation should either emit every script target it advertises or omit the script. Preflight scripts need to be part of scaffold verification.
- **Status:** Locally fixed in the builder app. CLI generator should be checked for the same missing-file class.

### Real builder project routes must fail fast on Supabase schema drift

- **Context:** The demo studio route worked, but the full dogfood smoke created a real project and then hit a SolidStart `Unknown error` overlay on `/projects/:id`.
- **Symptom:** The hosted Supabase project was behind the current builder SQL. `agent_events.role` was missing and `build_runs` was absent, so real project timeline/build queries failed while demo routes still looked healthy.
- **Local fix:** Added `npm --prefix apps/builder run schema:check`, wired it into `preflight` and `test:dogfood`, and made `schema.sql` idempotently add the newer `agent_events` columns to older tables.
- **Likely source fix:** Generated hosted Supabase apps should include a schema-contract check that validates required table/column presence before running browser dogfood tests. Demo routes must not be treated as proof that real authenticated resources are healthy.
- **Status:** Builder app now fails with a precise schema message. Apply `apps/builder/supabase/schema.sql` and `apps/builder/supabase/policies.sql` before rerunning the full dogfood lifecycle.
