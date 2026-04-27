import { action, query, revalidate } from "@solidjs/router";
import {
  CodexExecAdapter,
  ManualAgentAdapter,
  allocatePort,
  runCommand,
  startManagedProcess,
  type BuilderAgentAdapter,
  type BuilderAgentEvent,
  type ManagedProcess,
} from "@depths/stylyf-builder-core";
import { existsSync } from "node:fs";
import { mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { requireSession } from "~/lib/auth";
import { env } from "~/lib/env.server";
import { createSupabaseServerClient } from "~/lib/supabase";

type ProjectWorkspaceRecord = {
  id: string;
  owner_id: string;
  name: string;
  status: string;
  workspacePath: string | null;
  previewUrl: string | null;
  githubRepoFullName: string | null;
  github_default_branch: string | null;
};

export type TimelineEvent = {
  id: string;
  type: string;
  summary: string | null;
  role: string | null;
  status: string;
  content: string | null;
  artifact_path: string | null;
  content_path: string | null;
  created_at: string;
};

const processRegistry = new Map<string, ManagedProcess>();

const operatorSystemPrompt = [
  "You are the Stylyf internal builder agent.",
  "Read AGENTS.md first. It is the controlling contract.",
  "Use `stylyf intro --topic operator` and Stylyf IR before raw source edits.",
  "Use Webknife screenshots for UI changes.",
  "Never reveal raw environment values.",
].join("\n");

function createAgentAdapter(): BuilderAgentAdapter {
  if (process.env.STYLYF_BUILDER_AGENT_ADAPTER === "manual") return new ManualAgentAdapter();
  return new CodexExecAdapter();
}

async function getUserId() {
  const session = await requireSession();
  return session.user.id;
}

async function requireProject(projectId: string, userId: string) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, owner_id, name, status, workspacePath, previewUrl, githubRepoFullName, github_default_branch")
    .eq("id", projectId)
    .eq("owner_id", userId)
    .single();
  if (error) throw error;
  return data as ProjectWorkspaceRecord;
}

async function recordEvent(input: {
  projectId: string;
  userId: string;
  sessionId?: string | null;
  type: string;
  summary: string;
  role?: string | null;
  status?: "queued" | "running" | "completed" | "failed" | "cancelled";
  content?: string | null;
  artifactPath?: string | null;
  contentPath?: string | null;
}) {
  const supabase = createSupabaseServerClient();
  await supabase.from("agent_events").insert({
    project_id: input.projectId,
    session_id: input.sessionId ?? null,
    owner_id: input.userId,
    type: input.type,
    role: input.role ?? null,
    status: input.status ?? "completed",
    summary: input.summary.slice(0, 500),
    content: input.content ?? null,
    artifact_path: input.artifactPath ?? null,
    content_path: input.contentPath ?? null,
  });
}

async function recordCommand(projectId: string, result: Awaited<ReturnType<typeof runCommand>>) {
  const status = result.exitCode === 0 ? "completed" : "failed";
  await createSupabaseServerClient().from("commands").insert({
    project_id: projectId,
    command: `${result.command} ${result.args.join(" ")}`.trim(),
    cwd: result.cwd,
    status,
    exit_code: result.exitCode,
    stdout_path: result.stdoutPath,
    stderr_path: result.stderrPath,
    completed_at: new Date().toISOString(),
  });
  return status;
}

async function runTrackedCommand(input: { projectId: string; command: string; args: string[]; cwd: string; logsDir: string }) {
  const result = await runCommand({
    command: input.command,
    args: input.args,
    cwd: input.cwd,
    logsDir: input.logsDir,
  });
  await recordCommand(input.projectId, result);
  return result;
}

function summarizeCommitMessage(prompt: string) {
  return `builder iteration: ${prompt.replace(/\s+/g, " ").slice(0, 72)}`;
}

