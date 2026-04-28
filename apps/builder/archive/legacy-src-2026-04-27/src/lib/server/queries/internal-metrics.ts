import { query } from "@solidjs/router";
import { createSupabaseServerClient } from "~/lib/supabase";
import { requireViewerIdentity } from "~/lib/server/resource-policy";

export const getInternalMetrics = query(async () => {
  "use server";
  const { userId } = await requireViewerIdentity();
  const supabase = createSupabaseServerClient();
  const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", userId).single();
  if (profileError) throw profileError;
  if (profile?.role !== "admin") {
    return { allowed: false, counts: [], recent: [] };
  }

  const { data, error } = await supabase
    .from("agent_events")
    .select("type,summary,created_at")
    .like("type", "telemetry.%")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;

  const counts = Array.from(
    (data ?? []).reduce((acc, event) => {
      acc.set(event.type, (acc.get(event.type) ?? 0) + 1);
      return acc;
    }, new Map<string, number>()),
    ([type, count]) => ({ type, count }),
  );

  return {
    allowed: true,
    counts,
    recent: (data ?? []).slice(0, 12),
  };
}, "metrics.internal");
