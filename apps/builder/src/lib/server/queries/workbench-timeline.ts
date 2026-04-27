import { query } from "@solidjs/router";
import { createSupabaseServerClient } from "~/lib/supabase";
import { requireViewerIdentity } from "~/lib/server/resource-policy";

async function assertProjectOwner(projectId: string, userId: string) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from("projects").select("id").eq("id", projectId).eq("owner_id", userId).single();
  if (error) throw error;
  return data;
}

export const getWorkbenchTimeline = query(async (projectId: string) => {
  "use server";
  const { userId } = await requireViewerIdentity();
  await assertProjectOwner(projectId, userId);
  const supabase = createSupabaseServerClient();
  const [{ data: events, error: eventsError }, { data: approvals, error: approvalsError }, { data: commands, error: commandsError }] = await Promise.all([
    supabase
      .from("agent_events")
      .select("id,type,summary,artifact_path,created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(12),
    supabase
      .from("approvals")
      .select("id,type,summary,status,created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("commands")
      .select("id,command,status,exit_code,stdout_path,stderr_path,created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);
  if (eventsError) throw eventsError;
  if (approvalsError) throw approvalsError;
  if (commandsError) throw commandsError;
  return {
    events: events ?? [],
    approvals: approvals ?? [],
    commands: commands ?? [],
  };
}, "workbench.timeline");
