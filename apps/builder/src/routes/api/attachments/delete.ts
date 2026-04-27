import type { APIEvent } from "@solidjs/start/server";
import { deleteReferenceAsset } from "~/lib/server/attachments";

type DeleteBody = {
  projectId?: unknown;
  assetId?: unknown;
};

export async function POST(event: APIEvent) {
  try {
    const body = (await event.request.json()) as DeleteBody;
    if (typeof body.projectId !== "string" || typeof body.assetId !== "string") {
      return Response.json({ ok: false, error: "Project and asset id are required." }, { status: 400 });
    }
    const result = await deleteReferenceAsset({
      projectId: body.projectId,
      assetId: body.assetId,
    });
    return Response.json(result);
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "Could not delete reference file." },
      { status: 400 },
    );
  }
}
