import type {
  AppIR,
  AuthIR,
  BindingIR,
  ComponentRefIR,
  DatabaseIR,
  LayoutNodeIR,
  NavigationIR,
  PolicyIR,
  ResourceAccessPreset,
  ResourceAttachmentIR,
  ResourceFieldIR,
  ResourceIR,
  RouteIR,
  SectionIR,
  StorageIR,
  WorkflowIR,
} from "./generated-app.js";
import { defaultTheme, humanize, singularize } from "./defaults.js";
import type {
  ComponentSpec,
  BindingSpec,
  FieldSpec,
  FlowSpec,
  LayoutSpec,
  MediaAttachmentSpec,
  ObjectSpec,
  PolicySpec,
  RouteSpec,
  SectionSpec,
  StylyfSpecV10,
  SurfaceSpec,
} from "../spec/types.js";
import { genericExpansion } from "./kinds/generic.js";
import { internalToolExpansion } from "./kinds/internal-tool.js";
import { cmsSiteExpansion } from "./kinds/cms-site.js";
import { freeSaasToolExpansion } from "./kinds/free-saas-tool.js";
import type { KindExpansion } from "./kinds/common.js";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function titleFor(value: string) {
  return humanize(value);
}

function component(component: string, props?: Record<string, unknown>): ComponentRefIR {
  return props ? { component, props } : { component };
}

function section(layout: SectionIR["layout"], children: SectionIR["children"], id?: string): SectionIR {
  return {
    id,
    layout,
    children,
  };
}

function panel(children: Array<LayoutNodeIR | ComponentRefIR | string>, props?: Record<string, string | number | boolean>): LayoutNodeIR {
  return {
    layout: "panel",
    props,
    children,
  };
}

function isComponentSpec(node: LayoutSpec | ComponentSpec): node is ComponentSpec {
  return "component" in node;
}

function componentFromSpec(node: ComponentSpec): ComponentRefIR {
  return {
    component: node.component,
    variant: node.variant,
    props: node.props,
    items: node.items,
  };
}

function bindingFromSpec(binding: BindingSpec, source?: BindingIR["source"]): BindingIR {
  return {
    name: binding.name,
    kind: binding.kind,
    resource: binding.resource,
    workflow: binding.workflow,
    transition: binding.transition,
    attachment: binding.attachment,
    source:
      source || binding.section || binding.component
        ? {
            section: source?.section ?? binding.section,
            component: source?.component ?? binding.component,
          }
        : undefined,
  };
}

function collectBindingsFromCompositionNode(node: LayoutSpec | ComponentSpec | string, target: BindingIR[], sectionId?: string) {
  if (typeof node === "string") {
    return;
  }

  if (isComponentSpec(node)) {
    target.push(...(node.bindings ?? []).map(binding => bindingFromSpec(binding, { section: sectionId, component: node.component })));
    return;
  }

  target.push(...(node.bindings ?? []).map(binding => bindingFromSpec(binding, { section: sectionId })));
  for (const child of node.children ?? []) {
    collectBindingsFromCompositionNode(child, target, sectionId);
  }
}

function collectBindingsFromSections(sections?: SectionSpec[]) {
  const bindings: BindingIR[] = [];
  for (const sectionSpec of sections ?? []) {
    bindings.push(...(sectionSpec.bindings ?? []).map(binding => bindingFromSpec(binding, { section: sectionSpec.id })));
    for (const child of sectionSpec.children) {
      collectBindingsFromCompositionNode(child, bindings, sectionSpec.id);
    }
  }
  return bindings;
}

function compositionNodeFromSpec(node: LayoutSpec | ComponentSpec | string): LayoutNodeIR | ComponentRefIR | string {
  if (typeof node === "string") {
    return node;
  }

  if (isComponentSpec(node)) {
    return componentFromSpec(node);
  }

  return {
    layout: node.layout,
    props: node.props,
    children: node.children?.map(compositionNodeFromSpec),
  };
}

function sectionFromSpec(spec: SectionSpec): SectionIR {
  return {
    id: spec.id,
    layout: spec.layout,
    props: spec.props,
    children: spec.children.map(compositionNodeFromSpec),
  };
}

function sectionsFromSpec(sections?: SectionSpec[]) {
  return sections?.map(sectionFromSpec);
}

