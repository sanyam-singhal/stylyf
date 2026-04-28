import { action } from "@solidjs/router";
import { createSupabaseServerClient } from "~/lib/supabase";
import { requireViewerIdentity } from "~/lib/server/resource-policy";

type AgentEventsRecord = Record<string, unknown> & { id: string };

export const updateAgentEvents = action(async (input: AgentEventsRecord) => {
  "use server";
  const { userId } = await requireViewerIdentity();
  const { id, ...changes } = input;
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from("agent_events").update(changes).eq("id", id).eq("owner_id", userId).select("*");
  if (error) throw error;
  return data ?? [];
}, "agent_events.update");
