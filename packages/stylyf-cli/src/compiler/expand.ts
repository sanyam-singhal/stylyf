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
import type { FieldSpec, FlowSpec, MediaAttachmentSpec, ObjectSpec, StylyfSpecV04, SurfaceSpec } from "../spec/types.js";
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
    .filter(route => route.access !== "public")
    .filter(route => route.shell !== "marketing-shell")
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
  const shell = shellForSurface(surface, fallbackShell);

  switch (surface.kind) {
    case "dashboard":
      return {
        path,
        shell,
        page: "dashboard",
        title: surface.name || "Dashboard",
        access: surface.audience === "public" ? "public" : "user",
        sections: dashboardSections(),
      };
    case "landing":
      return {
        path,
        shell: "marketing-shell",
        page: "blank",
        title: surface.name || "Home",
        access: "public",
        sections: [section("stack", [component("page-header"), component("empty-state")])],
      };
    case "list":
      return {
        path,
        shell,
        page: "resource-index",
        resource,
        title: surface.name || resourceTitle,
        access: surface.audience === "public" ? "public" : "user",
        sections: resourceListSections(resource),
      };
    case "detail":
      return {
        path,
        shell,
        page: "resource-detail",
        resource,
        title: surface.name || `${resourceTitle} detail`,
        access: surface.audience === "public" ? "public" : "user",
        sections: [section("stack", [component("page-header"), component("detail-panel")])],
      };
    case "create":
      return {
        path,
        shell,
        page: "resource-create",
        resource,
        title: surface.name || `Create ${titleFor(singularize(resource))}`,
        access: surface.audience === "public" ? "public" : "user",
        sections: [],
      };
    case "edit":
      return {
        path,
        shell,
        page: "resource-edit",
        resource,
        title: surface.name || `Edit ${titleFor(singularize(resource))}`,
        access: surface.audience === "public" ? "public" : "user",
        sections: [],
      };
    case "settings":
      return {
        path,
        shell,
        page: "settings",
        title: surface.name || "Settings",
        access: surface.audience === "public" ? "public" : "user",
        sections: [section("stack", [component("settings-panel"), component("settings-row")])],
      };
    case "content-index":
      if (surface.audience === "admin" || surface.audience === "editor") {
        return {
          path,
          shell: fallbackShell,
          page: "resource-index",
          resource,
          title: surface.name || "Content",
          access: "user",
          sections: resourceListSections(resource),
        };
      }
      return {
        path,
        shell: "marketing-shell",
        page: "blank",
        title: surface.name || resourceTitle,
        access: "public",
        sections: [section("stack", [component("section-header"), component("data-list")])],
      };
    case "content-detail":
      return {
        path,
        shell: "marketing-shell",
        page: "blank",
        title: surface.name || titleFor(singularize(resource)),
        access: "public",
        sections: [section("stack", [component("page-header"), component("separator")])],
      };
    case "tool":
      return {
        path,
        shell: "topbar-app",
        page: "blank",
        title: surface.name || "Tool",
        access: surface.audience === "user" || surface.audience === "admin" || surface.audience === "editor" ? "user" : "public",
        sections: [section("stack", [component("form-section"), component("progress"), component("toast")])],
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

function kindExpansionFor(spec: StylyfSpecV04): KindExpansion {
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

function routesFor(spec: StylyfSpecV04, resources: ResourceIR[], expansion: KindExpansion) {
  return mergeSurfaces(expansion.defaultSurfaces(spec, resources), spec.surfaces).map(surface => surfaceToRoute(surface, resources, expansion.shell));
}

export function expandSpecToGeneratedApp(spec: StylyfSpecV04): AppIR {
  const expansion = kindExpansionFor(spec);
  const resources = expansion.defaultObjects(spec).map(object => objectToResource(object, spec));
  const workflows = expansion.defaultFlows(spec, resources).map(flowToWorkflow);
  const routes = routesFor(spec, resources, expansion);
  const backend = backendFor(spec);

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
    database: backend.database,
    auth,
    storage: backend.storage,
    resources,
    workflows,
  };
}
