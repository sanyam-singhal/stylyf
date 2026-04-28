import type { APIEvent } from "@solidjs/start/server";
import { getSession } from "~/lib/auth";

export async function GET(_event: APIEvent) {
  const session = await getSession();
  return Response.json({
    ok: true,
    session,
  });
}
