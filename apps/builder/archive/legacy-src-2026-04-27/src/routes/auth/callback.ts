import type { APIEvent } from "@solidjs/start/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "~/lib/supabase";

export async function GET(event: APIEvent) {
  const url = new URL(event.request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = (url.searchParams.get("type") ?? "email") as EmailOtpType;
  const redirectTo = url.searchParams.get("redirect_to") ?? "/";

  if (!tokenHash) {
    return Response.redirect(new URL("/login?error=missing_token_hash", url), 302);
  }

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type,
  });

  if (error) {
    return Response.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, url), 302);
  }

  return Response.redirect(new URL(redirectTo, url), 302);
}
