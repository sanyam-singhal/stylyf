import type { APIEvent } from "@solidjs/start/server";
import { signInWithPassword } from "~/lib/auth";

export async function POST(event: APIEvent) {
  const body = await event.request.json().catch(() => ({} as Record<string, unknown>));
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    return Response.json({ ok: false, error: "Email and password are required." }, { status: 400 });
  }

  const { data, error } = await signInWithPassword({ email, password });
  if (error) return Response.json({ ok: false, error: error.message }, { status: 400 });
  return Response.json({ ok: true, data });
}
