import { action } from "@solidjs/router";
import { CodexExecAdapter, createProjectWorkspace, ManualAgentAdapter, type BuilderAgentAdapter, type BuilderAgentEvent } from "@depths/stylyf-builder-core";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { createSupabaseServerClient } from "~/lib/supabase";
import { requireViewerIdentity } from "~/lib/server/resource-policy";

type ProjectRow = Record<string, unknown>;

const operatorSystemPrompt = [
  "You are the Stylyf internal builder agent.",
  "Your working directory is the project workspace root, where AGENTS.md is the controlling contract.",
  "Read `stylyf intro --topic operator` before making implementation decisions.",
  "Use Stylyf IR first, then edit generated source only when the IR cannot express the requested nuance.",
  "Keep changes visible, run checks before claiming completion, and use Webknife when UI changes need visual feedback.",
  "Never persist or reveal raw environment values.",
].join("\n");

function createAgentAdapter(): BuilderAgentAdapter {
  if (process.env.STYLYF_BUILDER_AGENT_ADAPTER === "manual") return new ManualAgentAdapter();
  return new CodexExecAdapter();
}

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

async function getActiveSpecContext(projectId: string) {
  const supabase = createSupabaseServerClient();
  const [{ data: specs }, { data: chunks }] = await Promise.all([
    supabase
      .from("stylyf_specs")
      .select("version,spec")
      .eq("project_id", projectId)
      .eq("is_active", true)
      .order("version", { ascending: false })
      .limit(1),
    supabase
      .from("stylyf_spec_chunks")
      .select("name,kind,spec_path,version")
      .eq("project_id", projectId)
      .eq("is_active", true)
      .order("name", { ascending: true }),
  ]);
  return {
    activeSpecVersion: specs?.[0]?.version ?? null,
    activeSpec: specs?.[0]?.spec ?? null,
    chunks: chunks ?? [],
  };
}

function buildTaskPacket(input: { prompt: string; project: ProjectRow; specContext: Awaited<ReturnType<typeof getActiveSpecContext>> }) {
  return [
    "Builder turn packet:",
    "",
    `Project: ${String(input.project.name ?? "Untitled project")}`,
    `Status: ${String(input.project.status ?? "unknown")}`,
    `Workspace path: ${String(input.project.workspacePath ?? "pending")}`,
    `GitHub repo: ${String(input.project.githubRepoFullName ?? "not connected")}`,
    `Active Stylyf spec version: ${String(input.specContext.activeSpecVersion ?? "none")}`,
    `Active chunks: ${input.specContext.chunks.map(chunk => `${chunk.kind}:${chunk.name}`).join(", ") || "none"}`,
    "",
    "User request:",
    input.prompt,
    "",
    "Mandatory operating order:",
    "1. Inspect AGENTS.md.",
    "2. Use Stylyf CLI and specs/ chunks before raw source edits.",
    "3. If raw edits are required, write the reason into handoff.md.",
    "4. Run checks and Webknife when UI changes are involved.",
    "5. Commit and push only when explicitly asked by the builder workflow.",
  ].join("\n");
}

function summarizeEvent(event: BuilderAgentEvent) {
  switch (event.type) {
    case "session.started":
      return `Agent session started with ${event.provider}.`;
    case "turn.started":
      return `User turn: ${event.prompt}`;
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

function approvalTypeForPrompt(prompt: string) {
  if (/\b(env|secret|token|credential|migration|sql|delete|destructive)\b/i.test(prompt)) return "sensitive_change";
  if (/\b(install|dependency|package|npm)\b/i.test(prompt)) return "dependency_change";
  if (/\b(push|commit|github|repo)\b/i.test(prompt)) return "git_change";
  return null;
}

async function persistAgentEvent(input: {
  projectId: string;
  userId: string;
  sessionId: string;
  event: BuilderAgentEvent;
}) {
  const supabase = createSupabaseServerClient();
  await supabase.from("agent_events").insert({
    project_id: input.projectId,
    session_id: input.sessionId,
    owner_id: input.userId,
    type: input.event.type,
    summary: summarizeEvent(input.event),
    artifact_path: null,
  });
}

export const sendAgentPrompt = action(async (projectId: string, formData: FormData) => {
  "use server";
  const prompt = String(formData.get("prompt") ?? "").trim();
  if (!prompt) throw new Error("Prompt is required.");

  const { userId } = await requireViewerIdentity();
  const project = await getProject(projectId, userId);
  const workspace = await ensureWorkspace(project);
  const specContext = await getActiveSpecContext(projectId);
  const supabase = createSupabaseServerClient();
  const adapter = createAgentAdapter();

  const { data: session, error: sessionError } = await supabase
    .from("agent_sessions")
    .insert({
      project_id: projectId,
      provider: adapter.provider,
      status: "running",
      created_by: userId,
    })
    .select("*")
    .single();
  if (sessionError) throw sessionError;

  let adapterSessionId = "";
  for await (const event of adapter.startSession({ workspacePath: workspace.root, systemPrompt: operatorSystemPrompt })) {
    if (event.type === "session.started") adapterSessionId = event.sessionId;
    await persistAgentEvent({ projectId, userId, sessionId: session.id, event });
  }
  await supabase.from("agent_sessions").update({ thread_id: adapterSessionId }).eq("id", session.id);

  const taskPacket = buildTaskPacket({ prompt, project, specContext });
  for await (const event of adapter.sendTurn({ sessionId: adapterSessionId, prompt: taskPacket })) {
    await persistAgentEvent({ projectId, userId, sessionId: session.id, event });
  }

  const approvalType = approvalTypeForPrompt(prompt);
  if (approvalType) {
    await supabase.from("approvals").insert({
      project_id: projectId,
      session_id: session.id,
      type: approvalType,
      requested_by: "agent",
      summary: `Approval required before applying prompt: ${prompt.slice(0, 180)}`,
      status: "pending",
    });
  }

  await supabase.from("agent_sessions").update({ status: "completed" }).eq("id", session.id);
  return { ok: true, message: approvalType ? "Prompt recorded; approval queued for sensitive work." : "Prompt recorded in the project timeline." };
}, "agent.send-prompt");

export const decideApproval = action(async (approvalId: string, decision: "approved" | "denied") => {
  "use server";
  const { userId } = await requireViewerIdentity();
  const supabase = createSupabaseServerClient();
  const { data: approval, error: approvalError } = await supabase.from("approvals").select("*").eq("id", approvalId).single();
  if (approvalError) throw approvalError;
  await getProject(String(approval.project_id), userId);
  const { error } = await supabase
    .from("approvals")
    .update({
      status: decision,
      decided_by: userId,
      decided_at: new Date().toISOString(),
    })
    .eq("id", approvalId);
  if (error) throw error;
  return { ok: true, decision };
}, "agent.decide-approval");
