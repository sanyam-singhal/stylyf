import type { APIEvent } from "@solidjs/start/server";
import { confirmReferenceUpload } from "~/lib/server/attachments";

type ConfirmBody = {
  projectId?: unknown;
  assetId?: unknown;
};

export async function POST(event: APIEvent) {
  try {
    const body = (await event.request.json()) as ConfirmBody;
    if (typeof body.projectId !== "string" || typeof body.assetId !== "string") {
      return Response.json({ ok: false, error: "Project and upload id are required." }, { status: 400 });
    }
    const result = await confirmReferenceUpload({
      projectId: body.projectId,
      assetId: body.assetId,
    });
    return Response.json(result);
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "Could not confirm upload." },
      { status: 400 },
    );
  }
}
