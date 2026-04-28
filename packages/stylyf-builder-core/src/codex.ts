import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createInterface } from "node:readline";

const tokenNamePattern = /(TOKEN|SECRET|PASSWORD|KEY|AUTH|COOKIE|SESSION|SUPABASE_SECRET|AWS_SECRET)/i;
const tokenValuePattern = /(sb_secret_[A-Za-z0-9._-]+|sk-[A-Za-z0-9._-]+|gh[pousr]_[A-Za-z0-9_]+|AKIA[0-9A-Z]{16})/g;

function redactAgentText(input: string) {
  return input
    .split(/\r?\n/g)
    .map(line => {
      const [key] = line.split("=", 1);
      if (key && tokenNamePattern.test(key)) {
        return `${key}=<redacted>`;
      }
      return line.replace(tokenValuePattern, "<redacted>");
    })
    .join("\n");
}

export type AgentRole = "system" | "user" | "assistant" | "tool";

export type BuilderAgentEvent =
  | { type: "session.started"; sessionId: string; provider: string; workspacePath: string; providerSessionId?: string }
  | { type: "turn.started"; sessionId: string; turnId: string; prompt: string }
  | { type: "message"; sessionId: string; role: AgentRole; content: string }
  | { type: "approval.requested"; sessionId: string; approvalId: string; summary: string; payload?: unknown }
  | { type: "tool.event"; sessionId: string; name: string; summary: string; payload?: unknown }
  | { type: "turn.completed"; sessionId: string; turnId: string; summary: string; providerSessionId?: string }
  | { type: "session.error"; sessionId: string; message: string };

export type BuilderAgentSession = {
  id: string;
  provider: "codex-app-server" | "codex-exec" | "manual";
  workspacePath: string;
  startedAt: Date;
  hasRun?: boolean;
  providerSessionId?: string;
  turnCount?: number;
};

export type StartAgentSessionInput = {
  workspacePath: string;
  systemPrompt: string;
  resumeSessionId?: string | null;
};

export type SendAgentTurnInput = {
  sessionId: string;
  prompt: string;
};

export type BuilderAgentAdapter = {
  readonly provider: BuilderAgentSession["provider"];
  startSession(input: StartAgentSessionInput): AsyncIterable<BuilderAgentEvent>;
  sendTurn(input: SendAgentTurnInput): AsyncIterable<BuilderAgentEvent>;
  stopSession(sessionId: string): Promise<void>;
};

export class ManualAgentAdapter implements BuilderAgentAdapter {
  readonly provider = "manual" as const;
  #sessions = new Map<string, BuilderAgentSession>();

  async *startSession(input: StartAgentSessionInput): AsyncIterable<BuilderAgentEvent> {
    const session: BuilderAgentSession = {
      id: randomUUID(),
      provider: this.provider,
      workspacePath: input.workspacePath,
      startedAt: new Date(),
    };
    this.#sessions.set(session.id, session);
    yield {
      type: "session.started",
      sessionId: session.id,
      provider: this.provider,
      workspacePath: input.workspacePath,
    };
    yield {
      type: "message",
      sessionId: session.id,
      role: "system",
      content: redactAgentText(input.systemPrompt),
    };
  }

  async *sendTurn(input: SendAgentTurnInput): AsyncIterable<BuilderAgentEvent> {
    const session = this.#sessions.get(input.sessionId);
    if (!session) {
      yield { type: "session.error", sessionId: input.sessionId, message: "Manual session not found." };
      return;
    }

    const turnId = randomUUID();
    yield { type: "turn.started", sessionId: session.id, turnId, prompt: redactAgentText(input.prompt) };
    yield {
      type: "message",
      sessionId: session.id,
      role: "assistant",
      content: "Manual adapter recorded the turn. Wire Codex App Server to execute this prompt.",
    };
    yield {
      type: "turn.completed",
      sessionId: session.id,
      turnId,
      summary: "Manual fallback completed without mutating the workspace.",
    };
  }

  async stopSession(sessionId: string) {
    this.#sessions.delete(sessionId);
  }
}

type JsonRpcRequest = {
  jsonrpc: "2.0";
  id: string;
  method: string;
  params?: unknown;
};

type JsonRpcResponse = {
  id?: string;
  method?: string;
  result?: unknown;
  error?: { message?: string };
  params?: unknown;
};

type CodexExecState = {
  provider: "codex-exec";
  providerSessionId: string | null;
  updatedAt: string;
  turnCount: number;
};

function codexStatePath(workspacePath: string) {
  return join(workspacePath, ".stylyf", "codex-exec-session.json");
}

async function readCodexState(workspacePath: string): Promise<CodexExecState | null> {
  try {
    return JSON.parse(await readFile(codexStatePath(workspacePath), "utf8")) as CodexExecState;
  } catch {
    return null;
  }
}

