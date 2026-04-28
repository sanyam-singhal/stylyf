import type { APIEvent } from "@solidjs/start/server";
import { createAttachmentUploadIntent } from "~/lib/server/attachments";

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected error";
}

export async function POST(event: APIEvent) {
  try {
    const body = await event.request.json().catch(() => ({} as Record<string, unknown>));
    const input = {
      resource: typeof body.resource === "string" ? body.resource : "",
      attachment: typeof body.attachment === "string" ? body.attachment : "",
      resourceId: typeof body.resourceId === "string" ? body.resourceId : "",
      fileName: typeof body.fileName === "string" ? body.fileName : "upload.bin",
      contentType: typeof body.contentType === "string" ? body.contentType : "application/octet-stream",
      fileSize: typeof body.fileSize === "number" ? body.fileSize : undefined,
      metadata: body.metadata && typeof body.metadata === "object" ? (body.metadata as Record<string, unknown>) : null,
      replaceAssetId: typeof body.replaceAssetId === "string" ? body.replaceAssetId : null,
    };
    const result = await createAttachmentUploadIntent(input);
    return Response.json({ ok: true, result });
  } catch (error) {
    return Response.json({ ok: false, error: errorMessage(error) }, { status: 400 });
  }
}
