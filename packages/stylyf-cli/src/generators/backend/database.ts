import type { AppIR, DatabaseColumnType, DatabaseDialect, DatabaseSchemaIR } from "../../compiler/generated-app.js";

function camelCase(value: string) {
  return value
    .split(/[^a-zA-Z0-9]+/g)
    .filter(Boolean)
    .map((segment, index) =>
      index === 0 ? `${segment[0]?.toLowerCase() ?? ""}${segment.slice(1)}` : `${segment[0]?.toUpperCase() ?? ""}${segment.slice(1)}`,
    )
    .join("");
}

function quote(value: string) {
  return JSON.stringify(value);
}

function postgresColumnFactory(type: DatabaseColumnType) {
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

function sqliteColumnFactory(type: DatabaseColumnType, nameArgument: string) {
  switch (type) {
    case "text":
    case "varchar":
      return `text(${nameArgument})`;
    case "integer":
      return `integer(${nameArgument})`;
    case "boolean":
      return `integer(${nameArgument}, { mode: "boolean" })`;
    case "timestamp":
      return `integer(${nameArgument}, { mode: "timestamp_ms" })`;
    case "jsonb":
      return `text(${nameArgument}, { mode: "json" })`;
    case "uuid":
      return `text(${nameArgument})`;
    default:
      return `text(${nameArgument})`;
  }
}

function renderColumn(column: DatabaseSchemaIR["columns"][number], dialect: DatabaseDialect) {
  const nameArgument = quote(column.name);
  const base =
    dialect === "sqlite"
      ? sqliteColumnFactory(column.type, nameArgument)
      : column.type === "timestamp"
        ? `${postgresColumnFactory(column.type)}(${nameArgument}, { withTimezone: true })`
        : `${postgresColumnFactory(column.type)}(${nameArgument})`;

  const chained = [
    column.primaryKey ? "primaryKey()" : undefined,
    column.unique ? "unique()" : undefined,
    column.default !== undefined ? `default(${JSON.stringify(column.default)})` : undefined,
    column.nullable ? undefined : "notNull()",
  ]
    .filter(Boolean)
    .map(method => `.${method}`)
    .join("");

  return `  ${camelCase(column.name)}: ${base}${chained},`;
}

function renderTable(table: DatabaseSchemaIR, dialect: DatabaseDialect) {
  const exportName = camelCase(table.table);
  const indexLines = table.columns
    .filter(column => column.indexed && !column.primaryKey && !column.unique)
    .map(column => `    index(${quote(`${table.table}_${column.name}_idx`)}).on(table.${camelCase(column.name)}),`);
  const uniqueIndexLines = table.columns
    .filter(column => column.indexed && column.unique)
    .map(column => `    uniqueIndex(${quote(`${table.table}_${column.name}_uniq_idx`)}).on(table.${camelCase(column.name)}),`);
  const tableCallbackLines = [...indexLines, ...uniqueIndexLines];
  const lines = [
    `${dialect === "sqlite" ? `export const ${exportName} = sqliteTable(${quote(table.table)}, {` : `export const ${exportName} = pgTable(${quote(table.table)}, {`}`,
    ...table.columns.map(column => renderColumn(column, dialect)),
  ];

  if (table.timestamps) {
    if (dialect === "sqlite") {
      lines.push(
        '  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`).notNull(),',
        '  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`).notNull(),',
      );
    } else {
      lines.push(
        '  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),',
        '  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),',
      );
    }
  }

  if (table.softDelete) {
    if (dialect === "sqlite") {
      lines.push('  deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),');
    } else {
      lines.push('  deletedAt: timestamp("deleted_at", { withTimezone: true }),');
    }
  }

  if (tableCallbackLines.length > 0) {
    lines.push("}, table => [", ...tableCallbackLines, "]);", "");
  } else {
    lines.push("});", "");
  }
  return lines.join("\n");
}

export function renderGeneratedDbSchema(app: AppIR) {
  const dialect = app.database?.dialect ?? "postgres";
  const tables = app.database?.schema ?? [];

  if (tables.length === 0) {
    if (dialect === "sqlite") {
      return [
        'import { sqliteTable, text } from "drizzle-orm/sqlite-core";',
        "",
        'export const placeholder = sqliteTable("__stylyf_placeholder", {',
        '  id: text("id").primaryKey(),',
        "});",
        "",
      ].join("\n");
    }

    return ['import { pgTable, text } from "drizzle-orm/pg-core";', "", 'export const placeholder = pgTable("__stylyf_placeholder", {', '  id: text("id").primaryKey(),', "});", ""].join("\n");
  }

  if (dialect === "sqlite") {
    const needsSql = tables.some(table => table.timestamps);
    const needsIndexes = tables.some(table => table.columns.some(column => column.indexed));

    return [
      `import { integer, ${needsIndexes ? "index, uniqueIndex, " : ""}sqliteTable, text } from "drizzle-orm/sqlite-core";`,
      ...(needsSql ? ['import { sql } from "drizzle-orm";'] : []),
      "",
      ...tables.map(table => renderTable(table, "sqlite")),
    ].join("\n");
  }

  return [
    `import { boolean, integer, ${tables.some(table => table.columns.some(column => column.indexed)) ? "index, uniqueIndex, " : ""}jsonb, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";`,
    "",
    ...tables.map(table => renderTable(table, "postgres")),
  ].join("\n");
}

export function renderGeneratedDbModule(app: AppIR) {
  if (app.database?.dialect === "sqlite") {
    return [
      'import { createClient } from "@libsql/client";',
      'import { drizzle } from "drizzle-orm/libsql";',
      'import { env } from "~/lib/env";',
      'import * as appSchema from "~/lib/db/schema";',
      'import * as authSchema from "~/lib/db/auth-schema";',
      "",
      "const client = createClient({",
      "  url: env.DATABASE_URL,",
      "  authToken: env.DATABASE_AUTH_TOKEN,",
      "});",
      "const schema = { ...appSchema, ...authSchema };",
      "",
      "export const db = drizzle(client, { schema });",
      "export { client, schema };",
      "export type DB = typeof db;",
      "",
    ].join("\n");
  }

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

export function renderGeneratedDrizzleConfig(app: AppIR) {
  if (app.database?.dialect === "sqlite") {
    return [
      'import { defineConfig } from "drizzle-kit";',
      "",
      "export default defineConfig({",
      '  dialect: "sqlite",',
      '  schema: "./src/lib/db/*.ts",',
      '  out: "./drizzle",',
      "  dbCredentials: {",
      '    url: process.env.DATABASE_URL ?? "file:./local.db",',
      "  },",
      "  strict: true,",
      "  verbose: true,",
      "});",
      "",
    ].join("\n");
  }

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
