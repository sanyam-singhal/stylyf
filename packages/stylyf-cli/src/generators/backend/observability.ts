import type { AppIR } from "../../compiler/generated-app.js";

export function renderGeneratedObservabilityModule(app: AppIR) {
  return [
    `export const serviceInfo = ${JSON.stringify(
      {
        name: app.name,
        database: app.database?.provider ?? "none",
        auth: app.auth?.provider ?? "none",
        storage: app.storage?.provider ?? "none",
      },
      null,
      2,
    )} as const;`,
    "",
    "export function logInfo(event: string, data: Record<string, unknown> = {}) {",
    "  console.log(JSON.stringify({ level: \"info\", event, service: serviceInfo.name, time: new Date().toISOString(), ...data }));",
    "}",
    "",
    "export function logError(event: string, error: unknown, data: Record<string, unknown> = {}) {",
    "  const message = error instanceof Error ? error.message : String(error);",
    "  console.error(JSON.stringify({ level: \"error\", event, service: serviceInfo.name, time: new Date().toISOString(), message, ...data }));",
    "}",
    "",
  ].join("\n");
}

export function renderGeneratedHealthRoute(app: AppIR) {
  return [
    'import type { APIEvent } from "@solidjs/start/server";',
    'import { serviceInfo } from "~/lib/server/observability";',
    "",
    "export async function GET(_event: APIEvent) {",
    "  return Response.json({",
    "    ok: true,",
    "    status: \"healthy\",",
    "    service: serviceInfo.name,",
    "    dependencies: {",
    "      auth: serviceInfo.auth !== \"none\",",
    "      database: serviceInfo.database !== \"none\",",
    "      storage: serviceInfo.storage !== \"none\",",
    "    },",
    "  });",
    "}",
    "",
  ].join("\n");
}

export function renderGeneratedReadinessRoute(app: AppIR) {
  const requiredEnv = [
    "APP_BASE_URL",
    app.database?.provider === "supabase" ? "SUPABASE_URL" : app.database ? "DATABASE_URL" : "",
    app.auth?.provider === "better-auth" ? "BETTER_AUTH_SECRET" : "",
    app.storage ? "S3_BUCKET" : "",
  ].filter(Boolean);

  return [
    'import type { APIEvent } from "@solidjs/start/server";',
    'import { serviceInfo } from "~/lib/server/observability";',
    "",
    `const requiredEnv = ${JSON.stringify(requiredEnv, null, 2)} as const;`,
    "",
    "export async function GET(_event: APIEvent) {",
    "  const missing = requiredEnv.filter(name => !process.env[name]);",
    "  return Response.json(",
    "    {",
    "      ok: missing.length === 0,",
    "      status: missing.length === 0 ? \"ready\" : \"not-ready\",",
    "      service: serviceInfo.name,",
    "      dependencies: serviceInfo,",
    "      missingEnv: missing,",
    "    },",
    "    { status: missing.length === 0 ? 200 : 503 },",
    "  );",
    "}",
    "",
  ].join("\n");
}

export function renderGeneratedOperationsMarkdown(app: AppIR) {
  return [
    "# Operations",
    "",
    `Service: ${app.name}`,
    "",
    "## Health",
    "",
    "- `GET /api/health`: lightweight liveness check; does not touch external services.",
    "- `GET /api/readiness`: checks required environment presence without printing secret values.",
    "",
    "## Logging",
    "",
    "- `src/lib/server/observability.ts` emits JSON logs through `logInfo` and `logError`.",
    "- Keep request IDs, user IDs, and domain identifiers explicit in log metadata.",
    "- Never log raw auth tokens, database URLs, object-storage keys, or signed URLs.",
    "",
    "## Backend",
    "",
    `- auth: ${app.auth?.provider ?? "none"}`,
    `- database: ${app.database?.provider ?? "none"}${app.database?.dialect ? ` / ${app.database.dialect}` : ""}`,
    `- storage: ${app.storage?.provider ?? "none"}`,
    "",
  ].join("\n");
}
