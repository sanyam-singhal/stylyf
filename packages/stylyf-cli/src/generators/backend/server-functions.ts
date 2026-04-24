import { resolve } from "node:path";
import type { AppIR, ResourceAccessPreset, ResourceIR, ServerModuleIR } from "../../compiler/generated-app.js";
import { writeGeneratedFile } from "../assets.js";
import { renderServerFunctionTemplate, type ServerFunctionTemplateId } from "../templates.js";

function camelCase(value: string) {
  return value
    .split(/[^a-zA-Z0-9]+/g)
    .filter(Boolean)
    .map((segment, index) =>
      index === 0 ? segment.toLowerCase() : `${segment[0]?.toUpperCase() ?? ""}${segment.slice(1).toLowerCase()}`,
    )
    .join("");
}

function pascalCase(value: string) {
  return value
    .split(/[^a-zA-Z0-9]+/g)
    .filter(Boolean)
    .map(segment => `${segment[0]?.toUpperCase() ?? ""}${segment.slice(1).toLowerCase()}`)
    .join("");
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function resourceSymbol(name?: string) {
  return camelCase(name ?? "resource");
}

function exportName(module: ServerModuleIR) {
  const resource = module.resource ? pascalCase(module.resource) : "";

  if (module.name.endsWith(".list")) return `list${resource}`;
  if (module.name.endsWith(".detail")) return `get${resource}`;
  if (module.name.endsWith(".create")) return `create${resource}`;
  if (module.name.endsWith(".update")) return `update${resource}`;
  if (module.name.endsWith(".delete")) return `delete${resource}`;
  if (module.name.includes("upload")) return `create${resource || "Upload"}Handshake`;

  return camelCase(module.name);
}

function templateIdFor(module: ServerModuleIR): ServerFunctionTemplateId {
  if (module.type === "query") {
    if (module.name.endsWith(".list")) return "list-query";
    if (module.name.endsWith(".detail")) return "detail-query";
    return "generic-query";
  }

  if (module.name.includes("upload")) return "upload-handshake-action";
  if (module.name.endsWith(".create")) return "create-action";
  if (module.name.endsWith(".update")) return "update-action";
  if (module.name.endsWith(".delete")) return "delete-action";
  return "generic-action";
}

function filePathFor(module: ServerModuleIR) {
  const folder = module.type === "query" ? "queries" : "actions";
  return `src/lib/server/${folder}/${slugify(module.name)}.ts`;
}

function tableNameFor(resource: ResourceIR) {
  return resource.table ?? resource.name;
}

function schemaSymbolFor(resource: ResourceIR) {
  return camelCase(tableNameFor(resource));
}

function propertySymbolFor(fieldName: string) {
  return camelCase(fieldName);
}

function operationFor(module: ServerModuleIR): "list" | "detail" | "create" | "update" | "delete" | null {
  if (module.name.endsWith(".list")) return "list";
  if (module.name.endsWith(".detail")) return "detail";
  if (module.name.endsWith(".create")) return "create";
  if (module.name.endsWith(".update")) return "update";
  if (module.name.endsWith(".delete")) return "delete";
  return null;
}

function policyFor(resource: ResourceIR, operation: "list" | "detail" | "create" | "update" | "delete"): ResourceAccessPreset {
  if (operation === "detail") {
    return resource.access?.read ?? "public";
  }

  if (operation === "list") {
    return resource.access?.list ?? resource.access?.read ?? "public";
  }

  return resource.access?.[operation] ?? "public";
}

function findResourceForModule(module: ServerModuleIR, app: AppIR) {
  const operation = operationFor(module);
  if (!operation) return null;

  const moduleKey = module.resource ?? module.name.split(".")[0] ?? "";

  return (
    app.resources?.find(resource => resource.name === moduleKey || tableNameFor(resource) === moduleKey) ?? null
  );
}

function policySessionHelperName(policy: ResourceAccessPreset) {
  return policy === "public" || policy === "owner-or-public" ? "getViewerIdentity" : "requireViewerIdentity";
}

function adminPolicyErrorLines() {
  return [
    "  await requireViewerIdentity();",
    '  throw new Error("Admin access preset requires explicit role wiring. Generated defaults fail closed until you customize this policy.");',
  ].join("\n");
}

function buildPortableResourceRenderer(module: ServerModuleIR, resource: ResourceIR) {
  const operation = operationFor(module);
  if (!operation) return null;

  const exportSymbol = exportName(module);
  const queryKey = JSON.stringify(module.name);
  const tableSymbol = schemaSymbolFor(resource);
  const ownerField = propertySymbolFor(resource.ownership?.ownerField ?? "owner_id");
  const workspaceField = propertySymbolFor(resource.ownership?.workspaceField ?? "workspace_id");
  const ownershipModel = resource.ownership?.model ?? "none";
  const membershipTable = resource.ownership?.membershipTable ?? "workspace_memberships";
  const membershipSymbol = camelCase(membershipTable);
  const policy = policyFor(resource, operation);
  const sessionHelper = policySessionHelperName(policy);
  const drizzleImports = new Set<string>();
  const schemaImports = new Set<string>([tableSymbol]);
  const serverPolicyImports = new Set<string>([sessionHelper]);

  let body = "";

  if (operation === "list") {
    switch (policy) {
      case "public":
        body = `  return db.select().from(${tableSymbol});`;
        break;
      case "user":
        body = `  await ${sessionHelper}();\n  return db.select().from(${tableSymbol});`;
        break;
      case "admin":
        body = adminPolicyErrorLines();
        break;
      case "owner":
        drizzleImports.add("eq");
        body =
          `  const { userId } = await ${sessionHelper}();\n` +
          `  return db.select().from(${tableSymbol}).where(eq(${tableSymbol}.${ownerField}, userId));`;
        break;
      case "owner-or-public":
        drizzleImports.add("eq");
        drizzleImports.add("or");
        body =
          `  const viewer = await ${sessionHelper}();\n` +
          `  const statement = viewer.userId\n` +
          `    ? db.select().from(${tableSymbol}).where(or(eq(${tableSymbol}.${ownerField}, viewer.userId), eq(${tableSymbol}.isPublic, true)))\n` +
          `    : db.select().from(${tableSymbol}).where(eq(${tableSymbol}.isPublic, true));\n` +
          "  return statement;";
        break;
      case "workspace-member":
        drizzleImports.add("eq");
        drizzleImports.add("inArray");
        schemaImports.add(membershipSymbol);
        body =
          `  const { userId } = await ${sessionHelper}();\n` +
          `  const memberships = await db.select({ workspaceId: ${membershipSymbol}.${workspaceField} }).from(${membershipSymbol}).where(eq(${membershipSymbol}.userId, userId));\n` +
          "  if (memberships.length === 0) return [];\n" +
          `  return db.select().from(${tableSymbol}).where(inArray(${tableSymbol}.${workspaceField}, memberships.map(row => row.workspaceId)));`;
        break;
    }
  }

  if (operation === "detail") {
    drizzleImports.add("eq");
    const base = `  let statement = db.select().from(${tableSymbol}).where(eq(${tableSymbol}.id, id)).limit(1);`;
    switch (policy) {
      case "public":
        body = `${base}\n  const rows = await statement;\n  return rows[0] ?? null;`;
        break;
      case "user":
        body = `  await ${sessionHelper}();\n${base}\n  const rows = await statement;\n  return rows[0] ?? null;`;
        break;
      case "admin":
        body = adminPolicyErrorLines();
        break;
      case "owner":
        drizzleImports.add("and");
        body =
          `  const { userId } = await ${sessionHelper}();\n` +
          `  let statement = db.select().from(${tableSymbol}).where(and(eq(${tableSymbol}.id, id), eq(${tableSymbol}.${ownerField}, userId))).limit(1);\n` +
          "  const rows = await statement;\n" +
          "  return rows[0] ?? null;";
        break;
      case "owner-or-public":
        drizzleImports.add("and");
        drizzleImports.add("or");
        body =
          `  const viewer = await ${sessionHelper}();\n` +
          `  let statement = viewer.userId\n` +
          `    ? db.select().from(${tableSymbol}).where(and(eq(${tableSymbol}.id, id), or(eq(${tableSymbol}.${ownerField}, viewer.userId), eq(${tableSymbol}.isPublic, true)))).limit(1)\n` +
          `    : db.select().from(${tableSymbol}).where(and(eq(${tableSymbol}.id, id), eq(${tableSymbol}.isPublic, true))).limit(1);\n` +
          "  const rows = await statement;\n" +
          "  return rows[0] ?? null;";
        break;
      case "workspace-member":
        drizzleImports.add("and");
        drizzleImports.add("inArray");
        schemaImports.add(membershipSymbol);
        body =
          `  const { userId } = await ${sessionHelper}();\n` +
          `  const memberships = await db.select({ workspaceId: ${membershipSymbol}.${workspaceField} }).from(${membershipSymbol}).where(eq(${membershipSymbol}.userId, userId));\n` +
          "  if (memberships.length === 0) return null;\n" +
          `  let statement = db.select().from(${tableSymbol}).where(and(eq(${tableSymbol}.id, id), inArray(${tableSymbol}.${workspaceField}, memberships.map(row => row.workspaceId)))).limit(1);\n` +
          "  const rows = await statement;\n" +
          "  return rows[0] ?? null;";
        break;
    }
  }

  if (operation === "create") {
    switch (policy) {
      case "public":
        body = `  return db.insert(${tableSymbol}).values(input).returning();`;
        break;
      case "user":
        if (ownershipModel === "user") {
          body =
            `  const { userId } = await ${sessionHelper}();\n` +
            `  const nextInput = { ...input, ${ownerField}: userId };\n` +
            `  return db.insert(${tableSymbol}).values(nextInput).returning();`;
        } else {
          body = `  await ${sessionHelper}();\n  return db.insert(${tableSymbol}).values(input).returning();`;
        }
        break;
      case "admin":
        body = adminPolicyErrorLines();
        break;
      case "owner":
      case "owner-or-public":
        body =
          `  const { userId } = await ${sessionHelper}();\n` +
          `  const nextInput = { ...input, ${ownerField}: userId };\n` +
          `  return db.insert(${tableSymbol}).values(nextInput).returning();`;
        break;
      case "workspace-member":
        drizzleImports.add("and");
        drizzleImports.add("eq");
        schemaImports.add(membershipSymbol);
        body =
          `  const { userId } = await ${sessionHelper}();\n` +
          `  const workspaceId = input.${workspaceField};\n` +
          "  if (!workspaceId) throw new Error(\"Workspace-scoped create requires a workspace id.\");\n" +
          `  const memberships = await db.select().from(${membershipSymbol}).where(and(eq(${membershipSymbol}.userId, userId), eq(${membershipSymbol}.${workspaceField}, workspaceId))).limit(1);\n` +
          "  if (memberships.length === 0) throw new Error(\"You are not a member of this workspace.\");\n" +
          `  return db.insert(${tableSymbol}).values(input).returning();`;
        break;
    }
  }

  if (operation === "update") {
    drizzleImports.add("eq");
    switch (policy) {
      case "public":
        body =
          "  const { id, ...changes } = input;\n" +
          `  return db.update(${tableSymbol}).set(changes).where(eq(${tableSymbol}.id, id)).returning();`;
        break;
      case "user":
        body =
          `  await ${sessionHelper}();\n` +
          "  const { id, ...changes } = input;\n" +
          `  return db.update(${tableSymbol}).set(changes).where(eq(${tableSymbol}.id, id)).returning();`;
        break;
      case "admin":
        body = adminPolicyErrorLines();
        break;
      case "owner":
      case "owner-or-public":
        drizzleImports.add("and");
        body =
          `  const { userId } = await ${sessionHelper}();\n` +
          "  const { id, ...changes } = input;\n" +
          `  return db.update(${tableSymbol}).set(changes).where(and(eq(${tableSymbol}.id, id), eq(${tableSymbol}.${ownerField}, userId))).returning();`;
        break;
      case "workspace-member":
        drizzleImports.add("and");
        drizzleImports.add("inArray");
        schemaImports.add(membershipSymbol);
        body =
          `  const { userId } = await ${sessionHelper}();\n` +
          `  const memberships = await db.select({ workspaceId: ${membershipSymbol}.${workspaceField} }).from(${membershipSymbol}).where(eq(${membershipSymbol}.userId, userId));\n` +
          "  if (memberships.length === 0) return [];\n" +
          "  const { id, ...changes } = input;\n" +
          `  return db.update(${tableSymbol}).set(changes).where(and(eq(${tableSymbol}.id, id), inArray(${tableSymbol}.${workspaceField}, memberships.map(row => row.workspaceId)))).returning();`;
        break;
    }
  }

  if (operation === "delete") {
    drizzleImports.add("eq");
    switch (policy) {
      case "public":
        body = `  return db.delete(${tableSymbol}).where(eq(${tableSymbol}.id, id)).returning();`;
        break;
      case "user":
        body = `  await ${sessionHelper}();\n  return db.delete(${tableSymbol}).where(eq(${tableSymbol}.id, id)).returning();`;
        break;
      case "admin":
        body = adminPolicyErrorLines();
        break;
      case "owner":
      case "owner-or-public":
        drizzleImports.add("and");
        body =
          `  const { userId } = await ${sessionHelper}();\n` +
          `  return db.delete(${tableSymbol}).where(and(eq(${tableSymbol}.id, id), eq(${tableSymbol}.${ownerField}, userId))).returning();`;
        break;
      case "workspace-member":
        drizzleImports.add("and");
        drizzleImports.add("inArray");
        schemaImports.add(membershipSymbol);
        body =
          `  const { userId } = await ${sessionHelper}();\n` +
          `  const memberships = await db.select({ workspaceId: ${membershipSymbol}.${workspaceField} }).from(${membershipSymbol}).where(eq(${membershipSymbol}.userId, userId));\n` +
          "  if (memberships.length === 0) return [];\n" +
          `  return db.delete(${tableSymbol}).where(and(eq(${tableSymbol}.id, id), inArray(${tableSymbol}.${workspaceField}, memberships.map(row => row.workspaceId)))).returning();`;
        break;
    }
  }

  const importLines = [
    module.type === "query" ? 'import { query } from "@solidjs/router";' : 'import { action } from "@solidjs/router";',
    drizzleImports.size > 0 ? `import { ${[...drizzleImports].sort().join(", ")} } from "drizzle-orm";` : "",
    'import { db } from "~/lib/db";',
    `import { ${[...schemaImports].sort().join(", ")} } from "~/lib/db/schema";`,
    `import { ${[...serverPolicyImports].sort().join(", ")} } from "~/lib/server/resource-policy";`,
    "",
  ]
    .filter(Boolean)
    .join("\n");

  const functionSource =
    operation === "list"
      ? `export const ${exportSymbol} = query(async () => {\n  "use server";\n${body}\n}, ${queryKey});\n`
      : operation === "detail"
        ? `export const ${exportSymbol} = query(async (id: typeof ${tableSymbol}.$inferSelect.id) => {\n  "use server";\n${body}\n}, ${queryKey});\n`
        : operation === "update"
          ? `type ${pascalCase(resource.name)}UpdateInput = Partial<typeof ${tableSymbol}.$inferInsert> & {\n  id: typeof ${tableSymbol}.$inferSelect.id;\n};\n\nexport const ${exportSymbol} = action(async (input: ${pascalCase(resource.name)}UpdateInput) => {\n  "use server";\n${body}\n}, ${queryKey});\n`
          : `export const ${exportSymbol} = action(async (input: typeof ${tableSymbol}.$inferInsert${operation === "delete" ? " | typeof " + tableSymbol + ".$inferSelect.id" : ""}) => {\n  "use server";\n${body}\n}, ${queryKey});\n`;

  if (operation === "delete") {
    return [
      importLines,
      `export const ${exportSymbol} = action(async (id: typeof ${tableSymbol}.$inferSelect.id) => {`,
      '  "use server";',
      body,
      `}, ${queryKey});`,
      "",
    ].join("\n");
  }

  return [importLines, functionSource, ""].join("\n");
}

function buildSupabaseResourceRenderer(module: ServerModuleIR, resource: ResourceIR) {
  const operation = operationFor(module);
  if (!operation) return null;

  const exportSymbol = exportName(module);
  const queryKey = JSON.stringify(module.name);
  const tableName = tableNameFor(resource);
  const ownerField = resource.ownership?.ownerField ?? "owner_id";
  const workspaceField = resource.ownership?.workspaceField ?? "workspace_id";
  const ownershipModel = resource.ownership?.model ?? "none";
  const membershipTable = resource.ownership?.membershipTable ?? "workspace_memberships";
  const policy = policyFor(resource, operation);
  const sessionHelper = policySessionHelperName(policy);

  const imports = [
    module.type === "query" ? 'import { query } from "@solidjs/router";' : 'import { action } from "@solidjs/router";',
    'import { createSupabaseServerClient } from "~/lib/supabase";',
    `import { ${sessionHelper} } from "~/lib/server/resource-policy";`,
    "",
  ].join("\n");

  let body = "";

  if (operation === "list") {
    switch (policy) {
      case "public":
        body =
          "  const supabase = createSupabaseServerClient();\n" +
          `  const { data, error } = await supabase.from(${JSON.stringify(tableName)}).select("*");\n` +
          "  if (error) throw error;\n" +
          "  return data ?? [];";
        break;
      case "user":
        body =
          `  await ${sessionHelper}();\n` +
          "  const supabase = createSupabaseServerClient();\n" +
          `  const { data, error } = await supabase.from(${JSON.stringify(tableName)}).select("*");\n` +
          "  if (error) throw error;\n" +
          "  return data ?? [];";
        break;
      case "admin":
        body = adminPolicyErrorLines();
        break;
      case "owner":
        body =
          `  const { userId } = await ${sessionHelper}();\n` +
          "  const supabase = createSupabaseServerClient();\n" +
          `  const { data, error } = await supabase.from(${JSON.stringify(tableName)}).select("*").eq(${JSON.stringify(ownerField)}, userId);\n` +
          "  if (error) throw error;\n" +
          "  return data ?? [];";
        break;
      case "owner-or-public":
        body =
          `  const viewer = await ${sessionHelper}();\n` +
          "  const supabase = createSupabaseServerClient();\n" +
          `  let statement = supabase.from(${JSON.stringify(tableName)}).select("*");\n` +
          `  statement = viewer.userId ? statement.or(${JSON.stringify(`${ownerField}.eq.`)} + viewer.userId + ${JSON.stringify(`,is_public.eq.true`)}) : statement.eq("is_public", true);\n` +
          "  const { data, error } = await statement;\n" +
          "  if (error) throw error;\n" +
          "  return data ?? [];";
        break;
      case "workspace-member":
        body =
          `  const { userId } = await ${sessionHelper}();\n` +
          "  const supabase = createSupabaseServerClient();\n" +
          `  const { data: memberships, error: membershipError } = await supabase.from(${JSON.stringify(membershipTable)}).select(${JSON.stringify(workspaceField)}).eq("user_id", userId);\n` +
          "  if (membershipError) throw membershipError;\n" +
          `  const workspaceIds = memberships?.map(row => row[${JSON.stringify(workspaceField)}]).filter(Boolean) ?? [];\n` +
          "  if (workspaceIds.length === 0) return [];\n" +
          `  const { data, error } = await supabase.from(${JSON.stringify(tableName)}).select("*").in(${JSON.stringify(workspaceField)}, workspaceIds);\n` +
          "  if (error) throw error;\n" +
          "  return data ?? [];";
        break;
    }
  }

  if (operation === "detail") {
    switch (policy) {
      case "public":
        body =
          "  const supabase = createSupabaseServerClient();\n" +
          `  const { data, error } = await supabase.from(${JSON.stringify(tableName)}).select("*").eq("id", id).limit(1);\n` +
          "  if (error) throw error;\n" +
          "  return data?.[0] ?? null;";
        break;
      case "user":
        body =
          `  await ${sessionHelper}();\n` +
          "  const supabase = createSupabaseServerClient();\n" +
          `  const { data, error } = await supabase.from(${JSON.stringify(tableName)}).select("*").eq("id", id).limit(1);\n` +
          "  if (error) throw error;\n" +
          "  return data?.[0] ?? null;";
        break;
      case "admin":
        body = adminPolicyErrorLines();
        break;
      case "owner":
        body =
          `  const { userId } = await ${sessionHelper}();\n` +
          "  const supabase = createSupabaseServerClient();\n" +
          `  const { data, error } = await supabase.from(${JSON.stringify(tableName)}).select("*").eq("id", id).eq(${JSON.stringify(ownerField)}, userId).limit(1);\n` +
          "  if (error) throw error;\n" +
          "  return data?.[0] ?? null;";
        break;
      case "owner-or-public":
        body =
          `  const viewer = await ${sessionHelper}();\n` +
          "  const supabase = createSupabaseServerClient();\n" +
          `  let statement = supabase.from(${JSON.stringify(tableName)}).select("*").eq("id", id).limit(1);\n` +
          `  statement = viewer.userId ? statement.or(${JSON.stringify(`${ownerField}.eq.`)} + viewer.userId + ${JSON.stringify(`,is_public.eq.true`)}) : statement.eq("is_public", true);\n` +
          "  const { data, error } = await statement;\n" +
          "  if (error) throw error;\n" +
          "  return data?.[0] ?? null;";
        break;
      case "workspace-member":
        body =
          `  const { userId } = await ${sessionHelper}();\n` +
          "  const supabase = createSupabaseServerClient();\n" +
          `  const { data: memberships, error: membershipError } = await supabase.from(${JSON.stringify(membershipTable)}).select(${JSON.stringify(workspaceField)}).eq("user_id", userId);\n` +
          "  if (membershipError) throw membershipError;\n" +
          `  const workspaceIds = memberships?.map(row => row[${JSON.stringify(workspaceField)}]).filter(Boolean) ?? [];\n` +
          "  if (workspaceIds.length === 0) return null;\n" +
          `  const { data, error } = await supabase.from(${JSON.stringify(tableName)}).select("*").eq("id", id).in(${JSON.stringify(workspaceField)}, workspaceIds).limit(1);\n` +
          "  if (error) throw error;\n" +
          "  return data?.[0] ?? null;";
        break;
    }
  }

  if (operation === "create") {
    switch (policy) {
      case "public":
        body =
          "  const supabase = createSupabaseServerClient();\n" +
          `  const { data, error } = await supabase.from(${JSON.stringify(tableName)}).insert(input).select("*");\n` +
          "  if (error) throw error;\n" +
          "  return data ?? [];";
        break;
      case "user":
        if (ownershipModel === "user") {
          body =
            `  const { userId } = await ${sessionHelper}();\n` +
            "  const supabase = createSupabaseServerClient();\n" +
            `  const nextInput = { ...input, ${JSON.stringify(ownerField)}: userId };\n` +
            `  const { data, error } = await supabase.from(${JSON.stringify(tableName)}).insert(nextInput).select("*");\n` +
            "  if (error) throw error;\n" +
            "  return data ?? [];";
        } else {
          body =
            `  await ${sessionHelper}();\n` +
            "  const supabase = createSupabaseServerClient();\n" +
            `  const { data, error } = await supabase.from(${JSON.stringify(tableName)}).insert(input).select("*");\n` +
            "  if (error) throw error;\n" +
            "  return data ?? [];";
        }
        break;
      case "admin":
        body = adminPolicyErrorLines();
        break;
      case "owner":
      case "owner-or-public":
        body =
          `  const { userId } = await ${sessionHelper}();\n` +
          "  const supabase = createSupabaseServerClient();\n" +
          `  const nextInput = { ...input, ${JSON.stringify(ownerField)}: userId };\n` +
          `  const { data, error } = await supabase.from(${JSON.stringify(tableName)}).insert(nextInput).select("*");\n` +
          "  if (error) throw error;\n" +
          "  return data ?? [];";
        break;
      case "workspace-member":
        body =
          `  const { userId } = await ${sessionHelper}();\n` +
          `  const workspaceId = input[${JSON.stringify(workspaceField)}];\n` +
          "  if (!workspaceId) throw new Error(\"Workspace-scoped create requires a workspace id.\");\n" +
          "  const supabase = createSupabaseServerClient();\n" +
          `  const { data: memberships, error: membershipError } = await supabase.from(${JSON.stringify(membershipTable)}).select("id").eq("user_id", userId).eq(${JSON.stringify(workspaceField)}, workspaceId).limit(1);\n` +
          "  if (membershipError) throw membershipError;\n" +
          "  if (!memberships || memberships.length === 0) throw new Error(\"You are not a member of this workspace.\");\n" +
          `  const { data, error } = await supabase.from(${JSON.stringify(tableName)}).insert(input).select("*");\n` +
          "  if (error) throw error;\n" +
          "  return data ?? [];";
        break;
    }
  }

  if (operation === "update") {
    switch (policy) {
      case "public":
        body =
          "  const { id, ...changes } = input;\n" +
          "  const supabase = createSupabaseServerClient();\n" +
          `  const { data, error } = await supabase.from(${JSON.stringify(tableName)}).update(changes).eq("id", id).select("*");\n` +
          "  if (error) throw error;\n" +
          "  return data ?? [];";
        break;
      case "user":
        body =
          `  await ${sessionHelper}();\n` +
          "  const { id, ...changes } = input;\n" +
          "  const supabase = createSupabaseServerClient();\n" +
          `  const { data, error } = await supabase.from(${JSON.stringify(tableName)}).update(changes).eq("id", id).select("*");\n` +
          "  if (error) throw error;\n" +
          "  return data ?? [];";
        break;
      case "admin":
        body = adminPolicyErrorLines();
        break;
      case "owner":
      case "owner-or-public":
        body =
          `  const { userId } = await ${sessionHelper}();\n` +
          "  const { id, ...changes } = input;\n" +
          "  const supabase = createSupabaseServerClient();\n" +
          `  const { data, error } = await supabase.from(${JSON.stringify(tableName)}).update(changes).eq("id", id).eq(${JSON.stringify(ownerField)}, userId).select("*");\n` +
          "  if (error) throw error;\n" +
          "  return data ?? [];";
        break;
      case "workspace-member":
        body =
          `  const { userId } = await ${sessionHelper}();\n` +
          "  const supabase = createSupabaseServerClient();\n" +
          `  const { data: memberships, error: membershipError } = await supabase.from(${JSON.stringify(membershipTable)}).select(${JSON.stringify(workspaceField)}).eq("user_id", userId);\n` +
          "  if (membershipError) throw membershipError;\n" +
          `  const workspaceIds = memberships?.map(row => row[${JSON.stringify(workspaceField)}]).filter(Boolean) ?? [];\n` +
          "  if (workspaceIds.length === 0) return [];\n" +
          "  const { id, ...changes } = input;\n" +
          `  const { data, error } = await supabase.from(${JSON.stringify(tableName)}).update(changes).eq("id", id).in(${JSON.stringify(workspaceField)}, workspaceIds).select("*");\n` +
          "  if (error) throw error;\n" +
          "  return data ?? [];";
        break;
    }
  }

  if (operation === "delete") {
    switch (policy) {
      case "public":
        body =
          "  const supabase = createSupabaseServerClient();\n" +
          `  const { data, error } = await supabase.from(${JSON.stringify(tableName)}).delete().eq("id", id).select("*");\n` +
          "  if (error) throw error;\n" +
          "  return data ?? [];";
        break;
      case "user":
        body =
          `  await ${sessionHelper}();\n` +
          "  const supabase = createSupabaseServerClient();\n" +
          `  const { data, error } = await supabase.from(${JSON.stringify(tableName)}).delete().eq("id", id).select("*");\n` +
          "  if (error) throw error;\n" +
          "  return data ?? [];";
        break;
      case "admin":
        body = adminPolicyErrorLines();
        break;
      case "owner":
      case "owner-or-public":
        body =
          `  const { userId } = await ${sessionHelper}();\n` +
          "  const supabase = createSupabaseServerClient();\n" +
          `  const { data, error } = await supabase.from(${JSON.stringify(tableName)}).delete().eq("id", id).eq(${JSON.stringify(ownerField)}, userId).select("*");\n` +
          "  if (error) throw error;\n" +
          "  return data ?? [];";
        break;
      case "workspace-member":
        body =
          `  const { userId } = await ${sessionHelper}();\n` +
          "  const supabase = createSupabaseServerClient();\n" +
          `  const { data: memberships, error: membershipError } = await supabase.from(${JSON.stringify(membershipTable)}).select(${JSON.stringify(workspaceField)}).eq("user_id", userId);\n` +
          "  if (membershipError) throw membershipError;\n" +
          `  const workspaceIds = memberships?.map(row => row[${JSON.stringify(workspaceField)}]).filter(Boolean) ?? [];\n` +
          "  if (workspaceIds.length === 0) return [];\n" +
          `  const { data, error } = await supabase.from(${JSON.stringify(tableName)}).delete().eq("id", id).in(${JSON.stringify(workspaceField)}, workspaceIds).select("*");\n` +
          "  if (error) throw error;\n" +
          "  return data ?? [];";
        break;
    }
  }

  if (operation === "list") {
    return [imports, `export const ${exportSymbol} = query(async () => {`, '  "use server";', body, `}, ${queryKey});`, ""].join("\n");
  }

  if (operation === "detail") {
    return [imports, `export const ${exportSymbol} = query(async (id: string) => {`, '  "use server";', body, `}, ${queryKey});`, ""].join("\n");
  }

  if (operation === "update") {
    return [
      imports,
      `type ${pascalCase(resource.name)}Record = Record<string, unknown> & { id: string };`,
      "",
      `export const ${exportSymbol} = action(async (input: ${pascalCase(resource.name)}Record) => {`,
      '  "use server";',
      body,
      `}, ${queryKey});`,
      "",
    ].join("\n");
  }

  if (operation === "delete") {
    return [imports, `export const ${exportSymbol} = action(async (id: string) => {`, '  "use server";', body, `}, ${queryKey});`, ""].join("\n");
  }

  return [
    imports,
    `type ${pascalCase(resource.name)}Input = Record<string, unknown>;`,
    "",
    `export const ${exportSymbol} = action(async (input: ${pascalCase(resource.name)}Input) => {`,
    '  "use server";',
    body,
    `}, ${queryKey});`,
    "",
  ].join("\n");
}

function effectiveModuleAuth(module: ServerModuleIR, app: AppIR) {
  if (module.auth) {
    return module.auth;
  }

  const protectedEntry = app.auth?.protect?.find(entry => entry.kind === "server" && entry.target === module.name);
  return protectedEntry?.access ?? "public";
}

function authImport(module: ServerModuleIR, app: AppIR) {
  if (effectiveModuleAuth(module, app) === "user" && app.auth) {
    return 'import { requireSession } from "~/lib/server/guards";';
  }

  return "";
}

function authCall(module: ServerModuleIR, app: AppIR) {
  if (effectiveModuleAuth(module, app) === "user" && app.auth) {
    return "  await requireSession();";
  }

  return "";
}

function renderSupabaseServerModule(module: ServerModuleIR, app: AppIR) {
  const exportSymbol = exportName(module);
  const resourceName = module.resource ?? "records";
  const authImportLine = authImport(module, app);
  const authCallLine = authCall(module, app);
  const typeName = `${pascalCase(module.resource ?? "Resource")}Record`;
  const inputType = `${pascalCase(module.resource ?? "Resource")}Input`;
  const imports = [
    module.type === "query" ? 'import { query } from "@solidjs/router";' : 'import { action } from "@solidjs/router";',
    'import { createSupabaseServerClient } from "~/lib/supabase";',
    authImportLine,
    "",
  ]
    .filter(Boolean)
    .join("\n");

  const authLines = authCallLine ? `${authCallLine}\n` : "";

  if (module.type === "query") {
    if (module.name.endsWith(".detail")) {
      return [
        imports,
        `export const ${exportSymbol} = query(async (id: string) => {`,
        '  "use server";',
        authLines.trimEnd(),
        "  const supabase = createSupabaseServerClient();",
        `  const { data, error } = await supabase.from(${JSON.stringify(resourceName)}).select("*").eq("id", id).limit(1);`,
        "  if (error) throw error;",
        "  return data?.[0] ?? null;",
        `}, ${JSON.stringify(module.name)});`,
        "",
      ]
        .filter(Boolean)
        .join("\n");
    }

    return [
      imports,
      `export const ${exportSymbol} = query(async () => {`,
      '  "use server";',
      authLines.trimEnd(),
      "  const supabase = createSupabaseServerClient();",
      `  const { data, error } = await supabase.from(${JSON.stringify(resourceName)}).select("*");`,
      "  if (error) throw error;",
      "  return data ?? [];",
      `}, ${JSON.stringify(module.name)});`,
      "",
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (module.name.includes("upload")) {
    return [
      imports.replace('import { createSupabaseAdminClient } from "~/lib/supabase";', 'import { createPresignedUpload, type UploadIntent } from "~/lib/storage";'),
      `export const ${exportSymbol} = action(async (input: UploadIntent) => {`,
      '  "use server";',
      authLines.trimEnd(),
      "  return createPresignedUpload(input);",
      `}, ${JSON.stringify(module.name)});`,
      "",
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (module.name.endsWith(".delete")) {
    return [
      imports,
      `export const ${exportSymbol} = action(async (id: string) => {`,
      '  "use server";',
      authLines.trimEnd(),
      "  const supabase = createSupabaseServerClient();",
      `  const { data, error } = await supabase.from(${JSON.stringify(resourceName)}).delete().eq("id", id).select("*");`,
      "  if (error) throw error;",
      "  return data ?? [];",
      `}, ${JSON.stringify(module.name)});`,
      "",
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (module.name.endsWith(".update")) {
    return [
      imports,
      `type ${typeName} = Record<string, unknown> & { id: string };`,
      "",
      `export const ${exportSymbol} = action(async (input: ${typeName}) => {`,
      '  "use server";',
      authLines.trimEnd(),
      "  const supabase = createSupabaseServerClient();",
      "  const { id, ...changes } = input;",
      `  const { data, error } = await supabase.from(${JSON.stringify(resourceName)}).update(changes).eq("id", id).select("*");`,
      "  if (error) throw error;",
      "  return data ?? [];",
      `}, ${JSON.stringify(module.name)});`,
      "",
    ]
      .filter(Boolean)
      .join("\n");
  }

  return [
    imports,
    `type ${inputType} = Record<string, unknown>;`,
    "",
    `export const ${exportSymbol} = action(async (input: ${inputType}) => {`,
    '  "use server";',
    authLines.trimEnd(),
    "  const supabase = createSupabaseServerClient();",
    `  const { data, error } = await supabase.from(${JSON.stringify(resourceName)}).insert(input).select("*");`,
    "  if (error) throw error;",
    "  return data ?? [];",
    `}, ${JSON.stringify(module.name)});`,
    "",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function writeGeneratedServerModules(app: AppIR, targetPath: string) {
  const modules = app.server ?? [];

  for (const module of modules) {
    const linkedResource = findResourceForModule(module, app);
    const rendered =
      linkedResource && app.database?.provider === "supabase"
        ? buildSupabaseResourceRenderer(module, linkedResource)
        : linkedResource
          ? buildPortableResourceRenderer(module, linkedResource)
          : app.database?.provider === "supabase"
            ? renderSupabaseServerModule(module, app)
            : await renderServerFunctionTemplate(templateIdFor(module), {
                EXPORT_NAME: exportName(module),
                QUERY_KEY: module.name,
                RESOURCE_SYMBOL: resourceSymbol(module.resource),
                TYPE_NAME: `${pascalCase(module.resource ?? "Resource")}UpdateInput`,
                AUTH_IMPORT: authImport(module, app),
                AUTH_CALL: authCall(module, app),
              });

    if (!rendered) {
      throw new Error(`Failed to render server module: ${module.name}`);
    }

    await writeGeneratedFile(resolve(targetPath, filePathFor(module)), rendered);
  }

  return modules.length;
}
