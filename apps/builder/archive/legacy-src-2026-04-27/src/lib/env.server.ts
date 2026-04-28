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

const serverSource = typeof process !== "undefined" ? process.env : {};

function requiredServer(name: string) {
  if (name === "APP_BASE_URL" && !serverSource[name]) {
    return "http://localhost:3000";
  }
  const value = serverSource[name];
  if (!value) throw new Error(`Missing required server env: ${name}`);
  return value;
}

function optionalServer(name: string) {
  return serverSource[name];
}

export const env = {
  APP_BASE_URL: requiredServer("APP_BASE_URL"),
  NODE_ENV: optionalServer("NODE_ENV"),
  SUPABASE_URL: requiredServer("SUPABASE_URL"),
  SUPABASE_PUBLISHABLE_KEY: requiredServer("SUPABASE_PUBLISHABLE_KEY"),
  SUPABASE_SECRET_KEY: requiredServer("SUPABASE_SECRET_KEY"),
  S3_REGION: optionalServer("S3_REGION"),
  AWS_REGION: optionalServer("AWS_REGION"),
  S3_BUCKET: optionalServer("S3_BUCKET"),
  AWS_S3_BUCKET: optionalServer("AWS_S3_BUCKET"),
  S3_ACCESS_KEY_ID: optionalServer("S3_ACCESS_KEY_ID"),
  AWS_ACCESS_KEY_ID: optionalServer("AWS_ACCESS_KEY_ID"),
  S3_SECRET_ACCESS_KEY: optionalServer("S3_SECRET_ACCESS_KEY"),
  AWS_SECRET_ACCESS_KEY: optionalServer("AWS_SECRET_ACCESS_KEY"),
  S3_ENDPOINT: optionalServer("S3_ENDPOINT"),
  AWS_ENDPOINT_URL_S3: optionalServer("AWS_ENDPOINT_URL_S3"),
  S3_FORCE_PATH_STYLE: optionalServer("S3_FORCE_PATH_STYLE"),
};

export type ServerEnv = typeof env;
