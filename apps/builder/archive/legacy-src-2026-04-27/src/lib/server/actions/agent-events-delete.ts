import { action } from "@solidjs/router";
import { createSupabaseServerClient } from "~/lib/supabase";
import { requireViewerIdentity } from "~/lib/server/resource-policy";

export const deleteAgentEvents = action(async (id: string) => {
  "use server";
  const { userId } = await requireViewerIdentity();
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from("agent_events").delete().eq("id", id).eq("owner_id", userId).select("*");
  if (error) throw error;
  return data ?? [];
}, "agent_events.delete");
