import type { APIEvent } from "@solidjs/start/server";
import { signOut } from "~/lib/auth";

export async function POST(_event: APIEvent) {
  const { error } = await signOut();
  if (error) return Response.json({ ok: false, error: error.message }, { status: 400 });
  return Response.json({ ok: true });
}

export async function GET(_event: APIEvent) {
  const { error } = await signOut();
  if (error) return Response.json({ ok: false, error: error.message }, { status: 400 });
  return Response.redirect(new URL("/login", _event.request.url), 302);
}
