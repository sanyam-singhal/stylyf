import type { AppIR, EnvVarIR } from "../../compiler/generated-app.js";

type EnvEntry = {
  name: string;
  required: boolean;
  exposure: "server" | "public";
  example: string;
  description?: string;
};

function uniqueByName(entries: EnvEntry[]) {
  const seen = new Set<string>();
  return entries.filter(entry => {
    if (seen.has(entry.name)) {
      return false;
    }

    seen.add(entry.name);
    return true;
  });
}

function fromExtra(extra: EnvVarIR): EnvEntry | null {
  if (!extra.name.trim()) {
    return null;
  }

  return {
    name: extra.name,
    required: extra.required ?? true,
    exposure: extra.exposure ?? "server",
    example: extra.example ?? "",
    description: extra.description,
  };
}

export function collectGeneratedEnvEntries(app: AppIR) {
  const entries: EnvEntry[] = [
    {
      name: "APP_BASE_URL",
      required: true,
      exposure: "server",
      example: "http://localhost:3000",
      description: "Canonical app URL used by auth and server-side absolute links.",
    },
    {
      name: "NODE_ENV",
      required: false,
      exposure: "server",
      example: "development",
      description: "Standard Node runtime environment.",
    },
  ];

  if (app.database) {
    if (app.database.provider === "supabase") {
      entries.push(
        {
          name: "SUPABASE_URL",
          required: true,
          exposure: "server",
          example: "https://your-project-ref.supabase.co",
          description: "Supabase project URL used by server-side auth and data clients.",
        },
        {
          name: "SUPABASE_PUBLISHABLE_KEY",
          required: true,
          exposure: "server",
          example: "sb_publishable_xxx",
          description: "Server-side copy of the Supabase publishable key used for SSR auth and request-scoped data access.",
        },
        {
          name: "SUPABASE_SECRET_KEY",
          required: true,
          exposure: "server",
          example: "sb_secret_xxx",
          description: "Server-only Supabase secret key for privileged admin and bypass-RLS operations.",
        },
        {
          name: "VITE_SUPABASE_URL",
          required: true,
          exposure: "public",
          example: "https://your-project-ref.supabase.co",
          description: "Client-exposed Supabase project URL for browser auth flows.",
        },
        {
          name: "VITE_SUPABASE_PUBLISHABLE_KEY",
          required: true,
          exposure: "public",
          example: "sb_publishable_xxx",
          description: "Client-exposed Supabase publishable key for browser auth and data access.",
        },
      );
    } else if (app.database.dialect === "sqlite") {
      entries.push(
        {
          name: "DATABASE_URL",
          required: true,
          exposure: "server",
          example: "file:./local.db",
          description:
            "libSQL connection URL used by Drizzle and Better Auth. For local SQLite use the required `file:` prefix.",
        },
        {
          name: "DATABASE_AUTH_TOKEN",
          required: false,
          exposure: "server",
          example: "",
          description: "Optional libSQL auth token for remote SQLite providers such as Turso.",
        },
      );
    } else {
      entries.push({
        name: "DATABASE_URL",
        required: true,
        exposure: "server",
        example: "postgres://postgres:postgres@localhost:5432/app",
        description: "PostgreSQL connection URL used by Drizzle and the postgres driver.",
      });
    }
  }

  if (app.auth) {
    if (app.auth.provider === "better-auth") {
      entries.push(
        {
          name: "BETTER_AUTH_SECRET",
          required: true,
          exposure: "server",
          example: "",
          description: "Secret used by Better Auth for signing and encryption.",
        },
        {
          name: "BETTER_AUTH_URL",
          required: true,
          exposure: "server",
          example: "http://localhost:3000",
          description: "Canonical Better Auth URL for the generated auth handler.",
        },
      );
    }
  }

  if (app.storage) {
    entries.push(
      {
        name: "S3_REGION",
        required: false,
        exposure: "server",
        example: "us-east-1",
        description: "Object storage region.",
      },
      {
        name: "AWS_REGION",
        required: false,
        exposure: "server",
        example: "auto",
        description: "AWS-compatible region alias used by providers such as Tigris.",
      },
      {
        name: "S3_BUCKET",
        required: true,
        exposure: "server",
        example: "app-uploads",
        description: "Target bucket for generated storage helpers.",
      },
      {
        name: "AWS_S3_BUCKET",
        required: false,
        exposure: "server",
        example: "app-uploads",
        description: "AWS-compatible bucket alias used by providers or deployments that prefer AWS_* naming.",
      },
      {
        name: "S3_ACCESS_KEY_ID",
        required: false,
        exposure: "server",
        example: "",
        description: "Access key used by the S3-compatible storage client.",
      },
      {
        name: "AWS_ACCESS_KEY_ID",
        required: false,
        exposure: "server",
        example: "",
        description: "AWS SDK-compatible access key alias used by providers such as Tigris.",
      },
      {
        name: "S3_SECRET_ACCESS_KEY",
        required: false,
        exposure: "server",
        example: "",
        description: "Secret key used by the S3-compatible storage client.",
      },
      {
        name: "AWS_SECRET_ACCESS_KEY",
        required: false,
        exposure: "server",
        example: "",
        description: "AWS SDK-compatible secret key alias used by providers such as Tigris.",
      },
      {
        name: "S3_ENDPOINT",
        required: false,
        exposure: "server",
        example: "",
        description: "Optional endpoint for S3-compatible providers such as Tigris or Spaces.",
      },
      {
        name: "AWS_ENDPOINT_URL_S3",
        required: false,
        exposure: "server",
        example: "https://t3.storage.dev",
        description: "AWS SDK-compatible S3 endpoint alias used by providers such as Tigris.",
      },
      {
        name: "S3_FORCE_PATH_STYLE",
        required: false,
        exposure: "server",
        example: "false",
        description: "Enable path-style requests for compatible providers that require it.",
      },
      {
        name: "S3_PUBLIC_BASE_URL",
        required: false,
        exposure: "server",
        example: "",
        description: "Optional public base URL for already-uploaded objects.",
      },
    );
  }

  for (const extra of app.env?.extras ?? []) {
    const entry = fromExtra(extra);
    if (entry) {
      entries.push(entry);
    }
  }

  return uniqueByName(entries);
}

