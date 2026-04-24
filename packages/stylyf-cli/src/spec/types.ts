export type AppKind = "generic" | "internal-tool" | "cms-site" | "free-saas-tool";
export type BackendMode = "portable" | "hosted";
export type MediaMode = "none" | "basic" | "rich";
export type ActorKind = "public" | "user" | "member" | "admin" | "editor" | "owner";
export type FieldType =
  | "short-text"
  | "long-text"
  | "rich-text"
  | "number"
  | "boolean"
  | "date"
  | "datetime"
  | "status"
  | "slug"
  | "json";
export type FlowKind = "crud" | "approval" | "publishing" | "onboarding" | "saved-results";
export type SurfaceKind =
  | "dashboard"
  | "list"
  | "detail"
  | "create"
  | "edit"
  | "settings"
  | "landing"
  | "content-index"
  | "content-detail"
  | "tool";
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
export type AuthAccess = "public" | "user";
export type ResourceAccessPreset = "public" | "user" | "owner" | "owner-or-public" | "workspace-member" | "admin";
export type ResourceRelationKind = "belongs-to" | "has-many" | "many-to-many";
export type WorkflowNotificationAudience = "owner" | "workspace" | "watchers" | "admins";
export type ApiRouteMethod = "GET" | "POST" | "PATCH" | "DELETE";
export type ApiRouteType = "json" | "webhook" | "presign-upload";
export type ServerModuleType = "query" | "action";
export type EnvExposure = "server" | "public";
export type DatabaseColumnType = "text" | "varchar" | "integer" | "boolean" | "timestamp" | "jsonb" | "uuid";

export type ActorSpec = {
  name: string;
  kind?: ActorKind;
  description?: string;
};

export type FieldSpec = {
  name: string;
  label?: string;
  type: FieldType;
  required?: boolean;
  unique?: boolean;
  options?: string[];
};

export type MediaAttachmentSpec = {
  name: string;
  kind?: "file" | "image" | "video" | "audio" | "document";
  multiple?: boolean;
  required?: boolean;
  bucketAlias?: string;
  metadataTable?: string;
};

export type ResourceAccessSpec = {
  list?: ResourceAccessPreset;
  read?: ResourceAccessPreset;
  create?: ResourceAccessPreset;
  update?: ResourceAccessPreset;
  delete?: ResourceAccessPreset;
};

export type ResourceRelationSpec = {
  target: string;
  kind: ResourceRelationKind;
  field?: string;
  through?: string;
};

export type ObjectSpec = {
  name: string;
  table?: string;
  label?: string;
  purpose?: string;
  ownership?: "none" | "user" | "workspace";
  visibility?: "private" | "public" | "mixed";
  access?: ResourceAccessSpec;
  relations?: ResourceRelationSpec[];
  fields?: FieldSpec[];
  media?: MediaAttachmentSpec[];
};

export type FlowSpec = {
  name: string;
  object: string;
  kind: FlowKind;
  field?: string;
  states?: string[];
  transitions?: Array<{
    name: string;
    from: string | string[];
    to: string;
    actor?: string;
    emits?: string[];
    notifies?: WorkflowNotificationAudience[];
  }>;
};

export type ComponentSpec = {
  component: string;
  variant?: string;
  props?: Record<string, unknown>;
  items?: Record<string, unknown>[];
};

export type LayoutSpec = {
  layout: LayoutNodeId;
  props?: Record<string, string | number | boolean>;
  children?: Array<LayoutSpec | ComponentSpec | string>;
};

export type SectionSpec = {
  id?: string;
  layout: LayoutNodeId;
  props?: Record<string, string | number | boolean>;
  children: Array<LayoutSpec | ComponentSpec | string>;
};

export type SurfaceSpec = {
  name: string;
  kind: SurfaceKind;
  object?: string;
  path?: string;
  audience?: "public" | "user" | "admin" | "editor";
  shell?: AppShellId;
  page?: PageShellId;
  title?: string;
  sections?: SectionSpec[];
};

export type RouteSpec = {
  path: string;
  shell?: AppShellId;
  page: PageShellId;
  resource?: string;
  title?: string;
  access?: AuthAccess;
  sections?: SectionSpec[];
};

export type EnvVarSpec = {
  name: string;
  exposure?: EnvExposure;
  required?: boolean;
  example?: string;
  description?: string;
};

export type DatabaseSchemaSpec = {
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

export type ApiRouteSpec = {
  path: string;
  method: ApiRouteMethod;
  type: ApiRouteType;
  name: string;
  auth?: AuthAccess;
};

export type ServerModuleSpec = {
  name: string;
  type: ServerModuleType;
  resource?: string;
  auth?: AuthAccess;
};

export type StylyfSpecV04 = {
  version: "0.4";
  app: {
    name: string;
    kind: AppKind;
    description?: string;
  };
  backend: {
    mode: BackendMode;
    portable?: {
      database?: "sqlite" | "postgres";
    };
  };
  database?: {
    schema?: DatabaseSchemaSpec[];
  };
  env?: {
    extras?: EnvVarSpec[];
  };
  media?: {
    mode: MediaMode;
  };
  experience?: {
    theme?: "amber" | "emerald" | "pearl" | "opal";
    mode?: "light" | "dark" | "system";
    density?: "compact" | "comfortable" | "relaxed";
    spacing?: "tight" | "balanced" | "airy";
    radius?: "edge" | "trim" | "soft" | "mellow";
  };
  actors?: ActorSpec[];
  objects?: ObjectSpec[];
  flows?: FlowSpec[];
  surfaces?: SurfaceSpec[];
  routes?: RouteSpec[];
  apis?: ApiRouteSpec[];
  server?: ServerModuleSpec[];
};
