import { resolve } from "node:path";
import { readFile } from "node:fs/promises";
import type {
  AppIR,
  AppShellId,
  BindingIR,
  ComponentRefIR,
  LayoutNodeIR,
  LayoutNodeId,
  PageShellId,
  ResourceIR,
  RouteIR,
  SectionIR,
} from "../compiler/generated-app.js";
import { expandSpecToGeneratedApp } from "../compiler/expand.js";
import { createGenerationPlan } from "../compiler/plan.js";
import { readSpecV10 } from "../spec/read.js";
import { renderHandoffMarkdown, renderLocalSmokeMarkdown, renderSecurityNotesMarkdown } from "./handoff.js";
import {
  renderGeneratedAuthClientModule,
  renderGeneratedAuthGuards,
  renderGeneratedAuthMiddleware,
  renderGeneratedAuthModule,
} from "./backend/auth.js";
import {
  renderGeneratedHealthRoute,
  renderGeneratedObservabilityModule,
  renderGeneratedOperationsMarkdown,
  renderGeneratedReadinessRoute,
} from "./backend/observability.js";
import { renderGeneratedAuthHandlerRoute, writeGeneratedApiRoutes } from "./backend/api-routes.js";
import { renderGeneratedAuthSchemaConfig, renderGeneratedAuthSchemaPlaceholder } from "./backend/auth-schema.js";
import { renderGeneratedDbModule, renderGeneratedDbSchema, renderGeneratedDrizzleConfig } from "./backend/database.js";
import {
  renderGeneratedEnvCheckModule,
  renderGeneratedEnvExample,
  renderGeneratedEnvModule,
  renderGeneratedEnvPublicModule,
  renderGeneratedEnvServerModule,
} from "./backend/env.js";
import {
  hasGeneratedAttachments,
  renderGeneratedAttachmentApiRoutes,
  renderGeneratedAttachmentModule,
  renderGeneratedAttachmentServerModule,
  renderGeneratedSupabaseAttachmentPoliciesSql,
} from "./backend/attachments.js";
import { writeGeneratedResourceForms } from "./backend/forms.js";
import {
  materializeAppForGeneration,
  renderGeneratedResourcePolicyModule,
  renderGeneratedRelationsModule,
  renderGeneratedResourcesModule,
  renderGeneratedSupabasePoliciesSql,
} from "./backend/resources.js";
import { writeGeneratedServerModules } from "./backend/server-functions.js";
import { renderGeneratedResourceFactories, renderGeneratedSeedModule, renderGeneratedSeedScript } from "./backend/seed.js";
import { renderGeneratedStorageModule } from "./backend/storage.js";
import {
  hasGeneratedWorkflows,
  materializeWorkflowSupport,
  renderGeneratedSupabaseWorkflowPoliciesSql,
  renderGeneratedWorkflowServerModule,
  renderGeneratedWorkflowsModule,
} from "./backend/workflows.js";
import {
  renderGeneratedSupabaseAuthApiRoutes,
  renderGeneratedSupabaseAuthCallbackRoute,
  renderGeneratedSupabaseAuthClientModule,
  renderGeneratedSupabaseAuthGuards,
  renderGeneratedSupabaseAuthModule,
  renderGeneratedSupabaseBrowserModule,
  renderGeneratedSupabaseMiddleware,
  renderGeneratedSupabaseServerModule,
  renderGeneratedSupabaseSqlSchema,
} from "./backend/supabase.js";
import { loadAssemblyRegistry, type AssemblyItem } from "../manifests/index.js";
import { bundledSourcePathExists, readBundledSourceFile, writeGeneratedFile } from "./assets.js";
import { installGeneratedProjectDependencies, runGeneratedProjectScript, writeProjectScaffold } from "./project.js";
import { renderGeneratedNavigationModule } from "./navigation.js";
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

