import type { AppIR, DatabaseSchemaIR, ResourceIR, WorkflowIR, WorkflowTransitionIR } from "../../ir/types.js";

function camelCase(value: string) {
  return value
    .split(/[^a-zA-Z0-9]+/g)
    .filter(Boolean)
    .map((segment, index) =>
      index === 0 ? `${segment[0]?.toLowerCase() ?? ""}${segment.slice(1)}` : `${segment[0]?.toUpperCase() ?? ""}${segment.slice(1)}`,
    )
    .join("");
}

function pascalCase(value: string) {
  return value
    .split(/[^a-zA-Z0-9]+/g)
    .filter(Boolean)
    .map(segment => `${segment[0]?.toUpperCase() ?? ""}${segment.slice(1)}`)
    .join("");
}

function sqlQuoted(value: string) {
  return `"${value}"`;
}

function uniqueTables(tables: DatabaseSchemaIR[]) {
  const seen = new Set<string>();
  return tables.filter(table => {
    if (seen.has(table.table)) return false;
    seen.add(table.table);
    return true;
  });
}

function resourceTableName(resource: ResourceIR) {
  return resource.table ?? resource.name;
}

function workflowFieldName(workflow: WorkflowIR) {
  return workflow.field ?? "status";
}

export function hasGeneratedWorkflows(app: AppIR) {
  return (app.workflows?.length ?? 0) > 0;
}

function workflowSchemaTables(): DatabaseSchemaIR[] {
  return [
    {
      table: "app_events",
      columns: [
        { name: "id", type: "uuid", primaryKey: true },
        { name: "resource", type: "varchar" },
        { name: "resource_id", type: "uuid" },
        { name: "workflow_name", type: "varchar" },
        { name: "transition_name", type: "varchar" },
        { name: "event_name", type: "varchar" },
        { name: "actor_id", type: "uuid", nullable: true },
        { name: "from_state", type: "varchar", nullable: true },
        { name: "to_state", type: "varchar", nullable: true },
        { name: "payload", type: "jsonb", nullable: true },
      ],
      timestamps: true,
    },
    {
      table: "notifications",
      columns: [
        { name: "id", type: "uuid", primaryKey: true },
        { name: "recipient_id", type: "uuid", nullable: true },
        { name: "resource", type: "varchar" },
        { name: "resource_id", type: "uuid" },
        { name: "event_name", type: "varchar" },
        { name: "audience", type: "varchar", nullable: true },
        { name: "channel", type: "varchar" },
        { name: "title", type: "text" },
        { name: "body", type: "text", nullable: true },
        { name: "status", type: "varchar" },
        { name: "read_at", type: "timestamp", nullable: true },
        { name: "payload", type: "jsonb", nullable: true },
      ],
      timestamps: true,
    },
  ];
}

export function materializeWorkflowSupport(app: AppIR): AppIR {
  if (!hasGeneratedWorkflows(app) || !app.database) {
    return app;
  }

  const existingSchema = app.database.schema ?? [];
  const existingTables = new Set(existingSchema.map(table => table.table));
  const derivedSchema = uniqueTables(workflowSchemaTables()).filter(table => !existingTables.has(table.table));

  return {
    ...app,
    database: {
      ...app.database,
      schema: [...existingSchema, ...derivedSchema],
    },
  };
}

export function renderGeneratedWorkflowsModule(app: AppIR) {
  const workflows = app.workflows ?? [];
  const resources = app.resources ?? [];
  const resourcesByWorkflow = Object.fromEntries(
    workflows.map(workflow => {
      const resource = resources.find(candidate => candidate.name === workflow.resource) ?? null;
      return [
        workflow.name,
        {
          resource: workflow.resource,
          table: resource ? resourceTableName(resource) : workflow.resource,
          field: workflowFieldName(workflow),
        },
      ];
    }),
  );

  return [
    "export const workflowDefinitions = " + JSON.stringify(workflows, null, 2) + " as const;",
    "",
    "export const workflowResources = " + JSON.stringify(resourcesByWorkflow, null, 2) + " as const;",
    "",
    "export const workflowsByName = Object.fromEntries(workflowDefinitions.map(workflow => [workflow.name, workflow]));",
    "",
  ].join("\n");
}

