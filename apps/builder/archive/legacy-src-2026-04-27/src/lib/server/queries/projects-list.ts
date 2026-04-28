import { query } from "@solidjs/router";
import { createSupabaseServerClient } from "~/lib/supabase";
import { requireViewerIdentity } from "~/lib/server/resource-policy";

export const listProjects = query(async () => {
  "use server";
  await requireViewerIdentity();
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from("projects").select("*");
  if (error) throw error;
  return data ?? [];
}, "projects.list");
