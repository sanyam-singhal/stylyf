import type {
  AppIR,
  AuthAccess,
  DatabaseColumnType,
  DatabaseSchemaIR,
  ResourceAccessPreset,
  ResourceFieldIR,
  ResourceIR,
  ServerModuleIR,
} from "../../ir/types.js";

function camelCase(value: string) {
  return value
    .split(/[^a-zA-Z0-9]+/g)
    .filter(Boolean)
    .map((segment, index) =>
      index === 0 ? `${segment[0]?.toLowerCase() ?? ""}${segment.slice(1)}` : `${segment[0]?.toUpperCase() ?? ""}${segment.slice(1)}`,
    )
    .join("");
}

function uniqueByName<T extends { name: string }>(items: T[]) {
  const seen = new Set<string>();
  return items.filter(item => {
    if (seen.has(item.name)) {
      return false;
    }
    seen.add(item.name);
    return true;
  });
}

export function tableNameFor(resource: ResourceIR) {
  return resource.table ?? resource.name;
}

export function assetTableNameFor(resource: ResourceIR) {
  return `${tableNameFor(resource)}_assets`;
}

function toDatabaseColumnType(field: ResourceFieldIR): DatabaseColumnType {
  switch (field.type) {
    case "longtext":
      return "text";
    case "date":
      return "timestamp";
    case "enum":
      return "varchar";
    default:
      return field.type;
  }
}

function toSchemaColumn(field: ResourceFieldIR): DatabaseSchemaIR["columns"][number] {
  return {
    name: field.name,
    type: toDatabaseColumnType(field),
    nullable: field.required === true ? false : true,
    primaryKey: field.primaryKey,
    unique: field.unique,
  };
}

function appendMissingColumn(
  columns: DatabaseSchemaIR["columns"],
  column: DatabaseSchemaIR["columns"][number],
) {
  if (!columns.some(existing => existing.name === column.name)) {
    columns.push(column);
  }
}

function deriveSchemaTable(resource: ResourceIR): DatabaseSchemaIR {
  const columns: DatabaseSchemaIR["columns"] = (resource.fields ?? []).map(toSchemaColumn);

  if (!columns.some(column => column.primaryKey)) {
    appendMissingColumn(columns, {
      name: "id",
      type: "uuid",
      primaryKey: true,
    });
  }

  if (resource.ownership?.model === "user") {
    appendMissingColumn(columns, {
      name: resource.ownership.ownerField ?? "owner_id",
      type: "uuid",
    });
  }

  if (resource.ownership?.model === "workspace") {
    appendMissingColumn(columns, {
      name: resource.ownership.workspaceField ?? "workspace_id",
      type: "uuid",
    });
  }

  if (
    resource.visibility === "mixed" ||
    resource.access?.list === "owner-or-public" ||
    resource.access?.read === "owner-or-public"
  ) {
    appendMissingColumn(columns, {
      name: "is_public",
      type: "boolean",
      nullable: true,
    });
  }

  for (const relation of resource.relations ?? []) {
    if (relation.kind === "belongs-to" && relation.field) {
      appendMissingColumn(columns, {
        name: relation.field,
        type: "uuid",
      });
    }
  }

  return {
    table: tableNameFor(resource),
    columns,
    timestamps: true,
  };
}

function deriveAttachmentSchemaTables(resource: ResourceIR): DatabaseSchemaIR[] {
  if (!resource.attachments || resource.attachments.length === 0) {
    return [];
  }

  return [
    {
      table: assetTableNameFor(resource),
      columns: [
        {
          name: "id",
          type: "uuid",
          primaryKey: true,
        },
        {
          name: "resource_id",
          type: "uuid",
        },
        {
          name: "attachment_name",
          type: "varchar",
        },
        {
          name: "bucket_alias",
          type: "varchar",
        },
        {
          name: "object_key",
          type: "varchar",
          unique: true,
        },
        {
          name: "object_url",
          type: "text",
          nullable: true,
        },
        {
          name: "file_name",
          type: "varchar",
          nullable: true,
        },
        {
          name: "content_type",
          type: "varchar",
          nullable: true,
        },
        {
          name: "file_size",
          type: "integer",
          nullable: true,
        },
        {
          name: "kind",
          type: "varchar",
        },
        {
          name: "status",
          type: "varchar",
        },
        {
          name: "metadata",
          type: "jsonb",
          nullable: true,
        },
        {
          name: "replaced_by_asset_id",
          type: "uuid",
          nullable: true,
        },
        {
          name: "deleted_at",
          type: "timestamp",
          nullable: true,
        },
      ],
      timestamps: true,
    },
  ];
}

