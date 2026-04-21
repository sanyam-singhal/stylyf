export type ThemePresetId = "amber" | "emerald" | "pearl" | "opal";
export type ThemeMode = "light" | "dark" | "system";
export type ThemeRadius = "edge" | "trim" | "soft" | "mellow";
export type ThemeDensity = "compact" | "comfortable" | "relaxed";
export type ThemeSpacing = "tight" | "balanced" | "airy";
export type DatabaseDialect = "postgres";
export type AuthProvider = "better-auth";
export type StorageProvider = "s3";
export type ApiRouteMethod = "GET" | "POST" | "PATCH" | "DELETE";
export type ApiRouteType = "json" | "webhook" | "presign-upload";
export type ServerModuleType = "query" | "action";
export type AuthAccess = "public" | "user";

export type AppShellId = "sidebar-app" | "topbar-app" | "docs-shell" | "marketing-shell";
export type PageShellId = "dashboard" | "resource-index" | "resource-detail" | "settings" | "auth" | "blank";
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
  children: Array<LayoutNodeIR | ComponentRefIR | string>;
};

export type RouteIR = {
  path: string;
  shell?: AppShellId;
  page: PageShellId;
  title?: string;
  sections: SectionIR[];
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
  dialect: DatabaseDialect;
  migrations?: "drizzle-kit";
  schema?: DatabaseSchemaIR[];
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
  auth?: AuthIR;
  storage?: StorageIR;
  apis?: ApiRouteIR[];
  server?: ServerModuleIR[];
};
