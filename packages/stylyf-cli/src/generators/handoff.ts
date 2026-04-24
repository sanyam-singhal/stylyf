import type { GenerationPlan } from "../compiler/plan.js";

export function renderHandoffMarkdown(plan: GenerationPlan) {
  return [
    "# Stylyf Handoff",
    "",
    `Generated app: ${plan.app.name}`,
    `App kind: ${plan.app.kind}`,
    "",
    "## Backend",
    "",
    `- mode: ${plan.backend.mode}`,
    `- auth: ${plan.backend.auth}`,
    `- data: ${plan.backend.data}`,
    `- storage: ${plan.backend.storage}`,
    "",
    "## Generated Routes",
    "",
    ...plan.routes.map(route => `- \`${route.path}\` -> \`${route.file}\``),
    "",
    "## Generated Resources",
    "",
    ...(plan.resources.length > 0 ? plan.resources.map(resource => `- \`${resource}\``) : ["- none"]),
    "",
    "## Generated Workflows",
    "",
    ...(plan.workflows.length > 0 ? plan.workflows.map(workflow => `- \`${workflow}\``) : ["- none"]),
    "",
    "## Source Ownership",
    "",
    "This generated app is ordinary source code. It does not import this repo and does not depend on `@depths/stylyf-cli` at runtime.",
    "",
    "Keep editing the emitted app directly after generation. Treat `stylyf.spec.json` and `stylyf.plan.json` as the generation record.",
    "",
  ].join("\n");
}

export function renderSecurityNotesMarkdown(plan: GenerationPlan) {
  return [
    "# Security Notes",
    "",
    "## Defaults",
    "",
    "- secrets are read server-side through `src/lib/env.ts`",
    "- browser code only receives public/publishable values",
    "- object storage uses presigned URLs; raw bucket credentials stay server-side",
    "- generated route protection is explicit in middleware when auth-protected routes exist",
    "",
    "## Backend Mode",
    "",
    plan.backend.mode === "hosted"
      ? "- hosted mode uses Supabase Auth and Supabase SDK data access; apply `supabase/schema.sql` and `supabase/policies.sql` before production use"
      : "- portable mode uses Better Auth and Drizzle; run `npm run auth:generate` and `npm run db:generate` after dependency install",
    "",
    "## Review Before Production",
    "",
    "- tighten ownership and role policies for your domain",
    "- review generated Supabase RLS policies when using hosted mode",
    "- configure real email delivery before relying on auth email flows",
    "- use least-privilege object-storage keys",
    "",
  ].join("\n");
}

export function renderLocalSmokeMarkdown(plan: GenerationPlan) {
  const commands = ["npm install"];
  if (plan.postGenerateSteps.includes("auth:generate")) {
    commands.push("npm run auth:generate");
  }
  if (plan.postGenerateSteps.includes("db:generate")) {
    commands.push("npm run db:generate");
  }
  commands.push("npm run check", "npm run build");

  return [
    "# Local Smoke",
    "",
    "Run these commands from the generated app root:",
    "",
    "```bash",
    ...commands,
    "```",
    "",
    "Generated apps may need `.env` values before runtime auth/data flows work. Build and typecheck should still be the first smoke tests.",
    "",
  ].join("\n");
}
