import type {
  ApiRouteMethod,
  ApiRouteType,
  AppKind,
  AppShellId,
  AuthAccess,
  BackendMode,
  DatabaseColumnType,
  EnvExposure,
  FieldType,
  FlowKind,
  LayoutNodeId,
  MediaMode,
  PageShellId,
  ResourceAccessPreset,
  ResourceRelationKind,
  ServerModuleType,
  SurfaceKind,
  WorkflowNotificationAudience,
} from "./types.js";

export const appKinds = ["generic", "internal-tool", "cms-site", "free-saas-tool"] as const satisfies readonly AppKind[];
export const backendModes = ["portable", "hosted"] as const satisfies readonly BackendMode[];
export const mediaModes = ["none", "basic", "rich"] as const satisfies readonly MediaMode[];
export const fieldTypes = [
  "short-text",
  "long-text",
  "rich-text",
  "number",
  "boolean",
  "date",
  "datetime",
  "status",
  "slug",
  "json",
] as const satisfies readonly FieldType[];
export const flowKinds = ["crud", "approval", "publishing", "onboarding", "saved-results"] as const satisfies readonly FlowKind[];
export const surfaceKinds = [
  "dashboard",
  "list",
  "detail",
  "create",
  "edit",
  "settings",
  "landing",
  "content-index",
  "content-detail",
  "tool",
] as const satisfies readonly SurfaceKind[];

export const actorKinds = ["public", "user", "member", "admin", "editor", "owner"] as const;
export const ownershipModels = ["none", "user", "workspace"] as const;
export const visibilityModes = ["private", "public", "mixed"] as const;
export const attachmentKinds = ["file", "image", "video", "audio", "document"] as const;
export const themes = ["amber", "emerald", "pearl", "opal"] as const;
export const themeModes = ["light", "dark", "system"] as const;
export const densities = ["compact", "comfortable", "relaxed"] as const;
export const spacings = ["tight", "balanced", "airy"] as const;
export const radii = ["edge", "trim", "soft", "mellow"] as const;
export const audiences = ["public", "user", "admin", "editor"] as const;
export const portableDatabases = ["sqlite", "postgres"] as const;
export const appShells = ["sidebar-app", "topbar-app", "docs-shell", "marketing-shell"] as const satisfies readonly AppShellId[];
export const pageShells = [
  "dashboard",
  "resource-index",
  "resource-detail",
  "resource-create",
  "resource-edit",
  "settings",
  "auth",
  "blank",
] as const satisfies readonly PageShellId[];
export const layoutNodes = ["stack", "row", "column", "grid", "split", "panel", "section", "toolbar", "content-frame"] as const satisfies readonly LayoutNodeId[];
export const authAccessLevels = ["public", "user"] as const satisfies readonly AuthAccess[];
export const resourceAccessPresets = ["public", "user", "owner", "owner-or-public", "workspace-member", "admin"] as const satisfies readonly ResourceAccessPreset[];
export const relationKinds = ["belongs-to", "has-many", "many-to-many"] as const satisfies readonly ResourceRelationKind[];
export const workflowNotificationAudiences = ["owner", "workspace", "watchers", "admins"] as const satisfies readonly WorkflowNotificationAudience[];
export const apiRouteMethods = ["GET", "POST", "PATCH", "DELETE"] as const satisfies readonly ApiRouteMethod[];
export const apiRouteTypes = ["json", "webhook", "presign-upload"] as const satisfies readonly ApiRouteType[];
export const serverModuleTypes = ["query", "action"] as const satisfies readonly ServerModuleType[];
export const envExposures = ["server", "public"] as const satisfies readonly EnvExposure[];
export const databaseColumnTypes = ["text", "varchar", "integer", "boolean", "timestamp", "jsonb", "uuid"] as const satisfies readonly DatabaseColumnType[];
