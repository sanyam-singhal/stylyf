export type BackendCatalogKind =
  | "capability"
  | "server-function"
  | "api-route"
  | "env-block"
  | "backend-snippet";

export type BackendCatalogEntry = {
  id: string;
  label: string;
  kind: BackendCatalogKind;
  area: string;
  description: string;
  summary: string;
  keywords: string[];
  snippet: string;
  props?: string[];
  sourcePath?: string;
};

export const backendCapabilityCatalog: Array<BackendCatalogEntry> = [
  {
    id: "database-postgres",
    label: "PostgreSQL Database Capability",
    kind: "capability",
    area: "Backend Capabilities",
    description: "Baseline PostgreSQL capability using Drizzle ORM and the postgres driver.",
    summary: "Adds typed database wiring, Drizzle config, schema modules, and migration scripts.",
    keywords: ["database", "postgres", "drizzle", "schema", "migration", "sql", "orm"],
    snippet:
      `database: {\n  dialect: "postgres",\n  migrations: "drizzle-kit",\n  schema: []\n}`,
    props: ["dialect", "migrations", "schema"],
    sourcePath: "src/generators/backend/database.ts",
  },
  {
    id: "auth-better-auth",
    label: "Better Auth Capability",
    kind: "capability",
    area: "Backend Capabilities",
    description: "Session-based Better Auth wiring integrated with SolidStart and Drizzle.",
    summary: "Generates auth server/client modules, auth API route, and guard helpers.",
    keywords: ["auth", "better-auth", "session", "login", "signup", "protect", "session guard"],
    snippet:
      `auth: {\n  provider: "better-auth",\n  mode: "session",\n  features: { emailPassword: true }\n}`,
    props: ["provider", "mode", "features", "protect"],
    sourcePath: "src/generators/backend/auth.ts",
  },
  {
    id: "storage-s3",
    label: "S3 Storage Capability",
    kind: "capability",
    area: "Backend Capabilities",
    description: "S3-compatible object storage capability using AWS SDK v3 and presigned upload helpers.",
    summary: "Generates a server-owned storage client and browser upload handshake primitives.",
    keywords: ["storage", "s3", "upload", "presign", "bucket", "object storage", "aws sdk"],
    snippet:
      `storage: {\n  provider: "s3",\n  mode: "presigned-put",\n  bucketAlias: "uploads"\n}`,
    props: ["provider", "mode", "bucketAlias"],
    sourcePath: "src/generators/backend/storage.ts",
  },
  {
    id: "env-contract",
    label: "Typed Env Contract Capability",
    kind: "capability",
    area: "Backend Capabilities",
    description: "Generated typed environment contract for app, database, auth, and storage configuration.",
    summary: "Emits `.env.example` and server-safe env helpers with fail-fast accessors.",
    keywords: ["env", "environment", "config", "typed", "server env", "dotenv"],
    snippet: `env: {\n  app: true,\n  database: true,\n  auth: true,\n  storage: true\n}`,
    props: ["app", "database", "auth", "storage"],
    sourcePath: "src/generators/backend/env.ts",
  },
];

