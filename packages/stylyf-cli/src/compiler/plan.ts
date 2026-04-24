import type { AppIR, RouteIR } from "./generated-app.js";
import type { StylyfSpecV04 } from "../spec/types.js";

function toRouteFileSegment(segment: string) {
  return segment.startsWith(":") ? `[${segment.slice(1)}]` : segment;
}

function hasRouteDescendants(pathname: string, routes: RouteIR[]) {
  const normalized = pathname.replace(/\/+$/g, "");
  if (!normalized || normalized === "/") {
    return false;
  }
  const prefix = `${normalized}/`;
  return routes.some(route => route.path !== pathname && route.path.startsWith(prefix));
}

function routeFilePath(pathname: string, routes: RouteIR[]) {
  const clean = pathname.replace(/^\/+|\/+$/g, "");
  if (!clean) {
    return "src/routes/index.tsx";
  }
  const segments = clean.split("/").map(toRouteFileSegment);
  if (hasRouteDescendants(pathname, routes)) {
    return `src/routes/${segments.join("/")}/index.tsx`;
  }
  return `src/routes/${segments.join("/")}.tsx`;
}

function apiRouteFilePath(pathname: string) {
  const clean = pathname.replace(/^\/+|\/+$/g, "");
  return `src/routes/${clean}.ts`;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function serverModuleFilePath(name: string, type: "query" | "action") {
  const folder = type === "query" ? "queries" : "actions";
  return `src/lib/server/${folder}/${slugify(name)}.ts`;
}

function backendSummary(app: AppIR) {
  return {
    mode: app.database?.provider === "supabase" || app.auth?.provider === "supabase" ? "hosted" : "portable",
    auth: app.auth?.provider ?? "none",
    data:
      app.database?.provider === "supabase"
        ? "supabase sdk"
        : app.database
          ? `drizzle ${app.database.dialect ?? "postgres"}`
          : "none",
    storage: app.storage ? "tigris/s3-compatible" : "none",
  };
}

export type GenerationPlan = {
  app: {
    name: string;
    kind: StylyfSpecV04["app"]["kind"];
  };
  backend: ReturnType<typeof backendSummary>;
  resources: string[];
  workflows: string[];
  routes: Array<{
    path: string;
    page: string;
    resource?: string;
    file: string;
  }>;
  files: string[];
  postGenerateSteps: string[];
};

export function createGenerationPlan(spec: StylyfSpecV04, app: AppIR): GenerationPlan {
  const files = new Set<string>([
    "package.json",
    "app.config.ts",
    "src/app.tsx",
    "src/app.css",
    "src/lib/env.ts",
    ".env.example",
    "stylyf.spec.json",
    "stylyf.plan.json",
  ]);
  const postGenerateSteps: string[] = [];

  if (app.auth?.provider === "better-auth") {
    files.add("src/lib/auth.ts");
    files.add("src/lib/auth-client.ts");
    files.add("src/lib/db/auth-schema.ts");
    files.add("src/routes/login.tsx");
    files.add("src/routes/api/auth/[...auth].ts");
    postGenerateSteps.push("auth:generate", "db:generate");
  }

  if (app.auth?.provider === "supabase") {
    files.add("src/lib/supabase.ts");
    files.add("src/lib/supabase-browser.ts");
    files.add("src/lib/auth.ts");
    files.add("src/routes/login.tsx");
    files.add("src/routes/auth/callback.ts");
    files.add("supabase/schema.sql");
    files.add("supabase/policies.sql");
  }

  if (app.database?.provider === "drizzle") {
    files.add("src/lib/db.ts");
    files.add("src/lib/db/schema.ts");
    files.add("drizzle.config.ts");
  }

  if (app.storage) {
    files.add("src/lib/storage.ts");
  }

  if ((app.resources?.length ?? 0) > 0) {
    files.add("src/lib/resources.ts");
    files.add("src/lib/server/resource-policy.ts");
  }

  if ((app.workflows?.length ?? 0) > 0) {
    files.add("src/lib/workflows.ts");
    files.add("src/lib/server/workflows.ts");
  }

  if ((app.resources ?? []).some(resource => (resource.attachments?.length ?? 0) > 0)) {
    files.add("src/lib/attachments.ts");
    files.add("src/lib/server/attachments.ts");
    files.add("src/routes/api/attachments/intent.ts");
    files.add("src/routes/api/attachments/confirm.ts");
    files.add("src/routes/api/attachments/replace.ts");
    files.add("src/routes/api/attachments/delete.ts");
  }

  for (const route of app.routes) {
    files.add(routeFilePath(route.path, app.routes));
  }

  for (const api of app.apis ?? []) {
    files.add(apiRouteFilePath(api.path));
  }

  for (const module of app.server ?? []) {
    files.add(serverModuleFilePath(module.name, module.type));
  }

  return {
    app: {
      name: spec.app.name,
      kind: spec.app.kind,
    },
    backend: backendSummary(app),
    resources: (app.resources ?? []).map(resource => resource.name),
    workflows: (app.workflows ?? []).map(workflow => workflow.name),
    routes: app.routes.map(route => ({
      path: route.path,
      page: route.page,
      resource: route.resource,
      file: routeFilePath(route.path, app.routes),
    })),
    files: [...files].sort(),
    postGenerateSteps,
  };
}

export function renderGenerationPlan(plan: GenerationPlan) {
  return [
    "Stylyf v0.4 generation plan",
    "",
    "App:",
    `  name: ${plan.app.name}`,
    `  kind: ${plan.app.kind}`,
    "",
    "Backend:",
    `  mode: ${plan.backend.mode}`,
    `  auth: ${plan.backend.auth}`,
    `  data: ${plan.backend.data}`,
    `  storage: ${plan.backend.storage}`,
    "",
    "Generated resources:",
    ...(plan.resources.length > 0 ? plan.resources.map(resource => `  - ${resource}`) : ["  - none"]),
    "",
    "Generated workflows:",
    ...(plan.workflows.length > 0 ? plan.workflows.map(workflow => `  - ${workflow}`) : ["  - none"]),
    "",
    "Generated routes:",
    ...plan.routes.map(route => `  - ${route.path} ${route.page}${route.resource ? ` (${route.resource})` : ""}`),
    "",
    "Generated files:",
    ...plan.files.slice(0, 18).map(file => `  - ${file}`),
    plan.files.length > 18 ? `  - ...and ${plan.files.length - 18} more` : "",
    "",
    "Post-generate steps:",
    ...(plan.postGenerateSteps.length > 0 ? plan.postGenerateSteps.map(step => `  - ${step}`) : ["  - none"]),
    "",
  ]
    .filter(line => line !== "")
    .join("\n");
}
