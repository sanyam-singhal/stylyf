import type { APIEvent } from "@solidjs/start/server";
import { createReferenceDownload } from "~/lib/server/attachments";

type DownloadBody = {
  projectId?: unknown;
  assetId?: unknown;
};

export async function POST(event: APIEvent) {
  try {
    const body = (await event.request.json()) as DownloadBody;
    if (typeof body.projectId !== "string" || typeof body.assetId !== "string") {
      return Response.json({ ok: false, error: "Project and asset id are required." }, { status: 400 });
    }
    const result = await createReferenceDownload({
      projectId: body.projectId,
      assetId: body.assetId,
    });
    return Response.json(result);
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "Could not create download URL." },
      { status: 400 },
    );
  }
}