function renderPortableTransitionAction(workflow: WorkflowIR, transition: WorkflowTransitionIR, resource: ResourceIR) {
  const exportName = `${transition.name}${pascalCase(resource.name)}Transition`;
  const resourceTableNameValue = resourceTableName(resource);
  const workflowField = camelCase(workflowFieldName(workflow));
  const ownerField = camelCase(resource.ownership?.ownerField ?? "owner_id");
  const workspaceField = camelCase(resource.ownership?.workspaceField ?? "workspace_id");
  const membershipSymbol = camelCase(resource.ownership?.membershipTable ?? "workspace_memberships");
  const actor = transition.actor ?? resource.access?.update ?? "user";
  const defaultEventName = `${workflow.name}.${transition.name}`;
  const eventNames = transition.emits && transition.emits.length > 0 ? transition.emits : [defaultEventName];
  const fromStates = Array.isArray(transition.from) ? transition.from : [transition.from];

  const actorGuard =
    actor === "public"
      ? [
          `  const resourceTable = resolveSchemaTable(${JSON.stringify(resourceTableNameValue)});`,
          "  const rows = await db.select().from(resourceTable).where(eq(resourceTable.id, id)).limit(1);",
          '  const record = rows[0];',
          '  if (!record) throw new Error("Resource not found.");',
          "  const actorId = null;",
        ]
      : actor === "owner" || actor === "owner-or-public"
        ? [
            `  const resourceTable = resolveSchemaTable(${JSON.stringify(resourceTableNameValue)});`,
            "  const { userId } = await requireViewerIdentity();",
            `  const rows = await db.select().from(resourceTable).where(and(eq(resourceTable.id, id), eq(resourceTable.${ownerField}, userId))).limit(1);`,
            '  const record = rows[0];',
            '  if (!record) throw new Error("Resource not found or not accessible.");',
            "  const actorId = userId;",
          ]
        : actor === "workspace-member"
          ? [
              `  const resourceTable = resolveSchemaTable(${JSON.stringify(resourceTableNameValue)});`,
              "  const { userId } = await requireViewerIdentity();",
              `  const memberships = await db.select({ workspaceId: ${membershipSymbol}.${workspaceField} }).from(${membershipSymbol}).where(eq(${membershipSymbol}.userId, userId));`,
              '  if (memberships.length === 0) throw new Error("Resource not found or not accessible.");',
              `  const rows = await db.select().from(resourceTable).where(and(eq(resourceTable.id, id), inArray(resourceTable.${workspaceField}, memberships.map(row => row.workspaceId)))).limit(1);`,
              '  const record = rows[0];',
              '  if (!record) throw new Error("Resource not found or not accessible.");',
              "  const actorId = userId;",
            ]
          : actor === "admin"
            ? [
                "  await requireViewerIdentity();",
                '  throw new Error("Admin workflow transitions require explicit role wiring. Generated defaults fail closed until you customize this policy.");',
              ]
          : [
              `  const resourceTable = resolveSchemaTable(${JSON.stringify(resourceTableNameValue)});`,
              "  const { userId } = await requireViewerIdentity();",
              `  const rows = await db.select().from(resourceTable).where(eq(resourceTable.id, id)).limit(1);`,
              '  const record = rows[0];',
              '  if (!record) throw new Error("Resource not found or not accessible.");',
              "  const actorId = userId;",
            ];

  return [
    `export const ${exportName} = action(async (id: string) => {`,
    '  "use server";',
    ...actorGuard,
    `  const allowedFrom = ${JSON.stringify(fromStates)};`,
    `  const currentState = (record.${workflowField} ?? ${JSON.stringify(workflow.initial)}) as string;`,
    "  if (!allowedFrom.includes(currentState)) {",
    `    throw new Error(${JSON.stringify(`Transition ${transition.name} is only allowed from ${fromStates.join(", ")}.`)});`,
    "  }",
    `  const changes = { ${workflowField}: ${JSON.stringify(transition.to)} } as Record<string, unknown>;`,
    "  const updatedRows = await db.update(resourceTable).set(changes as any).where(eq(resourceTable.id, id)).returning();",
    "  const nextRecord = (Array.isArray(updatedRows) ? updatedRows[0] : null) ?? { ...record, ...changes };",
    `  await insertWorkflowEvents(${JSON.stringify(resource.name)}, id, ${JSON.stringify(workflow.name)}, ${JSON.stringify(transition.name)}, currentState, ${JSON.stringify(transition.to)}, actorId, ${JSON.stringify(eventNames)});`,
    `  await createWorkflowNotifications(record, ${JSON.stringify(resource.name)}, id, ${JSON.stringify(workflow.name)}, ${JSON.stringify(transition.name)}, ${JSON.stringify(eventNames[0])}, ${JSON.stringify(transition.notifies ?? [])});`,
    "  return { ok: true as const, record: nextRecord, state: " + JSON.stringify(transition.to) + ", eventNames: " + JSON.stringify(eventNames) + " };",
    `}, ${JSON.stringify(`${workflow.name}.${transition.name}`)});`,
    "",
  ].join("\n");
}

