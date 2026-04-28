import type { APIEvent } from "@solidjs/start/server";

export async function POST(event: APIEvent) {
  await event.request.json().catch(() => ({}));
  return Response.json({ ok: false, error: "Email OTP verification is disabled for Stylyf Builder." }, { status: 403 });
}