function fieldToResourceField(field: FieldSpec): ResourceFieldIR {
  const base = {
    name: field.name,
    required: field.required,
    unique: field.unique,
    indexed: field.indexed,
    default: field.default,
  };

  switch (field.type) {
    case "short-text":
    case "slug":
      return { ...base, type: "varchar" };
    case "long-text":
    case "rich-text":
      return { ...base, type: "longtext" };
    case "number":
      return { ...base, type: "integer" };
    case "boolean":
      return { ...base, type: "boolean" };
    case "date":
    case "datetime":
      return { ...base, type: "date" };
    case "status":
      return { ...base, type: "enum", enumValues: field.options ?? ["draft", "active", "archived"] };
    case "json":
      return { ...base, type: "jsonb" };
  }
}

function attachmentFromSpec(attachment: MediaAttachmentSpec): ResourceAttachmentIR {
  return {
    name: attachment.name,
    kind: attachment.kind ?? "file",
    multiple: attachment.multiple,
    required: attachment.required,
    bucketAlias: attachment.bucketAlias,
    metadataTable: attachment.metadataTable,
  };
}

function defaultMediaAttachments(spec: StylyfSpecV10): ResourceAttachmentIR[] {
  const mode = spec.media?.mode ?? "none";
  if (mode === "none") {
    return [];
  }
  if (mode === "basic") {
    return [{ name: "upload", kind: "file" }];
  }
  return [
    { name: "coverImage", kind: "image" },
    { name: "sourceFiles", kind: "document", multiple: true },
  ];
}

function objectToResource(object: ObjectSpec, spec: StylyfSpecV10, policies?: PolicyIR): ResourceIR {
  const ownership = object.ownership ?? (spec.app.kind === "cms-site" ? "user" : "user");
  const visibility = object.visibility ?? (spec.app.kind === "cms-site" ? "mixed" : "private");
  const membership = defaultMembership(policies);
  const fields = object.fields?.map(fieldToResourceField) ?? [
    { name: "title", type: "varchar", required: true },
    { name: "status", type: "enum", enumValues: ["draft", "review", "approved"] },
    { name: "summary", type: "longtext" },
  ];
  const explicitMedia = object.media?.map(attachmentFromSpec);
  const defaultAccess =
    visibility === "public" || visibility === "mixed"
      ? {
          list: "owner-or-public" as const,
          read: "owner-or-public" as const,
          create: "user" as const,
          update: "owner" as const,
          delete: "owner" as const,
        }
      : {
          list: ownership === "workspace" ? ("workspace-member" as const) : ownership === "none" ? ("user" as const) : ("owner" as const),
          read: ownership === "workspace" ? ("workspace-member" as const) : ownership === "none" ? ("user" as const) : ("owner" as const),
          create: ownership === "workspace" ? ("workspace-member" as const) : ("user" as const),
          update: ownership === "workspace" ? ("workspace-member" as const) : ownership === "none" ? ("user" as const) : ("owner" as const),
          delete: ownership === "workspace" ? ("workspace-member" as const) : ownership === "none" ? ("user" as const) : ("owner" as const),
        };

  return {
    name: object.name,
    table: object.table,
    visibility,
    fields,
    ownership:
      ownership === "none"
        ? { model: "none" }
        : ownership === "workspace"
          ? {
              model: "workspace",
              membershipTable: membership?.table ?? "workspace_memberships",
              workspaceField: membership?.workspaceField ?? "workspace_id",
              roleField: membership?.roleField ?? "role",
            }
          : { model: "user", ownerField: spec.app.kind === "cms-site" ? "author_id" : "owner_id" },
    access: {
      ...defaultAccess,
      ...(object.access ?? {}),
    },
    relations: object.relations,
    attachments: explicitMedia ?? defaultMediaAttachments(spec),
  };
}

function transitionActor(actor?: string): ResourceAccessPreset {
  switch (actor) {
    case "public":
    case "user":
    case "owner":
    case "owner-or-public":
    case "workspace-member":
    case "admin":
      return actor;
    case "member":
    case "editor":
      return "workspace-member";
    default:
      return actor ? "user" : "owner";
  }
}

function flowToWorkflow(flow: FlowSpec): WorkflowIR {
  const states =
    flow.states ??
    (flow.kind === "publishing"
      ? ["draft", "review", "published", "archived"]
      : flow.kind === "approval"
        ? ["draft", "review", "approved"]
        : flow.kind === "onboarding"
          ? ["started", "configured", "complete"]
          : ["draft", "active", "archived"]);

  return {
    name: flow.name,
    resource: flow.object,
    field: flow.field ?? "status",
    initial: states[0] ?? "draft",
    states,
    transitions:
      flow.transitions?.map(transition => ({
        name: transition.name,
        from: transition.from,
        to: transition.to,
        actor: transitionActor(transition.actor),
        emits: transition.emits ?? [`${flow.object}.${transition.name}`],
        notifies: transition.notifies ?? ["owner"],
      })) ??
      states.slice(1).map((state, index) => ({
        name: `moveTo${titleFor(state).replace(/\s+/g, "")}`,
        from: states[index] ?? states[0] ?? "draft",
        to: state,
        actor: "owner",
        emits: [`${flow.object}.${state}`],
        notifies: ["owner"],
      })),
  };
}

