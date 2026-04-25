import { resolve } from "node:path";
import type { ApiRouteIR, AppIR } from "../../compiler/generated-app.js";
import { writeGeneratedFile } from "../assets.js";
import { renderApiRouteTemplate, type ApiRouteTemplateId } from "../templates.js";

function apiRouteFilePath(pathname: string) {
  const clean = pathname.replace(/^\/+|\/+$/g, "");
  return `src/routes/${clean}.ts`;
}

function effectiveRouteAuth(route: ApiRouteIR, app: AppIR) {
  if (route.auth) {
    return route.auth;
  }

  const protectedEntry = app.auth?.protect?.find(entry => entry.kind === "api" && entry.target === route.path);
  return protectedEntry?.access ?? "public";
}

function authImportBlock(route: ApiRouteIR, app: AppIR) {
  if (effectiveRouteAuth(route, app) !== "user") {
    return "";
  }

  return 'import { getSession } from "~/lib/server/guards";';
}

function authGuardBlock(route: ApiRouteIR, app: AppIR) {
  if (effectiveRouteAuth(route, app) !== "user") {
    return "";
  }

  return [
    "  const session = await getSession();",
    "  if (!session) {",
    '    return Response.json({ error: "Unauthorized" }, { status: 401 });',
    "  }",
    "",
  ].join("\n");
}