function renderEnvLine(entry: EnvEntry) {
  return `${entry.name}=${entry.example}`;
}

function profileEntry(entry: EnvEntry, profile: "local" | "production") {
  if (profile === "local") {
    return entry;
  }

  if (entry.name === "APP_BASE_URL" || entry.name === "BETTER_AUTH_URL") {
    return { ...entry, example: "https://example.com" };
  }
  if (entry.name === "NODE_ENV") {
    return { ...entry, example: "production" };
  }

  return entry;
}

export function renderGeneratedEnvExample(app: AppIR, profile: "local" | "production" = "local") {
  const entries = collectGeneratedEnvEntries(app).map(entry => profileEntry(entry, profile));
  const sections = [
    "# Generated by Stylyf CLI",
    `# ${profile === "local" ? "Local development" : "Production deployment"} env profile.`,
    "# Fill in real values before running backend features.",
    "",
    ...entries.flatMap(entry => {
      const commentLines = [
        entry.description ? `# ${entry.description}` : undefined,
        entry.exposure === "public" ? "# exposure: public" : "# exposure: server",
        entry.required ? "# required" : "# optional",
        renderEnvLine(entry),
        "",
      ].filter(Boolean) as string[];

      return commentLines;
    }),
  ];

  return `${sections.join("\n").trimEnd()}\n`;
}

function renderObjectLines(entries: EnvEntry[], accessor: "requiredServer" | "optionalServer" | "requiredPublic" | "optionalPublic") {
  return entries
    .map(entry => {
      const helper = entry.required
        ? accessor.startsWith("required")
          ? accessor
          : accessor.replace("optional", "required")
        : accessor.startsWith("optional")
          ? accessor
          : accessor.replace("required", "optional");

      return `  ${entry.name}: ${helper}(${JSON.stringify(entry.name)}),`;
    })
    .join("\n");
}

export function renderGeneratedEnvServerModule(app: AppIR) {
  const entries = collectGeneratedEnvEntries(app);
  const serverEntries = entries.filter(entry => entry.exposure === "server");

  return [
    'const serverSource = typeof process !== "undefined" ? process.env : {};',
    "",
    "function requiredServer(name: string) {",
    "  const value = serverSource[name];",
    '  if (!value) throw new Error(`Missing required server env: ${name}`);',
    "  return value;",
    "}",
    "",
    "function optionalServer(name: string) {",
    "  return serverSource[name];",
    "}",
    "",
    "export const env = {",
    serverEntries.length > 0 ? renderObjectLines(serverEntries, "requiredServer") : "",
    "};",
    "",
    "export type ServerEnv = typeof env;",
    "",
  ].join("\n");
}

