import { query } from "@solidjs/router";
import { createSupabaseServerClient } from "~/lib/supabase";
import { requireViewerIdentity } from "~/lib/server/resource-policy";

export const getProjects = query(async (id: string) => {
  "use server";
  const { userId } = await requireViewerIdentity();
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from("projects").select("*").eq("id", id).eq("owner_id", userId).limit(1);
  if (error) throw error;
  return data?.[0] ?? null;
}, "projects.detail");
