export type ThemePresetId = "amber" | "emerald" | "pearl" | "opal";
export type ThemeMode = "light" | "dark" | "system";
export type ThemeRadius = "edge" | "trim" | "soft" | "mellow";
export type ThemeDensity = "compact" | "comfortable" | "relaxed";
export type ThemeSpacing = "tight" | "balanced" | "airy";
export type DatabaseDialect = "postgres" | "sqlite";
export type DatabaseProvider = "drizzle" | "supabase";
export type AuthProvider = "better-auth" | "supabase";
export type StorageProvider = "s3";
export type ApiRouteMethod = "GET" | "POST" | "PATCH" | "DELETE";
export type ApiRouteType = "json" | "webhook" | "presign-upload";
export type ServerModuleType = "query" | "action";
export type AuthAccess = "public" | "user";
export type BindingKind =
  | "resource.list"
  | "resource.detail"
  | "resource.create"
  | "resource.update"
  | "workflow.transition"
  | "attachment.lifecycle";

export type AppShellId = "sidebar-app" | "topbar-app" | "docs-shell" | "marketing-shell";
export type PageShellId =
  | "dashboard"
  | "resource-index"
  | "resource-detail"
  | "resource-create"
  | "resource-edit"
  | "settings"
  | "auth"
  | "blank";
export type LayoutNodeId = "stack" | "row" | "column" | "grid" | "split" | "panel" | "section" | "toolbar" | "content-frame";

export type ThemeIR = {
  preset: ThemePresetId;
  mode: ThemeMode;
  radius: ThemeRadius;
  density: ThemeDensity;
  spacing: ThemeSpacing;
  fonts: {
    fancy: string;
    sans: string;
    mono: string;
  };
};

export type ComponentRefIR = {
  component: string;
  variant?: string;
  props?: Record<string, unknown>;
  items?: Record<string, unknown>[];
};

export type LayoutNodeIR = {
  layout: LayoutNodeId;
  props?: Record<string, string | number | boolean>;
  children?: Array<LayoutNodeIR | ComponentRefIR | string>;
};

export type SectionIR = {
  id?: string;
  layout: LayoutNodeId;
  props?: Record<string, string | number | boolean>;
  children: Array<LayoutNodeIR | ComponentRefIR | string>;
};

export type RouteIR = {
  path: string;
  shell?: AppShellId;
  page: PageShellId;
  resource?: string;
  title?: string;
  access?: AuthAccess;
  bindings?: BindingIR[];
  sections: SectionIR[];
};

export type BindingIR = {
  name?: string;
  kind: BindingKind;
  resource?: string;
  workflow?: string;
  transition?: string;
  attachment?: string;
  source?: {
    section?: string;
    component?: string;
  };
};

export type EnvVarIR = {
  name: string;
  exposure?: "server" | "public";
  required?: boolean;
  example?: string;
  description?: string;
};

export type EnvIR = {
  extras?: EnvVarIR[];
};

export type DatabaseColumnType =
  | "text"
  | "varchar"
  | "integer"
  | "boolean"
  | "timestamp"
  | "jsonb"
  | "uuid";

export type ResourceFieldType =
  | DatabaseColumnType
  | "longtext"
  | "date"
  | "enum";

export type ResourceOwnershipModel = "none" | "user" | "workspace";
export type ResourceAccessPreset = "public" | "user" | "owner" | "owner-or-public" | "workspace-member" | "admin";
export type ResourceVisibilityPreset = "private" | "public" | "mixed";
export type ResourceRelationKind = "belongs-to" | "has-many" | "many-to-many";
export type ResourceAttachmentKind = "file" | "image" | "video" | "audio" | "document";
export type WorkflowNotificationAudience = "owner" | "workspace" | "watchers" | "admins";

export type DatabaseSchemaIR = {
  table: string;
  columns: Array<{
    name: string;
    type: DatabaseColumnType;
    nullable?: boolean;
    primaryKey?: boolean;
    unique?: boolean;
  }>;
  timestamps?: boolean;
};

export type DatabaseIR = {
  provider?: DatabaseProvider;
  dialect?: DatabaseDialect;
  migrations?: "drizzle-kit";
  schema?: DatabaseSchemaIR[];
};

export type ResourceFieldIR = {
  name: string;
  type: ResourceFieldType;
  required?: boolean;
  unique?: boolean;
  indexed?: boolean;
  primaryKey?: boolean;
  enumValues?: string[];
};

export type ResourceOwnershipIR = {
  model: ResourceOwnershipModel;
  ownerField?: string;
  workspaceField?: string;
  membershipTable?: string;
  roleField?: string;
};

export type ResourceAccessIR = {
  list?: ResourceAccessPreset;
  read?: ResourceAccessPreset;
  create?: ResourceAccessPreset;
  update?: ResourceAccessPreset;
  delete?: ResourceAccessPreset;
};

export type ResourceRelationIR = {
  target: string;
  kind: ResourceRelationKind;
  field?: string;
  through?: string;
};

export type ResourceAttachmentIR = {
  name: string;
  kind: ResourceAttachmentKind;
  multiple?: boolean;
  required?: boolean;
  bucketAlias?: string;
  metadataTable?: string;
};

export type ResourceIR = {
  name: string;
  table?: string;
  visibility?: ResourceVisibilityPreset;
  fields?: ResourceFieldIR[];
  ownership?: ResourceOwnershipIR;
  access?: ResourceAccessIR;
  relations?: ResourceRelationIR[];
  attachments?: ResourceAttachmentIR[];
  workflow?: string;
};

export type RolePolicyIR = {
  name: string;
  description?: string;
};

export type MembershipPolicyIR = {
  name: string;
  table: string;
  userField: string;
  workspaceField: string;
  roleField: string;
  roles: string[];
};

export type ActorPolicyIR = {
  actor: string;
  role?: string;
  membership?: string;
};

export type PolicyIR = {
  roles: RolePolicyIR[];
  memberships: MembershipPolicyIR[];
  actors: ActorPolicyIR[];
};

export type WorkflowTransitionIR = {
  name: string;
  from: string | string[];
  to: string;
  actor?: ResourceAccessPreset;
  emits?: string[];
  notifies?: WorkflowNotificationAudience[];
};

export type WorkflowIR = {
  name: string;
  resource: string;
  field?: string;
  initial: string;
  states: string[];
  transitions: WorkflowTransitionIR[];
};

export type AuthProtectionIR = {
  target: string;
  kind: "route" | "api" | "server";
  access: AuthAccess;
};

export type AuthIR = {
  provider: AuthProvider;
  mode?: "session";
  features?: {
    emailPassword?: boolean;
    emailOtp?: boolean;
    magicLink?: boolean;
  };
  protect?: AuthProtectionIR[];
};

export type StorageIR = {
  provider: StorageProvider;
  mode?: "presigned-put";
  bucketAlias?: string;
};

export type ApiRouteIR = {
  path: string;
  method: ApiRouteMethod;
  type: ApiRouteType;
  name: string;
  auth?: AuthAccess;
};

export type ServerModuleIR = {
  name: string;
  type: ServerModuleType;
  resource?: string;
  auth?: AuthAccess;
};

export type AppIR = {
  name: string;
  shell: AppShellId;
  theme: ThemeIR;
  routes: RouteIR[];
  env?: EnvIR;
  database?: DatabaseIR;
  policies?: PolicyIR;
  resources?: ResourceIR[];
  workflows?: WorkflowIR[];
  auth?: AuthIR;
  storage?: StorageIR;
  apis?: ApiRouteIR[];
  server?: ServerModuleIR[];
};