export const backendServerTemplateCatalog: Array<BackendCatalogEntry> = [
  {
    id: "server-list-query",
    label: "List Query Server Module",
    kind: "server-function",
    area: "Server Functions",
    description: "Server-side list query using Solid Router query semantics and optional auth guards.",
    summary: "Best default for resource indexes, inboxes, audit logs, and filtered lists.",
    keywords: ["query", "list", "server", "solidstart", "createAsync", "resource index"],
    snippet:
      `export const listRecords = query(async () => {\n  "use server";\n  return db.select().from(records);\n}, "records.list");`,
    props: ["name", "resource", "auth", "filters"],
    sourcePath: "src/templates/server-functions/list-query.ts.tpl",
  },
  {
    id: "server-detail-query",
    label: "Detail Query Server Module",
    kind: "server-function",
    area: "Server Functions",
    description: "Server-side detail query for fetching a single record by id or slug.",
    summary: "Use for resource detail pages and master-detail side panels.",
    keywords: ["query", "detail", "record", "server", "resource detail"],
    snippet:
      `export const getRecord = query(async (id: string) => {\n  "use server";\n  return db.query.records.findFirst({ where: eq(records.id, id) });\n}, "records.detail");`,
    props: ["name", "resource", "auth", "key"],
    sourcePath: "src/templates/server-functions/detail-query.ts.tpl",
  },
  {
    id: "server-create-action",
    label: "Create Action Server Module",
    kind: "server-function",
    area: "Server Functions",
    description: "Mutation action for creating a record, optionally guarded by session requirements.",
    summary: "Use for forms, modal creates, and onboarding flows.",
    keywords: ["action", "create", "mutation", "server", "form submit"],
    snippet:
      `export const createRecord = action(async (input: CreateRecordInput) => {\n  "use server";\n  return db.insert(records).values(input).returning();\n});`,
    props: ["name", "resource", "auth", "validation"],
    sourcePath: "src/templates/server-functions/create-action.ts.tpl",
  },
  {
    id: "server-update-action",
    label: "Update Action Server Module",
    kind: "server-function",
    area: "Server Functions",
    description: "Mutation action for updating a record using Drizzle and SolidStart server actions.",
    summary: "Use for settings forms, inline editing, and resource detail edits.",
    keywords: ["action", "update", "mutation", "server", "edit"],
    snippet:
      `export const updateRecord = action(async (input: UpdateRecordInput) => {\n  "use server";\n  return db.update(records).set(input).where(eq(records.id, input.id)).returning();\n});`,
    props: ["name", "resource", "auth", "validation"],
    sourcePath: "src/templates/server-functions/update-action.ts.tpl",
  },
  {
    id: "server-delete-action",
    label: "Delete Action Server Module",
    kind: "server-function",
    area: "Server Functions",
    description: "Mutation action for deleting a record, optionally paired with audit or ownership checks.",
    summary: "Use for destructive actions, archive flows, and bulk removal baselines.",
    keywords: ["action", "delete", "remove", "mutation", "server", "destructive"],
    snippet:
      `export const deleteRecord = action(async (id: string) => {\n  "use server";\n  return db.delete(records).where(eq(records.id, id)).returning();\n});`,
    props: ["name", "resource", "auth"],
    sourcePath: "src/templates/server-functions/delete-action.ts.tpl",
  },
  {
    id: "server-upload-handshake-action",
    label: "Upload Handshake Action",
    kind: "server-function",
    area: "Server Functions",
    description: "Server-side action for issuing presigned upload information to the browser.",
    summary: "Use as the baseline bridge between browser uploads and S3-compatible storage.",
    keywords: ["upload", "presign", "action", "storage", "s3", "server"],
    snippet:
      `export const createUpload = action(async (input: UploadIntent) => {\n  "use server";\n  return createPresignedUpload(input);\n});`,
    props: ["name", "auth", "contentTypes"],
    sourcePath: "src/templates/server-functions/upload-handshake-action.ts.tpl",
  },
  {
    id: "server-session-guard",
    label: "Require Session Guard",
    kind: "server-function",
    area: "Server Functions",
    description: "Server guard helper that enforces an authenticated Better Auth session.",
    summary: "Use to protect queries, actions, and route-side server logic.",
    keywords: ["auth", "session", "guard", "server", "better-auth", "protected"],
    snippet:
      `const session = await requireSession();\nif (!session) throw redirect("/login");`,
    props: ["redirectTo", "role"],
    sourcePath: "src/generators/backend/auth.ts",
  },
];