function camelCase(value: string) {
  return value
    .split(/[^a-zA-Z0-9]+/g)
    .filter(Boolean)
    .map((segment, index) =>
      index === 0 ? segment.toLowerCase() : `${segment[0]?.toUpperCase() ?? ""}${segment.slice(1).toLowerCase()}`,
    )
    .join("");
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function humanize(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, match => match.toUpperCase());
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

function routeComponentName(pathname: string) {
  const clean = pathname.replace(/^\/+|\/+$/g, "");
  return `${pascalCase(clean || "index")}Route`;
}

function hasProtectedRoutes(app: AppIR) {
  return (app.auth?.protect ?? []).some(entry => entry.kind === "route" && entry.access === "user");
}

function escapeString(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function tableNameFor(resource: ResourceIR) {
  return resource.table ?? resource.name;
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

function addNamedImport(imports: Map<string, Set<string>>, importPath: string, name: string) {
  if (!imports.has(importPath)) {
    imports.set(importPath, new Set());
  }

  imports.get(importPath)?.add(name);
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
    props: {
      ...(section.props ?? {}),
      ...(section.id ? { id: section.id } : {}),
    },
    children: section.children,
  };

  return renderLayoutNode(node, assemblyLookup, imports, copiedRegistryImports, layoutImports);
}

function routeMetadata(route: RouteIR, app: AppIR, title: string) {
  const metadata = route.metadata ?? {};
  const description =
    metadata.description ??
    (route.access === "public"
      ? `${title} generated by Stylyf for ${app.name}.`
      : `${title} private app surface for ${app.name}.`);
  return {
    ...metadata,
    title: metadata.title ?? title,
    description,
    robots: metadata.robots ?? (route.access === "public" ? "index" : "noindex"),
    openGraph: {
      title: metadata.openGraph?.title ?? metadata.title ?? title,
      description: metadata.openGraph?.description ?? description,
      image: metadata.openGraph?.image,
    },
  };
}

function renderRouteMetadataTags(route: RouteIR, app: AppIR, title: string) {
  const metadata = routeMetadata(route, app, title);
  const tags = [
    `      <Title>${metadata.title}</Title>`,
    `      <Meta name="description" content=${jsxPropValue(metadata.description)} />`,
    `      <Meta name="robots" content=${jsxPropValue(metadata.robots)} />`,
    metadata.canonical ? `      <Link rel="canonical" href=${jsxPropValue(metadata.canonical)} />` : "",
    `      <Meta property="og:title" content=${jsxPropValue(metadata.openGraph.title)} />`,
    `      <Meta property="og:description" content=${jsxPropValue(metadata.openGraph.description)} />`,
    metadata.openGraph.image ? `      <Meta property="og:image" content=${jsxPropValue(metadata.openGraph.image)} />` : "",
    metadata.structuredData
      ? `      <script type="application/ld+json">${JSON.stringify(metadata.structuredData).replace(/</g, "\\u003c")}</script>`
      : "",
  ];

  return tags.filter(Boolean);
}

type ResourceRouteBinding = {
  operation: "list" | "detail" | "create" | "update";
  resource: ResourceIR;
};

function resourceBindingOperation(binding: BindingIR): ResourceRouteBinding["operation"] | null {
  if (binding.kind === "resource.list") return "list";
  if (binding.kind === "resource.detail") return "detail";
  if (binding.kind === "resource.create") return "create";
  if (binding.kind === "resource.update") return "update";
  return null;
}

function findResource(app: AppIR, name?: string) {
  if (!name) return null;
  return app.resources?.find(resource => resource.name === name || tableNameFor(resource) === name) ?? null;
}

function defaultRouteBindingOperation(route: RouteIR): ResourceRouteBinding["operation"] | null {
  if (route.page === "resource-index") return "list";
  if (route.page === "resource-detail") return "detail";
  if (route.page === "resource-create") return "create";
  if (route.page === "resource-edit") return "update";
  return null;
}

function resolveResourceRouteBinding(route: RouteIR, app: AppIR): ResourceRouteBinding | null {
  const explicitBinding = (route.bindings ?? [])
    .map(binding => ({ binding, operation: resourceBindingOperation(binding) }))
    .find(entry => entry.operation && entry.binding.resource);

  if (explicitBinding?.operation) {
    const resource = findResource(app, explicitBinding.binding.resource);
    return resource ? { operation: explicitBinding.operation, resource } : null;
  }

  const operation = defaultRouteBindingOperation(route);
  const resource = findResource(app, route.resource);
  return operation && resource ? { operation, resource } : null;
}

function serverFunctionImportFor(resource: ResourceIR, operation: ResourceRouteBinding["operation"]) {
  const folder = operation === "list" || operation === "detail" ? "queries" : "actions";
  const action = operation === "list" ? "list" : operation === "detail" ? "detail" : operation;
  const prefix = operation === "list" ? "list" : operation === "detail" ? "get" : operation;

  return {
    exportName: `${prefix}${pascalCase(tableNameFor(resource))}`,
    importPath: `~/lib/server/${folder}/${slugify(`${resource.name}-${action}`)}`,
  };
}

function registerDataStateImports(imports: Map<string, Set<string>>, copiedRegistryImports: Set<string>) {
  for (const [importPath, exportName] of [
    ["~/components/registry/information-states/loading-state", "LoadingState"],
    ["~/components/registry/information-states/empty-state", "EmptyState"],
    ["~/components/registry/information-states/error-state", "ErrorState"],
  ] as const) {
    addNamedImport(imports, importPath, exportName);
    copiedRegistryImports.add(importPath);
  }
}

function indentMultiline(source: string, spaces: number) {
  const prefix = " ".repeat(spaces);
  return source
    .split("\n")
    .map(line => (line.trim() ? `${prefix}${line}` : line))
    .join("\n");
}

function renderDataBoundRouteContent(
  route: RouteIR,
  binding: ResourceRouteBinding | null,
  renderedSections: string,
  imports: Map<string, Set<string>>,
  copiedRegistryImports: Set<string>,
) {
  if (!binding || (binding.operation !== "list" && binding.operation !== "detail")) {
    return {
      solidImports: new Set<string>(),
      routerImports: new Set<string>(),
      setupLines: [] as string[],
      content: renderedSections,
    };
  }

  registerDataStateImports(imports, copiedRegistryImports);
  const solidImports = new Set<string>(["ErrorBoundary", "Show"]);
  const routerImports = new Set<string>(["createAsync"]);
  const resourceLabel = humanize(binding.resource.name);
  const resourceLabelSingular = resourceLabel.replace(/s$/, "");
  const serverFunction = serverFunctionImportFor(binding.resource, binding.operation);
  addNamedImport(imports, serverFunction.importPath, serverFunction.exportName);

  if (binding.operation === "detail") {
    routerImports.add("useParams");
  }

  const resourceVariable = camelCase(binding.resource.name || "records") || "records";
  const rowAccessor = binding.operation === "list" ? `${resourceVariable}Rows` : `${camelCase(resourceLabelSingular) || "record"}Data`;
  const setupLines =
    binding.operation === "list"
      ? [`  const ${rowAccessor} = createAsync(() => ${serverFunction.exportName}());`]
      : ["  const params = useParams();", `  const ${rowAccessor} = createAsync(() => ${serverFunction.exportName}(params.id));`];

  const indentedSections = indentMultiline(renderedSections, 6);
  const content =
    binding.operation === "list"
      ? [
          '          <ErrorBoundary fallback={(error) => <ErrorState title="Unable to load records" detail={error instanceof Error ? error.message : String(error)} />}>',
          `            <Show when={${rowAccessor}() !== undefined} fallback={<LoadingState title=${jsxPropValue(`Loading ${resourceLabel.toLowerCase()}`)} description="Fetching the latest generated resource data." />}>`,
          `              <Show when={(${rowAccessor}()?.length ?? 0) > 0} fallback={<EmptyState eyebrow="No records" title=${jsxPropValue(`No ${resourceLabel.toLowerCase()} yet`)} description="Create your first record or adjust the generated query filters." />}>`,
          indentedSections,
          "              </Show>",
          "            </Show>",
          "          </ErrorBoundary>",
        ].join("\n")
      : [
          '          <ErrorBoundary fallback={(error) => <ErrorState title="Unable to load record" detail={error instanceof Error ? error.message : String(error)} />}>',
          `            <Show when={${rowAccessor}() !== undefined} fallback={<LoadingState title=${jsxPropValue(`Loading ${resourceLabelSingular.toLowerCase()}`)} description="Fetching this generated resource record." />}>`,
          `              <Show when={${rowAccessor}()} fallback={<EmptyState eyebrow="Not found" title=${jsxPropValue(`${resourceLabelSingular} not found`)} description="The requested record was not returned by the generated detail query." />}>`,
          indentedSections,
          "              </Show>",
          "            </Show>",
          "          </ErrorBoundary>",
        ].join("\n");

  return {
    solidImports,
    routerImports,
    setupLines,
    content,
  };
}

function renderResourceFormRouteSource(route: RouteIR, app: AppIR, assemblyLookup: Map<string, AssemblyItem>) {
  const copiedRegistryImports = new Set<string>();
  const imports = new Map<string, Set<string>>();
  const layoutImports = new Set<LayoutNodeId>();
  const appShellId = route.shell ?? app.shell;
  const pageShellId = route.page;
  const appShellName = appShellComponentName(appShellId);
  const pageShellName = pageShellComponentName(pageShellId);
  const resourceName = route.resource ?? "resource";
  const resourceComponentBase = slugify(resourceName);
  const resourceComponentName = `${pascalCase(resourceName)}Form`;
  const resourceLabel = humanize(resourceName).replace(/s$/, "");
  const renderedSections = route.sections
    .map(section => renderSection(section, assemblyLookup, imports, copiedRegistryImports, layoutImports))
    .join("\n");

  const importLines = [
    'import { Link, Meta, Title } from "@solidjs/meta";',
    route.page === "resource-edit" ? 'import { useParams } from "@solidjs/router";' : "",
    `import { ${appShellName} } from "~/components/shells/app/${appShellId}";`,
    `import { GeneratedNavigation } from "~/components/generated-navigation";`,
    `import { ${pageShellName} } from "~/components/shells/page/${pageShellId}";`,
    `import { ${resourceComponentName} } from "~/components/resource-forms/${resourceComponentBase}-form";`,
    ...[...layoutImports]
      .sort()
      .map(layoutId => `import { ${layoutComponentName(layoutId)} } from "~/components/layout/${layoutId}";`),
    ...[...imports.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([importPath, names]) => `import { ${[...names].sort().join(", ")} } from "${importPath}";`),
  ].filter(Boolean);

  const title = route.title ?? (route.page === "resource-create" ? `Create ${resourceLabel}` : `Edit ${resourceLabel}`);
  const description =
    route.page === "resource-create"
      ? `Create a new ${resourceLabel.toLowerCase()} using the generated resource form scaffold.`
      : `Edit an existing ${resourceLabel.toLowerCase()} using the generated resource form scaffold.`;

  const source = [
    ...importLines,
    "",
    `export default function ${routeComponentName(route.path)}() {`,
    route.page === "resource-edit" ? "  const params = useParams();" : "",
    "  return (",
    "    <>",
    ...renderRouteMetadataTags(route, app, title),
    `      <${appShellName} title=${jsxPropValue(app.name)} ${appShellId === "topbar-app" ? 'nav={<GeneratedNavigation shell="topbar-app" />}' : appShellId === "sidebar-app" || appShellId === "docs-shell" ? `navigation={<GeneratedNavigation shell=${jsxPropValue(appShellId)} />}` : ""}>`,
    `        <${pageShellName} title=${jsxPropValue(title)} description=${jsxPropValue(description)}>`,
    route.page === "resource-edit"
      ? `          <${resourceComponentName} mode="edit" resourceId={params.id} />`
      : `          <${resourceComponentName} mode="create" />`,
    renderedSections,
    `        </${pageShellName}>`,
    `      </${appShellName}>`,
    "    </>",
    "  );",
    "}",
    "",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    source,
    copiedRegistryImports,
  };
}

function renderRouteSource(route: RouteIR, app: AppIR, assemblyLookup: Map<string, AssemblyItem>) {
  if ((route.page === "resource-create" || route.page === "resource-edit") && route.resource) {
    return renderResourceFormRouteSource(route, app, assemblyLookup);
  }

  const imports = new Map<string, Set<string>>();
  const copiedRegistryImports = new Set<string>();
  const layoutImports = new Set<LayoutNodeId>();
  const appShellId = route.shell ?? app.shell;
  const pageShellId = route.page;
  const appShellName = appShellComponentName(appShellId);
  const pageShellName = pageShellComponentName(pageShellId);
  const dataBinding = resolveResourceRouteBinding(route, app);

  const renderedSections = route.sections
    .map(section => renderSection(section, assemblyLookup, imports, copiedRegistryImports, layoutImports))
    .join("\n");
  const dataBoundRoute = renderDataBoundRouteContent(route, dataBinding, renderedSections, imports, copiedRegistryImports);

  const importLines = [
    'import { Link, Meta, Title } from "@solidjs/meta";',
    dataBoundRoute.solidImports.size > 0 ? `import { ${[...dataBoundRoute.solidImports].sort().join(", ")} } from "solid-js";` : "",
    dataBoundRoute.routerImports.size > 0 ? `import { ${[...dataBoundRoute.routerImports].sort().join(", ")} } from "@solidjs/router";` : "",
    `import { ${appShellName} } from "~/components/shells/app/${appShellId}";`,
    `import { GeneratedNavigation } from "~/components/generated-navigation";`,
    `import { ${pageShellName} } from "~/components/shells/page/${pageShellId}";`,
    ...[...layoutImports]
      .sort()
      .map(layoutId => `import { ${layoutComponentName(layoutId)} } from "~/components/layout/${layoutId}";`),
    ...[...imports.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([importPath, names]) => `import { ${[...names].sort().join(", ")} } from "${importPath}";`),
  ].filter(Boolean);

  const title = route.title ?? `${app.name} ${pageShellId.replace(/-/g, " ")}`;

  const source = [
    ...importLines,
    "",
    `export default function ${routeComponentName(route.path)}() {`,
    ...dataBoundRoute.setupLines,
    "  return (",
    "    <>",
    ...renderRouteMetadataTags(route, app, title),
    `      <${appShellName} title=${jsxPropValue(app.name)} ${appShellId === "topbar-app" ? 'nav={<GeneratedNavigation shell="topbar-app" />}' : appShellId === "sidebar-app" || appShellId === "docs-shell" ? `navigation={<GeneratedNavigation shell=${jsxPropValue(appShellId)} />}` : ""}>`,
    `        <${pageShellName} title=${jsxPropValue(title)}>`,
    dataBoundRoute.content,
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

function renderGeneratedLoginRoute(app: AppIR) {
  const isHosted = app.auth?.provider === "supabase";
  const signInEndpoint = isHosted ? "/api/auth/sign-in/password" : "/api/auth/sign-in/email";
  const signUpEndpoint = isHosted ? "/api/auth/sign-up/password" : "/api/auth/sign-up/email";
  const signUpPayload = isHosted
    ? "{ email: email(), password: password() }"
    : '{ email: email(), password: password(), name: email().split("@")[0] || "Stylyf user" }';
  const signInPayload = isHosted
    ? "{ email: email(), password: password() }"
    : '{ email: email(), password: password(), callbackURL: "/" }';

  return [
    'import { Title } from "@solidjs/meta";',
    'import { Show, createSignal } from "solid-js";',
    'import { AuthPageShell } from "~/components/shells/page/auth";',
    'import { Button } from "~/components/registry/actions-navigation/button";',
    'import { TextField } from "~/components/registry/form-inputs/text-field";',
    "",
    "export default function LoginRoute() {",
    '  const [mode, setMode] = createSignal<"sign-in" | "sign-up">("sign-in");',
    '  const [email, setEmail] = createSignal("");',
    '  const [password, setPassword] = createSignal("");',
    '  const [message, setMessage] = createSignal("");',
    "  const [pending, setPending] = createSignal(false);",
    "",
    "  const submit = async (event: SubmitEvent) => {",
    "    event.preventDefault();",
    '    setMessage("");',
    "    setPending(true);",
    "",
    "    const response = await fetch(mode() === \"sign-up\" ? " + JSON.stringify(signUpEndpoint) + " : " + JSON.stringify(signInEndpoint) + ", {",
    '      method: "POST",',
    '      headers: { "content-type": "application/json" },',
    `      body: JSON.stringify(mode() === "sign-up" ? ${signUpPayload} : ${signInPayload}),`,
    "    }).catch(error => ({ ok: false, statusText: error instanceof Error ? error.message : String(error) }));",
    "",
    "    setPending(false);",
    "",
    '    if (!("ok" in response) || !response.ok) {',
    '      setMessage(`Authentication failed: ${"statusText" in response ? response.statusText : "unknown error"}`);',
    "      return;",
    "    }",
    "",
    '    window.location.href = "/";',
    "  };",
    "",
    "  return (",
    "    <>",
    "      <Title>Sign in</Title>",
    "      <AuthPageShell",
    '        title={mode() === "sign-up" ? "Create your account" : "Sign in"}',
    `        subtitle="Access ${escapeString(app.name)} with the generated ${isHosted ? "Supabase" : "Better Auth"} email/password flow."`,
    "      >",
    "        <form class=\"space-y-4\" onSubmit={submit}>",
    "          <TextField label=\"Email\" type=\"email\" value={email()} onValueChange={setEmail} required />",
    "          <TextField label=\"Password\" type=\"password\" value={password()} onValueChange={setPassword} required />",
    "          <Show when={message()}>",
    "            <p class=\"rounded-[var(--radius)] border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive\">",
    "              {message()}",
    "            </p>",
    "          </Show>",
    '          <Button type="submit" fullWidth pending={pending()}>',
    '            {mode() === "sign-up" ? "Create account" : "Sign in"}',
    "          </Button>",
    "        </form>",
    "        <div class=\"pt-2 text-center text-sm text-muted-foreground\">",
    '          <button type="button" class="font-semibold text-foreground underline-offset-4 hover:underline" onClick={() => setMode(mode() === "sign-up" ? "sign-in" : "sign-up")}>',
    '            {mode() === "sign-up" ? "Already have an account? Sign in" : "Need an account? Create one"}',
    "          </button>",
    "        </div>",
    "      </AuthPageShell>",
    "    </>",
    "  );",
    "}",
    "",
  ].join("\n");
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

export async function generateFrontendDraftFromApp(appIr: AppIR, targetPath: string, options?: { install?: boolean }) {
  const app = materializeWorkflowSupport(materializeAppForGeneration(appIr));
  const install = options?.install ?? true;
  const assemblyLookup = createAssemblyLookup(await loadAssemblyRegistry());
  const usedAppShells = new Set<AppShellId>([app.shell]);
  const usedPageShells = new Set<PageShellId>();
  const usedLayouts = new Set<LayoutNodeId>(listLayoutTemplates());
  const registryImportsToCopy = new Set<string>([
    "~/lib/cn",
    "~/components/registry/form-inputs/text-field",
    "~/components/registry/form-inputs/text-area",
    "~/components/registry/form-inputs/select",
    "~/components/registry/form-inputs/checkbox",
    "~/components/registry/actions-navigation/button",
  ]);
  const postGenerateSteps: string[] = [];
  const usesSupabaseBackend = app.database?.provider === "supabase" || app.auth?.provider === "supabase";

  await writeProjectScaffold(app, targetPath);
  await writeGeneratedFile(resolve(targetPath, "src/app.tsx"), renderGeneratedAppRoot(app));
  await writeGeneratedFile(resolve(targetPath, "src/entry-client.tsx"), renderGeneratedEntryClient());
  await writeGeneratedFile(resolve(targetPath, "src/entry-server.tsx"), renderGeneratedEntryServer());
  await writeGeneratedFile(resolve(targetPath, "src/app.css"), await renderGeneratedAppCss(app));
  await writeGeneratedFile(resolve(targetPath, "src/lib/theme-system.ts"), renderGeneratedThemeSystem(app));
  await writeGeneratedFile(resolve(targetPath, "src/components/generated-navigation.tsx"), renderGeneratedNavigationModule(app));
  await writeGeneratedFile(resolve(targetPath, "src/lib/server/observability.ts"), renderGeneratedObservabilityModule(app));
  if (!(app.apis ?? []).some(api => api.path === "/api/health")) {
    await writeGeneratedFile(resolve(targetPath, "src/routes/api/health.ts"), renderGeneratedHealthRoute(app));
  }
  await writeGeneratedFile(resolve(targetPath, "src/routes/api/readiness.ts"), renderGeneratedReadinessRoute(app));
  await writeGeneratedFile(resolve(targetPath, ".env.local.example"), renderGeneratedEnvExample(app, "local"));
  await writeGeneratedFile(resolve(targetPath, ".env.production.example"), renderGeneratedEnvExample(app, "production"));
  await writeGeneratedFile(resolve(targetPath, "src/lib/env.ts"), renderGeneratedEnvModule());
  await writeGeneratedFile(resolve(targetPath, "src/lib/env.server.ts"), renderGeneratedEnvServerModule(app));
  await writeGeneratedFile(resolve(targetPath, "src/lib/env.public.ts"), renderGeneratedEnvPublicModule(app));
  await writeGeneratedFile(resolve(targetPath, "src/lib/env.check.ts"), renderGeneratedEnvCheckModule(app));
  if ((app.resources?.length ?? 0) > 0 || (app.workflows?.length ?? 0) > 0) {
    await writeGeneratedFile(resolve(targetPath, "src/lib/resources.ts"), renderGeneratedResourcesModule(app));
    await writeGeneratedFile(resolve(targetPath, "src/lib/server/resource-policy.ts"), renderGeneratedResourcePolicyModule(app));
  }
  if (hasGeneratedWorkflows(app)) {
    await writeGeneratedFile(resolve(targetPath, "src/lib/workflows.ts"), renderGeneratedWorkflowsModule(app));
    await writeGeneratedFile(resolve(targetPath, "src/lib/server/workflows.ts"), renderGeneratedWorkflowServerModule(app));
  }
  if ((app.resources?.length ?? 0) > 0) {
    await writeGeneratedResourceForms(app, targetPath);
    await writeGeneratedFile(resolve(targetPath, "src/lib/server/seed.ts"), renderGeneratedSeedModule(app));
    await writeGeneratedFile(resolve(targetPath, "scripts/seed.ts"), renderGeneratedSeedScript());
    await writeGeneratedFile(resolve(targetPath, "tests/factories/resources.ts"), renderGeneratedResourceFactories(app));
  }
  if (hasGeneratedAttachments(app)) {
    await writeGeneratedFile(resolve(targetPath, "src/lib/attachments.ts"), renderGeneratedAttachmentModule(app));
    await writeGeneratedFile(resolve(targetPath, "src/lib/server/attachments.ts"), renderGeneratedAttachmentServerModule(app));
  }

  if (app.database) {
    if (app.database.provider === "supabase") {
      await writeGeneratedFile(resolve(targetPath, "supabase/schema.sql"), renderGeneratedSupabaseSqlSchema(app));
      if ((app.resources?.length ?? 0) > 0 || hasGeneratedWorkflows(app)) {
        const policies = [
          renderGeneratedSupabasePoliciesSql(app),
          renderGeneratedSupabaseAttachmentPoliciesSql(app),
          renderGeneratedSupabaseWorkflowPoliciesSql(app),
        ]
          .filter(Boolean)
          .join("\n");
        await writeGeneratedFile(resolve(targetPath, "supabase/policies.sql"), policies);
      }
    } else {
      await writeGeneratedFile(resolve(targetPath, "src/lib/db.ts"), renderGeneratedDbModule(app));
      await writeGeneratedFile(resolve(targetPath, "src/lib/db/schema.ts"), renderGeneratedDbSchema(app));
      const relationsModule = renderGeneratedRelationsModule(app);
      if (relationsModule) {
        await writeGeneratedFile(resolve(targetPath, "src/lib/db/relations.ts"), relationsModule);
      }
      await writeGeneratedFile(resolve(targetPath, "drizzle.config.ts"), renderGeneratedDrizzleConfig(app));
    }
  }

  if (app.auth) {
    usedPageShells.add("auth");
    await writeGeneratedFile(resolve(targetPath, "src/routes/login.tsx"), renderGeneratedLoginRoute(app));

    if (app.auth.provider === "supabase") {
      await writeGeneratedFile(resolve(targetPath, "src/lib/supabase.ts"), renderGeneratedSupabaseServerModule());
      await writeGeneratedFile(resolve(targetPath, "src/lib/supabase-browser.ts"), renderGeneratedSupabaseBrowserModule());
      await writeGeneratedFile(resolve(targetPath, "src/lib/auth.ts"), renderGeneratedSupabaseAuthModule(app));
      await writeGeneratedFile(resolve(targetPath, "src/lib/auth-client.ts"), renderGeneratedSupabaseAuthClientModule(app));
      await writeGeneratedFile(resolve(targetPath, "src/lib/server/guards.ts"), renderGeneratedSupabaseAuthGuards());
      await writeGeneratedFile(resolve(targetPath, "src/middleware.ts"), renderGeneratedSupabaseMiddleware(app));
      await writeGeneratedFile(resolve(targetPath, "src/routes/auth/callback.ts"), renderGeneratedSupabaseAuthCallbackRoute());
      for (const [relativePath, source] of Object.entries(renderGeneratedSupabaseAuthApiRoutes())) {
        await writeGeneratedFile(resolve(targetPath, relativePath), source);
      }
    } else {
      await writeGeneratedFile(resolve(targetPath, "src/lib/auth.ts"), renderGeneratedAuthModule(app));
      await writeGeneratedFile(resolve(targetPath, "src/lib/auth-client.ts"), renderGeneratedAuthClientModule());
      await writeGeneratedFile(resolve(targetPath, "src/lib/auth-schema.config.ts"), renderGeneratedAuthSchemaConfig(app));
      await writeGeneratedFile(resolve(targetPath, "src/lib/db/auth-schema.ts"), renderGeneratedAuthSchemaPlaceholder());
      await writeGeneratedFile(resolve(targetPath, "src/lib/server/guards.ts"), renderGeneratedAuthGuards());
      await writeGeneratedFile(
        resolve(targetPath, "src/routes/api/auth/[...auth].ts"),
        await renderGeneratedAuthHandlerRoute(),
      );
      if (hasProtectedRoutes(app)) {
        await writeGeneratedFile(resolve(targetPath, "src/middleware.ts"), renderGeneratedAuthMiddleware(app));
      }
    }
  } else if (usesSupabaseBackend) {
    await writeGeneratedFile(resolve(targetPath, "src/lib/supabase.ts"), renderGeneratedSupabaseServerModule());
    await writeGeneratedFile(resolve(targetPath, "src/lib/supabase-browser.ts"), renderGeneratedSupabaseBrowserModule());
  }

  if (app.storage) {
    await writeGeneratedFile(resolve(targetPath, "src/lib/storage.ts"), renderGeneratedStorageModule(app));
  }

  const generatedServerModules = await writeGeneratedServerModules(app, targetPath);
  let generatedApiRoutes = await writeGeneratedApiRoutes(app, targetPath);
  if (hasGeneratedAttachments(app)) {
    const attachmentRoutes = renderGeneratedAttachmentApiRoutes();
    for (const [relativePath, source] of Object.entries(attachmentRoutes)) {
      await writeGeneratedFile(resolve(targetPath, relativePath), source);
    }
    generatedApiRoutes += Object.keys(attachmentRoutes).length;
  }

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
    await writeGeneratedFile(resolve(targetPath, routeFilePath(route.path, app.routes)), renderedRoute.source);
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

    if (app.auth?.provider === "better-auth") {
      await runGeneratedProjectScript(targetPath, "auth:generate");
      postGenerateSteps.push("auth:generate");
    }

    if (app.database?.provider !== "supabase" && app.database?.migrations === "drizzle-kit") {
      await runGeneratedProjectScript(targetPath, "db:generate");
      postGenerateSteps.push("db:generate");
    }
  }

  return {
    routes: app.routes.length,
    appShells: usedAppShells.size,
    pageShells: usedPageShells.size,
    layouts: usedLayouts.size,
    copiedFiles: seenImports.size,
    apiRoutes: generatedApiRoutes,
    serverModules: generatedServerModules,
    postGenerateSteps,
    installed: install,
  };
}

export async function generateFromSpec(specPath: string, targetPath: string, options?: { install?: boolean }) {
  const { path, spec } = await readSpecV10(specPath);
  const app = expandSpecToGeneratedApp(spec);
  const plan = createGenerationPlan(spec, app);
  const result = await generateFrontendDraftFromApp(app, targetPath, options);

  await writeGeneratedFile(resolve(targetPath, "stylyf.spec.json"), await readFile(path, "utf8"));
  await writeGeneratedFile(resolve(targetPath, "stylyf.plan.json"), `${JSON.stringify(plan, null, 2)}\n`);
  await writeGeneratedFile(resolve(targetPath, "HANDOFF.md"), renderHandoffMarkdown(plan));
  await writeGeneratedFile(resolve(targetPath, "SECURITY_NOTES.md"), renderSecurityNotesMarkdown(plan));
  await writeGeneratedFile(resolve(targetPath, "LOCAL_SMOKE.md"), renderLocalSmokeMarkdown(plan));
  await writeGeneratedFile(resolve(targetPath, "OPERATIONS.md"), renderGeneratedOperationsMarkdown(app));

  return {
    ...result,
    spec,
    plan,
  };
}
