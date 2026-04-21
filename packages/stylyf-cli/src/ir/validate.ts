import type {
  ApiRouteIR,
  ApiRouteMethod,
  ApiRouteType,
  AppIR,
  AppShellId,
  AuthAccess,
  AuthProvider,
  ComponentRefIR,
  DatabaseDialect,
  LayoutNodeIR,
  LayoutNodeId,
  PageShellId,
  RouteIR,
  SectionIR,
  ServerModuleType,
  StorageProvider,
  ThemeDensity,
  ThemeMode,
  ThemePresetId,
  ThemeRadius,
  ThemeSpacing,
} from "./types.js";

export type ValidationResult = {
  ok: boolean;
  errors: string[];
};

const appShellIds = new Set<AppShellId>(["sidebar-app", "topbar-app", "docs-shell", "marketing-shell"]);
const pageShellIds = new Set<PageShellId>(["dashboard", "resource-index", "resource-detail", "settings", "auth", "blank"]);
const layoutIds = new Set<LayoutNodeId>(["stack", "row", "column", "grid", "split", "panel", "section", "toolbar", "content-frame"]);
const themePresets = new Set<ThemePresetId>(["amber", "emerald", "pearl", "opal"]);
const themeModes = new Set<ThemeMode>(["light", "dark", "system"]);
const themeRadii = new Set<ThemeRadius>(["edge", "trim", "soft", "mellow"]);
const themeDensity = new Set<ThemeDensity>(["compact", "comfortable", "relaxed"]);
const themeSpacing = new Set<ThemeSpacing>(["tight", "balanced", "airy"]);
const databaseDialects = new Set<DatabaseDialect>(["postgres"]);
const authProviders = new Set<AuthProvider>(["better-auth"]);
const storageProviders = new Set<StorageProvider>(["s3"]);
const apiRouteMethods = new Set<ApiRouteMethod>(["GET", "POST", "PATCH", "DELETE"]);
const apiRouteTypes = new Set<ApiRouteType>(["json", "webhook", "presign-upload"]);
const serverModuleTypes = new Set<ServerModuleType>(["query", "action"]);
const authAccess = new Set<AuthAccess>(["public", "user"]);
const databaseColumnTypes = new Set(["text", "varchar", "integer", "boolean", "timestamp", "jsonb", "uuid"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isLayoutNode(value: unknown): value is LayoutNodeIR {
  return isRecord(value) && typeof value.layout === "string";
}

function isComponentRef(value: unknown): value is ComponentRefIR {
  return isRecord(value) && typeof value.component === "string";
}

function validateChild(value: unknown, path: string, errors: string[]) {
  if (typeof value === "string") {
    return;
  }

  if (isLayoutNode(value)) {
    validateLayoutNode(value, path, errors);
    return;
  }

  if (isComponentRef(value)) {
    if (!value.component.trim()) {
      errors.push(`${path}.component must not be empty`);
    }
    if (value.props !== undefined && !isRecord(value.props)) {
      errors.push(`${path}.props must be an object when provided`);
    }
    if (value.items !== undefined && !Array.isArray(value.items)) {
      errors.push(`${path}.items must be an array when provided`);
    }
    return;
  }

  errors.push(`${path} must be a string, layout node, or component ref`);
}

function validateLayoutNode(node: LayoutNodeIR, path: string, errors: string[]) {
  if (!layoutIds.has(node.layout)) {
    errors.push(`${path}.layout must be one of ${[...layoutIds].join(", ")}`);
  }

  if (node.props !== undefined && !isRecord(node.props)) {
    errors.push(`${path}.props must be an object when provided`);
  }

  if (node.children !== undefined) {
    if (!Array.isArray(node.children)) {
      errors.push(`${path}.children must be an array when provided`);
    } else {
      node.children.forEach((child, index) => validateChild(child, `${path}.children[${index}]`, errors));
    }
  }
}

function validateSection(section: SectionIR, path: string, errors: string[]) {
  if (!layoutIds.has(section.layout)) {
    errors.push(`${path}.layout must be one of ${[...layoutIds].join(", ")}`);
  }

  if (!Array.isArray(section.children) || section.children.length === 0) {
    errors.push(`${path}.children must be a non-empty array`);
    return;
  }

  section.children.forEach((child, index) => validateChild(child, `${path}.children[${index}]`, errors));
}

function validateRoute(route: RouteIR, path: string, errors: string[], seenPaths: Set<string>) {
  if (!route.path || !route.path.startsWith("/")) {
    errors.push(`${path}.path must start with '/'`);
  } else if (route.path === "/api" || route.path.startsWith("/api/")) {
    errors.push(`${path}.path must not use the /api namespace`);
  } else if (seenPaths.has(route.path)) {
    errors.push(`${path}.path duplicates an earlier route: ${route.path}`);
  } else {
    seenPaths.add(route.path);
  }

  if (!pageShellIds.has(route.page)) {
    errors.push(`${path}.page must be one of ${[...pageShellIds].join(", ")}`);
  }

  if (route.shell !== undefined && !appShellIds.has(route.shell)) {
    errors.push(`${path}.shell must be one of ${[...appShellIds].join(", ")}`);
  }

  if (!Array.isArray(route.sections) || route.sections.length === 0) {
    errors.push(`${path}.sections must be a non-empty array`);
    return;
  }

  route.sections.forEach((section, index) => validateSection(section, `${path}.sections[${index}]`, errors));
}

function validateEnv(value: Record<string, unknown>, errors: string[]) {
  if (value.extras !== undefined) {
    if (!Array.isArray(value.extras)) {
      errors.push("env.extras must be an array when provided");
    } else {
      value.extras.forEach((entry, index) => {
        if (!isRecord(entry)) {
          errors.push(`env.extras[${index}] must be an object`);
          return;
        }

        if (typeof entry.name !== "string" || !entry.name.trim()) {
          errors.push(`env.extras[${index}].name must be a non-empty string`);
        }

        if (entry.exposure !== undefined && entry.exposure !== "server" && entry.exposure !== "public") {
          errors.push(`env.extras[${index}].exposure must be 'server' or 'public'`);
        }

        if (entry.required !== undefined && typeof entry.required !== "boolean") {
          errors.push(`env.extras[${index}].required must be a boolean when provided`);
        }
      });
    }
  }
}

function validateDatabase(value: Record<string, unknown>, errors: string[]) {
  if (!databaseDialects.has(value.dialect as DatabaseDialect)) {
    errors.push(`database.dialect must be one of ${[...databaseDialects].join(", ")}`);
  }

  if (value.migrations !== undefined && value.migrations !== "drizzle-kit") {
    errors.push("database.migrations must be 'drizzle-kit' when provided");
  }

  if (value.schema !== undefined) {
    if (!Array.isArray(value.schema)) {
      errors.push("database.schema must be an array when provided");
    } else {
      value.schema.forEach((table, tableIndex) => {
        if (!isRecord(table)) {
          errors.push(`database.schema[${tableIndex}] must be an object`);
          return;
        }

        if (typeof table.table !== "string" || !table.table.trim()) {
          errors.push(`database.schema[${tableIndex}].table must be a non-empty string`);
        }

        if (!Array.isArray(table.columns) || table.columns.length === 0) {
          errors.push(`database.schema[${tableIndex}].columns must be a non-empty array`);
        } else {
          table.columns.forEach((column, columnIndex) => {
            if (!isRecord(column)) {
              errors.push(`database.schema[${tableIndex}].columns[${columnIndex}] must be an object`);
              return;
            }

            if (typeof column.name !== "string" || !column.name.trim()) {
              errors.push(`database.schema[${tableIndex}].columns[${columnIndex}].name must be a non-empty string`);
            }

            if (!databaseColumnTypes.has(String(column.type ?? ""))) {
              errors.push(
                `database.schema[${tableIndex}].columns[${columnIndex}].type must be one of ${[...databaseColumnTypes].join(", ")}`,
              );
            }
          });
        }
      });
    }
  }
}

function validateAuth(value: Record<string, unknown>, errors: string[]) {
  if (!authProviders.has(value.provider as AuthProvider)) {
    errors.push(`auth.provider must be one of ${[...authProviders].join(", ")}`);
  }

  if (value.mode !== undefined && value.mode !== "session") {
    errors.push("auth.mode must be 'session' when provided");
  }

  if (value.features !== undefined) {
    if (!isRecord(value.features)) {
      errors.push("auth.features must be an object when provided");
    } else {
      for (const key of ["emailPassword", "magicLink"] as const) {
        if (value.features[key] !== undefined && typeof value.features[key] !== "boolean") {
          errors.push(`auth.features.${key} must be a boolean when provided`);
        }
      }
    }
  }

  if (value.protect !== undefined) {
    if (!Array.isArray(value.protect)) {
      errors.push("auth.protect must be an array when provided");
    } else {
      value.protect.forEach((entry, index) => {
        if (!isRecord(entry)) {
          errors.push(`auth.protect[${index}] must be an object`);
          return;
        }

        if (typeof entry.target !== "string" || !entry.target.trim()) {
          errors.push(`auth.protect[${index}].target must be a non-empty string`);
        }

        if (!["route", "api", "server"].includes(String(entry.kind ?? ""))) {
          errors.push(`auth.protect[${index}].kind must be one of route, api, server`);
        }

        if (!authAccess.has(entry.access as AuthAccess)) {
          errors.push(`auth.protect[${index}].access must be one of ${[...authAccess].join(", ")}`);
        }
      });
    }
  }
}

function validateStorage(value: Record<string, unknown>, errors: string[]) {
  if (!storageProviders.has(value.provider as StorageProvider)) {
    errors.push(`storage.provider must be one of ${[...storageProviders].join(", ")}`);
  }

  if (value.mode !== undefined && value.mode !== "presigned-put") {
    errors.push("storage.mode must be 'presigned-put' when provided");
  }

  if (value.bucketAlias !== undefined && (typeof value.bucketAlias !== "string" || !value.bucketAlias.trim())) {
    errors.push("storage.bucketAlias must be a non-empty string when provided");
  }
}

function validateApiRoute(route: ApiRouteIR, path: string, errors: string[], seenPaths: Set<string>, authEnabled: boolean) {
  if (!route.path || !route.path.startsWith("/api/")) {
    errors.push(`${path}.path must start with '/api/'`);
  } else if (route.path === "/api/auth/[...auth]") {
    errors.push(`${path}.path is reserved for the generated Better Auth handler`);
  } else if (seenPaths.has(route.path)) {
    errors.push(`${path}.path duplicates an earlier API route: ${route.path}`);
  } else {
    seenPaths.add(route.path);
  }

  if (!apiRouteMethods.has(route.method)) {
    errors.push(`${path}.method must be one of ${[...apiRouteMethods].join(", ")}`);
  }

  if (!apiRouteTypes.has(route.type)) {
    errors.push(`${path}.type must be one of ${[...apiRouteTypes].join(", ")}`);
  }

  if (!route.name.trim()) {
    errors.push(`${path}.name must be a non-empty string`);
  }

  if (route.auth !== undefined && !authAccess.has(route.auth)) {
    errors.push(`${path}.auth must be one of ${[...authAccess].join(", ")}`);
  }

  if (route.auth === "user" && !authEnabled) {
    errors.push(`${path}.auth cannot require a user session when auth is not enabled`);
  }
}

function validateServerModule(value: Record<string, unknown>, path: string, errors: string[], seenNames: Set<string>, authEnabled: boolean) {
  if (typeof value.name !== "string" || !value.name.trim()) {
    errors.push(`${path}.name must be a non-empty string`);
  } else if (seenNames.has(value.name)) {
    errors.push(`${path}.name duplicates an earlier server module: ${value.name}`);
  } else {
    seenNames.add(value.name);
  }

  if (!serverModuleTypes.has(value.type as ServerModuleType)) {
    errors.push(`${path}.type must be one of ${[...serverModuleTypes].join(", ")}`);
  }

  if (value.resource !== undefined && (typeof value.resource !== "string" || !value.resource.trim())) {
    errors.push(`${path}.resource must be a non-empty string when provided`);
  }

  if (value.auth !== undefined && !authAccess.has(value.auth as AuthAccess)) {
    errors.push(`${path}.auth must be one of ${[...authAccess].join(", ")}`);
  }

  if (value.auth === "user" && !authEnabled) {
    errors.push(`${path}.auth cannot require a user session when auth is not enabled`);
  }
}

export function validateAppIr(value: unknown): ValidationResult {
  const errors: string[] = [];

  if (!isRecord(value)) {
    return { ok: false, errors: ["App IR must be a JSON object"] };
  }

  if (typeof value.name !== "string" || !value.name.trim()) {
    errors.push("name must be a non-empty string");
  }

  if (typeof value.shell !== "string" || !appShellIds.has(value.shell as AppShellId)) {
    errors.push(`shell must be one of ${[...appShellIds].join(", ")}`);
  }

  if (!isRecord(value.theme)) {
    errors.push("theme must be an object");
  } else {
    if (!themePresets.has(value.theme.preset as ThemePresetId)) {
      errors.push(`theme.preset must be one of ${[...themePresets].join(", ")}`);
    }
    if (!themeModes.has(value.theme.mode as ThemeMode)) {
      errors.push(`theme.mode must be one of ${[...themeModes].join(", ")}`);
    }
    if (!themeRadii.has(value.theme.radius as ThemeRadius)) {
      errors.push(`theme.radius must be one of ${[...themeRadii].join(", ")}`);
    }
    if (!themeDensity.has(value.theme.density as ThemeDensity)) {
      errors.push(`theme.density must be one of ${[...themeDensity].join(", ")}`);
    }
    if (!themeSpacing.has(value.theme.spacing as ThemeSpacing)) {
      errors.push(`theme.spacing must be one of ${[...themeSpacing].join(", ")}`);
    }
    if (!isRecord(value.theme.fonts)) {
      errors.push("theme.fonts must be an object");
    } else {
      for (const key of ["fancy", "sans", "mono"] as const) {
        if (typeof value.theme.fonts[key] !== "string" || !value.theme.fonts[key]?.trim()) {
          errors.push(`theme.fonts.${key} must be a non-empty string`);
        }
      }
    }
  }

  if (!Array.isArray(value.routes) || value.routes.length === 0) {
    errors.push("routes must be a non-empty array");
  } else {
    const seenPaths = new Set<string>();
    value.routes.forEach((route, index) => validateRoute(route as RouteIR, `routes[${index}]`, errors, seenPaths));
  }

  if (value.env !== undefined) {
    if (!isRecord(value.env)) {
      errors.push("env must be an object when provided");
    } else {
      validateEnv(value.env, errors);
    }
  }

  if (value.database !== undefined) {
    if (!isRecord(value.database)) {
      errors.push("database must be an object when provided");
    } else {
      validateDatabase(value.database, errors);
    }
  }

  if (value.auth !== undefined) {
    if (!isRecord(value.auth)) {
      errors.push("auth must be an object when provided");
    } else {
      validateAuth(value.auth, errors);
    }
  }

  if (value.storage !== undefined) {
    if (!isRecord(value.storage)) {
      errors.push("storage must be an object when provided");
    } else {
      validateStorage(value.storage, errors);
    }
  }

  const authEnabled = isRecord(value.auth);

  if (value.apis !== undefined) {
    if (!Array.isArray(value.apis)) {
      errors.push("apis must be an array when provided");
    } else {
      const seenApiPaths = new Set<string>();
      value.apis.forEach((route, index) => {
        if (!isRecord(route)) {
          errors.push(`apis[${index}] must be an object`);
          return;
        }

        validateApiRoute(route as ApiRouteIR, `apis[${index}]`, errors, seenApiPaths, authEnabled);
      });
    }
  }

  if (value.server !== undefined) {
    if (!Array.isArray(value.server)) {
      errors.push("server must be an array when provided");
    } else {
      const seenServerNames = new Set<string>();
      value.server.forEach((entry, index) => {
        if (!isRecord(entry)) {
          errors.push(`server[${index}] must be an object`);
          return;
        }

        validateServerModule(entry, `server[${index}]`, errors, seenServerNames, authEnabled);
      });
    }
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

export function assertValidAppIr(value: unknown): asserts value is AppIR {
  const result = validateAppIr(value);

  if (!result.ok) {
    throw new Error(result.errors.join("\n"));
  }
}
