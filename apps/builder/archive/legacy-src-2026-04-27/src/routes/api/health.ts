import type { APIEvent } from "@solidjs/start/server";
import { serviceInfo } from "~/lib/server/observability";

export async function GET(_event: APIEvent) {
  return Response.json({
    ok: true,
    status: "healthy",
    service: serviceInfo.name,
    dependencies: {
      auth: serviceInfo.auth !== "none",
      database: serviceInfo.database !== "none",
      storage: serviceInfo.storage !== "none",
    },
  });
}