export function renderGeneratedEnvPublicModule(app: AppIR) {
  const entries = collectGeneratedEnvEntries(app);
  const publicEntries = entries.filter(entry => entry.exposure === "public");

  return [
    'const publicSource = ((import.meta as { env?: Record<string, string | undefined> }).env ?? {}) as Record<string, string | undefined>;',
    "",
    "function requiredPublic(name: string) {",
    "  const value = publicSource[name];",
    '  if (!value) throw new Error(`Missing required public env: ${name}`);',
    "  return value;",
    "}",
    "",
    "function optionalPublic(name: string) {",
    "  return publicSource[name];",
    "}",
    "",
    "export const publicEnv = {",
    publicEntries.length > 0 ? renderObjectLines(publicEntries, "requiredPublic") : "",
    "};",
    "",
    "export type PublicEnv = typeof publicEnv;",
    "",
  ].join("\n");
}

export function renderGeneratedEnvModule() {
  return [
    'export { env } from "./env.server";',
    'export type { ServerEnv } from "./env.server";',
    'export { publicEnv } from "./env.public";',
    'export type { PublicEnv } from "./env.public";',
    "",
  ].join("\n");
}

export function renderGeneratedEnvCheckModule(app: AppIR) {
  const entries = collectGeneratedEnvEntries(app);
  const requiredEntries = entries.filter(entry => entry.required);
  const publicEntries = entries.filter(entry => entry.exposure === "public");

  return [
    'import { existsSync, readFileSync } from "node:fs";',
    'import { resolve } from "node:path";',
    "",
    "function loadEnvFile(path: string) {",
    "  if (!existsSync(path)) return;",
    '  const source = readFileSync(path, "utf8");',
    "  for (const line of source.split(/\\r?\\n/g)) {",
    "    const trimmed = line.trim();",
    '    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;',
    '    const [name, ...rawParts] = trimmed.split("=");',
    "    if (!name || process.env[name] !== undefined) continue;",
    '    const rawValue = rawParts.join("=");',
    '    process.env[name] = rawValue.replace(/^["\\\']|["\\\']$/g, "");',
    "  }",
    "}",
    "",
    "for (const candidate of [\".env.local\", \".env\"]) {",
    "  loadEnvFile(resolve(process.cwd(), candidate));",
    "}",
    "",
    `const requiredEnv = ${JSON.stringify(requiredEntries, null, 2)} as const;`,
    `const publicEnvNames: readonly string[] = ${JSON.stringify(publicEntries.map(entry => entry.name), null, 2)};`,
    "",
    "function isProbablyUrl(value: string) {",
    "  try { new URL(value); return true; } catch { return false; }",
    "}",
    "",
    "function checkEnv() {",
    "  const issues: string[] = [];",
    "  for (const entry of requiredEnv) {",
    "    const value = process.env[entry.name];",
    "    if (!value) {",
    "      issues.push(`Missing required ${entry.exposure} env: ${entry.name}`);",
    "      continue;",
    "    }",
    "    if ((entry.name.endsWith(\"_URL\") || entry.name === \"APP_BASE_URL\" || entry.name === \"BETTER_AUTH_URL\") && !isProbablyUrl(value)) {",
    "      issues.push(`${entry.name} must be a valid absolute URL.`);",
    "    }",
    "  }",
    "  for (const name of publicEnvNames) {",
    "    if (!name.startsWith(\"VITE_\") && !name.startsWith(\"PUBLIC_\")) {",
    "      issues.push(`Public env ${name} should use a VITE_ or PUBLIC_ prefix.`);",
    "    }",
    "  }",
    "  return issues;",
    "}",
    "",
    "const issues = checkEnv();",
    "if (issues.length > 0) {",
    "  console.error(\"Stylyf env preflight failed:\");",
    "  for (const issue of issues) console.error(`- ${issue}`);",
    "  process.exitCode = 1;",
    "} else {",
    "  console.log(\"Stylyf env preflight passed.\");",
    "}",
    "",
  ].join("\n");
}
