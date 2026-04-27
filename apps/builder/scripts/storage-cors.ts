import { GetBucketCorsCommand, PutBucketCorsCommand, S3Client, type CORSRule } from "@aws-sdk/client-s3";
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

function envValue(...keys: string[]) {
  for (const key of keys) {
    const value = process.env[key];
    if (value) return value;
  }
  return undefined;
}

function requiredEnv(label: string, ...keys: string[]) {
  const value = envValue(...keys);
  if (!value) throw new Error(`Missing ${label}. Set one of ${keys.join(", ")}.`);
  return value;
}

function parseOrigins(argv: string[]) {
  const flagIndex = argv.findIndex(value => value === "--origins");
  const raw = flagIndex >= 0 ? argv[flagIndex + 1] : envValue("STYLYF_BUILDER_CORS_ORIGINS", "APP_BASE_URL");
  const values =
    raw
      ?.split(",")
      .map(value => value.trim())
      .filter(Boolean) ?? [];
  if (values.length === 0) {
    return ["http://127.0.0.1:3000", "http://localhost:3000"];
  }
  return values;
}

function storageClient() {
  return new S3Client({
    region: envValue("AWS_REGION", "S3_REGION") ?? "auto",
    endpoint: requiredEnv("object storage endpoint", "AWS_ENDPOINT_URL_S3", "S3_ENDPOINT"),
    forcePathStyle: envValue("S3_FORCE_PATH_STYLE") === "true" || envValue("S3_FORCE_PATH_STYLE") === "1",
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
    credentials: {
      accessKeyId: requiredEnv("object storage access key", "AWS_ACCESS_KEY_ID", "S3_ACCESS_KEY_ID"),
      secretAccessKey: requiredEnv("object storage secret key", "AWS_SECRET_ACCESS_KEY", "S3_SECRET_ACCESS_KEY"),
    },
  });
}

function storageBucket() {
  const bucket = requiredEnv("object storage bucket", "AWS_S3_BUCKET", "S3_BUCKET");
  if (!/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(bucket) || bucket.includes("..")) {
    throw new Error("Object storage bucket must be a DNS-compatible lowercase S3 bucket name.");
  }
  return bucket;
}

function uploadCorsRule(origins: string[]): CORSRule {
  return {
    AllowedMethods: ["GET", "PUT", "HEAD"],
    AllowedOrigins: origins,
    AllowedHeaders: ["content-type", "x-amz-*"],
    ExposeHeaders: ["ETag"],
    MaxAgeSeconds: 3600,
  };
}

function printRules(rules: CORSRule[]) {
  console.log(JSON.stringify(rules, null, 2));
}

async function main() {
  const [command = "check", ...rest] = process.argv.slice(2);
  const bucket = storageBucket();
  const client = storageClient();

  if (command === "check") {
    const result = await client.send(new GetBucketCorsCommand({ Bucket: bucket }));
    printRules(result.CORSRules ?? []);
    return;
  }

  if (command === "apply") {
    const origins = parseOrigins(rest);
    if (origins.includes("*")) {
      console.warn("Applying wildcard CORS origin. Prefer explicit builder origins for normal operation.");
    }
    const CORSRules = [uploadCorsRule(origins)];
    await client.send(new PutBucketCorsCommand({ Bucket: bucket, CORSConfiguration: { CORSRules } }));
    console.log(`Applied object-storage CORS for ${origins.join(", ")}.`);
    printRules(CORSRules);
    return;
  }

  throw new Error(`Unknown command '${command}'. Use 'check' or 'apply'.`);
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