export const backendApiRouteCatalog: Array<BackendCatalogEntry> = [
  {
    id: "api-auth-handler",
    label: "Better Auth Handler Route",
    kind: "api-route",
    area: "API Routes",
    description: "Catch-all auth API route used by Better Auth in SolidStart.",
    summary: "Mounts the generated auth instance at `/api/auth/[...auth]`.",
    keywords: ["api", "auth", "better-auth", "handler", "solidstart"],
    snippet:
      `import { toSolidStartHandler } from "better-auth/solid-start";\nimport { auth } from "~/lib/auth";\n\nexport const { GET, POST } = toSolidStartHandler(auth);`,
    props: ["path", "method"],
    sourcePath: "src/templates/api-routes/auth-mount.ts.tpl",
  },
  {
    id: "api-json-route",
    label: "JSON API Route",
    kind: "api-route",
    area: "API Routes",
    description: "Simple JSON route template for app-owned endpoints and external clients.",
    summary: "Use for explicit machine-facing endpoints that should not be server actions.",
    keywords: ["api", "json", "route", "endpoint", "http"],
    snippet:
      `export async function GET() {\n  return new Response(JSON.stringify({ ok: true }), {\n    headers: { "content-type": "application/json" },\n  });\n}`,
    props: ["path", "method", "name"],
    sourcePath: "src/templates/api-routes/json.ts.tpl",
  },
  {
    id: "api-webhook-route",
    label: "Webhook Route",
    kind: "api-route",
    area: "API Routes",
    description: "POST route template for external webhook receivers with signature validation hooks.",
    summary: "Use for webhook-style integrations and callback receivers.",
    keywords: ["api", "webhook", "callback", "route", "post"],
    snippet:
      `export async function POST(event: APIEvent) {\n  const payload = await event.request.text();\n  return new Response(null, { status: 204 });\n}`,
    props: ["path", "name", "signature"],
    sourcePath: "src/templates/api-routes/webhook.ts.tpl",
  },
  {
    id: "api-presign-upload-route",
    label: "Presigned Upload Route",
    kind: "api-route",
    area: "API Routes",
    description: "JSON POST route that returns a presigned S3 upload payload.",
    summary: "Use when the app wants an explicit upload signing endpoint instead of a server action only.",
    keywords: ["api", "upload", "presign", "s3", "route"],
    snippet:
      `export async function POST(event: APIEvent) {\n  const input = await event.request.json();\n  const signed = await createPresignedUpload(input);\n  return Response.json(signed);\n}`,
    props: ["path", "name", "auth"],
    sourcePath: "src/templates/api-routes/presign-upload.ts.tpl",
  },
];

export const backendEnvCatalog: Array<BackendCatalogEntry> = [
  {
    id: "env-app-core",
    label: "App Core Env Block",
    kind: "env-block",
    area: "Environment",
    description: "Core app-level variables shared across generated full-stack apps.",
    summary: "Provides base URL and runtime environment variables used by auth and other capabilities.",
    keywords: ["env", "app", "base url", "node env", "config"],
    snippet: `APP_BASE_URL=\nNODE_ENV=development`,
    props: ["APP_BASE_URL", "NODE_ENV"],
    sourcePath: "src/generators/backend/env.ts",
  },
  {
    id: "env-postgres",
    label: "PostgreSQL Env Block",
    kind: "env-block",
    area: "Environment",
    description: "Database connection variables for the generated Postgres + Drizzle stack.",
    summary: "Provides the connection URL required by Drizzle and the postgres driver.",
    keywords: ["env", "database", "postgres", "drizzle", "database_url"],
    snippet: `DATABASE_URL=postgres://postgres:postgres@localhost:5432/app`,
    props: ["DATABASE_URL"],
    sourcePath: "src/generators/backend/env.ts",
  },
  {
    id: "env-better-auth",
    label: "Better Auth Env Block",
    kind: "env-block",
    area: "Environment",
    description: "Auth secret and public URL variables required by Better Auth.",
    summary: "Provides the secret and canonical auth URL for generated auth wiring.",
    keywords: ["env", "auth", "better-auth", "secret", "url"],
    snippet: `BETTER_AUTH_SECRET=\nBETTER_AUTH_URL=http://localhost:3000`,
    props: ["BETTER_AUTH_SECRET", "BETTER_AUTH_URL"],
    sourcePath: "src/generators/backend/env.ts",
  },
  {
    id: "env-s3",
    label: "S3 Storage Env Block",
    kind: "env-block",
    area: "Environment",
    description: "S3-compatible configuration block used by the generated storage capability.",
    summary: "Supports AWS S3 and endpoint-based compatible providers like Tigris or Spaces.",
    keywords: ["env", "storage", "s3", "bucket", "region", "endpoint", "spaces", "tigris"],
    snippet:
      `S3_REGION=\nS3_BUCKET=\nS3_ACCESS_KEY_ID=\nS3_SECRET_ACCESS_KEY=\nS3_ENDPOINT=\nS3_FORCE_PATH_STYLE=false\nS3_PUBLIC_BASE_URL=`,
    props: [
      "S3_REGION",
      "S3_BUCKET",
      "S3_ACCESS_KEY_ID",
      "S3_SECRET_ACCESS_KEY",
      "S3_ENDPOINT",
      "S3_FORCE_PATH_STYLE",
      "S3_PUBLIC_BASE_URL",
    ],
    sourcePath: "src/generators/backend/env.ts",
  },
];

