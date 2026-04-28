import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile(path: string) {
  if (!existsSync(path)) return;
  const source = readFileSync(path, "utf8");
  for (const line of source.split(/\r?\n/g)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [name, ...rawParts] = trimmed.split("=");
    if (!name || process.env[name] !== undefined) continue;
    process.env[name] = rawParts.join("=").replace(/^["']|["']$/g, "");
  }
}

for (const candidate of [".env.local", ".env", "../../.env"]) {
  loadEnvFile(resolve(process.cwd(), candidate));
}

const groups = [
  { label: "Supabase URL", keys: ["SUPABASE_URL"] },
  { label: "Supabase publishable key", keys: ["SUPABASE_PUBLISHABLE_KEY"] },
  { label: "Supabase service key", keys: ["SUPABASE_SECRET_KEY"] },
  { label: "Object storage bucket", keys: ["AWS_S3_BUCKET", "S3_BUCKET"] },
  { label: "Object storage access key", keys: ["AWS_ACCESS_KEY_ID", "S3_ACCESS_KEY_ID"] },
  { label: "Object storage secret key", keys: ["AWS_SECRET_ACCESS_KEY", "S3_SECRET_ACCESS_KEY"] },
  { label: "Object storage endpoint", keys: ["AWS_ENDPOINT_URL_S3", "S3_ENDPOINT"] },
] as const;

const failures: string[] = [];
const warnings: string[] = [];
for (const group of groups) {
  if (!group.keys.some(key => Boolean(process.env[key]))) {
    failures.push(`${group.label}: set one of ${group.keys.join(", ")}`);
  }
}

const bucket = process.env.AWS_S3_BUCKET || process.env.S3_BUCKET;
if (bucket && (!/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(bucket) || bucket.includes(".."))) {
  failures.push("Object storage bucket: use a DNS-compatible lowercase S3 bucket name.");
}

const corsOrigins = process.env.STYLYF_BUILDER_CORS_ORIGINS;
if (corsOrigins) {
  for (const origin of corsOrigins.split(",").map(value => value.trim()).filter(Boolean)) {
    if (origin === "*") continue;
    try {
      const url = new URL(origin);
      if (!["http:", "https:"].includes(url.protocol)) throw new Error("invalid protocol");
    } catch {
      failures.push(`STYLYF_BUILDER_CORS_ORIGINS: '${origin}' is not a valid browser origin.`);
    }
  }
}

const optionalBuilderKeys = [
  "STYLYF_BUILDER_ROOT",
  "STYLYF_BUILDER_GITHUB_ORG",
  "STYLYF_BUILDER_CREATE_GITHUB_REPOS",
  "STYLYF_BUILDER_AGENT_ADAPTER",
  "STYLYF_BUILDER_GIT_USER_NAME",
  "STYLYF_BUILDER_GIT_USER_EMAIL",
  "CODEX_RUN_FLAGS",
  "CODEX_RESUME_FLAGS",
  "STYLYF_PREVIEW_PUBLIC_BASE",
] as const;

const missingOptional = optionalBuilderKeys.filter(key => !process.env[key]);
if (missingOptional.length > 0) {
  warnings.push(`Optional builder keys not set, defaults will apply where supported: ${missingOptional.join(", ")}`);
}
if (!process.env.APP_BASE_URL) {
  warnings.push("APP_BASE_URL is not set; local server code defaults to http://localhost:3000.");
}

const createRepos = process.env.STYLYF_BUILDER_CREATE_GITHUB_REPOS;
if (createRepos && !["true", "false"].includes(createRepos)) {
  failures.push("STYLYF_BUILDER_CREATE_GITHUB_REPOS: use 'true' or 'false'.");
}

const agentAdapter = process.env.STYLYF_BUILDER_AGENT_ADAPTER;
if (agentAdapter && !["manual", "codex-exec", "codex-app-server"].includes(agentAdapter)) {
  failures.push("STYLYF_BUILDER_AGENT_ADAPTER: use manual, codex-exec, or codex-app-server.");
}

const previewBase = process.env.STYLYF_PREVIEW_PUBLIC_BASE;
if (previewBase) {
  try {
    const url = new URL(previewBase);
    if (!["http:", "https:"].includes(url.protocol)) throw new Error("invalid protocol");
  } catch {
    failures.push("STYLYF_PREVIEW_PUBLIC_BASE: set a valid http(s) base URL without a trailing port.");
  }
}

if (failures.length > 0) {
  console.error(["Builder env check failed:", ...failures.map(failure => `- ${failure}`)].join("\n"));
  process.exitCode = 1;
} else {
  console.log("Builder env check passed. Required key names are present.");
  for (const warning of warnings) {
    console.warn(`- ${warning}`);
  }
}
