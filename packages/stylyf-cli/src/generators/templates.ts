import { readFile } from "node:fs/promises";
import type { AppShellId, LayoutNodeId, PageShellId } from "../ir/types.js";

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

export function templatePathForAppShell(id: AppShellId) {
  return appShellTemplateFiles[id];
}

export function templatePathForPageShell(id: PageShellId) {
  return pageShellTemplateFiles[id];
}

export function templatePathForLayout(id: LayoutNodeId) {
  return layoutTemplateFiles[id];
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

