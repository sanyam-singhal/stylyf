import { action } from "@solidjs/router";
import { createProjectWorkspace, runCommand } from "@depths/stylyf-builder-core";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { createSupabaseServerClient } from "~/lib/supabase";
import { requireViewerIdentity } from "~/lib/server/resource-policy";
import { recordTelemetry } from "~/lib/server/telemetry";

type ProjectRow = Record<string, unknown>;

async function getProject(projectId: string, userId: string) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from("projects").select("*").eq("id", projectId).eq("owner_id", userId).single();
  if (error) throw error;
  return data as ProjectRow;
}

async function ensureWorkspace(project: ProjectRow) {
  const existing = typeof project.workspacePath === "string" ? project.workspacePath : "";
  if (existing) {
    await mkdir(join(existing, "logs"), { recursive: true });
    await mkdir(join(existing, ".webknife"), { recursive: true });
    return {
      root: existing,
      logs: join(existing, "logs"),
      webknife: join(existing, ".webknife"),
    };
  }

  const workspace = await createProjectWorkspace({
    projectId: String(project.id),
    name: String(project.name ?? "Untitled project"),
  });
  await createSupabaseServerClient().from("projects").update({ workspacePath: workspace.root }).eq("id", project.id);
  return workspace;
}

async function recordCommand(input: {
  projectId: string;
  command: string;
  cwd: string;
  status: "completed" | "failed";
  exitCode: number | null;
  stdoutPath: string;
  stderrPath: string;
}) {
  const supabase = createSupabaseServerClient();
  await supabase.from("commands").insert({
    project_id: input.projectId,
    command: input.command,
    cwd: input.cwd,
    status: input.status,
    exit_code: input.exitCode,
    stdout_path: input.stdoutPath,
    stderr_path: input.stderrPath,
    completed_at: new Date().toISOString(),
  });
}

export const runWebknifeScreenshot = action(async (projectId: string) => {
  "use server";
  const { userId } = await requireViewerIdentity();
  const project = await getProject(projectId, userId);
  const previewUrl = typeof project.previewUrl === "string" ? project.previewUrl : "";
  if (!previewUrl) throw new Error("Start a preview before running Webknife.");

  const workspace = await ensureWorkspace(project);
  const command = await runCommand({
    command: "npx",
    args: ["@depths/webknife", "shot", previewUrl, "--out", workspace.webknife, "--ci", "--json"],
    cwd: workspace.root,
    logsDir: workspace.logs,
  });

  await recordCommand({
    projectId,
    command: `npx @depths/webknife shot ${previewUrl} --out ${workspace.webknife} --ci --json`,
    cwd: workspace.root,
    status: command.exitCode === 0 ? "completed" : "failed",
    exitCode: command.exitCode,
    stdoutPath: command.stdoutPath,
    stderrPath: command.stderrPath,
  });

  const supabase = createSupabaseServerClient();
  await supabase.from("webknife_runs").insert({
    project_id: projectId,
    kind: "shot",
    artifact_path: workspace.webknife,
    summary: command.exitCode === 0 ? "Webknife screenshot completed." : `Webknife screenshot failed with exit code ${command.exitCode ?? "unknown"}.`,
  });
  await supabase.from("agent_events").insert({
    project_id: projectId,
    owner_id: userId,
    type: "webknife.shot",
    summary: command.exitCode === 0 ? "Webknife screenshot completed." : "Webknife screenshot failed.",
    artifact_path: workspace.webknife,
  });
  await recordTelemetry({
    projectId,
    userId,
    kind: command.exitCode === 0 ? "webknife.completed" : "webknife.failed",
    summary: command.exitCode === 0 ? "Webknife screenshot completed." : "Webknife screenshot failed.",
    artifactPath: workspace.webknife,
  });

  return { ok: command.exitCode === 0, exitCode: command.exitCode, artifactPath: workspace.webknife };
}, "webknife.screenshot");