async function commitAndPushProject(input: { project: ProjectWorkspaceRecord; userId: string; sessionId: string; prompt: string }) {
  if (!input.project.workspacePath) return;
  const logsDir = join(input.project.workspacePath, "logs");
  await mkdir(logsDir, { recursive: true });

  const statusResult = await runTrackedCommand({
    projectId: input.project.id,
    command: "git",
    args: ["status", "--short"],
    cwd: input.project.workspacePath,
    logsDir,
  });
  if (statusResult.exitCode !== 0) {
    await recordEvent({ projectId: input.project.id, userId: input.userId, sessionId: input.sessionId, type: "git.status_failed", summary: "Could not inspect project git status." });
    return;
  }

  const statusText = (await readFile(statusResult.stdoutPath, "utf8")).trim();
  if (!statusText) {
    await recordEvent({ projectId: input.project.id, userId: input.userId, sessionId: input.sessionId, type: "git.clean", summary: "No file changes to commit." });
    return;
  }

  const addResult = await runTrackedCommand({
    projectId: input.project.id,
    command: "git",
    args: ["add", "."],
    cwd: input.project.workspacePath,
    logsDir,
  });
  if (addResult.exitCode !== 0) throw new Error("Could not stage project changes.");

  const commitMessage = summarizeCommitMessage(input.prompt);
  const commitResult = await runTrackedCommand({
    projectId: input.project.id,
    command: "git",
    args: ["commit", "-m", commitMessage],
    cwd: input.project.workspacePath,
    logsDir,
  });
  if (commitResult.exitCode !== 0) throw new Error("Could not commit project changes.");

  const shaResult = await runTrackedCommand({
    projectId: input.project.id,
    command: "git",
    args: ["rev-parse", "HEAD"],
    cwd: input.project.workspacePath,
    logsDir,
  });
  const commitSha = shaResult.exitCode === 0 ? (await readFile(shaResult.stdoutPath, "utf8")).trim() : null;
  const branch = input.project.github_default_branch ?? "main";
  const supabase = createSupabaseServerClient();
  await supabase.from("git_events").insert({
    project_id: input.project.id,
    kind: "commit_created",
    repo_full_name: input.project.githubRepoFullName,
    branch,
    commit_sha: commitSha,
    summary: commitMessage,
  });
  await recordEvent({ projectId: input.project.id, userId: input.userId, sessionId: input.sessionId, type: "git.committed", summary: commitSha ? `Committed ${commitSha.slice(0, 7)}.` : "Committed project changes." });

  if (!input.project.githubRepoFullName) {
    await recordEvent({ projectId: input.project.id, userId: input.userId, sessionId: input.sessionId, type: "git.push_skipped", summary: "No GitHub remote is connected for this project." });
    return;
  }

  const pushResult = await runTrackedCommand({
    projectId: input.project.id,
    command: "git",
    args: ["push", "origin", branch],
    cwd: input.project.workspacePath,
    logsDir,
  });
  const pushed = pushResult.exitCode === 0;
  await supabase.from("git_events").insert({
    project_id: input.project.id,
    kind: pushed ? "push_completed" : "push_failed",
    repo_full_name: input.project.githubRepoFullName,
    branch,
    commit_sha: commitSha,
    summary: pushed ? "Pushed builder iteration." : "Project push failed.",
  });
  if (pushed) {
    await supabase.from("projects").update({ lastPushedSha: commitSha }).eq("id", input.project.id);
  }
  await recordEvent({
    projectId: input.project.id,
    userId: input.userId,
    sessionId: input.sessionId,
    type: pushed ? "git.pushed" : "git.push_failed",
    summary: pushed ? "Pushed project changes." : "Project push failed.",
  });
  if (!pushed) throw new Error("Project push failed. Check the recorded git logs.");
}

function summarizeAgentEvent(event: BuilderAgentEvent) {
  switch (event.type) {
    case "session.started":
      return `Session started: ${event.provider}.`;
    case "turn.started":
      return event.prompt;
    case "message":
      return `${event.role}: ${event.content}`;
    case "approval.requested":
      return event.summary;
    case "tool.event":
      return `${event.name}: ${event.summary}`;
    case "turn.completed":
      return event.summary;
    case "session.error":
      return event.message;
  }
}