function jsonLiteral(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function renderContractHelpers(route: ApiRouteIR) {
  return [
    `const requestContract = ${jsonLiteral(route.request ?? {})} as { body?: SchemaObject; query?: SchemaObject; params?: SchemaObject; headers?: SchemaObject };`,
    `const responseContract = ${jsonLiteral(route.response ?? {})} as { status?: number; body?: SchemaObject };`,
    `const rateLimitContract: { window: "minute" | "hour" | "day"; max: number } | null = ${jsonLiteral(route.rateLimit ?? null)};`,
    `const idempotencyContract: { required?: boolean; header?: string } | null = ${jsonLiteral(route.idempotency ?? null)};`,
    "",
    "type SchemaField = {",
    '  type: "string" | "number" | "integer" | "boolean" | "json" | "uuid" | "email" | "url";',
    "  required?: boolean;",
    "  array?: boolean;",
    "  enum?: readonly string[];",
    "  min?: number;",
    "  max?: number;",
    "};",
    "",
    "type SchemaObject = Record<string, SchemaField>;",
    "",
    "function jsonOk(data: Record<string, unknown>, init?: ResponseInit) {",
    "  return Response.json({ ok: true, ...data }, init);",
    "}",
    "",
    "function jsonError(message: string, init?: ResponseInit & { issues?: string[] }) {",
    "  return Response.json({ ok: false, error: message, issues: init?.issues ?? [] }, { status: init?.status ?? 400 });",
    "}",
    "",
    "function isUuid(value: string) {",
    "  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);",
    "}",
    "",
    "function isEmail(value: string) {",
    "  return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(value);",
    "}",
    "",
    "function validateScalar(value: unknown, field: SchemaField, path: string, issues: string[]) {",
    "  if (field.enum && typeof value === \"string\" && !field.enum.includes(value)) issues.push(`${path} must be one of: ${field.enum.join(\", \")}.`);",
    "  if (field.type === \"string\" && typeof value !== \"string\") issues.push(`${path} must be a string.`);",
    "  if (field.type === \"number\" && typeof value !== \"number\") issues.push(`${path} must be a number.`);",
    "  if (field.type === \"integer\" && (!Number.isInteger(value) || typeof value !== \"number\")) issues.push(`${path} must be an integer.`);",
    "  if (field.type === \"boolean\" && typeof value !== \"boolean\") issues.push(`${path} must be a boolean.`);",
    "  if (field.type === \"uuid\" && (typeof value !== \"string\" || !isUuid(value))) issues.push(`${path} must be a UUID.`);",
    "  if (field.type === \"email\" && (typeof value !== \"string\" || !isEmail(value))) issues.push(`${path} must be an email address.`);",
    "  if (field.type === \"url\" && typeof value === \"string\") {",
    "    try { new URL(value); } catch { issues.push(`${path} must be a URL.`); }",
    "  } else if (field.type === \"url\") {",
    "    issues.push(`${path} must be a URL.`);",
    "  }",
    "  if (typeof value === \"number\" && field.min !== undefined && value < field.min) issues.push(`${path} must be at least ${field.min}.`);",
    "  if (typeof value === \"number\" && field.max !== undefined && value > field.max) issues.push(`${path} must be at most ${field.max}.`);",
    "}",
    "",
    "function validateSchema(value: unknown, schema: SchemaObject | undefined, label: string) {",
    "  const issues: string[] = [];",
    "  if (!schema) return issues;",
    "  const record = value && typeof value === \"object\" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};",
    "  for (const [name, field] of Object.entries(schema)) {",
    "    const item = record[name];",
    "    const path = `${label}.${name}`;",
    "    if ((item === undefined || item === null || item === \"\") && field.required) {",
    "      issues.push(`${path} is required.`);",
    "      continue;",
    "    }",
    "    if (item === undefined || item === null || item === \"\") continue;",
    "    if (field.array) {",
    "      if (!Array.isArray(item)) {",
    "        issues.push(`${path} must be an array.`);",
    "      } else {",
    "        item.forEach((entry, index) => validateScalar(entry, field, `${path}[${index}]`, issues));",
    "      }",
    "      continue;",
    "    }",
    "    validateScalar(item, field, path, issues);",
    "  }",
    "  return issues;",
    "}",
    "",
    "function headersObject(headers: Headers) {",
    "  return Object.fromEntries(headers.entries());",
    "}",
    "",
    "async function bodyObject(request: Request) {",
    "  if (request.method === \"GET\") return {};",
    "  return await request.json().catch(() => ({} as Record<string, unknown>));",
    "}",
    "",
  ].join("\n");
}

function renderRateLimitNote(route: ApiRouteIR) {
  if (!route.rateLimit) return "";
  return `  // Rate-limit contract: max ${route.rateLimit.max} request(s) per ${route.rateLimit.window}. Wire your chosen limiter here before public launch.\n`;
}

function renderIdempotencyGuard(route: ApiRouteIR) {
  if (!route.idempotency?.required) return "";
  const header = route.idempotency.header ?? "idempotency-key";
  return [
    `  const idempotencyKey = event.request.headers.get(${JSON.stringify(header)});`,
    "  if (!idempotencyKey) {",
    `    return jsonError("Missing idempotency key.", { status: 409, issues: [${JSON.stringify(`Header ${header} is required.`)}] });`,
    "  }",
    "  // Idempotency contract: persist and replay responses by this key in app-owned storage.",
    "",
  ].join("\n");
}

function renderContractedJsonRoute(route: ApiRouteIR, app: AppIR) {
  return [
    'import type { APIEvent } from "@solidjs/start/server";',
    authImportBlock(route, app),
    "",
    renderContractHelpers(route),
    `export async function ${route.method}(event: APIEvent) {`,
    authGuardBlock(route, app),
    renderRateLimitNote(route).trimEnd(),
    renderIdempotencyGuard(route).trimEnd(),
    "  const url = new URL(event.request.url);",
    "  const query = Object.fromEntries(url.searchParams.entries());",
    "  const body = await bodyObject(event.request);",
    "  const headers = headersObject(event.request.headers);",
    "  const issues = [",
    "    ...validateSchema(body, requestContract.body, \"body\"),",
    "    ...validateSchema(query, requestContract.query, \"query\"),",
    "    ...validateSchema(event.params, requestContract.params, \"params\"),",
    "    ...validateSchema(headers, requestContract.headers, \"headers\"),",
    "  ];",
    "  if (issues.length > 0) return jsonError(\"Invalid request.\", { status: 400, issues });",
    "",
    "  return jsonOk(",
    "    {",
    `      route: ${JSON.stringify(route.name)},`,
    `      method: ${JSON.stringify(route.method)},`,
    `      path: ${JSON.stringify(route.path)},`,
    "      params: event.params,",
    "      query,",
    "      body,",
    "      contract: responseContract,",
    "    },",
    "    { status: responseContract.status ?? 200 },",
    "  );",
    "}",
    "",
  ]
    .filter(line => line !== "")
    .join("\n");
}

function renderWebhookVerificationBlock(route: ApiRouteIR) {
  const header = route.webhook?.signatureHeader ?? "x-signature";
  const secretEnv = route.webhook?.secretEnv;

  if (!secretEnv) {
    return [
      `  const signature = event.request.headers.get(${JSON.stringify(header)});`,
      "  if (!signature && !requestContract.headers) {",
      "    return jsonError(\"Missing webhook signature.\", { status: 401 });",
      "  }",
      "  // Webhook signature contract: add provider verification here once a secret env var is configured.",
      "",
    ].join("\n");
  }

  return [
    `  const signature = event.request.headers.get(${JSON.stringify(header)});`,
    "  if (!signature) return jsonError(\"Missing webhook signature.\", { status: 401 });",
    `  if (!process.env[${JSON.stringify(secretEnv)}]) return jsonError("Webhook secret is not configured.", { status: 500 });`,
    `  return jsonError("Webhook signature verification for ${route.webhook?.provider ?? "generic"} is intentionally fail-closed. Implement provider verification before enabling this endpoint.", { status: 501 });`,
    "",
  ].join("\n");
}

function renderContractedWebhookRoute(route: ApiRouteIR, app: AppIR) {
  return [
    'import type { APIEvent } from "@solidjs/start/server";',
    authImportBlock(route, app),
    "",
    renderContractHelpers(route),
    `export async function ${route.method}(event: APIEvent) {`,
    authGuardBlock(route, app),
    renderRateLimitNote(route).trimEnd(),
    renderWebhookVerificationBlock(route).trimEnd(),
    "  const payload = await event.request.text();",
    "  const headers = headersObject(event.request.headers);",
    "  const issues = validateSchema(headers, requestContract.headers, \"headers\");",
    "  if (issues.length > 0) return jsonError(\"Invalid webhook headers.\", { status: 400, issues });",
    "",
    "  return jsonOk(",
    "    {",
    `      route: ${JSON.stringify(route.name)},`,
    `      provider: ${JSON.stringify(route.webhook?.provider ?? "generic")},`,
    "      receivedBytes: payload.length,",
    "      contract: responseContract,",
    "    },",
    "    { status: responseContract.status ?? 202 },",
    "  );",
    "}",
    "",
  ]
    .filter(line => line !== "")
    .join("\n");
}

async function renderApiRoute(route: ApiRouteIR, app: AppIR) {
  if (route.type === "json") {
    return renderContractedJsonRoute(route, app);
  }
  if (route.type === "webhook") {
    return renderContractedWebhookRoute(route, app);
  }

  return renderApiRouteTemplate(templateIdForRoute(route), {
    METHOD: route.method,
    ROUTE_NAME: route.name,
    ROUTE_PATH: route.path,
    AUTH_IMPORT: authImportBlock(route, app),
    AUTH_GUARD: authGuardBlock(route, app),
  });
}

function renderApiContracts(app: AppIR) {
  const routes = (app.apis ?? []).map(route => ({
    name: route.name,
    path: route.path,
    method: route.method,
    type: route.type,
    auth: effectiveRouteAuth(route, app),
    draft: route.draft ?? false,
    request: route.request ?? null,
    response: route.response ?? null,
    rateLimit: route.rateLimit ?? null,
    idempotency: route.idempotency ?? null,
    webhook: route.webhook ?? null,
  }));

  return `${JSON.stringify({ generatedBy: "stylyf", version: "1.0", routes }, null, 2)}\n`;
}

function templateIdForRoute(route: ApiRouteIR): ApiRouteTemplateId {
  switch (route.type) {
    case "json":
      return "json";
    case "webhook":
      return "webhook";
    case "presign-upload":
      return "presign-upload";
    default:
      return "json";
  }
}

export async function writeGeneratedApiRoutes(app: AppIR, targetPath: string) {
  let generated = 0;

  for (const route of app.apis ?? []) {
    const rendered = await renderApiRoute(route, app);

    await writeGeneratedFile(resolve(targetPath, apiRouteFilePath(route.path)), rendered);
    generated += 1;
  }

  if ((app.apis?.length ?? 0) > 0) {
    await writeGeneratedFile(resolve(targetPath, "src/api.contracts.json"), renderApiContracts(app));
  }

  return generated;
}

export async function renderGeneratedAuthHandlerRoute() {
  return renderApiRouteTemplate("auth-mount");
}
