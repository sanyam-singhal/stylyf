import type { AppIR } from "../../ir/types.js";

export function renderGeneratedAuthSchemaPlaceholder() {
  return [
    "// Placeholder file for Better Auth Drizzle schema output.",
    "// Run `npm run auth:generate` to replace this with the official generated schema.",
    "",
    "export {};",
    "",
  ].join("\n");
}

export function renderGeneratedAuthSchemaConfig(app: AppIR) {
  const emailPasswordEnabled = app.auth?.features?.emailPassword ?? true;

  return [
    'import { betterAuth } from "better-auth";',
    'import { drizzleAdapter } from "better-auth/adapters/drizzle";',
    'import { drizzle } from "drizzle-orm/postgres-js";',
    'import postgres from "postgres";',
    "",
    'const client = postgres(process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/app", {',
    "  prepare: false,",
    "});",
    "const db = drizzle(client);",
    "",
    "export const auth = betterAuth({",
    '  secret: process.env.BETTER_AUTH_SECRET ?? "stylyf-dev-secret",',
    '  baseURL: process.env.BETTER_AUTH_URL ?? process.env.APP_BASE_URL ?? "http://localhost:3000",',
    "  database: drizzleAdapter(db, {",
    '    provider: "pg",',
    "  }),",
    "  emailAndPassword: {",
    `    enabled: ${emailPasswordEnabled ? "true" : "false"},`,
    "  },",
    "});",
    "",
  ].join("\n");
}
