import { action } from "@solidjs/router";
import { createSupabaseServerClient } from "~/lib/supabase";
import { requireViewerIdentity } from "~/lib/server/resource-policy";

export const deleteProjects = action(async (id: string) => {
  "use server";
  const { userId } = await requireViewerIdentity();
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from("projects").delete().eq("id", id).eq("owner_id", userId).select("*");
  if (error) throw error;
  return data ?? [];
}, "projects.delete");
