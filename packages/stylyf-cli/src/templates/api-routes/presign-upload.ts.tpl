import { randomUUID } from "node:crypto";
import type { APIEvent } from "@solidjs/start/server";
import { createPresignedUpload, storagePolicy } from "~/lib/storage";
{{AUTH_IMPORT}}

function sanitizeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-");
}

export async function {{METHOD}}(event: APIEvent) {
{{AUTH_GUARD}}
  const body = await event.request.json().catch(() => ({} as Record<string, unknown>));
  const fileName = typeof body.fileName === "string" && body.fileName ? body.fileName : "upload.bin";
  const contentType =
    typeof body.contentType === "string" && body.contentType ? body.contentType : "application/octet-stream";
  const folder = typeof body.folder === "string" && body.folder ? body.folder : "{{ROUTE_NAME}}";
  const fileSize = typeof body.fileSize === "number" ? body.fileSize : undefined;
  const key = `${storagePolicy.keyPrefix}/${folder}/${randomUUID()}-${sanitizeFileName(fileName)}`;
  const upload = await createPresignedUpload({
    key,
    contentType,
    fileSize,
  });

  return Response.json({
    ok: true,
    route: "{{ROUTE_NAME}}",
    method: "{{METHOD}}",
    path: "{{ROUTE_PATH}}",
    upload,
  });
}
