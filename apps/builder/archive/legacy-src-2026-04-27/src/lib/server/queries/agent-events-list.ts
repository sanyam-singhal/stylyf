import { query } from "@solidjs/router";
import { createSupabaseServerClient } from "~/lib/supabase";
import { requireViewerIdentity } from "~/lib/server/resource-policy";

export const listAgentEvents = query(async () => {
  "use server";
  const { userId } = await requireViewerIdentity();
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from("agent_events").select("*").eq("owner_id", userId);
  if (error) throw error;
  return data ?? [];
}, "agent_events.list");