function buildTaskPacket(input: { project: ProjectWorkspaceRecord; prompt: string }) {
  return [
    `Project: ${input.project.name}`,
    `Workspace: ${input.project.workspacePath ?? "not created"}`,
    `GitHub: ${input.project.githubRepoFullName ?? "not connected"}`,
    "",
    "User request:",
    input.prompt,
    "",
    "Operating order:",
    "1. Read AGENTS.md.",
    "2. Prefer Stylyf IR and CLI generation before raw source edits.",
    "3. Use Webknife screenshots for visual changes.",
    "4. Keep commits small and push after each completed change.",
  ].join("\n");
}

function buildPreviewUrl(port: number) {
  const publicBase = process.env.STYLYF_PREVIEW_PUBLIC_BASE;
  if (publicBase) return `${publicBase.replace(/\/$/, "")}:${port}`;
  const base = new URL(env.APP_BASE_URL);
  return `${base.protocol}//${base.hostname}:${port}`;
}

export const getTimeline = query(async (projectId: string): Promise<TimelineEvent[]> => {
  "use server";
  if (projectId === "demo") return [];
  const userId = await getUserId();
  await requireProject(projectId, userId);
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("agent_events")
    .select("id,type,summary,role,status,content,artifact_path,content_path,created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) throw error;
  return (data ?? []) as TimelineEvent[];
}, "builder.studio.timeline");

export const sendAgentPrompt = action(async (projectId: string, formData: FormData) => {
  "use server";
  const promptValue = formData.get("prompt");
  const prompt = typeof promptValue === "string" ? promptValue.trim() : "";
  if (!prompt) throw new Error("Write the next instruction first.");
  if (projectId === "demo") return { ok: true, message: "Demo prompt noted." };

  const userId = await getUserId();
  const project = await requireProject(projectId, userId);
  if (!project.workspacePath) throw new Error("This project workspace is not ready yet.");

  await mkdir(join(project.workspacePath, "logs"), { recursive: true });
  const adapter = createAgentAdapter();
  const supabase = createSupabaseServerClient();
  const { data: session, error: sessionError } = await supabase
    .from("agent_sessions")
    .insert({
      project_id: projectId,
      provider: adapter.provider,
      status: "running",
      created_by: userId,
    })
    .select("id")
    .single();
  if (sessionError) throw sessionError;

  await recordEvent({
    projectId,
    userId,
    sessionId: session.id,
    type: "user.prompt",
    role: "user",
    summary: prompt,
    content: prompt,
  });

  let adapterSessionId = "";
  try {
    for await (const event of adapter.startSession({ workspacePath: project.workspacePath, systemPrompt: operatorSystemPrompt })) {
      if (event.type === "session.started") adapterSessionId = event.sessionId;
      await recordEvent({
        projectId,
        userId,
        sessionId: session.id,
        type: event.type,
        role: event.type === "message" ? event.role : "system",
        status: event.type === "session.error" ? "failed" : "completed",
        summary: summarizeAgentEvent(event),
        content: event.type === "message" ? event.content : null,
      });
    }

    const packet = buildTaskPacket({ project, prompt });
    for await (const event of adapter.sendTurn({ sessionId: adapterSessionId, prompt: packet })) {
      await recordEvent({
        projectId,
        userId,
        sessionId: session.id,
        type: event.type,
        role: event.type === "message" ? event.role : event.type === "turn.started" ? "user" : "assistant",
        status: event.type === "session.error" ? "failed" : event.type === "turn.started" ? "running" : "completed",
        summary: summarizeAgentEvent(event),
        content: event.type === "message" ? event.content : null,
      });
    }

    await commitAndPushProject({ project, userId, sessionId: session.id, prompt });
    await supabase.from("agent_sessions").update({ status: "completed", thread_id: adapterSessionId }).eq("id", session.id);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Builder turn failed.";
    await recordEvent({
      projectId,
      userId,
      sessionId: session.id,
      type: "session.error",
      role: "system",
      status: "failed",
      summary: message,
    });
    await supabase.from("agent_sessions").update({ status: "error", thread_id: adapterSessionId || null }).eq("id", session.id);
    await revalidate(getTimeline.keyFor(projectId));
    throw error;
  }

  await revalidate(getTimeline.keyFor(projectId));
  return { ok: true, message: "Sent to builder." };
}, "builder.studio.send-prompt");

export const startPreview = action(async (projectId: string) => {
  "use server";
  if (projectId === "demo") return { ok: true, previewUrl: null };
  const userId = await getUserId();
  const project = await requireProject(projectId, userId);
  if (!project.workspacePath) throw new Error("This project workspace is not ready yet.");

  const appPath = join(project.workspacePath, "app");
  if (!existsSync(join(appPath, "package.json"))) {
    throw new Error("Generate the app before opening preview.");
  }

  const existing = processRegistry.get(projectId);
  if (existing) {
    await existing.stop();
    processRegistry.delete(projectId);
  }

  const port = await allocatePort();
  const preview = startManagedProcess({
    id: projectId,
    command: "npm",
    args: ["run", "dev", "--", "--host", "127.0.0.1", "--port", String(port)],
    cwd: appPath,
  });
  processRegistry.set(projectId, preview);

  const previewUrl = buildPreviewUrl(port);
  await createSupabaseServerClient().from("projects").update({ preview_port: port, previewUrl }).eq("id", projectId);
  await recordEvent({ projectId, userId, type: "preview.started", summary: `Preview started.` });
  await revalidate(getTimeline.keyFor(projectId));
  return { ok: true, previewUrl };
}, "builder.studio.start-preview");

export const stopPreview = action(async (projectId: string) => {
  "use server";
  if (projectId === "demo") return { ok: true };
  const userId = await getUserId();
  await requireProject(projectId, userId);
  const existing = processRegistry.get(projectId);
  if (existing) {
    await existing.stop();
    processRegistry.delete(projectId);
  }
  await createSupabaseServerClient().from("projects").update({ preview_port: null, previewUrl: null }).eq("id", projectId);
  await recordEvent({ projectId, userId, type: "preview.stopped", summary: "Preview stopped." });
  await revalidate(getTimeline.keyFor(projectId));
  return { ok: true };
}, "builder.studio.stop-preview");

export const runScreenshotReview = action(async (projectId: string) => {
  "use server";
  if (projectId === "demo") throw new Error("Open a real project preview before taking screenshots.");
  const userId = await getUserId();
  const project = await requireProject(projectId, userId);
  if (!project.workspacePath) throw new Error("This project workspace is not ready yet.");
  if (!project.previewUrl) throw new Error("Open a preview before taking screenshots.");

  const webknifePath = join(project.workspacePath, ".webknife");
  const logsPath = join(project.workspacePath, "logs");
  await mkdir(webknifePath, { recursive: true });
  await mkdir(logsPath, { recursive: true });

  const result = await runCommand({
    command: "npx",
    args: ["@depths/webknife", "shot", project.previewUrl, "--out", webknifePath, "--ci", "--json"],
    cwd: project.workspacePath,
    logsDir: logsPath,
  });

  const status = result.exitCode === 0 ? "completed" : "failed";
  const supabase = createSupabaseServerClient();
  await supabase.from("commands").insert({
    project_id: projectId,
    command: `npx @depths/webknife shot ${project.previewUrl} --out .webknife --ci --json`,
    cwd: project.workspacePath,
    status,
    exit_code: result.exitCode,
    stdout_path: result.stdoutPath,
    stderr_path: result.stderrPath,
    completed_at: new Date().toISOString(),
  });
  await supabase.from("webknife_runs").insert({
    project_id: projectId,
    kind: "shot",
    artifact_path: webknifePath,
    summary: status === "completed" ? "Screenshot review completed." : "Screenshot review failed.",
  });
  await recordEvent({
    projectId,
    userId,
    type: "webknife.shot",
    summary: status === "completed" ? "Screenshot review completed." : "Screenshot review failed.",
    artifactPath: webknifePath,
  });
  await revalidate(getTimeline.keyFor(projectId));

  if (result.exitCode !== 0) {
    throw new Error("Screenshot review failed. Check the recorded Webknife logs.");
  }

  return { ok: true, artifactPath: webknifePath };
}, "builder.studio.screenshot-review");
