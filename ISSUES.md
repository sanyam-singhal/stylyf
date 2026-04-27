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