function accessToAuth(access?: ResourceAccessPreset): AuthAccess {
  return access === undefined || access === "public" ? "public" : "user";
}

function deriveServerModules(resource: ResourceIR): ServerModuleIR[] {
  const base = resource.name;
  return [
    {
      name: `${base}.list`,
      type: "query",
      resource: tableNameFor(resource),
      auth: accessToAuth(resource.access?.list ?? resource.access?.read),
    },
    {
      name: `${base}.detail`,
      type: "query",
      resource: tableNameFor(resource),
      auth: accessToAuth(resource.access?.read),
    },
    {
      name: `${base}.create`,
      type: "action",
      resource: tableNameFor(resource),
      auth: accessToAuth(resource.access?.create),
    },
    {
      name: `${base}.update`,
      type: "action",
      resource: tableNameFor(resource),
      auth: accessToAuth(resource.access?.update),
    },
    {
      name: `${base}.delete`,
      type: "action",
      resource: tableNameFor(resource),
      auth: accessToAuth(resource.access?.delete),
    },
  ];
}

export function materializeAppForGeneration(app: AppIR): AppIR {
  if (!app.resources || app.resources.length === 0) {
    return app;
  }

  const existingSchema = app.database?.schema ?? [];
  const existingTables = new Set(existingSchema.map(table => table.table));
  const derivedSchema = app.resources
    .flatMap(resource => [deriveSchemaTable(resource), ...deriveAttachmentSchemaTables(resource)])
    .filter(table => !existingTables.has(table.table));

  const existingServer = app.server ?? [];
  const existingServerNames = new Set(existingServer.map(entry => entry.name));
  const derivedServer = app.resources
    .flatMap(resource => deriveServerModules(resource))
    .filter(module => !existingServerNames.has(module.name));

  return {
    ...app,
    database: app.database
      ? {
          ...app.database,
          schema: [...existingSchema, ...derivedSchema],
        }
      : app.database,
    server: [...existingServer, ...derivedServer],
  };
}

export function renderGeneratedResourcesModule(app: AppIR) {
  const resources = app.resources ?? [];
  const workflows = app.workflows ?? [];
  const attachments = resources
    .filter(resource => (resource.attachments?.length ?? 0) > 0)
    .map(resource => ({
      resource: resource.name,
      table: assetTableNameFor(resource),
      attachments: resource.attachments ?? [],
    }));

  return [
    "export const resourceDefinitions = " + JSON.stringify(resources, null, 2) + " as const;",
    "",
    "export const attachmentDefinitions = " + JSON.stringify(attachments, null, 2) + " as const;",
    "",
    "export const workflowDefinitions = " + JSON.stringify(workflows, null, 2) + " as const;",
    "",
    "export const resourcesByName = Object.fromEntries(resourceDefinitions.map(resource => [resource.name, resource]));",
    "export const attachmentsByResource = Object.fromEntries(attachmentDefinitions.map(entry => [entry.resource, entry]));",
    "export const workflowsByName = Object.fromEntries(workflowDefinitions.map(workflow => [workflow.name, workflow]));",
    "",
  ].join("\n");
}

