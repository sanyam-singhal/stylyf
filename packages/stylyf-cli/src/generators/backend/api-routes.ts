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
    const rendered = await renderApiRouteTemplate(templateIdForRoute(route), {
      METHOD: route.method,
      ROUTE_NAME: route.name,
      ROUTE_PATH: route.path,
      AUTH_IMPORT: authImportBlock(route, app),
      AUTH_GUARD: authGuardBlock(route, app),
    });

    await writeGeneratedFile(resolve(targetPath, apiRouteFilePath(route.path)), rendered);
    generated += 1;
  }

  return generated;
}

export async function renderGeneratedAuthHandlerRoute() {
  return renderApiRouteTemplate("auth-mount");
}
