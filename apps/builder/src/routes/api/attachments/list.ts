import type { APIEvent } from "@solidjs/start/server";
import { listReferenceAssets } from "~/lib/server/attachments";

export async function GET(event: APIEvent) {
  try {
    const projectId = new URL(event.request.url).searchParams.get("projectId");
    if (!projectId) {
      return Response.json({ ok: false, error: "Project id is required." }, { status: 400 });
    }
    const assets = await listReferenceAssets(projectId);
    return Response.json({ ok: true, assets });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "Could not list reference files." },
      { status: 400 },
    );
  }
}
