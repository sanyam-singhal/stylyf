import type { APIEvent } from "@solidjs/start/server";
import { createAttachmentDownloadIntent } from "~/lib/server/attachments";

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
      assetId: typeof body.assetId === "string" ? body.assetId : "",
    };
    const result = await createAttachmentDownloadIntent(input);
    return Response.json({ ok: true, result });
  } catch (error) {
    return Response.json({ ok: false, error: errorMessage(error) }, { status: 400 });
  }
}
