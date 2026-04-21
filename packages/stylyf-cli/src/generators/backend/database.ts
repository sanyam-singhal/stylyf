import type { AppIR, DatabaseColumnType, DatabaseSchemaIR } from "../../ir/types.js";

function camelCase(value: string) {
  return value
    .split(/[^a-zA-Z0-9]+/g)
    .filter(Boolean)
    .map((segment, index) =>
      index === 0 ? segment.toLowerCase() : `${segment[0]?.toUpperCase() ?? ""}${segment.slice(1).toLowerCase()}`,
    )
    .join("");
}

function quote(value: string) {
  return JSON.stringify(value);
}

function drizzleColumnFactory(type: DatabaseColumnType) {
  switch (type) {
    case "text":
      return "text";
    case "varchar":
      return "varchar";
    case "integer":
      return "integer";
    case "boolean":
      return "boolean";
    case "timestamp":
      return "timestamp";
    case "jsonb":
      return "jsonb";
    case "uuid":
      return "uuid";
    default:
      return "text";
  }
}

function renderColumn(table: DatabaseSchemaIR, column: DatabaseSchemaIR["columns"][number]) {
  const columnFactory = drizzleColumnFactory(column.type);
  const nameArgument = quote(column.name);
  const base =
    column.type === "timestamp"
      ? `${columnFactory}(${nameArgument}, { withTimezone: true })`
      : `${columnFactory}(${nameArgument})`;

  const chained = [
    column.primaryKey ? "primaryKey()" : undefined,
    column.unique ? "unique()" : undefined,
    column.nullable ? undefined : "notNull()",
  ]
    .filter(Boolean)
    .map(method => `.${method}`)
    .join("");

  return `  ${camelCase(column.name)}: ${base}${chained},`;
}

function renderTable(table: DatabaseSchemaIR) {
  const exportName = camelCase(table.table);
  const lines = [
    `export const ${exportName} = pgTable(${quote(table.table)}, {`,
    ...table.columns.map(column => renderColumn(table, column)),
  ];

  if (table.timestamps) {
    lines.push(
      '  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),',
      '  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),',
    );
  }

  lines.push("});", "");
  return lines.join("\n");
}

export function renderGeneratedDbSchema(app: AppIR) {
  const tables = app.database?.schema ?? [];

  if (tables.length === 0) {
    return ['import { pgTable, text } from "drizzle-orm/pg-core";', "", 'export const placeholder = pgTable("__stylyf_placeholder", {', '  id: text("id").primaryKey(),', "});", ""].join("\n");
  }

  return [
    'import { boolean, integer, jsonb, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";',
    "",
    ...tables.map(table => renderTable(table)),
  ].join("\n");
}

export function renderGeneratedDbModule() {
  return [
    'import { drizzle } from "drizzle-orm/postgres-js";',
    'import postgres from "postgres";',
    'import { env } from "~/lib/env";',
    'import * as appSchema from "~/lib/db/schema";',
    'import * as authSchema from "~/lib/db/auth-schema";',
    "",
    'const client = postgres(env.DATABASE_URL, { prepare: false });',
    "const schema = { ...appSchema, ...authSchema };",
    "",
    "export const db = drizzle(client, { schema });",
    "export { client, schema };",
    "export type DB = typeof db;",
    "",
  ].join("\n");
}

export function renderGeneratedDrizzleConfig() {
  return [
    'import { defineConfig } from "drizzle-kit";',
    "",
    "export default defineConfig({",
    '  dialect: "postgresql",',
    '  schema: "./src/lib/db/*.ts",',
    '  out: "./drizzle",',
    "  dbCredentials: {",
    '    url: process.env.DATABASE_URL ?? "",',
    "  },",
    "  strict: true,",
    "  verbose: true,",
    "});",
    "",
  ].join("\n");
}
