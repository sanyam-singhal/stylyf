import { action } from "@solidjs/router";
import { allocatePort, createProjectWorkspace, runCommand, startManagedProcess, type ManagedProcess } from "@depths/stylyf-builder-core";
import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { env } from "~/lib/env.server";
import { createSupabaseServerClient } from "~/lib/supabase";
import { requireViewerIdentity } from "~/lib/server/resource-policy";
import { recordTelemetry } from "~/lib/server/telemetry";

const processRegistry = new Map<string, ManagedProcess>();

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
    await mkdir(join(existing, "app"), { recursive: true });
    return {
      root: existing,
      app: join(existing, "app"),
      logs: join(existing, "logs"),
    };
  }

  const workspace = await createProjectWorkspace({
    projectId: String(project.id),
    name: String(project.name ?? "Untitled project"),
  });
  await createSupabaseServerClient().from("projects").update({ workspacePath: workspace.root }).eq("id", project.id);
  return workspace;
}

function buildPreviewUrl(port: number) {
  const publicBase = process.env.STYLYF_PREVIEW_PUBLIC_BASE;
  if (publicBase) return `${publicBase.replace(/\/$/, "")}:${port}`;
  const base = new URL(env.APP_BASE_URL);
  return `${base.protocol}//${base.hostname}:${port}`;
}

async function recordEvent(input: { projectId: string; userId: string; type: string; summary: string; artifactPath?: string }) {
  const supabase = createSupabaseServerClient();
  await supabase.from("agent_events").insert({
    project_id: input.projectId,
    owner_id: input.userId,
    type: input.type,
    summary: input.summary,
    artifact_path: input.artifactPath ?? null,
  });
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

export const startProjectPreview = action(async (projectId: string) => {
  "use server";
  const { userId } = await requireViewerIdentity();
  const project = await getProject(projectId, userId);
  const workspace = await ensureWorkspace(project);
  const packageJsonPath = join(workspace.app, "package.json");
  if (!existsSync(packageJsonPath)) {
    throw new Error("Generate the app before starting a preview.");
  }

  const existing = processRegistry.get(projectId);
  if (existing) {
    await existing.stop();
    processRegistry.delete(projectId);
  }

  if (!existsSync(join(workspace.app, "node_modules"))) {
    const install = await runCommand({
      command: "npm",
      args: ["install"],
      cwd: workspace.app,
      logsDir: workspace.logs,
    });
    await recordCommand({
      projectId,
      command: "npm install",
      cwd: workspace.app,
      status: install.exitCode === 0 ? "completed" : "failed",
      exitCode: install.exitCode,
      stdoutPath: install.stdoutPath,
      stderrPath: install.stderrPath,
    });
    if (install.exitCode !== 0) {
      await recordEvent({
        projectId,
        userId,
        type: "preview.install_failed",
        summary: `Preview dependency install failed with exit code ${install.exitCode ?? "unknown"}.`,
        artifactPath: install.stderrPath,
      });
      throw new Error("Preview dependency install failed. Check the recorded stderr log.");
    }
  }

  const port = await allocatePort();
  const preview = startManagedProcess({
    id: projectId,
    command: "npm",
    args: ["run", "dev", "--", "--host", "127.0.0.1", "--port", String(port)],
    cwd: workspace.app,
  });
  processRegistry.set(projectId, preview);

  const previewUrl = buildPreviewUrl(port);
  const supabase = createSupabaseServerClient();
  await supabase.from("previews").update({ status: "stopped" }).eq("project_id", projectId).eq("status", "running");
  await supabase.from("previews").insert({
    project_id: projectId,
    port,
    pid: preview.pid,
    status: "running",
  });
  await supabase.from("preview_processes").insert({
    project_id: projectId,
    port,
    pid: preview.pid,
    preview_url: previewUrl,
    status: "running",
    started_at: new Date().toISOString(),
  });
  await supabase.from("projects").update({ preview_port: port, previewUrl }).eq("id", projectId);
  await recordEvent({
    projectId,
    userId,
    type: "preview.started",
    summary: `Preview started on ${previewUrl}.`,
  });
  await recordTelemetry({
    projectId,
    userId,
    kind: "preview.started",
    summary: `Preview started on port ${port}.`,
  });

  return { ok: true, previewUrl, port, pid: preview.pid };
}, "preview.start-project");

export const stopProjectPreview = action(async (projectId: string) => {
  "use server";
  const { userId } = await requireViewerIdentity();
  await getProject(projectId, userId);
  const existing = processRegistry.get(projectId);
  if (existing) {
    await existing.stop();
    processRegistry.delete(projectId);
  }

  const supabase = createSupabaseServerClient();
  await supabase.from("previews").update({ status: "stopped" }).eq("project_id", projectId).eq("status", "running");
  await supabase
    .from("preview_processes")
    .update({ status: "stopped", stopped_at: new Date().toISOString() })
    .eq("project_id", projectId)
    .eq("status", "running");
  await supabase.from("projects").update({ preview_port: null, previewUrl: null }).eq("id", projectId);
  await recordEvent({
    projectId,
    userId,
    type: "preview.stopped",
    summary: "Preview process stopped.",
  });
  await recordTelemetry({
    projectId,
    userId,
    kind: "preview.stopped",
    summary: "Preview process stopped.",
  });

  return { ok: true };
}, "preview.stop-project");