export function renderGeneratedResourcePolicyModule(app: AppIR) {
  const policies = (app.resources ?? []).map(resource => ({
    name: resource.name,
    table: tableNameFor(resource),
    visibility: resource.visibility ?? "private",
    ownership: resource.ownership ?? { model: "none" },
    access: resource.access ?? {},
  }));

  return [
    'import { getSession, requireSession } from "~/lib/server/guards";',
    "",
    "function extractUserId(session: unknown) {",
    "  if (!session || typeof session !== \"object\") return null;",
    "  const record = session as { user?: { id?: string | null }; session?: { userId?: string | null } };",
    "  return record.user?.id ?? record.session?.userId ?? null;",
    "}",
    "",
    "export const resourcePolicies = " + JSON.stringify(policies, null, 2) + " as const;",
    "",
    "export async function getViewerIdentity() {",
    "  const session = await getSession();",
    "  return { session, userId: extractUserId(session) };",
    "}",
    "",
    "export async function requireViewerIdentity() {",
    "  const session = await requireSession();",
    "  const userId = extractUserId(session);",
    "  if (!userId) {",
    '    throw new Error("Authenticated session is missing a user id.");',
    "  }",
    "  return { session, userId };",
    "}",
    "",
  ].join("\n");
}

function schemaExportName(tableName: string) {
  return camelCase(tableName);
}

function schemaPropertyName(fieldName: string) {
  return camelCase(fieldName);
}

function relationExportName(resource: ResourceIR) {
  return `${camelCase(tableNameFor(resource))}Relations`;
}

export function renderGeneratedRelationsModule(app: AppIR) {
  const resources = uniqueByName(app.resources ?? []);
  const relatedResources = resources.filter(resource => (resource.relations ?? []).length > 0);
  const resourceTableLookup = new Map(resources.map(resource => [resource.name, tableNameFor(resource)]));

  if (relatedResources.length === 0) {
    return "";
  }

  const imports = new Set<string>(["relations"]);
  const schemaImports = new Set<string>();

  const blocks = relatedResources.map(resource => {
    const sourceExport = schemaExportName(tableNameFor(resource));
    schemaImports.add(sourceExport);

    const relationEntries = (resource.relations ?? [])
      .map(relation => {
        if (relation.kind === "belongs-to") {
          const targetExport = schemaExportName(resourceTableLookup.get(relation.target) ?? relation.target);
          schemaImports.add(targetExport);
          return `    ${camelCase(relation.target)}: one(${targetExport}, { fields: [${sourceExport}.${schemaPropertyName(relation.field ?? "id")}], references: [${targetExport}.id] }),`;
        }

        if (relation.kind === "has-many") {
          const targetExport = schemaExportName(resourceTableLookup.get(relation.target) ?? relation.target);
          schemaImports.add(targetExport);
          return `    ${camelCase(relation.target)}: many(${targetExport}),`;
        }

        const throughExport = schemaExportName(resourceTableLookup.get(relation.through ?? relation.target) ?? (relation.through ?? relation.target));
        schemaImports.add(throughExport);
        return `    ${camelCase(relation.target)}: many(${throughExport}),`;
      })
      .join("\n");

    const relationHelpers = (resource.relations ?? []).some(relation => relation.kind === "belongs-to")
      ? "{ one, many }"
      : "{ many }";

    return [
      `export const ${relationExportName(resource)} = relations(${sourceExport}, (${relationHelpers}) => ({`,
      relationEntries,
      "}));",
      "",
    ].join("\n");
  });

  return [
    `import { ${[...imports].sort().join(", ")} } from "drizzle-orm";`,
    `import { ${[...schemaImports].sort().join(", ")} } from "~/lib/db/schema";`,
    "",
    ...blocks,
  ].join("\n");
}

function readPolicyFor(resource: ResourceIR, operation: "list" | "read" | "create" | "update" | "delete") {
  return resource.access?.[operation] ?? (operation === "list" ? resource.access?.read : undefined) ?? "public";
}

function sqlQuoted(value: string) {
  return `"${value}"`;
}

function sqlOwnershipExpression(resource: ResourceIR) {
  const ownerField = resource.ownership?.ownerField ?? "owner_id";
  return `(select auth.uid()) is not null and (select auth.uid()) = ${sqlQuoted(ownerField)}`;
}

function sqlPublicOrOwnerExpression(resource: ResourceIR) {
  return `coalesce(${sqlQuoted("is_public")}, false) or (${sqlOwnershipExpression(resource)})`;
}

