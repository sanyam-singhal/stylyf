import { query } from "@solidjs/router";
import { createSupabaseServerClient } from "~/lib/supabase";
import { requireViewerIdentity } from "~/lib/server/resource-policy";

export const getActiveIrDraft = query(async (projectId: string) => {
  "use server";
  const { userId } = await requireViewerIdentity();
  const supabase = createSupabaseServerClient();
  const { error: projectError } = await supabase.from("projects").select("id").eq("id", projectId).eq("owner_id", userId).single();
  if (projectError) throw projectError;
  const { data, error } = await supabase
    .from("stylyf_specs")
    .select("spec,version,created_at")
    .eq("project_id", projectId)
    .eq("is_active", true)
    .order("version", { ascending: false })
    .limit(1);
  if (error) throw error;
  const { data: chunks, error: chunksError } = await supabase
    .from("stylyf_spec_chunks")
    .select("name,kind,spec_path,version,created_at")
    .eq("project_id", projectId)
    .eq("is_active", true)
    .order("name", { ascending: true });
  if (chunksError) throw chunksError;
  const current = data?.[0] ?? null;
  return current
    ? {
        version: current.version,
        createdAt: current.created_at,
        spec: JSON.stringify(current.spec, null, 2),
        chunks: chunks ?? [],
      }
    : null;
}, "ir.active-draft");
