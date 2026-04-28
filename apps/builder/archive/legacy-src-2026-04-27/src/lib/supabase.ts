import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { deleteCookie, getEvent, parseCookies, setCookie, setHeader, type HTTPEvent } from "vinxi/http";
import { env } from "~/lib/env";

function readCookies(event: HTTPEvent) {
  const cookies = parseCookies(event) ?? {};
  return Object.entries(cookies).map(([name, value]) => ({ name, value }));
}

function writeCookies(event: HTTPEvent, cookiesToSet: Array<{ name: string; value: string; options: Record<string, unknown> }>, headers: Record<string, string>) {
  for (const [name, value] of Object.entries(headers)) {
    setHeader(event, name, value);
  }

  for (const { name, value, options } of cookiesToSet) {
    if (typeof options.maxAge === "number" && options.maxAge <= 0) {
      deleteCookie(event, name, options);
      continue;
    }

    setCookie(event, name, value, options);
  }
}

export function createSupabaseServerClient(event: HTTPEvent = getEvent()) {
  return createServerClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return readCookies(event);
      },
      setAll(cookiesToSet, headers) {
        writeCookies(event, cookiesToSet, headers);
      },
    },
  });
}

export function createSupabaseAdminClient(): SupabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