function backendFor(spec: StylyfSpecV10): { database?: DatabaseIR; auth?: AuthIR; storage?: StorageIR } {
  const storage = (spec.media?.mode ?? "none") === "none" ? undefined : { provider: "s3" as const, mode: "presigned-put" as const, bucketAlias: "uploads" };

  if (spec.backend.mode === "hosted") {
    return {
      database: { provider: "supabase" },
      auth: {
        provider: "supabase",
        mode: "session",
        features: { emailPassword: true, emailOtp: true },
      },
      storage,
    };
  }

  return {
    database: {
      provider: "drizzle",
      dialect: spec.backend.portable?.database ?? "sqlite",
      migrations: "drizzle-kit",
    },
    auth: {
      provider: "better-auth",
      mode: "session",
      features: { emailPassword: true },
    },
    storage,
  };
}

function policiesFromSpec(policy?: PolicySpec): PolicyIR | undefined {
  const roles = policy?.roles?.map(role => ({ name: role.name, description: role.description })) ?? [
    { name: "admin", description: "Full privileged operator role. Generated code requires an explicit membership row before this grants access." },
    { name: "editor", description: "Content/editorial operator role. Generated code requires an explicit membership row before this grants access." },
    { name: "member", description: "Default workspace member role." },
  ];

  const memberships =
    policy?.memberships?.map(membership => ({
      name: membership.name ?? "workspace",
      table: membership.table ?? "workspace_memberships",
      userField: membership.userField ?? "user_id",
      workspaceField: membership.workspaceField ?? "workspace_id",
      roleField: membership.roleField ?? "role",
      roles: membership.roles ?? roles.map(role => role.name),
    })) ?? [
      {
        name: "workspace",
        table: "workspace_memberships",
        userField: "user_id",
        workspaceField: "workspace_id",
        roleField: "role",
        roles: roles.map(role => role.name),
      },
    ];

  const actors = policy?.actors?.map(actor => ({ actor: actor.actor, role: actor.role, membership: actor.membership })) ?? [
    { actor: "admin", role: "admin", membership: memberships[0]?.name },
    { actor: "editor", role: "editor", membership: memberships[0]?.name },
    { actor: "member", role: "member", membership: memberships[0]?.name },
  ];

  return { roles, memberships, actors };
}

function defaultMembership(policy: PolicyIR | undefined) {
  return policy?.memberships[0];
}

function protectedRoutes(routes: RouteIR[]) {
  return routes
    .filter(route => route.access !== "public")
    .map(route => ({
      target: route.path,
      kind: "route" as const,
      access: "user" as const,
    }));
}

function resourceListSections(resource: string): SectionIR[] {
  return [
    section("stack", [
      component("page-header", { title: titleFor(resource), description: `Manage ${titleFor(resource).toLowerCase()} records.` }),
      component("filter-toolbar"),
      component("data-table-shell"),
      component("detail-panel"),
    ]),
  ];
}

function dashboardSections(): SectionIR[] {
  return [
    section("grid", [component("stat-card"), component("stat-grid")], "overview"),
    section("grid", [panel([component("activity-feed")]), panel([component("notification-list")])], "activity"),
  ];
}

function primaryResourceName(resources: ResourceIR[], surface?: Pick<SurfaceSpec, "object">) {
  return surface?.object ?? resources[0]?.name ?? "records";
}

function surfaceDefaultPath(surface: SurfaceSpec, resources: ResourceIR[]) {
  const resource = primaryResourceName(resources, surface);
  const slug = slugify(resource);

  switch (surface.kind) {
    case "dashboard":
      return "/";
    case "landing":
      return "/";
    case "list":
      return `/${slug}`;
    case "detail":
      return `/${slug}/:id`;
    case "create":
      return `/${slug}/new`;
    case "edit":
      return `/${slug}/:id/edit`;
    case "settings":
      return "/settings";
    case "content-index":
      return surface.audience === "admin" || surface.audience === "editor" ? "/admin/content" : `/${slug}`;
    case "content-detail":
      return `/${slug}/:slug`;
    case "tool":
      return "/tool";
  }
}

