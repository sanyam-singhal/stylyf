import type { APIEvent } from "@solidjs/start/server";
import { serviceInfo } from "~/lib/server/observability";

const requiredEnv = [
  "APP_BASE_URL",
  "SUPABASE_URL",
  "S3_BUCKET"
] as const;

export async function GET(_event: APIEvent) {
  const missing = requiredEnv.filter(name => !process.env[name]);
  return Response.json(
    {
      ok: missing.length === 0,
      status: missing.length === 0 ? "ready" : "not-ready",
      service: serviceInfo.name,
      dependencies: serviceInfo,
      missingEnv: missing,
    },
    { status: missing.length === 0 ? 200 : 503 },
  );
}
