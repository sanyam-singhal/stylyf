import { readFile } from "node:fs/promises";
import type { AppShellId, LayoutNodeId, PageShellId } from "../compiler/generated-app.js";

type TemplateReplacements = Record<string, string>;

const appShellTemplateFiles: Record<AppShellId, string> = {
  "sidebar-app": "app-shells/sidebar-app.tsx.tpl",
  "topbar-app": "app-shells/topbar-app.tsx.tpl",
  "docs-shell": "app-shells/docs-shell.tsx.tpl",
  "marketing-shell": "app-shells/marketing-shell.tsx.tpl",
};

const pageShellTemplateFiles: Record<PageShellId, string> = {
  dashboard: "page-shells/dashboard.tsx.tpl",
  "resource-index": "page-shells/resource-index.tsx.tpl",
  "resource-detail": "page-shells/resource-detail.tsx.tpl",
  "resource-create": "page-shells/resource-create.tsx.tpl",
  "resource-edit": "page-shells/resource-edit.tsx.tpl",
  settings: "page-shells/settings.tsx.tpl",
  auth: "page-shells/auth.tsx.tpl",
  blank: "page-shells/blank.tsx.tpl",
};

const layoutTemplateFiles: Record<LayoutNodeId, string> = {
  stack: "layouts/stack.tsx.tpl",
  row: "layouts/row.tsx.tpl",
  column: "layouts/column.tsx.tpl",
  grid: "layouts/grid.tsx.tpl",
  split: "layouts/split.tsx.tpl",
  panel: "layouts/panel.tsx.tpl",
  section: "layouts/section.tsx.tpl",
  toolbar: "layouts/toolbar.tsx.tpl",
  "content-frame": "layouts/content-frame.tsx.tpl",
};

const serverFunctionTemplateFiles = {
  "list-query": "server-functions/list-query.ts.tpl",
  "detail-query": "server-functions/detail-query.ts.tpl",
  "create-action": "server-functions/create-action.ts.tpl",
  "update-action": "server-functions/update-action.ts.tpl",
  "delete-action": "server-functions/delete-action.ts.tpl",
  "upload-handshake-action": "server-functions/upload-handshake-action.ts.tpl",
  "generic-query": "server-functions/generic-query.ts.tpl",
  "generic-action": "server-functions/generic-action.ts.tpl",
} as const;

const apiRouteTemplateFiles = {
  "auth-mount": "api-routes/auth-mount.ts.tpl",
  json: "api-routes/json.ts.tpl",
  webhook: "api-routes/webhook.ts.tpl",
  "presign-upload": "api-routes/presign-upload.ts.tpl",
} as const;

export type ServerFunctionTemplateId = keyof typeof serverFunctionTemplateFiles;
export type ApiRouteTemplateId = keyof typeof apiRouteTemplateFiles;

function templateUrl(relativePath: string) {
  return new URL(`../templates/${relativePath}`, import.meta.url);
}

function interpolateTemplate(template: string, replacements: TemplateReplacements = {}) {
  return template.replace(/\{\{\s*([A-Z0-9_]+)\s*\}\}/g, (_, key: string) => replacements[key] ?? "");
}

async function readTemplate(relativePath: string, replacements?: TemplateReplacements) {
  const content = await readFile(templateUrl(relativePath), "utf8");
  return interpolateTemplate(content, replacements);
}

export function listAppShellTemplates() {
  return Object.keys(appShellTemplateFiles) as AppShellId[];
}

export function listPageShellTemplates() {
  return Object.keys(pageShellTemplateFiles) as PageShellId[];
}

export function listLayoutTemplates() {
  return Object.keys(layoutTemplateFiles) as LayoutNodeId[];
}

export function listServerFunctionTemplates() {
  return Object.keys(serverFunctionTemplateFiles) as ServerFunctionTemplateId[];
}

export function listApiRouteTemplates() {
  return Object.keys(apiRouteTemplateFiles) as ApiRouteTemplateId[];
}

export function templatePathForAppShell(id: AppShellId) {
  return appShellTemplateFiles[id];
}

export function templatePathForPageShell(id: PageShellId) {
  return pageShellTemplateFiles[id];
}

export function templatePathForLayout(id: LayoutNodeId) {
  return layoutTemplateFiles[id];
}

export function templatePathForServerFunction(id: ServerFunctionTemplateId) {
  return serverFunctionTemplateFiles[id];
}

export function templatePathForApiRoute(id: ApiRouteTemplateId) {
  return apiRouteTemplateFiles[id];
}

export function renderAppShellTemplate(id: AppShellId, replacements?: TemplateReplacements) {
  return readTemplate(templatePathForAppShell(id), replacements);
}

export function renderPageShellTemplate(id: PageShellId, replacements?: TemplateReplacements) {
  return readTemplate(templatePathForPageShell(id), replacements);
}

export function renderLayoutTemplate(id: LayoutNodeId, replacements?: TemplateReplacements) {
  return readTemplate(templatePathForLayout(id), replacements);
}

export function renderServerFunctionTemplate(id: ServerFunctionTemplateId, replacements?: TemplateReplacements) {
  return readTemplate(templatePathForServerFunction(id), replacements);
}

export function renderApiRouteTemplate(id: ApiRouteTemplateId, replacements?: TemplateReplacements) {
  return readTemplate(templatePathForApiRoute(id), replacements);
}