function shellForSurface(surface: SurfaceSpec, fallbackShell: RouteIR["shell"]): RouteIR["shell"] {
  if (surface.audience === "admin" || surface.audience === "editor" || surface.audience === "user") {
    return fallbackShell;
  }
  if (surface.audience === "public" || surface.kind === "landing" || surface.kind === "content-index" || surface.kind === "content-detail") {
    return "marketing-shell";
  }
  if (surface.kind === "tool") {
    return "topbar-app";
  }
  return fallbackShell;
}

function surfaceToRoute(surface: SurfaceSpec, resources: ResourceIR[], fallbackShell?: RouteIR["shell"]): RouteIR {
  const resource = primaryResourceName(resources, surface);
  const resourceTitle = titleFor(resource);
  const path = surface.path ?? surfaceDefaultPath(surface, resources);
  const shell = surface.shell ?? shellForSurface(surface, fallbackShell);
  const explicitSections = sectionsFromSpec(surface.sections);
  const bindings = [...(surface.bindings ?? []).map(binding => bindingFromSpec(binding)), ...collectBindingsFromSections(surface.sections)];

  switch (surface.kind) {
    case "dashboard":
      return {
        path,
        shell,
        page: surface.page ?? "dashboard",
        title: surface.title ?? surface.name ?? "Dashboard",
        access: surface.audience === "public" ? "public" : "user",
        bindings,
        metadata: surface.metadata,
        sections: explicitSections ?? dashboardSections(),
      };
    case "landing":
      return {
        path,
        shell,
        page: surface.page ?? "blank",
        title: surface.title ?? surface.name ?? "Home",
        access: "public",
        bindings,
        metadata: surface.metadata,
        sections: explicitSections ?? [section("stack", [component("page-header"), component("empty-state")])],
      };
    case "list":
      return {
        path,
        shell,
        page: surface.page ?? "resource-index",
        resource,
        title: surface.title ?? surface.name ?? resourceTitle,
        access: surface.audience === "public" ? "public" : "user",
        bindings,
        metadata: surface.metadata,
        sections: explicitSections ?? resourceListSections(resource),
      };
    case "detail":
      return {
        path,
        shell,
        page: surface.page ?? "resource-detail",
        resource,
        title: surface.title ?? surface.name ?? `${resourceTitle} detail`,
        access: surface.audience === "public" ? "public" : "user",
        bindings,
        metadata: surface.metadata,
        sections: explicitSections ?? [section("stack", [component("page-header"), component("detail-panel")])],
      };
    case "create":
      return {
        path,
        shell,
        page: surface.page ?? "resource-create",
        resource,
        title: surface.title ?? surface.name ?? `Create ${titleFor(singularize(resource))}`,
        access: surface.audience === "public" ? "public" : "user",
        bindings,
        metadata: surface.metadata,
        sections: explicitSections ?? [],
      };
    case "edit":
      return {
        path,
        shell,
        page: surface.page ?? "resource-edit",
        resource,
        title: surface.title ?? surface.name ?? `Edit ${titleFor(singularize(resource))}`,
        access: surface.audience === "public" ? "public" : "user",
        bindings,
        metadata: surface.metadata,
        sections: explicitSections ?? [],
      };
    case "settings":
      return {
        path,
        shell,
        page: surface.page ?? "settings",
        title: surface.title ?? surface.name ?? "Settings",
        access: surface.audience === "public" ? "public" : "user",
        bindings,
        metadata: surface.metadata,
        sections: explicitSections ?? [section("stack", [component("settings-panel"), component("settings-row")])],
      };
    case "content-index":
      if (surface.audience === "admin" || surface.audience === "editor") {
        return {
          path,
          shell,
          page: surface.page ?? "resource-index",
          resource,
          title: surface.title ?? surface.name ?? "Content",
          access: "user",
          bindings,
          metadata: surface.metadata,
          sections: explicitSections ?? resourceListSections(resource),
        };
      }
      return {
        path,
        shell,
        page: surface.page ?? "blank",
        title: surface.title ?? surface.name ?? resourceTitle,
        access: "public",
        bindings,
        metadata: surface.metadata,
        sections: explicitSections ?? [section("stack", [component("section-header"), component("data-list")])],
      };
    case "content-detail":
      return {
        path,
        shell,
        page: surface.page ?? "blank",
        title: surface.title ?? surface.name ?? titleFor(singularize(resource)),
        access: "public",
        bindings,
        metadata: surface.metadata,
        sections: explicitSections ?? [section("stack", [component("page-header"), component("separator")])],
      };
    case "tool":
      return {
        path,
        shell,
        page: surface.page ?? "blank",
        title: surface.title ?? surface.name ?? "Tool",
        access: surface.audience === "user" || surface.audience === "admin" || surface.audience === "editor" ? "user" : "public",
        bindings,
        metadata: surface.metadata,
        sections: explicitSections ?? [section("stack", [component("form-section"), component("progress"), component("toast")])],
      };
  }
}