function renderPortableWorkflowServerModule(app: AppIR) {
  const workflows = app.workflows ?? [];
  const resources = app.resources ?? [];
  const workflowTransitions = workflows
    .map(workflow => {
      const resource = resources.find(candidate => candidate.name === workflow.resource);
      if (!resource) return "";
      return workflow.transitions.map(transition => renderPortableTransitionAction(workflow, transition, resource)).join("\n");
    })
    .filter(Boolean)
    .join("\n");

  return [
    'import { randomUUID } from "node:crypto";',
    'import { action, query } from "@solidjs/router";',
    'import { and, desc, eq, inArray } from "drizzle-orm";',
    'import { db } from "~/lib/db";',
    'import * as schema from "~/lib/db/schema";',
    'import { getViewerIdentity, requireViewerIdentity } from "~/lib/server/resource-policy";',
    'import { workflowDefinitions } from "~/lib/workflows";',
    "",
    "function camelize(value: string) {",
    "  return value.split(/[^a-zA-Z0-9]+/g).filter(Boolean).map((segment, index) => index === 0 ? `${segment[0]?.toLowerCase() ?? \"\"}${segment.slice(1)}` : `${segment[0]?.toUpperCase() ?? \"\"}${segment.slice(1)}`).join(\"\");",
    "}",
    "",
    "function resolveSchemaTable(tableName: string) {",
    "  const table = (schema as Record<string, any>)[camelize(tableName)];",
    "  if (!table) throw new Error(`Unable to resolve schema table: ${tableName}`);",
    "  return table;",
    "}",
    "",
    "function getWorkflowDefinition(name: string) {",
    "  const workflow = (workflowDefinitions.find(entry => entry.name === name) ?? null) as any;",
    "  if (!workflow) throw new Error(`Unknown workflow: ${name}`);",
    "  return workflow;",
    "}",
    "",
    "function getResourceDefinition(name: string) {",
    `  const resource = (${JSON.stringify(resources, null, 2)} as any[]).find(entry => entry.name === name) ?? null;`,
    "  if (!resource) throw new Error(`Unknown workflow resource: ${name}`);",
    "  return resource;",
    "}",
    "",
    "function buildNotificationTitle(resourceName: string, transitionName: string, nextState: string) {",
    "  return `${resourceName} moved via ${transitionName} to ${nextState}`;",
    "}",
    "",
    "async function insertWorkflowEvents(resourceName: string, resourceId: string, workflowName: string, transitionName: string, fromState: string, toState: string, actorId: string | null, eventNames: string[]) {",
    '  const appEvents = resolveSchemaTable("app_events");',
    "  for (const eventName of eventNames) {",
    "    await db.insert(appEvents).values({",
    "      id: randomUUID(),",
    "      resource: resourceName,",
    "      resourceId,",
    "      workflowName,",
    "      transitionName,",
    "      eventName,",
    "      actorId,",
    "      fromState,",
    "      toState,",
    "      payload: { resource: resourceName, resourceId, workflowName, transitionName, fromState, toState },",
    "    } as any);",
    "  }",
    "}",
    "",
    "async function createWorkflowNotifications(record: Record<string, any>, resourceName: string, resourceId: string, workflowName: string, transitionName: string, eventName: string, audiences: string[]) {",
    '  if (!audiences.length) return;',
    '  const notifications = resolveSchemaTable("notifications");',
    "  const resource = getResourceDefinition(resourceName);",
    "  const recipients = new Map<string, string>();",
    "  const unresolvedAudiences = new Set<string>();",
    '  const ownerField = camelize(resource.ownership?.ownerField ?? "owner_id");',
    '  const workspaceField = camelize(resource.ownership?.workspaceField ?? "workspace_id");',
    "  if (audiences.includes(\"owner\") && record?.[ownerField]) {",
    "    recipients.set(String(record[ownerField]), \"owner\");",
    "  }",
    "  if (audiences.includes(\"workspace\") && resource.ownership?.model === \"workspace\" && record?.[workspaceField] && resource.ownership?.membershipTable) {",
    "    const membershipTable = resolveSchemaTable(resource.ownership.membershipTable);",
    "    const members = await db.select({ userId: membershipTable.userId }).from(membershipTable).where(eq(membershipTable[workspaceField], record[workspaceField]));",
    "    for (const member of members) {",
    '      if (member.userId) recipients.set(String(member.userId), "workspace");',
    "    }",
    "  }",
    "  if (audiences.includes(\"admins\")) unresolvedAudiences.add(\"admins\");",
    "  if (audiences.includes(\"watchers\")) unresolvedAudiences.add(\"watchers\");",
    "  const title = buildNotificationTitle(resourceName, transitionName, String(record?.[camelize(getWorkflowDefinition(workflowName).field ?? \"status\")] ?? \"updated\"));",
    "  for (const [recipientId, audience] of recipients.entries()) {",
    "    await db.insert(notifications).values({",
    "      id: randomUUID(),",
    "      recipientId,",
    "      resource: resourceName,",
    "      resourceId,",
    "      eventName,",
    "      audience,",
    '      channel: "in_app",',
    "      title,",
    "      body: `${workflowName}.${transitionName}` ,",
    '      status: "unread",',
    "      readAt: null,",
    "      payload: { workflowName, transitionName, resourceName, resourceId },",
    "    } as any);",
    "  }",
    "  for (const audience of unresolvedAudiences) {",
    "    await db.insert(notifications).values({",
    "      id: randomUUID(),",
    "      recipientId: null,",
    "      resource: resourceName,",
    "      resourceId,",
    "      eventName,",
    "      audience,",
    '      channel: "in_app",',
    "      title,",
    "      body: `${workflowName}.${transitionName}` ,",
    '      status: "pending-resolution",',
    "      readAt: null,",
    "      payload: { workflowName, transitionName, resourceName, resourceId },",
    "    } as any);",
    "  }",
    "}",
    "",
    "export const listResourceEvents = query(async (resourceName: string, resourceId: string) => {",
    '  "use server";',
    "  const resource = getResourceDefinition(resourceName);",
    "  const resourceTable = resolveSchemaTable(resource.table ?? resource.name);",
    "  const policy = resource.access?.read ?? resource.access?.list ?? \"public\";",
    '  const ownerField = camelize(resource.ownership?.ownerField ?? "owner_id");',
    '  const workspaceField = camelize(resource.ownership?.workspaceField ?? "workspace_id");',
    "  if (policy === \"owner\" || policy === \"owner-or-public\") {",
    "    const viewer = await getViewerIdentity();",
    "    if (!viewer.userId) throw new Error(\"Authentication is required to read these events.\");",
    "    const rows = await db.select().from(resourceTable).where(and(eq(resourceTable.id, resourceId), eq(resourceTable[ownerField], viewer.userId))).limit(1);",
    '    if (!rows[0]) throw new Error("Resource not found or not accessible.");',
    "  } else if (policy === \"workspace-member\") {",
    "    const { userId } = await requireViewerIdentity();",
    "    const membershipTable = resolveSchemaTable(resource.ownership?.membershipTable ?? \"workspace_memberships\");",
    "    const memberships = await db.select({ workspaceId: membershipTable[workspaceField] }).from(membershipTable).where(eq(membershipTable.userId, userId));",
    "    const rows = await db.select().from(resourceTable).where(and(eq(resourceTable.id, resourceId), inArray(resourceTable[workspaceField], memberships.map(row => row.workspaceId)))).limit(1);",
    '    if (!rows[0]) throw new Error("Resource not found or not accessible.");',
    "  } else if (policy === \"admin\") {",
    "    await requireViewerIdentity();",
    '    throw new Error("Admin event access requires explicit role wiring. Generated defaults fail closed until you customize this policy.");',
    "  } else if (policy !== \"public\") {",
    "    await requireViewerIdentity();",
    "  }",
    '  const appEvents = resolveSchemaTable("app_events");',
    "  return db.select().from(appEvents).where(and(eq(appEvents.resource, resourceName), eq(appEvents.resourceId, resourceId))).orderBy(desc(appEvents.createdAt));",
    `}, ${JSON.stringify("workflows.events.list")});`,
    "",
    "export const listViewerNotifications = query(async () => {",
    '  "use server";',
    "  const { userId } = await requireViewerIdentity();",
    '  const notifications = resolveSchemaTable("notifications");',
    "  return db.select().from(notifications).where(eq(notifications.recipientId, userId)).orderBy(desc(notifications.createdAt));",
    `}, ${JSON.stringify("workflows.notifications.list")});`,
    "",
    "export const markNotificationRead = action(async (notificationId: string) => {",
    '  "use server";',
    "  const { userId } = await requireViewerIdentity();",
    '  const notifications = resolveSchemaTable("notifications");',
    "  return db.update(notifications).set({ readAt: new Date(), status: \"read\" } as any).where(and(eq(notifications.id, notificationId), eq(notifications.recipientId, userId))).returning();",
    `}, ${JSON.stringify("workflows.notifications.read")});`,
    "",
    workflowTransitions,
  ].join("\n");
}

