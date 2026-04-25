import type {
  AppIR,
  AuthAccess,
  DatabaseColumnType,
  DatabaseSchemaIR,
  ResourceAccessPreset,
  ResourceFieldIR,
  ResourceIR,
  ServerModuleIR,
} from "../../compiler/generated-app.js";

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
    indexed: field.indexed,
    default: field.default,
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

function deriveMembershipSchemaTables(app: AppIR): DatabaseSchemaIR[] {
  const memberships = app.policies?.memberships ?? [];
  const needsMembershipTables = (app.resources ?? []).some(
    resource =>
      resource.ownership?.model === "workspace" ||
      Object.values(resource.access ?? {}).some(access => access === "workspace-member"),
  );

  if (!needsMembershipTables) {
    return [];
  }

  const membershipTables = memberships.length > 0
    ? memberships
    : [
        {
          table: "workspace_memberships",
          userField: "user_id",
          workspaceField: "workspace_id",
          roleField: "role",
        },
      ];

  const seen = new Set<string>();
  return membershipTables
    .filter(membership => {
      if (seen.has(membership.table)) {
        return false;
      }
      seen.add(membership.table);
      return true;
    })
    .map(membership => ({
      table: membership.table,
      columns: [
        {
          name: "id",
          type: "uuid",
          primaryKey: true,
        },
        {
          name: membership.userField,
          type: "uuid",
        },
        {
          name: membership.workspaceField,
          type: "uuid",
        },
        {
          name: membership.roleField,
          type: "varchar",
        },
      ],
      timestamps: true,
    }));
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
  const derivedSchema = [
    ...app.resources.flatMap(resource => [deriveSchemaTable(resource), ...deriveAttachmentSchemaTables(resource)]),
    ...deriveMembershipSchemaTables(app),
  ]
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
  const rolePolicies = app.policies?.roles ?? [];
  const membershipPolicies = app.policies?.memberships ?? [];
  const actorPolicies = app.policies?.actors ?? [];
  const usesPortableDb = app.database?.provider !== "supabase";
  const needsMembershipTables = (app.resources ?? []).some(
    resource =>
      resource.ownership?.model === "workspace" ||
      Object.values(resource.access ?? {}).some(access => access === "workspace-member"),
  );
  const portablePolicyHelpers =
    usesPortableDb && membershipPolicies.length > 0 && needsMembershipTables
      ? [
          'import { and, eq } from "drizzle-orm";',
          'import { db, schema } from "~/lib/db";',
          "",
        ]
      : [];
  const portableHelperFunctions =
    usesPortableDb && membershipPolicies.length > 0 && needsMembershipTables
      ? [
          "function camelCase(value: string) {",
          "  return value",
          "    .split(/[^a-zA-Z0-9]+/g)",
          "    .filter(Boolean)",
          "    .map((segment, index) =>",
          "      index === 0 ? `${segment[0]?.toLowerCase() ?? \"\"}${segment.slice(1)}` : `${segment[0]?.toUpperCase() ?? \"\"}${segment.slice(1)}`,",
          "    )",
          "    .join(\"\");",
          "}",
          "",
          "function resolveSchemaTable(tableName: string) {",
          "  const table = (schema as Record<string, any>)[camelCase(tableName)];",
          "  if (!table) throw new Error(`Policy table ${tableName} is not present in the generated database schema.`);",
          "  return table;",
          "}",
          "",
          "function membershipPolicy(name = \"workspace\") {",
          "  const policy = membershipPolicies.find(entry => entry.name === name) ?? membershipPolicies[0];",
          "  if (!policy) throw new Error(\"No membership policy is configured for this app.\");",
          "  return policy;",
          "}",
          "",
          "export async function requireWorkspaceMember(workspaceId: string, membershipName?: string) {",
          "  const { userId } = await requireViewerIdentity();",
          "  const policy = membershipPolicy(membershipName);",
          "  const table = resolveSchemaTable(policy.table);",
          "  const rows = await db",
          "    .select()",
          "    .from(table)",
          "    .where(and(eq(table[policy.userField], userId), eq(table[policy.workspaceField], workspaceId)))",
          "    .limit(1);",
          "  if (rows.length === 0) throw new Error(\"Workspace membership is required for this action.\");",
          "  return rows[0];",
          "}",
          "",
          "export async function requireRole(role: string, options?: { workspaceId?: string; membership?: string }) {",
          "  const { userId } = await requireViewerIdentity();",
          "  const policy = membershipPolicy(options?.membership);",
          "  const table = resolveSchemaTable(policy.table);",
          "  const predicates = [eq(table[policy.userField], userId), eq(table[policy.roleField], role)];",
          "  if (options?.workspaceId) predicates.push(eq(table[policy.workspaceField], options.workspaceId));",
          "  const rows = await db.select().from(table).where(and(...predicates)).limit(1);",
          "  if (rows.length === 0) throw new Error(`Role ${role} is required for this action.`);",
          "  return rows[0];",
          "}",
          "",
          "export async function requireOwner(ownerId: string | null | undefined) {",
          "  const { userId } = await requireViewerIdentity();",
          "  if (!ownerId || ownerId !== userId) throw new Error(\"Resource ownership is required for this action.\");",
          "  return { userId };",
          "}",
          "",
        ]
      : [
          "export async function requireWorkspaceMember(_workspaceId: string, _membershipName?: string) {",
          "  await requireViewerIdentity();",
          "  throw new Error(\"Workspace membership helpers require a generated membership policy table.\");",
          "}",
          "",
          "export async function requireRole(role: string, _options?: { workspaceId?: string; membership?: string }) {",
          "  await requireViewerIdentity();",
          "  throw new Error(`Role ${role} is not wired to a generated membership policy table.`);",
          "}",
          "",
          "export async function requireOwner(ownerId: string | null | undefined) {",
          "  const { userId } = await requireViewerIdentity();",
          "  if (!ownerId || ownerId !== userId) throw new Error(\"Resource ownership is required for this action.\");",
          "  return { userId };",
          "}",
          "",
        ];

  return [
    'import { getSession, requireSession } from "~/lib/server/guards";',
    ...portablePolicyHelpers,
    "",
    "function extractUserId(session: unknown) {",
    "  if (!session || typeof session !== \"object\") return null;",
    "  const record = session as { user?: { id?: string | null }; session?: { userId?: string | null } };",
    "  return record.user?.id ?? record.session?.userId ?? null;",
    "}",
    "",
    "export const resourcePolicies = " + JSON.stringify(policies, null, 2) + " as const;",
    "",
    "export const rolePolicies = " + JSON.stringify(rolePolicies, null, 2) + " as const;",
    "",
    "export const membershipPolicies = " + JSON.stringify(membershipPolicies, null, 2) + " as const;",
    "",
    "export const actorPolicies = " + JSON.stringify(actorPolicies, null, 2) + " as const;",
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
    ...portableHelperFunctions,
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

function sqlLiteral(value: string) {
  return `'${value.replace(/'/g, "''")}'`;
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

function sqlRoleExpression(app: AppIR, resource: ResourceIR, actor: "admin" | "editor") {
  const actorPolicy = app.policies?.actors.find(entry => entry.actor === actor);
  const membershipPolicy = app.policies?.memberships.find(entry => entry.name === actorPolicy?.membership) ?? app.policies?.memberships[0];

  if (!actorPolicy?.role || !membershipPolicy) {
    return "false";
  }

  const tableName = membershipPolicy.table;
  const workspaceField = resource.ownership?.workspaceField ?? membershipPolicy.workspaceField;
  const workspacePredicate =
    resource.ownership?.model === "workspace"
      ? ` and membership.${sqlQuoted(membershipPolicy.workspaceField)} = ${sqlQuoted(workspaceField)}`
      : "";

  return [
    "exists (",
    `select 1 from public.${sqlQuoted(tableName)} as membership`,
    `where membership.${sqlQuoted(membershipPolicy.userField)} = (select auth.uid())`,
    `and membership.${sqlQuoted(membershipPolicy.roleField)} = ${sqlLiteral(actorPolicy.role)}`,
    workspacePredicate,
    ")",
  ]
    .filter(Boolean)
    .join(" ");
}

function sqlReservedAdminExpression(app: AppIR, resource: ResourceIR) {
  const expression = sqlRoleExpression(app, resource, "admin");
  if (expression !== "false") return expression;
  return "false";
}

function sqlReadPredicate(app: AppIR, resource: ResourceIR, access: ResourceAccessPreset) {
  switch (access) {
    case "public":
      return "true";
    case "user":
      return "(select auth.uid()) is not null";
    case "admin":
      return sqlReservedAdminExpression(app, resource);
    case "owner":
      return sqlOwnershipExpression(resource);
    case "owner-or-public":
      return sqlPublicOrOwnerExpression(resource);
    case "workspace-member":
      return sqlWorkspaceMemberExpression(resource);
  }
}

function sqlWriteCheck(
  app: AppIR,
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
      return sqlReservedAdminExpression(app, resource);
    case "owner":
    case "owner-or-public":
      return sqlOwnershipExpression(resource);
    case "workspace-member":
      return sqlWorkspaceMemberExpression(resource);
  }
}

function renderGeneratedSupabaseMembershipPoliciesSql(app: AppIR) {
  const needsMembershipTables = (app.resources ?? []).some(
    resource =>
      resource.ownership?.model === "workspace" ||
      Object.values(resource.access ?? {}).some(access => access === "workspace-member" || access === "admin"),
  );
  const memberships = app.policies?.memberships ?? [];

  if (!needsMembershipTables || memberships.length === 0) {
    return [];
  }

  return memberships.flatMap(membership => {
    const table = sqlQuoted(membership.table);
    const userField = sqlQuoted(membership.userField);
    const workspaceField = sqlQuoted(membership.workspaceField);
    const roleField = sqlQuoted(membership.roleField);

    return [
      `alter table if exists public.${table} enable row level security;`,
      `create index if not exists ${sqlQuoted(`${membership.table}_${membership.userField}_idx`)} on public.${table} (${userField});`,
      `create index if not exists ${sqlQuoted(`${membership.table}_${membership.workspaceField}_idx`)} on public.${table} (${workspaceField});`,
      `create index if not exists ${sqlQuoted(`${membership.table}_${membership.roleField}_idx`)} on public.${table} (${roleField});`,
      `drop policy if exists ${sqlQuoted(`${membership.table}_select_own`)} on public.${table};`,
      `create policy ${sqlQuoted(`${membership.table}_select_own`)} on public.${table} for select to authenticated using (${userField} = (select auth.uid()));`,
      `drop policy if exists ${sqlQuoted(`${membership.table}_insert_reserved`)} on public.${table};`,
      `create policy ${sqlQuoted(`${membership.table}_insert_reserved`)} on public.${table} for insert to authenticated with check (false);`,
      `drop policy if exists ${sqlQuoted(`${membership.table}_update_reserved`)} on public.${table};`,
      `create policy ${sqlQuoted(`${membership.table}_update_reserved`)} on public.${table} for update to authenticated using (false) with check (false);`,
      `drop policy if exists ${sqlQuoted(`${membership.table}_delete_reserved`)} on public.${table};`,
      `create policy ${sqlQuoted(`${membership.table}_delete_reserved`)} on public.${table} for delete to authenticated using (false);`,
      "",
    ];
  });
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
      `create policy ${sqlQuoted(`${tableName}_select`)} on public.${sqlQuoted(tableName)} for select to anon, authenticated using (${sqlReadPredicate(app, resource, selectAccess)});`,
      `drop policy if exists ${sqlQuoted(`${tableName}_insert`)} on public.${sqlQuoted(tableName)};`,
      `create policy ${sqlQuoted(`${tableName}_insert`)} on public.${sqlQuoted(tableName)} for insert to authenticated with check (${sqlWriteCheck(app, resource, createAccess, { operation: "create" })});`,
      `drop policy if exists ${sqlQuoted(`${tableName}_update`)} on public.${sqlQuoted(tableName)};`,
      `create policy ${sqlQuoted(`${tableName}_update`)} on public.${sqlQuoted(tableName)} for update to authenticated using (${sqlWriteCheck(app, resource, updateAccess, { operation: "update" })}) with check (${sqlWriteCheck(app, resource, updateAccess, { operation: "update" })});`,
      `drop policy if exists ${sqlQuoted(`${tableName}_delete`)} on public.${sqlQuoted(tableName)};`,
      `create policy ${sqlQuoted(`${tableName}_delete`)} on public.${sqlQuoted(tableName)} for delete to authenticated using (${sqlWriteCheck(app, resource, deleteAccess, { operation: "delete" })});`,
      "",
    ];
  });

  return [
    "-- Generated by Stylyf CLI",
    "-- Apply this alongside supabase/schema.sql for resource-driven row level security defaults.",
    "-- Membership tables are readable by their own users but write-locked by default.",
    "-- App-owned admin membership provisioning should happen through trusted server code or Supabase dashboard operations.",
    "",
    ...renderGeneratedSupabaseMembershipPoliciesSql(app),
    ...statements,
  ].join("\n");
}
