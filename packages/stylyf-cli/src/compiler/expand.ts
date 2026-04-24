import type {
  AppIR,
  AuthIR,
  ComponentRefIR,
  DatabaseIR,
  LayoutNodeIR,
  ResourceAttachmentIR,
  ResourceFieldIR,
  ResourceIR,
  RouteIR,
  SectionIR,
  StorageIR,
  WorkflowIR,
} from "./generated-app.js";
import { defaultTheme, humanize, singularize } from "./defaults.js";
import type { FieldSpec, FlowSpec, MediaAttachmentSpec, ObjectSpec, StylyfSpecV04 } from "../spec/types.js";

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

function fieldToResourceField(field: FieldSpec): ResourceFieldIR {
  const base = {
    name: field.name,
    required: field.required,
    unique: field.unique,
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
  };
}

function defaultMediaAttachments(spec: StylyfSpecV04): ResourceAttachmentIR[] {
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

function objectToResource(object: ObjectSpec, spec: StylyfSpecV04): ResourceIR {
  const ownership = object.ownership ?? (spec.app.kind === "cms-site" ? "user" : "user");
  const visibility = object.visibility ?? (spec.app.kind === "cms-site" ? "mixed" : "private");
  const fields = object.fields?.map(fieldToResourceField) ?? [
    { name: "title", type: "varchar", required: true },
    { name: "status", type: "enum", enumValues: ["draft", "review", "approved"] },
    { name: "summary", type: "longtext" },
  ];
  const explicitMedia = object.media?.map(attachmentFromSpec);

  return {
    name: object.name,
    visibility,
    fields,
    ownership:
      ownership === "none"
        ? { model: "none" }
        : ownership === "workspace"
          ? { model: "workspace", workspaceField: "workspace_id" }
          : { model: "user", ownerField: spec.app.kind === "cms-site" ? "author_id" : "owner_id" },
    access:
      visibility === "public" || visibility === "mixed"
        ? {
            list: "owner-or-public",
            read: "owner-or-public",
            create: "user",
            update: "owner",
            delete: "owner",
          }
        : {
            list: ownership === "none" ? "user" : "owner",
            read: ownership === "none" ? "user" : "owner",
            create: "user",
            update: ownership === "none" ? "user" : "owner",
            delete: ownership === "none" ? "user" : "owner",
          },
    attachments: explicitMedia ?? defaultMediaAttachments(spec),
  };
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
    field: "status",
    initial: states[0] ?? "draft",
    states,
    transitions:
      flow.transitions?.map(transition => ({
        name: transition.name,
        from: transition.from,
        to: transition.to,
        actor: "owner",
        emits: [`${flow.object}.${transition.name}`],
        notifies: ["owner"],
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

function backendFor(spec: StylyfSpecV04): { database?: DatabaseIR; auth?: AuthIR; storage?: StorageIR } {
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

function protectedRoutes(routes: RouteIR[]) {
  return routes
    .filter(route => route.path !== "/" || route.shell !== "marketing-shell")
    .filter(route => !route.path.startsWith("/articles/"))
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

function internalToolRoutes(resources: ResourceIR[]): RouteIR[] {
  const primary = resources[0]?.name ?? "records";
  return [
    { path: "/", page: "dashboard", title: "Overview", sections: dashboardSections() },
    ...resources.flatMap(resource => [
      { path: `/${slugify(resource.name)}`, page: "resource-index" as const, resource: resource.name, title: titleFor(resource.name), sections: resourceListSections(resource.name) },
      { path: `/${slugify(resource.name)}/new`, page: "resource-create" as const, resource: resource.name, title: `Create ${titleFor(singularize(resource.name))}`, sections: [] },
      { path: `/${slugify(resource.name)}/:id/edit`, page: "resource-edit" as const, resource: resource.name, title: `Edit ${titleFor(singularize(resource.name))}`, sections: [] },
    ]),
    {
      path: "/settings",
      page: "settings",
      title: "Settings",
      sections: [section("stack", [component("settings-panel"), component("settings-row")])],
    },
  ];
}

function cmsRoutes(resources: ResourceIR[]): RouteIR[] {
  const article = resources.find(resource => resource.name === "articles") ?? resources[0];
  const articleName = article?.name ?? "articles";
  return [
    {
      path: "/",
      shell: "marketing-shell",
      page: "blank",
      title: "Home",
      sections: [section("stack", [component("page-header"), component("empty-state")])],
    },
    {
      path: "/articles",
      shell: "marketing-shell",
      page: "blank",
      title: "Articles",
      sections: [section("stack", [component("section-header"), component("data-list")])],
    },
    {
      path: "/articles/:slug",
      shell: "marketing-shell",
      page: "blank",
      title: "Article",
      sections: [section("stack", [component("page-header"), component("separator")])],
    },
    {
      path: "/admin/content",
      page: "resource-index",
      resource: articleName,
      title: "Content",
      sections: resourceListSections(articleName),
    },
    { path: "/admin/content/new", page: "resource-create", resource: articleName, title: "Create content", sections: [] },
    { path: "/admin/content/:id/edit", page: "resource-edit", resource: articleName, title: "Edit content", sections: [] },
  ];
}

function freeToolRoutes(hasSavedResults: boolean): RouteIR[] {
  return [
    {
      path: "/",
      shell: "marketing-shell",
      page: "blank",
      title: "Home",
      sections: [section("stack", [component("page-header"), component("empty-state")])],
    },
    {
      path: "/tool",
      shell: "topbar-app",
      page: "blank",
      title: "Tool",
      sections: [section("stack", [component("form-section"), component("progress"), component("toast")])],
    },
    ...(hasSavedResults
      ? [
          { path: "/dashboard", page: "dashboard" as const, title: "Dashboard", sections: dashboardSections() },
          {
            path: "/settings",
            page: "settings" as const,
            title: "Settings",
            sections: [section("stack", [component("settings-panel"), component("settings-row")])],
          },
        ]
      : []),
  ];
}

function defaultObjectsFor(spec: StylyfSpecV04): ObjectSpec[] {
  if (spec.objects && spec.objects.length > 0) {
    return spec.objects;
  }

  if (spec.app.kind === "cms-site") {
    return [
      {
        name: "articles",
        ownership: "user",
        visibility: "mixed",
        fields: [
          { name: "title", type: "short-text", required: true },
          { name: "slug", type: "slug", required: true, unique: true },
          { name: "excerpt", type: "long-text" },
          { name: "body", type: "rich-text" },
          { name: "status", type: "status", options: ["draft", "review", "published", "archived"] },
          { name: "published_at", type: "datetime" },
        ],
      },
    ];
  }

  if (spec.app.kind === "free-saas-tool") {
    const hasSavedResults = (spec.flows ?? []).some(flow => flow.kind === "saved-results");
    return hasSavedResults
      ? [
          {
            name: "tool_runs",
            ownership: "user",
            visibility: "private",
            fields: [
              { name: "input", type: "json" },
              { name: "output", type: "json" },
              { name: "status", type: "status", options: ["queued", "complete", "failed"] },
            ],
          },
        ]
      : [];
  }

  return [
    {
      name: "records",
      ownership: "user",
      visibility: "private",
      fields: [
        { name: "title", type: "short-text", required: true },
        { name: "status", type: "status", options: ["draft", "review", "approved"] },
        { name: "summary", type: "long-text" },
      ],
    },
  ];
}

function defaultFlowsFor(spec: StylyfSpecV04, resources: ResourceIR[]): FlowSpec[] {
  if (spec.flows && spec.flows.length > 0) {
    return spec.flows;
  }

  const primary = resources[0]?.name;
  if (!primary) {
    return [];
  }

  if (spec.app.kind === "cms-site") {
    return [{ name: "contentPublishing", object: primary, kind: "publishing" }];
  }

  return [];
}

function routesFor(spec: StylyfSpecV04, resources: ResourceIR[]) {
  if (spec.app.kind === "cms-site") {
    return cmsRoutes(resources);
  }
  if (spec.app.kind === "free-saas-tool") {
    return freeToolRoutes(resources.some(resource => resource.name === "tool_runs"));
  }
  return internalToolRoutes(resources);
}

export function expandSpecToGeneratedApp(spec: StylyfSpecV04): AppIR {
  const resources = defaultObjectsFor(spec).map(object => objectToResource(object, spec));
  const workflows = defaultFlowsFor(spec, resources).map(flowToWorkflow);
  const routes = routesFor(spec, resources);
  const backend = backendFor(spec);
  const shell = spec.app.kind === "cms-site" ? "sidebar-app" : spec.app.kind === "free-saas-tool" ? "topbar-app" : "sidebar-app";

  const auth = backend.auth
    ? {
        ...backend.auth,
        protect: protectedRoutes(routes),
      }
    : undefined;

  return {
    name: spec.app.name,
    shell,
    theme: defaultTheme(spec),
    routes,
    database: backend.database,
    auth,
    storage: backend.storage,
    resources,
    workflows,
  };
}