function sqlWorkspaceMemberExpression(resource: ResourceIR) {
  const workspaceField = resource.ownership?.workspaceField ?? "workspace_id";
  const membershipTable = resource.ownership?.membershipTable ?? "workspace_memberships";
  return `${sqlQuoted(workspaceField)} in (select ${sqlQuoted(workspaceField)} from public.${sqlQuoted(membershipTable)} where ${sqlQuoted("user_id")} = (select auth.uid()))`;
}

function sqlReservedAdminExpression() {
  return "false";
}

function sqlReadPredicate(resource: ResourceIR, access: ResourceAccessPreset) {
  switch (access) {
    case "public":
      return "true";
    case "user":
      return "(select auth.uid()) is not null";
    case "admin":
      return sqlReservedAdminExpression();
    case "owner":
      return sqlOwnershipExpression(resource);
    case "owner-or-public":
      return sqlPublicOrOwnerExpression(resource);
    case "workspace-member":
      return sqlWorkspaceMemberExpression(resource);
  }
}

function sqlWriteCheck(
  resource: ResourceIR,
  access: ResourceAccessPreset,
  options?: {
    operation?: "create" | "update" | "delete";
  },
) {
  if (options?.operation === "create" && resource.ownership?.model === "user" && access !== "public") {
    return sqlOwnershipExpression(resource);
  }

  if (options?.operation === "create" && resource.ownership?.model === "workspace" && access !== "public") {
    return sqlWorkspaceMemberExpression(resource);
  }

  switch (access) {
    case "public":
      return "true";
    case "user":
      return "(select auth.uid()) is not null";
    case "admin":
      return sqlReservedAdminExpression();
    case "owner":
    case "owner-or-public":
      return sqlOwnershipExpression(resource);
    case "workspace-member":
      return sqlWorkspaceMemberExpression(resource);
  }
}

export function renderGeneratedSupabasePoliciesSql(app: AppIR) {
  const resources = app.resources ?? [];

  if (resources.length === 0) {
    return [
      "-- Generated by Stylyf CLI",
      "-- No resource policies were generated because the App IR does not declare any resources.",
      "",
    ].join("\n");
  }

  const statements = resources.flatMap(resource => {
    const tableName = tableNameFor(resource);
    const selectAccess = readPolicyFor(resource, "read");
    const createAccess = readPolicyFor(resource, "create");
    const updateAccess = readPolicyFor(resource, "update");
    const deleteAccess = readPolicyFor(resource, "delete");

    return [
      `alter table if exists public.${sqlQuoted(tableName)} enable row level security;`,
      `drop policy if exists ${sqlQuoted(`${tableName}_select`)} on public.${sqlQuoted(tableName)};`,
      `create policy ${sqlQuoted(`${tableName}_select`)} on public.${sqlQuoted(tableName)} for select to anon, authenticated using (${sqlReadPredicate(resource, selectAccess)});`,
      `drop policy if exists ${sqlQuoted(`${tableName}_insert`)} on public.${sqlQuoted(tableName)};`,
      `create policy ${sqlQuoted(`${tableName}_insert`)} on public.${sqlQuoted(tableName)} for insert to authenticated with check (${sqlWriteCheck(resource, createAccess, { operation: "create" })});`,
      `drop policy if exists ${sqlQuoted(`${tableName}_update`)} on public.${sqlQuoted(tableName)};`,
      `create policy ${sqlQuoted(`${tableName}_update`)} on public.${sqlQuoted(tableName)} for update to authenticated using (${sqlWriteCheck(resource, updateAccess, { operation: "update" })}) with check (${sqlWriteCheck(resource, updateAccess, { operation: "update" })});`,
      `drop policy if exists ${sqlQuoted(`${tableName}_delete`)} on public.${sqlQuoted(tableName)};`,
      `create policy ${sqlQuoted(`${tableName}_delete`)} on public.${sqlQuoted(tableName)} for delete to authenticated using (${sqlWriteCheck(resource, deleteAccess, { operation: "delete" })});`,
      "",
    ];
  });

  return [
    "-- Generated by Stylyf CLI",
    "-- Apply this alongside supabase/schema.sql for resource-driven row level security defaults.",
    "-- These policies are intentionally broad and should be tightened further for production-specific needs.",
    "",
    ...statements,
  ].join("\n");
}