async function writeCodexState(workspacePath: string, state: CodexExecState) {
  const path = codexStatePath(workspacePath);
  await mkdir(join(path, ".."), { recursive: true });
  await writeFile(path, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

export class CodexAppServerAdapter implements BuilderAgentAdapter {
  readonly provider = "codex-app-server" as const;
  #command: string;
  #args: string[];
  #processes = new Map<string, ChildProcessWithoutNullStreams>();

  constructor(input: { command?: string; args?: string[] } = {}) {
    this.#command = input.command ?? "codex";
    this.#args = input.args ?? ["app-server", "--stdio"];
  }

  async *startSession(input: StartAgentSessionInput): AsyncIterable<BuilderAgentEvent> {
    const sessionId = randomUUID();
    const child = spawn(this.#command, this.#args, {
      cwd: input.workspacePath,
      shell: false,
      env: process.env,
    });
    this.#processes.set(sessionId, child);

    const request: JsonRpcRequest = {
      jsonrpc: "2.0",
      id: randomUUID(),
      method: "session/start",
      params: {
        cwd: input.workspacePath,
        systemPrompt: input.systemPrompt,
      },
    };
    child.stdin.write(`${JSON.stringify(request)}\n`);

    yield {
      type: "session.started",
      sessionId,
      provider: this.provider,
      workspacePath: input.workspacePath,
    };

    const lines = createInterface({ input: child.stdout });
    for await (const line of lines) {
      const event = parseCodexEvent(sessionId, line);
      if (event) yield event;
      if (event?.type === "turn.completed") break;
    }
  }

  async *sendTurn(input: SendAgentTurnInput): AsyncIterable<BuilderAgentEvent> {
    const child = this.#processes.get(input.sessionId);
    if (!child) {
      yield { type: "session.error", sessionId: input.sessionId, message: "Codex App Server session not found." };
      return;
    }

    const turnId = randomUUID();
    yield { type: "turn.started", sessionId: input.sessionId, turnId, prompt: redactAgentText(input.prompt) };
    const request: JsonRpcRequest = {
      jsonrpc: "2.0",
      id: turnId,
      method: "turn/send",
      params: { prompt: input.prompt },
    };
    child.stdin.write(`${JSON.stringify(request)}\n`);

    const lines = createInterface({ input: child.stdout });
    for await (const line of lines) {
      const event = parseCodexEvent(input.sessionId, line);
      if (event) yield event;
      if (event?.type === "turn.completed") break;
    }
  }

  async stopSession(sessionId: string) {
    const child = this.#processes.get(sessionId);
    if (!child) return;
    child.kill("SIGTERM");
    this.#processes.delete(sessionId);
  }
}

function shellSplit(input: string) {
  return input.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g)?.map(part => part.replace(/^["']|["']$/g, "")) ?? [];
}

export class CodexExecAdapter implements BuilderAgentAdapter {
  readonly provider = "codex-exec" as const;
  #command: string;
  #baseArgs: string[];
  #resumeArgs: string[];
  #sessions = new Map<string, BuilderAgentSession>();

  constructor(input: { command?: string; args?: string[] } = {}) {
    this.#command = input.command ?? "codex";
    this.#baseArgs = input.args ?? shellSplit(process.env.CODEX_RUN_FLAGS ?? "exec --json --dangerously-bypass-approvals-and-sandbox");
    this.#resumeArgs = shellSplit(process.env.CODEX_RESUME_FLAGS ?? "exec resume --json --dangerously-bypass-approvals-and-sandbox");
  }

  async *startSession(input: StartAgentSessionInput): AsyncIterable<BuilderAgentEvent> {
    const persisted = await readCodexState(input.workspacePath);
    const session: BuilderAgentSession = {
      id: randomUUID(),
      provider: this.provider,
      workspacePath: input.workspacePath,
      startedAt: new Date(),
      hasRun: false,
      providerSessionId: input.resumeSessionId ?? persisted?.providerSessionId ?? undefined,
      turnCount: persisted?.turnCount ?? 0,
    };
    this.#sessions.set(session.id, session);
    yield {
      type: "session.started",
      sessionId: session.id,
      provider: this.provider,
      workspacePath: input.workspacePath,
      providerSessionId: session.providerSessionId,
    };
    yield {
      type: "message",
      sessionId: session.id,
      role: "system",
      content: redactAgentText(
        session.providerSessionId
          ? `${input.systemPrompt}\n\nResuming Codex session ${session.providerSessionId}.`
          : input.systemPrompt,
      ),
    };
  }

  async *sendTurn(input: SendAgentTurnInput): AsyncIterable<BuilderAgentEvent> {
    const session = this.#sessions.get(input.sessionId);
    if (!session) {
      yield { type: "session.error", sessionId: input.sessionId, message: "Codex exec session not found." };
      return;
    }

    const turnId = randomUUID();
    yield { type: "turn.started", sessionId: input.sessionId, turnId, prompt: redactAgentText(input.prompt) };

    const shouldResume = Boolean(session.providerSessionId);
    const args = shouldResume
      ? [...this.#resumeArgs, session.providerSessionId as string, input.prompt]
      : [...this.#baseArgs, "--cd", session.workspacePath, input.prompt];
    const child = spawn(this.#command, args, {
      cwd: session.workspacePath,
      shell: false,
      env: process.env,
    });
    session.hasRun = true;
    const exitPromise = new Promise<number | null>((resolveExit, reject) => {
      child.on("error", reject);
      child.on("close", resolveExit);
    });

    const stdoutLines = createInterface({ input: child.stdout });
    const stderrLines = createInterface({ input: child.stderr });
    const stderrBuffer: string[] = [];
    const stderrPromise = (async () => {
      for await (const line of stderrLines) {
        stderrBuffer.push(redactAgentText(line));
      }
    })();

    for await (const line of stdoutLines) {
      const providerSessionId = extractCodexSessionId(line);
      if (providerSessionId) {
        session.providerSessionId = providerSessionId;
        session.turnCount = (session.turnCount ?? 0) + 1;
        await writeCodexState(session.workspacePath, {
          provider: this.provider,
          providerSessionId,
          updatedAt: new Date().toISOString(),
          turnCount: session.turnCount,
        });
      }
      const event = parseCodexEvent(input.sessionId, line);
      if (event) yield event;
    }

    await stderrPromise;
    const exitCode = await exitPromise;

    if (exitCode === 0) {
      yield {
        type: "turn.completed",
        sessionId: input.sessionId,
        turnId,
        summary: "Codex exec turn completed.",
        providerSessionId: session.providerSessionId,
      };
    } else {
      const stderr = stderrBuffer.join("\n").trim();
      yield { type: "session.error", sessionId: input.sessionId, message: `Codex exec exited with ${exitCode ?? "unknown"}.${stderr ? ` ${stderr.slice(0, 800)}` : ""}` };
    }
  }

  async stopSession(sessionId: string) {
    this.#sessions.delete(sessionId);
  }
}

function extractCodexSessionId(line: string) {
  if (!line.trim()) return undefined;
  let payload: unknown;
  try {
    payload = JSON.parse(line) as unknown;
  } catch {
    return undefined;
  }
  if (!payload || typeof payload !== "object") return undefined;
  const record = payload as Record<string, unknown>;
  for (const key of ["session_id", "sessionId", "conversation_id", "conversationId", "thread_id", "threadId"]) {
    const value = record[key];
    if (typeof value === "string" && value.length > 8) return value;
  }
  const nested = record.msg ?? record.message ?? record.event ?? record.payload;
  if (nested && typeof nested === "object") {
    const nestedRecord = nested as Record<string, unknown>;
    for (const key of ["session_id", "sessionId", "conversation_id", "conversationId", "thread_id", "threadId"]) {
      const value = nestedRecord[key];
      if (typeof value === "string" && value.length > 8) return value;
    }
  }
  return undefined;
}

function parseCodexEvent(sessionId: string, line: string): BuilderAgentEvent | undefined {
  if (!line.trim()) return undefined;
  let payload: JsonRpcResponse;
  try {
    payload = JSON.parse(line) as JsonRpcResponse;
  } catch {
    return { type: "message", sessionId, role: "tool", content: redactAgentText(line) };
  }

  if (payload.error) {
    return { type: "session.error", sessionId, message: redactAgentText(payload.error.message ?? "Codex App Server error.") };
  }

  const method = payload.method ?? "";
  const eventType = typeof (payload as { type?: unknown }).type === "string" ? String((payload as { type?: unknown }).type) : "";
  if (eventType) {
    return {
      type: "tool.event",
      sessionId,
      name: eventType,
      summary: "Codex exec emitted an event.",
      payload,
    };
  }
  if (method.includes("approval")) {
    return {
      type: "approval.requested",
      sessionId,
      approvalId: randomUUID(),
      summary: "Codex requested approval.",
      payload: payload.params,
    };
  }
  if (method.includes("tool")) {
    return {
      type: "tool.event",
      sessionId,
      name: method,
      summary: "Codex emitted a tool event.",
      payload: payload.params,
    };
  }
  if (method.includes("message")) {
    return {
      type: "message",
      sessionId,
      role: "assistant",
      content: redactAgentText(JSON.stringify(payload.params ?? payload.result ?? "")),
    };
  }
  if (method.includes("complete") || payload.id) {
    return {
      type: "turn.completed",
      sessionId,
      turnId: String(payload.id ?? randomUUID()),
      summary: "Codex turn completed.",
    };
  }
  return {
    type: "tool.event",
    sessionId,
    name: method || "codex.event",
    summary: "Codex emitted an event.",
    payload,
  };
}