export const backendSnippetCatalog: Array<BackendCatalogEntry> = [
  {
    id: "snippet-drizzle-db-module",
    label: "Drizzle DB Module",
    kind: "backend-snippet",
    area: "Backend Snippets",
    description: "Typed Drizzle database module using the postgres driver and generated env contract.",
    summary: "Provides the shared DB client and schema wiring for the rest of the generated app.",
    keywords: ["snippet", "db", "drizzle", "postgres", "module"],
    snippet:
      `import postgres from "postgres";\nimport { drizzle } from "drizzle-orm/postgres-js";\nimport { env } from "~/lib/env";\n\nconst client = postgres(env.DATABASE_URL);\nexport const db = drizzle(client);`,
    props: ["DATABASE_URL"],
    sourcePath: "src/generators/backend/database.ts",
  },
  {
    id: "snippet-better-auth-module",
    label: "Better Auth Module",
    kind: "backend-snippet",
    area: "Backend Snippets",
    description: "Auth module wiring Better Auth to Drizzle and the generated env helpers.",
    summary: "Provides a readable baseline auth setup instead of hiding auth behind a Stylyf wrapper.",
    keywords: ["snippet", "auth", "better-auth", "drizzle", "module"],
    snippet:
      `import { betterAuth } from "better-auth";\nimport { drizzleAdapter } from "better-auth/adapters/drizzle";\nimport { db } from "~/lib/db";\n\nexport const auth = betterAuth({ database: drizzleAdapter(db, { provider: "pg" }) });`,
    props: ["BETTER_AUTH_SECRET", "BETTER_AUTH_URL"],
    sourcePath: "src/generators/backend/auth.ts",
  },
  {
    id: "snippet-s3-storage-module",
    label: "S3 Storage Module",
    kind: "backend-snippet",
    area: "Backend Snippets",
    description: "Storage capability module using S3Client and presigned upload helpers.",
    summary: "Provides the baseline bridge to S3-compatible object stores without exposing credentials to the browser.",
    keywords: ["snippet", "storage", "s3", "presign", "aws sdk", "module"],
    snippet:
      `const client = new S3Client({ region: env.S3_REGION, endpoint: env.S3_ENDPOINT || undefined });\nexport async function createPresignedUpload(input: UploadIntent) {\n  return getSignedUrl(client, new PutObjectCommand({ Bucket: env.S3_BUCKET, Key: input.key }));\n}`,
    props: ["S3_REGION", "S3_BUCKET", "S3_ENDPOINT"],
    sourcePath: "src/generators/backend/storage.ts",
  },
  {
    id: "snippet-typed-env-module",
    label: "Typed Env Module",
    kind: "backend-snippet",
    area: "Backend Snippets",
    description: "Server-side env helper that fails fast on missing required variables.",
    summary: "Provides a light, explicit env contract without bringing in a heavy runtime framework first.",
    keywords: ["snippet", "env", "typed", "module", "config"],
    snippet:
      `function required(name: string) {\n  const value = process.env[name];\n  if (!value) throw new Error(\`Missing env: \${name}\`);\n  return value;\n}\n\nexport const env = { DATABASE_URL: required("DATABASE_URL") };`,
    props: ["required", "optional"],
    sourcePath: "src/generators/backend/env.ts",
  },
];
