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
    const rawValue = rawParts.join("=");
    process.env[name] = rawValue.replace(/^["\']|["\']$/g, "");
  }
}

for (const candidate of [".env.local", ".env", "../../.env"]) {
  loadEnvFile(resolve(process.cwd(), candidate));
}

const requiredEnv = [
  {
    "name": "APP_BASE_URL",
    "required": true,
    "exposure": "server",
    "example": "http://localhost:3000",
    "description": "Canonical app URL used by auth and server-side absolute links."
  },
  {
    "name": "SUPABASE_URL",
    "required": true,
    "exposure": "server",
    "example": "https://your-project-ref.supabase.co",
    "description": "Supabase project URL used by server-side auth and data clients."
  },
  {
    "name": "SUPABASE_PUBLISHABLE_KEY",
    "required": true,
    "exposure": "server",
    "example": "sb_publishable_xxx",
    "description": "Server-side copy of the Supabase publishable key used for SSR auth and request-scoped data access."
  },
  {
    "name": "SUPABASE_SECRET_KEY",
    "required": true,
    "exposure": "server",
    "example": "sb_secret_xxx",
    "description": "Server-only Supabase secret key for privileged admin and bypass-RLS operations."
  }
] as const;
const publicEnvNames: readonly string[] = [
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_PUBLISHABLE_KEY"
];

function isProbablyUrl(value: string) {
  try { new URL(value); return true; } catch { return false; }
}

function checkEnv() {
  const issues: string[] = [];
  for (const entry of requiredEnv) {
    if (entry.name === "APP_BASE_URL" && !process.env.APP_BASE_URL) {
      process.env.APP_BASE_URL = "http://localhost:3000";
    }
    const value = process.env[entry.name];
    if (!value) {
      issues.push(`Missing required ${entry.exposure} env: ${entry.name}`);
      continue;
    }
    if ((entry.name.endsWith("_URL") || entry.name === "APP_BASE_URL") && !isProbablyUrl(value)) {
      issues.push(`${entry.name} must be a valid absolute URL.`);
    }
  }
  if (!process.env.VITE_SUPABASE_URL && !process.env.SUPABASE_URL) {
    issues.push("Missing required public Supabase URL: set VITE_SUPABASE_URL or SUPABASE_URL.");
  }
  if (!process.env.VITE_SUPABASE_PUBLISHABLE_KEY && !process.env.SUPABASE_PUBLISHABLE_KEY) {
    issues.push("Missing required public Supabase publishable key: set VITE_SUPABASE_PUBLISHABLE_KEY or SUPABASE_PUBLISHABLE_KEY.");
  }
  if (!process.env.AWS_S3_BUCKET && !process.env.S3_BUCKET) {
    issues.push("Missing required server env: set AWS_S3_BUCKET or S3_BUCKET.");
  }
  if (!process.env.AWS_ACCESS_KEY_ID && !process.env.S3_ACCESS_KEY_ID) {
    issues.push("Missing required server env: set AWS_ACCESS_KEY_ID or S3_ACCESS_KEY_ID.");
  }
  if (!process.env.AWS_SECRET_ACCESS_KEY && !process.env.S3_SECRET_ACCESS_KEY) {
    issues.push("Missing required server env: set AWS_SECRET_ACCESS_KEY or S3_SECRET_ACCESS_KEY.");
  }
  if (!process.env.AWS_ENDPOINT_URL_S3 && !process.env.S3_ENDPOINT) {
    issues.push("Missing required server env: set AWS_ENDPOINT_URL_S3 or S3_ENDPOINT.");
  }
  for (const name of publicEnvNames) {
    if (!name.startsWith("VITE_") && !name.startsWith("PUBLIC_")) {
      issues.push(`Public env ${name} should use a VITE_ or PUBLIC_ prefix.`);
    }
  }
  return issues;
}

const issues = checkEnv();
if (issues.length > 0) {
  console.error("Stylyf env preflight failed:");
  for (const issue of issues) console.error(`- ${issue}`);
  process.exitCode = 1;
} else {
  console.log("Stylyf env preflight passed.");
}