function mergeSurfaces(defaults: SurfaceSpec[], overrides?: SurfaceSpec[]) {
  if (!overrides || overrides.length === 0) {
    return defaults;
  }

  const merged = new Map<string, SurfaceSpec>();
  for (const surface of defaults) {
    merged.set(surface.path ?? `${surface.kind}:${surface.object ?? ""}:${surface.name}`, surface);
  }
  for (const surface of overrides) {
    merged.set(surface.path ?? `${surface.kind}:${surface.object ?? ""}:${surface.name}`, surface);
  }
  return [...merged.values()];
}

function kindExpansionFor(spec: StylyfSpecV10): KindExpansion {
  switch (spec.app.kind) {
    case "generic":
      return genericExpansion;
    case "internal-tool":
      return internalToolExpansion;
    case "cms-site":
      return cmsSiteExpansion;
    case "free-saas-tool":
      return freeSaasToolExpansion;
  }
}

function routeFromSpec(route: RouteSpec, fallbackShell: RouteIR["shell"]): RouteIR {
  const shell = route.shell ?? fallbackShell;
  const bindings = [...(route.bindings ?? []).map(binding => bindingFromSpec(binding)), ...collectBindingsFromSections(route.sections)];

  return {
    path: route.path,
    shell,
    page: route.page,
    resource: route.resource,
    title: route.title,
    access: route.access ?? "user",
    bindings,
    metadata: route.metadata,
    sections: sectionsFromSpec(route.sections) ?? [],
  };
}

function mergeRoutes(defaults: RouteIR[], overrides?: RouteIR[]) {
  if (!overrides || overrides.length === 0) {
    return defaults;
  }

  const merged = new Map<string, RouteIR>();
  for (const route of defaults) {
    merged.set(route.path, route);
  }
  for (const route of overrides) {
    merged.set(route.path, route);
  }
  return [...merged.values()];
}

function routesFor(spec: StylyfSpecV10, resources: ResourceIR[], expansion: KindExpansion) {
  const surfaceRoutes = mergeSurfaces(expansion.defaultSurfaces(spec, resources), spec.surfaces).map(surface =>
    surfaceToRoute(surface, resources, expansion.shell),
  );
  const explicitRoutes = spec.routes?.map(route => routeFromSpec(route, expansion.shell));
  return mergeRoutes(surfaceRoutes, explicitRoutes);
}

function navigationFor(spec: StylyfSpecV10, routes: RouteIR[]): NavigationIR {
  const routeItems = routes
    .filter(route => !route.path.includes(":") && route.page !== "auth")
    .map(route => ({
      label: route.title ?? titleFor(route.path.replace(/^\/$/, "home").replace(/^\/+/, "")),
      href: route.path,
      group: route.access === "public" ? "Public" : "App",
      auth: route.access ?? "user",
    }));

  return {
    primary: spec.navigation?.primary ?? routeItems,
    secondary: spec.navigation?.secondary ?? [],
    userMenu: spec.navigation?.userMenu ?? [{ label: "Settings", href: "/settings", auth: "user" }],
    commandMenu: spec.navigation?.commandMenu ?? routeItems.map(item => ({ ...item, command: true })),
  };
}

export function expandSpecToGeneratedApp(spec: StylyfSpecV10): AppIR {
  const expansion = kindExpansionFor(spec);
  const policies = policiesFromSpec(spec.policies);
  const resources = expansion.defaultObjects(spec).map(object => objectToResource(object, spec, policies));
  const workflows = expansion.defaultFlows(spec, resources).map(flowToWorkflow);
  const routes = routesFor(spec, resources, expansion);
  const navigation = navigationFor(spec, routes);
  const backend = backendFor(spec);
  const database = backend.database
    ? {
        ...backend.database,
        schema: spec.database?.schema,
      }
    : undefined;

  const auth = backend.auth
    ? {
        ...backend.auth,
        protect: protectedRoutes(routes),
      }
    : undefined;

  return {
    name: spec.app.name,
    shell: expansion.shell,
    theme: defaultTheme(spec),
    routes,
    env: spec.env,
    database,
    policies,
    navigation,
    auth,
    storage: backend.storage,
    resources,
    workflows,
    apis: spec.apis,
    server: spec.server,
    fixtures: spec.fixtures,
  };
}
