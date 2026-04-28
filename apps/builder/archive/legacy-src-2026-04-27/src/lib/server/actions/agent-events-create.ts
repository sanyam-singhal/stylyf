import { action } from "@solidjs/router";
import { createSupabaseServerClient } from "~/lib/supabase";
import { requireViewerIdentity } from "~/lib/server/resource-policy";

type AgentEventsInput = Record<string, unknown>;

export const createAgentEvents = action(async (input: AgentEventsInput) => {
  "use server";
  const { userId } = await requireViewerIdentity();
  const supabase = createSupabaseServerClient();
  const nextInput = { ...input, "owner_id": userId };
  const { data, error } = await supabase.from("agent_events").insert(nextInput).select("*");
  if (error) throw error;
  return data ?? [];
}, "agent_events.create");
