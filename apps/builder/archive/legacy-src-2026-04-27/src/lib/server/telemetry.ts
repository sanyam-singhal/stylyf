import { createSupabaseServerClient } from "~/lib/supabase";

export type BuilderTelemetryKind =
  | "project.created"
  | "spec.validated"
  | "generation.started"
  | "generation.completed"
  | "generation.failed"
  | "preview.started"
  | "preview.stopped"
  | "webknife.completed"
  | "webknife.failed"
  | "commit.created"
  | "push.completed"
  | "push.failed";

export async function recordTelemetry(input: {
  projectId: string;
  userId: string;
  kind: BuilderTelemetryKind;
  summary: string;
  artifactPath?: string | null;
}) {
  const supabase = createSupabaseServerClient();
  await supabase.from("agent_events").insert({
    project_id: input.projectId,
    owner_id: input.userId,
    type: `telemetry.${input.kind}`,
    summary: input.summary.slice(0, 500),
    artifact_path: input.artifactPath ?? null,
  });
}