function renderHostedTransitionAction(workflow: WorkflowIR, transition: WorkflowTransitionIR, resource: ResourceIR) {
  const exportName = `${transition.name}${pascalCase(resource.name)}Transition`;
  const actor = transition.actor ?? resource.access?.update ?? "user";
  const workflowField = workflowFieldName(workflow);
  const ownerField = resource.ownership?.ownerField ?? "owner_id";
  const workspaceField = resource.ownership?.workspaceField ?? "workspace_id";
  const membershipTable = resource.ownership?.membershipTable ?? "workspace_memberships";
  const fromStates = Array.isArray(transition.from) ? transition.from : [transition.from];
  const defaultEventName = `${workflow.name}.${transition.name}`;
  const eventNames = transition.emits && transition.emits.length > 0 ? transition.emits : [defaultEventName];

  const actorGuard =
    actor === "public"
      ? [
          `  const { data: resourceRows, error: resourceError } = await (supabase as any).from(${JSON.stringify(resourceTableName(resource))}).select("*").eq("id", id).limit(1);`,
          "  if (resourceError) throw resourceError;",
          "  const record = resourceRows?.[0] ?? null;",
          '  if (!record) throw new Error("Resource not found.");',
          "  const actorId = null;",
        ]
      : actor === "owner" || actor === "owner-or-public"
        ? [
            "  const session = await requireSession();",
            `  const { data: resourceRows, error: resourceError } = await (supabase as any).from(${JSON.stringify(resourceTableName(resource))}).select("*").eq("id", id).eq(${JSON.stringify(ownerField)}, session.user.id).limit(1);`,
            "  if (resourceError) throw resourceError;",
            "  const record = resourceRows?.[0] ?? null;",
            '  if (!record) throw new Error("Resource not found or not accessible.");',
            "  const actorId = session.user.id;",
          ]
        : actor === "workspace-member"
          ? [
              "  const session = await requireSession();",
              `  const { data: memberships, error: membershipError } = await (supabase as any).from(${JSON.stringify(membershipTable)}).select(${JSON.stringify(workspaceField)}).eq("user_id", session.user.id);`,
              "  if (membershipError) throw membershipError;",
              `  const workspaceIds = memberships?.map((row: any) => row[${JSON.stringify(workspaceField)}]).filter(Boolean) ?? [];`,
              `  const { data: resourceRows, error: resourceError } = await (supabase as any).from(${JSON.stringify(resourceTableName(resource))}).select("*").eq("id", id).in(${JSON.stringify(workspaceField)}, workspaceIds).limit(1);`,
              "  if (resourceError) throw resourceError;",
              "  const record = resourceRows?.[0] ?? null;",
              '  if (!record) throw new Error("Resource not found or not accessible.");',
              "  const actorId = session.user.id;",
            ]
          : actor === "admin"
            ? [
                "  await requireSession();",
                '  throw new Error("Admin workflow transitions require explicit role wiring. Generated defaults fail closed until you customize this policy.");',
              ]
          : [
              "  const session = await requireSession();",
              `  const { data: resourceRows, error: resourceError } = await (supabase as any).from(${JSON.stringify(resourceTableName(resource))}).select("*").eq("id", id).limit(1);`,
              "  if (resourceError) throw resourceError;",
              "  const record = resourceRows?.[0] ?? null;",
              '  if (!record) throw new Error("Resource not found or not accessible.");',
              "  const actorId = session.user.id;",
            ];

  return [
    `export const ${exportName} = action(async (id: string) => {`,
    '  "use server";',
    "  const supabase = createSupabaseServerClient();",
    "  const admin = createSupabaseAdminClient();",
    ...actorGuard,
    `  const allowedFrom = ${JSON.stringify(fromStates)};`,
    `  const currentState = (record?.[${JSON.stringify(workflowField)}] ?? ${JSON.stringify(workflow.initial)}) as string;`,
    "  if (!allowedFrom.includes(currentState)) {",
    `    throw new Error(${JSON.stringify(`Transition ${transition.name} is only allowed from ${fromStates.join(", ")}.`)});`,
    "  }",
    `  const { data: updatedRows, error: updateError } = await (admin as any).from(${JSON.stringify(resourceTableName(resource))}).update({ ${JSON.stringify(workflowField)}: ${JSON.stringify(transition.to)} }).eq("id", id).select("*").limit(1);`,
    "  if (updateError) throw updateError;",
    "  const nextRecord = updatedRows?.[0] ?? { ...record, " + JSON.stringify(workflowField) + ": " + JSON.stringify(transition.to) + " };",
    `  await insertHostedWorkflowEvents(admin, ${JSON.stringify(resource.name)}, id, ${JSON.stringify(workflow.name)}, ${JSON.stringify(transition.name)}, currentState, ${JSON.stringify(transition.to)}, actorId, ${JSON.stringify(eventNames)});`,
    `  await createHostedWorkflowNotifications(admin, record, ${JSON.stringify(resource.name)}, id, ${JSON.stringify(workflow.name)}, ${JSON.stringify(transition.name)}, ${JSON.stringify(eventNames[0])}, ${JSON.stringify(transition.notifies ?? [])});`,
    "  return { ok: true as const, record: nextRecord, state: " + JSON.stringify(transition.to) + ", eventNames: " + JSON.stringify(eventNames) + " };",
    `}, ${JSON.stringify(`${workflow.name}.${transition.name}`)});`,
    "",
  ].join("\n");
}

