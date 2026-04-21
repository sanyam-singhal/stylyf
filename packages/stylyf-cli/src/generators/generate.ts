import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type {
  AppIR,
  AppShellId,
  ComponentRefIR,
  LayoutNodeIR,
  LayoutNodeId,
  PageShellId,
  RouteIR,
  SectionIR,
} from "../ir/types.js";
import { assertValidAppIr } from "../ir/validate.js";
import { loadAssemblyRegistry, type AssemblyItem } from "../manifests/index.js";
import { bundledSourcePathExists, readBundledSourceFile, writeGeneratedFile } from "./assets.js";
import { installGeneratedProjectDependencies, writeProjectScaffold } from "./project.js";
import {
  renderGeneratedAppCss,
  renderGeneratedAppRoot,
  renderGeneratedEntryClient,
  renderGeneratedEntryServer,
  renderGeneratedThemeSystem,
} from "./style.js";
import { listLayoutTemplates, renderAppShellTemplate, renderLayoutTemplate, renderPageShellTemplate } from "./templates.js";

function normalizeKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function pascalCase(value: string) {
  return value
    .split(/[^a-zA-Z0-9]+/g)
    .filter(Boolean)
    .map(segment => `${segment[0]?.toUpperCase() ?? ""}${segment.slice(1)}`)
    .join("");
}

function appShellComponentName(id: AppShellId) {
  const names: Record<AppShellId, string> = {
    "sidebar-app": "SidebarAppShell",
    "topbar-app": "TopbarAppShell",
    "docs-shell": "DocsShell",
    "marketing-shell": "MarketingShell",
  };

  return names[id];
}

function pageShellComponentName(id: PageShellId) {
  return `${pascalCase(id)}PageShell`;
}

function layoutComponentName(id: LayoutNodeId) {
  return pascalCase(id);
}

function routeFilePath(pathname: string) {
  const clean = pathname.replace(/^\/+|\/+$/g, "");
  if (!clean) {
    return "src/routes/index.tsx";
  }
  return `src/routes/${clean}.tsx`;
}

function routeComponentName(pathname: string) {
  const clean = pathname.replace(/^\/+|\/+$/g, "");
  return `${pascalCase(clean || "index")}Route`;
}

