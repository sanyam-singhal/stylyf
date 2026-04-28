import { createSupabaseAdminClient } from "~/lib/supabase";

export const seedPlan = [
  {
    "resource": "projects",
    "table": "projects",
    "rows": [
      {
        "name": "Seed name",
        "slug": "Seed slug"
      }
    ]
  },
  {
    "resource": "agent_events",
    "table": "agent_events",
    "rows": [
      {
        "type": "Seed type",
        "payload": {}
      }
    ]
  }
] as const;

export async function runSeed() {
  const supabase = createSupabaseAdminClient();
  for (const entry of seedPlan) {
    if ((entry.rows as readonly unknown[]).length === 0) continue;
    const { error } = await supabase.from(entry.table).insert(entry.rows as any);
    if (error) throw error;
  }
  return { ok: true as const, resources: seedPlan.length };
}
