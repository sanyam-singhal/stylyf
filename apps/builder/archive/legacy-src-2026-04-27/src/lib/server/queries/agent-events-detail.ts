import { query } from "@solidjs/router";
import { createSupabaseServerClient } from "~/lib/supabase";
import { requireViewerIdentity } from "~/lib/server/resource-policy";

export const getAgentEvents = query(async (id: string) => {
  "use server";
  const { userId } = await requireViewerIdentity();
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from("agent_events").select("*").eq("id", id).eq("owner_id", userId).limit(1);
  if (error) throw error;
  return data?.[0] ?? null;
}, "agent_events.detail");
