import { action } from "@solidjs/router";
import { createProjectWorkspace } from "@depths/stylyf-builder-core";
import { createSupabaseServerClient } from "~/lib/supabase";
import { requireViewerIdentity } from "~/lib/server/resource-policy";
import { recordTelemetry } from "~/lib/server/telemetry";

type ProjectsInput = Record<string, unknown>;

export const createProjects = action(async (input: ProjectsInput) => {
  "use server";
  const { userId } = await requireViewerIdentity();
  const supabase = createSupabaseServerClient();
  const nextInput = { ...input, "owner_id": userId };
  const { data, error } = await supabase.from("projects").insert(nextInput).select("*").single();
  if (error) throw error;
  const workspace = await createProjectWorkspace({
    projectId: String(data.id),
    name: String(data.name ?? "Untitled project"),
  });
  const { data: updated, error: updateError } = await supabase
    .from("projects")
    .update({ "workspacePath": workspace.root })
    .eq("id", data.id)
    .select("*")
    .single();
  if (updateError) throw updateError;
  await recordTelemetry({
    projectId: String(data.id),
    userId,
    kind: "project.created",
    summary: `Project created: ${String(data.name ?? "Untitled project")}`,
  });
  return updated ? [updated] : [data];
}, "projects.create");
