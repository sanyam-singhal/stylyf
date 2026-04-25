import type { AppIR, ResourceIR } from "../../compiler/generated-app.js";

function camelCase(value: string) {
  return value
    .split(/[^a-zA-Z0-9]+/g)
    .filter(Boolean)
    .map((segment, index) =>
      index === 0 ? `${segment[0]?.toLowerCase() ?? ""}${segment.slice(1)}` : `${segment[0]?.toUpperCase() ?? ""}${segment.slice(1)}`,
    )
    .join("");
}

function tableNameFor(resource: ResourceIR) {
  return resource.table ?? resource.name;
}

function defaultFixtureRows(resource: ResourceIR) {
  const row: Record<string, unknown> = {};
  for (const field of resource.fields ?? []) {
    if (field.primaryKey) continue;
    if (field.default !== undefined) continue;
    if (field.type === "integer") row[field.name] = 1;
    else if (field.type === "boolean") row[field.name] = false;
    else if (field.type === "enum") row[field.name] = field.enumValues?.[0] ?? "draft";
    else if (field.type === "jsonb") row[field.name] = {};
    else if (field.required) row[field.name] = `Seed ${field.name}`;
  }
  return [row];
}

function seedPlan(app: AppIR) {
  const resources = app.resources ?? [];
  const explicit = new Map((app.fixtures ?? []).map(fixture => [fixture.resource, fixture.rows]));

  return resources.map(resource => ({
    resource: resource.name,
    table: tableNameFor(resource),
    rows: explicit.get(resource.name) ?? defaultFixtureRows(resource),
  }));
}

export function renderGeneratedSeedModule(app: AppIR) {
  const plan = seedPlan(app);
  const hosted = app.database?.provider === "supabase";

  return [
    hosted ? 'import { createSupabaseAdminClient } from "~/lib/supabase";' : 'import { db, schema } from "~/lib/db";',
    "",
    `export const seedPlan = ${JSON.stringify(plan, null, 2)} as const;`,
    "",
    hosted
      ? [
          "export async function runSeed() {",
          "  const supabase = createSupabaseAdminClient();",
          "  for (const entry of seedPlan) {",
          "    if (entry.rows.length === 0) continue;",
          "    const { error } = await supabase.from(entry.table).insert(entry.rows as any);",
          "    if (error) throw error;",
          "  }",
          "  return { ok: true as const, resources: seedPlan.length };",
          "}",
        ].join("\n")
      : [
          "function resolveSchemaTable(tableName: string) {",
          "  const table = (schema as Record<string, any>)[tableName.split(/[^a-zA-Z0-9]+/g).filter(Boolean).map((segment, index) => index === 0 ? `${segment[0]?.toLowerCase() ?? \"\"}${segment.slice(1)}` : `${segment[0]?.toUpperCase() ?? \"\"}${segment.slice(1)}`).join(\"\")];",
          "  if (!table) throw new Error(`Unable to resolve seed table: ${tableName}`);",
          "  return table;",
          "}",
          "",
          "export async function runSeed() {",
          "  for (const entry of seedPlan) {",
          "    if (entry.rows.length === 0) continue;",
          "    await db.insert(resolveSchemaTable(entry.table)).values(entry.rows as any);",
          "  }",
          "  return { ok: true as const, resources: seedPlan.length };",
          "}",
        ].join("\n"),
    "",
  ].join("\n");
}

export function renderGeneratedSeedScript() {
  return [
    'import { runSeed } from "../src/lib/server/seed";',
    "",
    "runSeed()",
    "  .then(result => {",
    '    console.log(`Seed complete for ${result.resources} resource definition(s).`);',
    "  })",
    "  .catch(error => {",
    '    console.error("Seed failed:", error);',
    "    process.exitCode = 1;",
    "  });",
    "",
  ].join("\n");
}

export function renderGeneratedResourceFactories(app: AppIR) {
  const resources = app.resources ?? [];
  const factories = resources.map(resource => {
    const baseName = camelCase(resource.name);
    const sample = defaultFixtureRows(resource)[0] ?? {};
    return [
      `export function make${baseName[0]?.toUpperCase() ?? ""}${baseName.slice(1)}Fixture(overrides: Record<string, unknown> = {}) {`,
      `  return { ...${JSON.stringify(sample, null, 2)}, ...overrides };`,
      "}",
      "",
    ].join("\n");
  });

  return [
    `export const resourceFactoryDefinitions = ${JSON.stringify(resources.map(resource => ({ name: resource.name, table: tableNameFor(resource) })), null, 2)} as const;`,
    "",
    ...factories,
  ].join("\n");
}