function escapeString(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function jsxPropValue(value: unknown): string {
  if (typeof value === "string") {
    return `"${escapeString(value)}"`;
  }

  if (typeof value === "number") {
    return `{${value}}`;
  }

  if (typeof value === "boolean") {
    return value ? "" : "{false}";
  }

  return `{${JSON.stringify(value)}}`;
}

function renderProps(props?: Record<string, unknown>, extra?: Record<string, unknown>) {
  const merged = { ...(props ?? {}), ...(extra ?? {}) };
  return Object.entries(merged)
    .map(([key, value]) => {
      if (typeof value === "boolean") {
        return value ? key : `${key}={false}`;
      }

      return `${key}=${jsxPropValue(value)}`;
    })
    .join(" ");
}

function importPathToAssetCandidates(importPath: string) {
  const base = importPath.replace(/^~\//, "src/");
  return [`${base}.tsx`, `${base}.ts`];
}

async function resolveBundledSourceRelativePath(importPath: string) {
  for (const candidate of importPathToAssetCandidates(importPath)) {
    if (await bundledSourcePathExists(candidate)) {
      return candidate;
    }
  }
  return null;
}

function collectImportPaths(source: string) {
  return [...source.matchAll(/from\s+["'](~\/[^"']+)["']/g)].map(match => match[1]);
}

function collectLayoutIdsFromNode(node: LayoutNodeIR, target: Set<LayoutNodeId>) {
  target.add(node.layout);

  for (const child of node.children ?? []) {
    if (typeof child === "string" || "component" in child) {
      continue;
    }

    collectLayoutIdsFromNode(child, target);
  }
}

function collectLayoutIdsFromSection(section: SectionIR, target: Set<LayoutNodeId>) {
  target.add(section.layout);

  for (const child of section.children) {
    if (typeof child === "string" || "component" in child) {
      continue;
    }

    collectLayoutIdsFromNode(child, target);
  }
}

function createAssemblyLookup(items: AssemblyItem[]) {
  const lookup = new Map<string, AssemblyItem>();

  for (const item of items) {
    for (const alias of [item.id, item.slug, item.label, item.exportName, `${item.clusterDirectory}/${item.slug}`]) {
      lookup.set(normalizeKey(alias), item);
    }
  }

  return lookup;
}

function componentReferenceName(reference: string | ComponentRefIR) {
  return typeof reference === "string" ? reference : reference.component;
}

function resolveAssemblyItem(reference: string | ComponentRefIR, lookup: Map<string, AssemblyItem>) {
  return lookup.get(normalizeKey(componentReferenceName(reference))) ?? null;
}

function renderComponentNode(
  reference: string | ComponentRefIR,
  assemblyLookup: Map<string, AssemblyItem>,
  imports: Map<string, Set<string>>,
  copiedRegistryImports: Set<string>,
) {
  const item = resolveAssemblyItem(reference, assemblyLookup);

  if (!item) {
    throw new Error(`Unknown component reference: ${componentReferenceName(reference)}`);
  }

  if (!imports.has(item.importPath)) {
    imports.set(item.importPath, new Set());
  }

  imports.get(item.importPath)?.add(item.exportName);
  copiedRegistryImports.add(item.importPath);

  const props =
    typeof reference === "string"
      ? {}
      : {
          ...(reference.props ?? {}),
          ...(reference.variant ? { variant: reference.variant } : {}),
          ...(reference.items ? { items: reference.items } : {}),
        };
  const propString = renderProps(props);

  return propString ? `<${item.exportName} ${propString} />` : `<${item.exportName} />`;
}

function renderLayoutNode(
  node: LayoutNodeIR,
  assemblyLookup: Map<string, AssemblyItem>,
  imports: Map<string, Set<string>>,
  copiedRegistryImports: Set<string>,
  layoutImports: Set<LayoutNodeId>,
  indent = 8,
): string {
  layoutImports.add(node.layout);
  const componentName = layoutComponentName(node.layout);
  const indentText = " ".repeat(indent);
  const childIndent = " ".repeat(indent + 2);
  const children = (node.children ?? [])
    .map(child => {
      if (typeof child === "string" || "component" in child) {
        return `${childIndent}${renderComponentNode(child as string | ComponentRefIR, assemblyLookup, imports, copiedRegistryImports)}`;
      }

      return renderLayoutNode(child, assemblyLookup, imports, copiedRegistryImports, layoutImports, indent + 2);
    })
    .join("\n");
  const propString = renderProps(node.props);
  const openTag = propString ? `<${componentName} ${propString}>` : `<${componentName}>`;

  return `${indentText}${openTag}\n${children}\n${indentText}</${componentName}>`;
}

function renderSection(
  section: SectionIR,
  assemblyLookup: Map<string, AssemblyItem>,
  imports: Map<string, Set<string>>,
  copiedRegistryImports: Set<string>,
  layoutImports: Set<LayoutNodeId>,
) {
  const node: LayoutNodeIR = {
    layout: section.layout,
    props: section.id ? { id: section.id } : undefined,
    children: section.children,
  };

  return renderLayoutNode(node, assemblyLookup, imports, copiedRegistryImports, layoutImports);
}

function renderRouteSource(route: RouteIR, app: AppIR, assemblyLookup: Map<string, AssemblyItem>) {
  const imports = new Map<string, Set<string>>();
  const copiedRegistryImports = new Set<string>();
  const layoutImports = new Set<LayoutNodeId>();
  const appShellId = route.shell ?? app.shell;
  const pageShellId = route.page;
  const appShellName = appShellComponentName(appShellId);
  const pageShellName = pageShellComponentName(pageShellId);

  const renderedSections = route.sections
    .map(section => renderSection(section, assemblyLookup, imports, copiedRegistryImports, layoutImports))
    .join("\n");

  const importLines = [
    'import { Title } from "@solidjs/meta";',
    `import { ${appShellName} } from "~/components/shells/app/${appShellId}";`,
    `import { ${pageShellName} } from "~/components/shells/page/${pageShellId}";`,
    ...[...layoutImports]
      .sort()
      .map(layoutId => `import { ${layoutComponentName(layoutId)} } from "~/components/layout/${layoutId}";`),
    ...[...imports.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([importPath, names]) => `import { ${[...names].sort().join(", ")} } from "${importPath}";`),
  ];

  const title = route.title ?? `${app.name} ${pageShellId.replace(/-/g, " ")}`;

  const source = [
    ...importLines,
    "",
    `export default function ${routeComponentName(route.path)}() {`,
    "  return (",
    "    <>",
    `      <Title>${title}</Title>`,
    `      <${appShellName} title=${jsxPropValue(app.name)}>`,
    `        <${pageShellName} title=${jsxPropValue(title)}>`,
    renderedSections,
    `        </${pageShellName}>`,
    `      </${appShellName}>`,
    "    </>",
    "  );",
    "}",
    "",
  ].join("\n");

  return {
    source,
    copiedRegistryImports,
  };
}

async function copyBundledDependencyTree(importPath: string, targetRoot: string, seen: Set<string>) {
  if (seen.has(importPath) || importPath.startsWith("~/components/layout/") || importPath.startsWith("~/components/shells/")) {
    return;
  }

  const relativeSource = await resolveBundledSourceRelativePath(importPath);
  if (!relativeSource) {
    return;
  }

  seen.add(importPath);
  const source = await readBundledSourceFile(relativeSource);
  await writeGeneratedFile(resolve(targetRoot, relativeSource), source);

  for (const nestedImport of collectImportPaths(source)) {
    await copyBundledDependencyTree(nestedImport, targetRoot, seen);
  }
}

export async function generateFrontendDraft(irPath: string, targetPath: string, options?: { install?: boolean }) {
  const raw = await readFile(resolve(process.cwd(), irPath), "utf8");
  const parsed = JSON.parse(raw) as unknown;
  assertValidAppIr(parsed);

  const app = parsed as AppIR;
  const install = options?.install ?? true;
  const assemblyLookup = createAssemblyLookup(await loadAssemblyRegistry());
  const usedAppShells = new Set<AppShellId>([app.shell]);
  const usedPageShells = new Set<PageShellId>();
  const usedLayouts = new Set<LayoutNodeId>(listLayoutTemplates());
  const registryImportsToCopy = new Set<string>(["~/lib/cn"]);

  await writeProjectScaffold(app, targetPath);
  await writeGeneratedFile(resolve(targetPath, "src/app.tsx"), renderGeneratedAppRoot(app));
  await writeGeneratedFile(resolve(targetPath, "src/entry-client.tsx"), renderGeneratedEntryClient());
  await writeGeneratedFile(resolve(targetPath, "src/entry-server.tsx"), renderGeneratedEntryServer());
  await writeGeneratedFile(resolve(targetPath, "src/app.css"), await renderGeneratedAppCss(app));
  await writeGeneratedFile(resolve(targetPath, "src/lib/theme-system.ts"), renderGeneratedThemeSystem(app));

  for (const route of app.routes) {
    usedAppShells.add(route.shell ?? app.shell);
    usedPageShells.add(route.page);
    route.sections.forEach(section => collectLayoutIdsFromSection(section, usedLayouts));
  }

  for (const layoutId of usedLayouts) {
    const rendered = await renderLayoutTemplate(layoutId);
    await writeGeneratedFile(resolve(targetPath, `src/components/layout/${layoutId}.tsx`), rendered);
  }

  for (const appShellId of usedAppShells) {
    const rendered = await renderAppShellTemplate(appShellId, { APP_NAME: app.name });
    await writeGeneratedFile(resolve(targetPath, `src/components/shells/app/${appShellId}.tsx`), rendered);
    for (const importPath of collectImportPaths(rendered)) {
      registryImportsToCopy.add(importPath);
    }
  }

  for (const pageShellId of usedPageShells) {
    const rendered = await renderPageShellTemplate(pageShellId, { APP_NAME: app.name });
    await writeGeneratedFile(resolve(targetPath, `src/components/shells/page/${pageShellId}.tsx`), rendered);
    for (const importPath of collectImportPaths(rendered)) {
      registryImportsToCopy.add(importPath);
    }
  }

  for (const route of app.routes) {
    const renderedRoute = renderRouteSource(route, app, assemblyLookup);
    await writeGeneratedFile(resolve(targetPath, routeFilePath(route.path)), renderedRoute.source);
    for (const importPath of renderedRoute.copiedRegistryImports) {
      registryImportsToCopy.add(importPath);
    }
  }

  const seenImports = new Set<string>();
  for (const importPath of registryImportsToCopy) {
    await copyBundledDependencyTree(importPath, targetPath, seenImports);
  }

  if (install) {
    await installGeneratedProjectDependencies(targetPath);
  }

  return {
    routes: app.routes.length,
    appShells: usedAppShells.size,
    pageShells: usedPageShells.size,
    layouts: usedLayouts.size,
    copiedFiles: seenImports.size,
    installed: install,
  };
}
