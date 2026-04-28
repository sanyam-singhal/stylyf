import { action } from "@solidjs/router";
import { createSupabaseServerClient } from "~/lib/supabase";
import { requireViewerIdentity } from "~/lib/server/resource-policy";

type ProjectsRecord = Record<string, unknown> & { id: string };

export const updateProjects = action(async (input: ProjectsRecord) => {
  "use server";
  const { userId } = await requireViewerIdentity();
  const { id, ...changes } = input;
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from("projects").update(changes).eq("id", id).eq("owner_id", userId).select("*");
  if (error) throw error;
  return data ?? [];
}, "projects.update");