function renderHostedWorkflowServerModule(app: AppIR) {
  const workflows = app.workflows ?? [];
  const resources = app.resources ?? [];
  const workflowTransitions = workflows
    .map(workflow => {
      const resource = resources.find(candidate => candidate.name === workflow.resource);
      if (!resource) return "";
      return workflow.transitions.map(transition => renderHostedTransitionAction(workflow, transition, resource)).join("\n");
    })
    .filter(Boolean)
    .join("\n");

  return [
    'import { action, query } from "@solidjs/router";',
    'import { createSupabaseAdminClient, createSupabaseServerClient } from "~/lib/supabase";',
    'import { getSession, requireSession } from "~/lib/auth";',
    'import { workflowDefinitions } from "~/lib/workflows";',
    "",
    "function getWorkflowDefinition(name: string) {",
    "  const workflow = (workflowDefinitions.find(entry => entry.name === name) ?? null) as any;",
    "  if (!workflow) throw new Error(`Unknown workflow: ${name}`);",
    "  return workflow;",
    "}",
    "",
    "function getResourceDefinition(name: string) {",
    `  const resource = (${JSON.stringify(resources, null, 2)} as any[]).find(entry => entry.name === name) ?? null;`,
    "  if (!resource) throw new Error(`Unknown workflow resource: ${name}`);",
    "  return resource;",
    "}",
    "",
    "function buildNotificationTitle(resourceName: string, transitionName: string, nextState: string) {",
    "  return `${resourceName} moved via ${transitionName} to ${nextState}`;",
    "}",
    "",
    "async function insertHostedWorkflowEvents(admin: any, resourceName: string, resourceId: string, workflowName: string, transitionName: string, fromState: string, toState: string, actorId: string | null, eventNames: string[]) {",
    "  for (const eventName of eventNames) {",
    '    const { error } = await admin.from("app_events").insert({',
    "      resource: resourceName,",
    "      resource_id: resourceId,",
    "      workflow_name: workflowName,",
    "      transition_name: transitionName,",
    "      event_name: eventName,",
    "      actor_id: actorId,",
    "      from_state: fromState,",
    "      to_state: toState,",
    "      payload: { resourceName, resourceId, workflowName, transitionName, fromState, toState },",
    "    });",
    "    if (error) throw error;",
    "  }",
    "}",
    "",
    "async function createHostedWorkflowNotifications(admin: any, record: Record<string, any>, resourceName: string, resourceId: string, workflowName: string, transitionName: string, eventName: string, audiences: string[]) {",
    '  if (!audiences.length) return;',
    "  const resource = getResourceDefinition(resourceName);",
    "  const recipients = new Map<string, string>();",
    "  const unresolvedAudiences = new Set<string>();",
    '  const ownerField = resource.ownership?.ownerField ?? "owner_id";',
    '  const workspaceField = resource.ownership?.workspaceField ?? "workspace_id";',
    "  if (audiences.includes(\"owner\") && record?.[ownerField]) {",
    "    recipients.set(String(record[ownerField]), \"owner\");",
    "  }",
    "  if (audiences.includes(\"workspace\") && resource.ownership?.model === \"workspace\" && resource.ownership?.membershipTable && record?.[workspaceField]) {",
    "    const { data: memberships, error: membershipError } = await (admin as any).from(resource.ownership.membershipTable).select(\"user_id\").eq(workspaceField, record[workspaceField]);",
    "    if (membershipError) throw membershipError;",
    "    for (const membership of memberships ?? []) {",
    '      if (membership.user_id) recipients.set(String(membership.user_id), "workspace");',
    "    }",
    "  }",
    "  if (audiences.includes(\"admins\")) unresolvedAudiences.add(\"admins\");",
    "  if (audiences.includes(\"watchers\")) unresolvedAudiences.add(\"watchers\");",
    "  const title = buildNotificationTitle(resourceName, transitionName, String(record?.[getWorkflowDefinition(workflowName).field ?? \"status\"] ?? \"updated\"));",
    "  for (const [recipientId, audience] of recipients.entries()) {",
    '    const { error } = await admin.from("notifications").insert({',
    "      recipient_id: recipientId,",
    "      resource: resourceName,",
    "      resource_id: resourceId,",
    "      event_name: eventName,",
    "      audience,",
    '      channel: "in_app",',
    "      title,",
    "      body: `${workflowName}.${transitionName}` ,",
    '      status: "unread",',
    "      read_at: null,",
    "      payload: { workflowName, transitionName, resourceName, resourceId },",
    "    });",
    "    if (error) throw error;",
    "  }",
    "  for (const audience of unresolvedAudiences) {",
    '    const { error } = await admin.from("notifications").insert({',
    "      recipient_id: null,",
    "      resource: resourceName,",
    "      resource_id: resourceId,",
    "      event_name: eventName,",
    "      audience,",
    '      channel: "in_app",',
    "      title,",
    "      body: `${workflowName}.${transitionName}` ,",
    '      status: "pending-resolution",',
    "      read_at: null,",
    "      payload: { workflowName, transitionName, resourceName, resourceId },",
    "    });",
    "    if (error) throw error;",
    "  }",
    "}",
    "",
    "export const listResourceEvents = query(async (resourceName: string, resourceId: string) => {",
    '  "use server";',
    "  const resource = getResourceDefinition(resourceName);",
    "  const supabase = createSupabaseServerClient();",
    "  const admin = createSupabaseAdminClient();",
    "  const policy = resource.access?.read ?? resource.access?.list ?? \"public\";",
    '  const ownerField = resource.ownership?.ownerField ?? "owner_id";',
    '  const workspaceField = resource.ownership?.workspaceField ?? "workspace_id";',
    "  if (policy === \"owner\" || policy === \"owner-or-public\") {",
    "    const session = await getSession();",
    "    if (!session?.user?.id) throw new Error(\"Authentication is required to read these events.\");",
    `    const { data, error } = await (supabase as any).from(resource.table ?? resource.name).select("*").eq("id", resourceId).eq(ownerField, session.user.id).limit(1);`,
    "    if (error) throw error;",
    '    if (!data?.[0]) throw new Error("Resource not found or not accessible.");',
    "  } else if (policy === \"workspace-member\") {",
    "    const session = await requireSession();",
    `    const { data: memberships, error: membershipError } = await (supabase as any).from(resource.ownership?.membershipTable ?? "workspace_memberships").select(workspaceField).eq("user_id", session.user.id);`,
    "    if (membershipError) throw membershipError;",
    "    const workspaceIds = memberships?.map((row: any) => row[workspaceField]).filter(Boolean) ?? [];",
    `    const { data, error } = await (supabase as any).from(resource.table ?? resource.name).select("*").eq("id", resourceId).in(workspaceField, workspaceIds).limit(1);`,
    "    if (error) throw error;",
    '    if (!data?.[0]) throw new Error("Resource not found or not accessible.");',
    "  } else if (policy === \"admin\") {",
    "    await requireSession();",
    '    throw new Error("Admin event access requires explicit role wiring. Generated defaults fail closed until you customize this policy.");',
    "  } else if (policy !== \"public\") {",
    "    await requireSession();",
    "  }",
    '  const { data, error } = await admin.from("app_events").select("*").eq("resource", resourceName).eq("resource_id", resourceId).order("created_at", { ascending: false });',
    "  if (error) throw error;",
    "  return data ?? [];",
    `}, ${JSON.stringify("workflows.events.list")});`,
    "",
    "export const listViewerNotifications = query(async () => {",
    '  "use server";',
    "  const session = await requireSession();",
    "  const supabase = createSupabaseServerClient();",
    '  const { data, error } = await supabase.from("notifications").select("*").eq("recipient_id", session.user.id).order("created_at", { ascending: false });',
    "  if (error) throw error;",
    "  return data ?? [];",
    `}, ${JSON.stringify("workflows.notifications.list")});`,
    "",
    "export const markNotificationRead = action(async (notificationId: string) => {",
    '  "use server";',
    "  const session = await requireSession();",
    "  const supabase = createSupabaseServerClient();",
    '  const { data, error } = await supabase.from("notifications").update({ read_at: new Date().toISOString(), status: "read" }).eq("id", notificationId).eq("recipient_id", session.user.id).select("*");',
    "  if (error) throw error;",
    "  return data ?? [];",
    `}, ${JSON.stringify("workflows.notifications.read")});`,
    "",
    workflowTransitions,
  ].join("\n");
}

