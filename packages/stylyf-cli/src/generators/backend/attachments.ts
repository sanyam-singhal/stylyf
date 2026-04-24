import type { AppIR, ResourceAccessPreset, ResourceIR } from "../../compiler/generated-app.js";
import { assetTableNameFor, tableNameFor } from "./resources.js";

function defaultBucketAlias(app: AppIR) {
  return app.storage?.bucketAlias ?? "default";
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

function sqlMutationPredicate(resource: ResourceIR, access: ResourceAccessPreset) {
  if (resource.ownership?.model === "user" && access !== "public") {
    return sqlOwnershipExpression(resource);
  }

  if (resource.ownership?.model === "workspace" && access !== "public") {
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

function attachmentMutationAccess(resource: ResourceIR): ResourceAccessPreset {
  return resource.access?.update ?? resource.access?.create ?? "user";
}

function attachmentReadAccess(resource: ResourceIR): ResourceAccessPreset {
  return resource.access?.read ?? resource.access?.list ?? "public";
}

function resourcesWithAttachments(app: AppIR) {
  return (app.resources ?? []).filter(resource => (resource.attachments?.length ?? 0) > 0);
}

export function hasGeneratedAttachments(app: AppIR) {
  return resourcesWithAttachments(app).length > 0;
}

export function renderGeneratedAttachmentModule(app: AppIR) {
  const attachments = resourcesWithAttachments(app).map(resource => ({
    resource: resource.name,
    table: assetTableNameFor(resource),
    attachments: (resource.attachments ?? []).map(attachment => ({
      ...attachment,
      bucketAlias: attachment.bucketAlias ?? defaultBucketAlias(app),
    })),
  }));

  return [
    "export const attachmentCatalog = " + JSON.stringify(attachments, null, 2) + " as const;",
    "",
    "export function getAttachmentEntry(resourceName: string) {",
    "  const entry = (attachmentCatalog.find(item => item.resource === resourceName) ?? null) as any;",
    "  if (!entry) throw new Error(`Resource ${resourceName} does not declare any attachments.`);",
    "  return entry;",
    "}",
    "",
    "export function getAttachmentDefinition(resourceName: string, attachmentName: string) {",
    "  const entry = getAttachmentEntry(resourceName);",
    "  const attachment = (entry.attachments.find((item: any) => item.name === attachmentName) ?? null) as any;",
    "  if (!attachment) throw new Error(`Unknown attachment ${attachmentName} on resource ${resourceName}.`);",
    "  return attachment;",
    "}",
    "",
  ].join("\n");
}

export function renderGeneratedSupabaseAttachmentPoliciesSql(app: AppIR) {
  const resources = resourcesWithAttachments(app);

  if (resources.length === 0) {
    return "";
  }

  const statements = resources.flatMap(resource => {
    const assetTable = assetTableNameFor(resource);
    const baseTable = tableNameFor(resource);
    const readPredicate = sqlReadPredicate(resource, attachmentReadAccess(resource));
    const mutationPredicate = sqlMutationPredicate(resource, attachmentMutationAccess(resource));
    const readScope = `${sqlQuoted("resource_id")} in (select ${sqlQuoted("id")} from public.${sqlQuoted(baseTable)} where ${readPredicate})`;
    const mutationScope = `${sqlQuoted("resource_id")} in (select ${sqlQuoted("id")} from public.${sqlQuoted(baseTable)} where ${mutationPredicate})`;

    return [
      `alter table if exists public.${sqlQuoted(assetTable)} enable row level security;`,
      `drop policy if exists ${sqlQuoted(`${assetTable}_select`)} on public.${sqlQuoted(assetTable)};`,
      `create policy ${sqlQuoted(`${assetTable}_select`)} on public.${sqlQuoted(assetTable)} for select to anon, authenticated using (${readScope});`,
      `drop policy if exists ${sqlQuoted(`${assetTable}_insert`)} on public.${sqlQuoted(assetTable)};`,
      `create policy ${sqlQuoted(`${assetTable}_insert`)} on public.${sqlQuoted(assetTable)} for insert to authenticated with check (${mutationScope});`,
      `drop policy if exists ${sqlQuoted(`${assetTable}_update`)} on public.${sqlQuoted(assetTable)};`,
      `create policy ${sqlQuoted(`${assetTable}_update`)} on public.${sqlQuoted(assetTable)} for update to authenticated using (${mutationScope}) with check (${mutationScope});`,
      `drop policy if exists ${sqlQuoted(`${assetTable}_delete`)} on public.${sqlQuoted(assetTable)};`,
      `create policy ${sqlQuoted(`${assetTable}_delete`)} on public.${sqlQuoted(assetTable)} for delete to authenticated using (${mutationScope});`,
      "",
    ];
  });

  return [
    "-- Attachment metadata policies generated by Stylyf CLI",
    ...statements,
  ].join("\n");
}

function renderPortableAttachmentServerModule(app: AppIR) {
  const fallbackBucketAlias = JSON.stringify(defaultBucketAlias(app));

  return [
    'import { randomUUID } from "node:crypto";',
    'import { and, eq, inArray, ne, or } from "drizzle-orm";',
    'import { db } from "~/lib/db";',
    'import * as schema from "~/lib/db/schema";',
    'import { getAttachmentDefinition, getAttachmentEntry } from "~/lib/attachments";',
    'import { resourcesByName } from "~/lib/resources";',
    'import { buildObjectUrl, createPresignedUpload, deleteObject } from "~/lib/storage";',
    'import { getViewerIdentity, requireViewerIdentity } from "~/lib/server/resource-policy";',
    "",
    "const DEFAULT_BUCKET_ALIAS = " + fallbackBucketAlias + ";",
    "",
    "export type AttachmentIntentInput = {",
    "  resource: string;",
    "  attachment: string;",
    "  resourceId: string;",
    "  fileName: string;",
    "  contentType: string;",
    "  fileSize?: number;",
    "  metadata?: Record<string, unknown> | null;",
    "  replaceAssetId?: string | null;",
    "};",
    "",
    "export type AttachmentConfirmInput = {",
    "  resource: string;",
    "  attachment: string;",
    "  resourceId: string;",
    "  assetId: string;",
    "  contentType?: string;",
    "  fileSize?: number;",
    "  metadata?: Record<string, unknown> | null;",
    "  replaceAssetId?: string | null;",
    "};",
    "",
    "export type AttachmentDeleteInput = {",
    "  resource: string;",
    "  attachment: string;",
    "  resourceId: string;",
    "  assetId: string;",
    "};",
    "",
    "function camelize(value: string) {",
    "  return value",
    "    .split(/[^a-zA-Z0-9]+/g)",
    "    .filter(Boolean)",
    "    .map((segment, index) => index === 0 ? `${segment[0]?.toLowerCase() ?? \"\"}${segment.slice(1)}` : `${segment[0]?.toUpperCase() ?? \"\"}${segment.slice(1)}`)",
    "    .join(\"\");",
    "}",
    "",
    "function sanitizeFileName(value: string) {",
    "  return value.replace(/[^a-zA-Z0-9._-]+/g, \"-\");",
    "}",
    "",
    "function getResourceDefinition(resourceName: string) {",
    "  const resource = (resourcesByName as Record<string, any>)[resourceName] as any;",
    "  if (!resource) throw new Error(`Unknown resource: ${resourceName}`);",
    "  return resource;",
    "}",
    "",
    "function resolveSchemaTable(tableName: string) {",
    "  const table = (schema as Record<string, any>)[camelize(tableName)];",
    "  if (!table) throw new Error(`Unable to resolve schema table: ${tableName}`);",
    "  return table;",
    "}",
    "",
    "function mutationAccessFor(resource: ReturnType<typeof getResourceDefinition>) {",
    "  return (resource.access?.update ?? resource.access?.create ?? \"user\") as string;",
    "}",
    "",
    "function buildAttachmentObjectKey(input: { bucketAlias: string; resource: string; resourceId: string; attachment: string; assetId: string; fileName: string }) {",
    "  const safeFileName = sanitizeFileName(input.fileName || \"upload.bin\");",
    "  return `${input.bucketAlias}/${input.resource}/${input.resourceId}/${input.attachment}/${input.assetId}-${safeFileName}`;",
    "}",
    "",
    "async function assertPortableMutationAccess(resourceName: string, resourceId: string) {",
    "  const resource = getResourceDefinition(resourceName);",
    "  const resourceTable = resolveSchemaTable(resource.table ?? resource.name);",
    "  const policy = mutationAccessFor(resource);",
    "  const ownerField = camelize(resource.ownership?.ownerField ?? \"owner_id\");",
    "  const workspaceField = camelize(resource.ownership?.workspaceField ?? \"workspace_id\");",
    "",
    "  switch (policy) {",
    "    case \"public\": {",
    "      const rows = (await db.select().from(resourceTable).where(eq(resourceTable.id, resourceId)).limit(1)) as any[];",
    "      if (!rows[0]) throw new Error(\"Resource not found or not accessible.\");",
    "      return { resource, userId: null as string | null };",
    "    }",
    "    case \"user\": {",
    "      const { userId } = await requireViewerIdentity();",
    "      const rows = (await db.select().from(resourceTable).where(eq(resourceTable.id, resourceId)).limit(1)) as any[];",
    "      if (!rows[0]) throw new Error(\"Resource not found or not accessible.\");",
    "      return { resource, userId };",
    "    }",
    "    case \"admin\": {",
    "      await requireViewerIdentity();",
    "      throw new Error(\"Admin access preset requires explicit role wiring. Generated defaults fail closed until you customize this policy.\");",
    "    }",
    "    case \"owner\": {",
    "      const { userId } = await requireViewerIdentity();",
    "      const rows = (await db.select().from(resourceTable).where(and(eq(resourceTable.id, resourceId), eq(resourceTable[ownerField], userId))).limit(1)) as any[];",
    "      if (!rows[0]) throw new Error(\"Resource not found or not accessible.\");",
    "      return { resource, userId };",
    "    }",
    "    case \"owner-or-public\": {",
    "      const viewer = await getViewerIdentity();",
    "      const rows = (viewer.userId",
    "        ? await db.select().from(resourceTable).where(and(eq(resourceTable.id, resourceId), or(eq(resourceTable[ownerField], viewer.userId), eq(resourceTable.isPublic, true)))).limit(1)",
    "        : await db.select().from(resourceTable).where(and(eq(resourceTable.id, resourceId), eq(resourceTable.isPublic, true))).limit(1)) as any[];",
    "      if (!rows[0]) throw new Error(\"Resource not found or not accessible.\");",
    "      return { resource, userId: viewer.userId };",
    "    }",
    "    case \"workspace-member\": {",
    "      const { userId } = await requireViewerIdentity();",
    "      const membershipTable = resolveSchemaTable(resource.ownership?.membershipTable ?? \"workspace_memberships\");",
    "      const memberships = (await db.select({ workspaceId: membershipTable[workspaceField] }).from(membershipTable).where(eq(membershipTable.userId, userId))) as Array<{ workspaceId: string }>;",
    "      if (memberships.length === 0) throw new Error(\"Resource not found or not accessible.\");",
    "      const rows = (await db.select().from(resourceTable).where(and(eq(resourceTable.id, resourceId), inArray(resourceTable[workspaceField], memberships.map(row => row.workspaceId)))).limit(1)) as any[];",
    "      if (!rows[0]) throw new Error(\"Resource not found or not accessible.\");",
    "      return { resource, userId };",
    "    }",
    "  }",
    "}",
    "",
    "async function loadPortableAssetRecord(input: AttachmentDeleteInput | AttachmentConfirmInput, requirePending = false) {",
    "  await assertPortableMutationAccess(input.resource, input.resourceId);",
    "  const entry = getAttachmentEntry(input.resource);",
    "  const definition = getAttachmentDefinition(input.resource, input.attachment);",
    "  const assetTable = resolveSchemaTable(entry.table);",
    "  const rows = (await db",
    "    .select()",
    "    .from(assetTable)",
    "    .where(and(eq(assetTable.id, input.assetId), eq(assetTable.resourceId, input.resourceId), eq(assetTable.attachmentName, input.attachment)))",
    "    .limit(1)) as any[];",
    "  const asset = rows[0];",
    "  if (!asset) throw new Error(\"Attachment record not found.\");",
    "  if (requirePending && asset.status !== \"pending\") throw new Error(\"Attachment upload is not pending.\");",
    "  return { assetTable, asset, definition };",
    "}",
    "",
    "export async function createAttachmentUploadIntent(input: AttachmentIntentInput) {",
    "  const definition = getAttachmentDefinition(input.resource, input.attachment);",
    "  await assertPortableMutationAccess(input.resource, input.resourceId);",
    "  const entry = getAttachmentEntry(input.resource);",
    "  const assetTable = resolveSchemaTable(entry.table);",
    "  const assetId = randomUUID();",
    "  const bucketAlias = definition.bucketAlias ?? DEFAULT_BUCKET_ALIAS;",
    "  const objectKey = buildAttachmentObjectKey({",
    "    bucketAlias,",
    "    resource: input.resource,",
    "    resourceId: input.resourceId,",
    "    attachment: input.attachment,",
    "    assetId,",
    "    fileName: input.fileName,",
    "  });",
    "  const upload = await createPresignedUpload({ key: objectKey, contentType: input.contentType });",
    "  await db.insert(assetTable).values({",
    "    id: assetId,",
    "    resourceId: input.resourceId,",
    "    attachmentName: input.attachment,",
    "    bucketAlias,",
    "    objectKey,",
    "    objectUrl: null,",
    "    fileName: input.fileName,",
    "    contentType: input.contentType,",
    "    fileSize: input.fileSize ?? null,",
    "    kind: definition.kind,",
    "    status: \"pending\",",
    "    metadata: input.metadata ?? null,",
    "    replacedByAssetId: null,",
    "    deletedAt: null,",
    "  }).returning();",
    "  return {",
    "    assetId,",
    "    bucketAlias,",
    "    objectKey,",
    "    upload,",
    "  };",
    "}",
    "",
    "export async function createAttachmentReplacementIntent(input: AttachmentIntentInput & { replaceAssetId: string }) {",
    "  return createAttachmentUploadIntent(input);",
    "}",
    "",
    "export async function confirmAttachment(input: AttachmentConfirmInput) {",
    "  const { assetTable, asset, definition } = await loadPortableAssetRecord(input, true);",
    "  const priorRows = input.replaceAssetId",
    "    ? ((await db.select().from(assetTable).where(and(eq(assetTable.id, input.replaceAssetId), eq(assetTable.resourceId, input.resourceId), eq(assetTable.attachmentName, input.attachment), eq(assetTable.status, \"attached\"))).limit(1)) as any[])",
    "    : definition.multiple",
    "      ? []",
    "      : ((await db.select().from(assetTable).where(and(eq(assetTable.resourceId, input.resourceId), eq(assetTable.attachmentName, input.attachment), eq(assetTable.status, \"attached\"), ne(assetTable.id, input.assetId)))) as any[]);",
    "",
    "  for (const prior of priorRows) {",
    "    if (prior.objectKey) {",
    "      await deleteObject(prior.objectKey);",
    "    }",
    "    await db.update(assetTable).set({",
    "      status: \"replaced\",",
    "      replacedByAssetId: input.assetId,",
    "      deletedAt: new Date(),",
    "    }).where(eq(assetTable.id, prior.id));",
    "  }",
    "",
    "  const objectUrl = buildObjectUrl(asset.objectKey);",
    "  const rows = (await db.update(assetTable).set({",
    "    status: \"attached\",",
    "    objectUrl,",
    "    contentType: input.contentType ?? asset.contentType ?? null,",
    "    fileSize: input.fileSize ?? asset.fileSize ?? null,",
    "    metadata: input.metadata ?? asset.metadata ?? null,",
    "    deletedAt: null,",
    "  }).where(eq(assetTable.id, input.assetId)).returning()) as any[];",
    "",
    "  return {",
    "    asset: rows[0] ?? { ...asset, objectUrl, status: \"attached\" },",
    "    replacedAssetIds: priorRows.map((row: any) => row.id),",
    "  };",
    "}",
    "",
    "export async function deleteAttachment(input: AttachmentDeleteInput) {",
    "  const { assetTable, asset } = await loadPortableAssetRecord(input);",
    "  if (asset.status !== \"deleted\" && asset.objectKey) {",
    "    await deleteObject(asset.objectKey);",
    "  }",
    "  const rows = (await db.update(assetTable).set({",
    "    status: \"deleted\",",
    "    deletedAt: new Date(),",
    "  }).where(eq(assetTable.id, input.assetId)).returning()) as any[];",
    "  return rows[0] ?? { ...asset, status: \"deleted\", deletedAt: new Date() };",
    "}",
    "",
  ].join("\n");
}

function renderHostedAttachmentServerModule(app: AppIR) {
  const fallbackBucketAlias = JSON.stringify(defaultBucketAlias(app));

  return [
    'import { randomUUID } from "node:crypto";',
    'import { getAttachmentDefinition, getAttachmentEntry } from "~/lib/attachments";',
    'import { resourcesByName } from "~/lib/resources";',
    'import { buildObjectUrl, createPresignedUpload, deleteObject } from "~/lib/storage";',
    'import { createSupabaseServerClient } from "~/lib/supabase";',
    'import { getViewerIdentity, requireViewerIdentity } from "~/lib/server/resource-policy";',
    "",
    "const DEFAULT_BUCKET_ALIAS = " + fallbackBucketAlias + ";",
    "",
    "export type AttachmentIntentInput = {",
    "  resource: string;",
    "  attachment: string;",
    "  resourceId: string;",
    "  fileName: string;",
    "  contentType: string;",
    "  fileSize?: number;",
    "  metadata?: Record<string, unknown> | null;",
    "  replaceAssetId?: string | null;",
    "};",
    "",
    "export type AttachmentConfirmInput = {",
    "  resource: string;",
    "  attachment: string;",
    "  resourceId: string;",
    "  assetId: string;",
    "  contentType?: string;",
    "  fileSize?: number;",
    "  metadata?: Record<string, unknown> | null;",
    "  replaceAssetId?: string | null;",
    "};",
    "",
    "export type AttachmentDeleteInput = {",
    "  resource: string;",
    "  attachment: string;",
    "  resourceId: string;",
    "  assetId: string;",
    "};",
    "",
    "function sanitizeFileName(value: string) {",
    "  return value.replace(/[^a-zA-Z0-9._-]+/g, \"-\");",
    "}",
    "",
    "function getResourceDefinition(resourceName: string) {",
    "  const resource = (resourcesByName as Record<string, any>)[resourceName] as any;",
    "  if (!resource) throw new Error(`Unknown resource: ${resourceName}`);",
    "  return resource;",
    "}",
    "",
    "function mutationAccessFor(resource: ReturnType<typeof getResourceDefinition>) {",
    "  return (resource.access?.update ?? resource.access?.create ?? \"user\") as string;",
    "}",
    "",
    "function buildAttachmentObjectKey(input: { bucketAlias: string; resource: string; resourceId: string; attachment: string; assetId: string; fileName: string }) {",
    "  const safeFileName = sanitizeFileName(input.fileName || \"upload.bin\");",
    "  return `${input.bucketAlias}/${input.resource}/${input.resourceId}/${input.attachment}/${input.assetId}-${safeFileName}`;",
    "}",
    "",
    "async function assertSupabaseMutationAccess(resourceName: string, resourceId: string) {",
    "  const resource = getResourceDefinition(resourceName);",
    "  const supabase = createSupabaseServerClient() as any;",
    "  const tableName = resource.table ?? resource.name;",
    "  const policy = mutationAccessFor(resource);",
    "  const ownerField = resource.ownership?.ownerField ?? \"owner_id\";",
    "  const workspaceField = resource.ownership?.workspaceField ?? \"workspace_id\";",
    "",
    "  switch (policy) {",
    "    case \"public\": {",
    "      const { data, error } = await supabase.from(tableName).select(\"id\").eq(\"id\", resourceId).limit(1);",
    "      if (error) throw error;",
    "      if (!data?.[0]) throw new Error(\"Resource not found or not accessible.\");",
    "      return { resource, userId: null as string | null };",
    "    }",
    "    case \"user\": {",
    "      const { userId } = await requireViewerIdentity();",
    "      const { data, error } = await supabase.from(tableName).select(\"id\").eq(\"id\", resourceId).limit(1);",
    "      if (error) throw error;",
    "      if (!data?.[0]) throw new Error(\"Resource not found or not accessible.\");",
    "      return { resource, userId };",
    "    }",
    "    case \"admin\": {",
    "      await requireViewerIdentity();",
    "      throw new Error(\"Admin access preset requires explicit role wiring. Generated defaults fail closed until you customize this policy.\");",
    "    }",
    "    case \"owner\": {",
    "      const { userId } = await requireViewerIdentity();",
    "      const { data, error } = await supabase.from(tableName).select(\"id\").eq(\"id\", resourceId).eq(ownerField, userId).limit(1);",
    "      if (error) throw error;",
    "      if (!data?.[0]) throw new Error(\"Resource not found or not accessible.\");",
    "      return { resource, userId };",
    "    }",
    "    case \"owner-or-public\": {",
    "      const viewer = await getViewerIdentity();",
    "      let statement = supabase.from(tableName).select(\"id\").eq(\"id\", resourceId).limit(1);",
    "      statement = viewer.userId ? statement.or(`${ownerField}.eq.${viewer.userId},is_public.eq.true`) : statement.eq(\"is_public\", true);",
    "      const { data, error } = await statement;",
    "      if (error) throw error;",
    "      if (!data?.[0]) throw new Error(\"Resource not found or not accessible.\");",
    "      return { resource, userId: viewer.userId };",
    "    }",
    "    case \"workspace-member\": {",
    "      const { userId } = await requireViewerIdentity();",
    "      const membershipTable = resource.ownership?.membershipTable ?? \"workspace_memberships\";",
    "      const { data: memberships, error: membershipError } = await supabase.from(membershipTable).select(workspaceField).eq(\"user_id\", userId);",
    "      if (membershipError) throw membershipError;",
    "      const workspaceIds = memberships?.map((row: any) => row[workspaceField]).filter(Boolean) ?? [];",
    "      if (workspaceIds.length === 0) throw new Error(\"Resource not found or not accessible.\");",
    "      const { data, error } = await supabase.from(tableName).select(\"id\").eq(\"id\", resourceId).in(workspaceField, workspaceIds).limit(1);",
    "      if (error) throw error;",
    "      if (!data?.[0]) throw new Error(\"Resource not found or not accessible.\");",
    "      return { resource, userId };",
    "    }",
    "  }",
    "}",
    "",
    "async function loadSupabaseAssetRecord(input: AttachmentDeleteInput | AttachmentConfirmInput, requirePending = false) {",
    "  await assertSupabaseMutationAccess(input.resource, input.resourceId);",
    "  const entry = getAttachmentEntry(input.resource);",
    "  const definition = getAttachmentDefinition(input.resource, input.attachment);",
    "  const supabase = createSupabaseServerClient() as any;",
    "  const { data, error } = await supabase",
    "    .from(entry.table)",
    "    .select(\"*\")",
    "    .eq(\"id\", input.assetId)",
    "    .eq(\"resource_id\", input.resourceId)",
    "    .eq(\"attachment_name\", input.attachment)",
    "    .limit(1);",
    "  if (error) throw error;",
    "  const asset = data?.[0];",
    "  if (!asset) throw new Error(\"Attachment record not found.\");",
    "  if (requirePending && asset.status !== \"pending\") throw new Error(\"Attachment upload is not pending.\");",
    "  return { supabase, tableName: entry.table, asset, definition };",
    "}",
    "",
    "export async function createAttachmentUploadIntent(input: AttachmentIntentInput) {",
    "  const definition = getAttachmentDefinition(input.resource, input.attachment);",
    "  await assertSupabaseMutationAccess(input.resource, input.resourceId);",
    "  const entry = getAttachmentEntry(input.resource);",
    "  const supabase = createSupabaseServerClient() as any;",
    "  const assetId = randomUUID();",
    "  const bucketAlias = definition.bucketAlias ?? DEFAULT_BUCKET_ALIAS;",
    "  const objectKey = buildAttachmentObjectKey({",
    "    bucketAlias,",
    "    resource: input.resource,",
    "    resourceId: input.resourceId,",
    "    attachment: input.attachment,",
    "    assetId,",
    "    fileName: input.fileName,",
    "  });",
    "  const upload = await createPresignedUpload({ key: objectKey, contentType: input.contentType });",
    "  const { error } = await supabase.from(entry.table).insert({",
    "    id: assetId,",
    "    resource_id: input.resourceId,",
    "    attachment_name: input.attachment,",
    "    bucket_alias: bucketAlias,",
    "    object_key: objectKey,",
    "    object_url: null,",
    "    file_name: input.fileName,",
    "    content_type: input.contentType,",
    "    file_size: input.fileSize ?? null,",
    "    kind: definition.kind,",
    "    status: \"pending\",",
    "    metadata: input.metadata ?? null,",
    "    replaced_by_asset_id: null,",
    "    deleted_at: null,",
    "  });",
    "  if (error) throw error;",
    "  return {",
    "    assetId,",
    "    bucketAlias,",
    "    objectKey,",
    "    upload,",
    "  };",
    "}",
    "",
    "export async function createAttachmentReplacementIntent(input: AttachmentIntentInput & { replaceAssetId: string }) {",
    "  return createAttachmentUploadIntent(input);",
    "}",
    "",
    "export async function confirmAttachment(input: AttachmentConfirmInput) {",
    "  const { supabase, tableName, asset, definition } = await loadSupabaseAssetRecord(input, true);",
    "  const priorResponse = input.replaceAssetId",
    "    ? await supabase.from(tableName).select(\"*\").eq(\"id\", input.replaceAssetId).eq(\"resource_id\", input.resourceId).eq(\"attachment_name\", input.attachment).eq(\"status\", \"attached\").limit(1)",
    "    : definition.multiple",
    "      ? { data: [], error: null }",
    "      : await supabase.from(tableName).select(\"*\").eq(\"resource_id\", input.resourceId).eq(\"attachment_name\", input.attachment).eq(\"status\", \"attached\").neq(\"id\", input.assetId);",
    "  if (priorResponse.error) throw priorResponse.error;",
    "  const priorRows = priorResponse.data ?? [];",
    "",
    "  for (const prior of priorRows) {",
    "    if (prior.object_key) {",
    "      await deleteObject(prior.object_key);",
    "    }",
    "    const { error } = await supabase.from(tableName).update({",
    "      status: \"replaced\",",
    "      replaced_by_asset_id: input.assetId,",
    "      deleted_at: new Date().toISOString(),",
    "    }).eq(\"id\", prior.id);",
    "    if (error) throw error;",
    "  }",
    "",
    "  const objectUrl = buildObjectUrl(asset.object_key);",
    "  const { data, error } = await supabase.from(tableName).update({",
    "    status: \"attached\",",
    "    object_url: objectUrl,",
    "    content_type: input.contentType ?? asset.content_type ?? null,",
    "    file_size: input.fileSize ?? asset.file_size ?? null,",
    "    metadata: input.metadata ?? asset.metadata ?? null,",
    "    deleted_at: null,",
    "  }).eq(\"id\", input.assetId).select(\"*\").limit(1);",
    "  if (error) throw error;",
    "  return {",
    "    asset: data?.[0] ?? { ...asset, object_url: objectUrl, status: \"attached\" },",
    "    replacedAssetIds: priorRows.map((row: any) => row.id),",
    "  };",
    "}",
    "",
    "export async function deleteAttachment(input: AttachmentDeleteInput) {",
    "  const { supabase, tableName, asset } = await loadSupabaseAssetRecord(input);",
    "  if (asset.status !== \"deleted\" && asset.object_key) {",
    "    await deleteObject(asset.object_key);",
    "  }",
    "  const { data, error } = await supabase.from(tableName).update({",
    "    status: \"deleted\",",
    "    deleted_at: new Date().toISOString(),",
    "  }).eq(\"id\", input.assetId).select(\"*\").limit(1);",
    "  if (error) throw error;",
    "  return data?.[0] ?? { ...asset, status: \"deleted\", deleted_at: new Date().toISOString() };",
    "}",
    "",
  ].join("\n");
}

function routeSource(helperName: string, bodyLines: string[]) {
  return [
    'import type { APIEvent } from "@solidjs/start/server";',
    `import { ${helperName} } from "~/lib/server/attachments";`,
    "",
    "function errorMessage(error: unknown) {",
    "  return error instanceof Error ? error.message : \"Unexpected error\";",
    "}",
    "",
    "export async function POST(event: APIEvent) {",
    "  try {",
    "    const body = await event.request.json().catch(() => ({} as Record<string, unknown>));",
    ...bodyLines.map(line => `    ${line}`),
    `    const result = await ${helperName}(input);`,
    "    return Response.json({ ok: true, result });",
    "  } catch (error) {",
    "    return Response.json({ ok: false, error: errorMessage(error) }, { status: 400 });",
    "  }",
    "}",
    "",
  ].join("\n");
}

export function renderGeneratedAttachmentApiRoutes() {
  return {
    "src/routes/api/attachments/intent.ts": routeSource("createAttachmentUploadIntent", [
      "const input = {",
      "  resource: typeof body.resource === \"string\" ? body.resource : \"\",",
      "  attachment: typeof body.attachment === \"string\" ? body.attachment : \"\",",
      "  resourceId: typeof body.resourceId === \"string\" ? body.resourceId : \"\",",
      "  fileName: typeof body.fileName === \"string\" ? body.fileName : \"upload.bin\",",
      "  contentType: typeof body.contentType === \"string\" ? body.contentType : \"application/octet-stream\",",
      "  fileSize: typeof body.fileSize === \"number\" ? body.fileSize : undefined,",
      "  metadata: body.metadata && typeof body.metadata === \"object\" ? (body.metadata as Record<string, unknown>) : null,",
      "  replaceAssetId: typeof body.replaceAssetId === \"string\" ? body.replaceAssetId : null,",
      "};",
    ]),
    "src/routes/api/attachments/replace.ts": routeSource("createAttachmentReplacementIntent", [
      "const input = {",
      "  resource: typeof body.resource === \"string\" ? body.resource : \"\",",
      "  attachment: typeof body.attachment === \"string\" ? body.attachment : \"\",",
      "  resourceId: typeof body.resourceId === \"string\" ? body.resourceId : \"\",",
      "  fileName: typeof body.fileName === \"string\" ? body.fileName : \"upload.bin\",",
      "  contentType: typeof body.contentType === \"string\" ? body.contentType : \"application/octet-stream\",",
      "  fileSize: typeof body.fileSize === \"number\" ? body.fileSize : undefined,",
      "  metadata: body.metadata && typeof body.metadata === \"object\" ? (body.metadata as Record<string, unknown>) : null,",
      "  replaceAssetId: typeof body.replaceAssetId === \"string\" ? body.replaceAssetId : \"\",",
      "};",
    ]),
    "src/routes/api/attachments/confirm.ts": routeSource("confirmAttachment", [
      "const input = {",
      "  resource: typeof body.resource === \"string\" ? body.resource : \"\",",
      "  attachment: typeof body.attachment === \"string\" ? body.attachment : \"\",",
      "  resourceId: typeof body.resourceId === \"string\" ? body.resourceId : \"\",",
      "  assetId: typeof body.assetId === \"string\" ? body.assetId : \"\",",
      "  contentType: typeof body.contentType === \"string\" ? body.contentType : undefined,",
      "  fileSize: typeof body.fileSize === \"number\" ? body.fileSize : undefined,",
      "  metadata: body.metadata && typeof body.metadata === \"object\" ? (body.metadata as Record<string, unknown>) : null,",
      "  replaceAssetId: typeof body.replaceAssetId === \"string\" ? body.replaceAssetId : null,",
      "};",
    ]),
    "src/routes/api/attachments/delete.ts": routeSource("deleteAttachment", [
      "const input = {",
      "  resource: typeof body.resource === \"string\" ? body.resource : \"\",",
      "  attachment: typeof body.attachment === \"string\" ? body.attachment : \"\",",
      "  resourceId: typeof body.resourceId === \"string\" ? body.resourceId : \"\",",
      "  assetId: typeof body.assetId === \"string\" ? body.assetId : \"\",",
      "};",
    ]),
  };
}

export function renderGeneratedAttachmentServerModule(app: AppIR) {
  return app.database?.provider === "supabase"
    ? renderHostedAttachmentServerModule(app)
    : renderPortableAttachmentServerModule(app);
}
