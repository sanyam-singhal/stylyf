import type { APIEvent } from "@solidjs/start/server";
import { createReferenceUploadIntent } from "~/lib/server/attachments";

type IntentBody = {
  projectId?: unknown;
  fileName?: unknown;
  contentType?: unknown;
  fileSize?: unknown;
};

export async function POST(event: APIEvent) {
  try {
    const body = (await event.request.json()) as IntentBody;
    if (typeof body.projectId !== "string" || typeof body.fileName !== "string") {
      return Response.json({ ok: false, error: "Project and file name are required." }, { status: 400 });
    }
    const fileSize = typeof body.fileSize === "number" ? body.fileSize : Number(body.fileSize);
    const result = await createReferenceUploadIntent({
      projectId: body.projectId,
      fileName: body.fileName,
      contentType: typeof body.contentType === "string" ? body.contentType : "application/octet-stream",
      fileSize,
    });
    return Response.json({ ok: true, ...result });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "Could not create upload intent." },
      { status: 400 },
    );
  }
}