export function renderGeneratedWorkflowServerModule(app: AppIR) {
  if (!hasGeneratedWorkflows(app)) {
    return "";
  }

  return app.database?.provider === "supabase" || app.auth?.provider === "supabase"
    ? renderHostedWorkflowServerModule(app)
    : renderPortableWorkflowServerModule(app);
}

export function renderGeneratedSupabaseWorkflowPoliciesSql(app: AppIR) {
  if (!hasGeneratedWorkflows(app)) {
    return "";
  }

  return [
    "-- Workflow support policies generated by Stylyf CLI",
    `alter table if exists public.${sqlQuoted("app_events")} enable row level security;`,
    "-- No direct select policies are created for app_events.",
    "-- Generated server helpers use explicit resource checks and the server-side admin client to read this table.",
    "",
    `alter table if exists public.${sqlQuoted("notifications")} enable row level security;`,
    `drop policy if exists ${sqlQuoted("notifications_select")} on public.${sqlQuoted("notifications")};`,
    `create policy ${sqlQuoted("notifications_select")} on public.${sqlQuoted("notifications")} for select to authenticated using ((select auth.uid()) is not null and (select auth.uid()) = ${sqlQuoted("recipient_id")});`,
    `drop policy if exists ${sqlQuoted("notifications_update")} on public.${sqlQuoted("notifications")};`,
    `create policy ${sqlQuoted("notifications_update")} on public.${sqlQuoted("notifications")} for update to authenticated using ((select auth.uid()) is not null and (select auth.uid()) = ${sqlQuoted("recipient_id")}) with check ((select auth.uid()) is not null and (select auth.uid()) = ${sqlQuoted("recipient_id")});`,
    "",
  ].join("\n");
}
