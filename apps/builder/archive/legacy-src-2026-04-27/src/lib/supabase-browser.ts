import { createBrowserClient } from "@supabase/ssr";
import { publicEnv } from "~/lib/env";

let browserClient: ReturnType<typeof createBrowserClient> | undefined;

export function createSupabaseBrowserClient() {
  if (!browserClient) {
    browserClient = createBrowserClient(
      publicEnv.VITE_SUPABASE_URL,
      publicEnv.VITE_SUPABASE_PUBLISHABLE_KEY,
    );
  }

  return browserClient;
}
