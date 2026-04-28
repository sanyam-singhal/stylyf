import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { allocatePort, bootstrapProjectWorkspace, createProjectWorkspace, ManualAgentAdapter, readJson, redact, renderProjectAgentsMarkdown, runCommand } from "../src/index.js";

const root = await mkdtemp(join(tmpdir(), "stylyf-builder-core-"));
try {
  const workspace = await createProjectWorkspace({ projectId: "test", name: "Core Smoke", root });
  const bootstrapped = await bootstrapProjectWorkspace({
    projectId: "bootstrap",
    name: "Bootstrap Smoke",
    root,
    git: {
      userName: "Stylyf Smoke",
      userEmail: "stylyf-smoke@example.com",
    },
  });
  const metadata = await readJson<{ name: string }>(join(bootstrapped.workspace.specs, "metadata.json"));
  if (metadata.name !== "Bootstrap Smoke") throw new Error("Bootstrap metadata smoke failed.");
  if (!bootstrapped.events.some(event => event.type === "git.initialized")) {
    throw new Error("Bootstrap git event was not emitted.");
  }
  const agents = renderProjectAgentsMarkdown({ projectName: "Contract Smoke" });
  for (const required of ["stylyf compose", "stylyf validate", "stylyf generate", "webknife shot", "handoff.md"]) {
    if (!agents.includes(required)) throw new Error(`Project AGENTS contract is missing ${required}.`);
  }
  const redacted = redact("AWS_SECRET_ACCESS_KEY=abc123\nhello=world\nsk-test");
  if (redacted.includes("abc123")) throw new Error("Redaction failed.");
  const result = await runCommand({
    command: "node",
    args: ["--version"],
    cwd: workspace.root,
    logsDir: workspace.logs,
  });
  if (result.exitCode !== 0) throw new Error("Command smoke failed.");
  const port = await allocatePort(4500, 4599);
  const adapter = new ManualAgentAdapter();
  let sessionId = "";
  for await (const event of adapter.startSession({ workspacePath: workspace.app, systemPrompt: "SYSTEM_SECRET=hidden" })) {
    if (event.type === "session.started") sessionId = event.sessionId;
  }
  if (!sessionId) throw new Error("Manual adapter did not emit a session.");
  for await (const event of adapter.sendTurn({ sessionId, prompt: "Sketch a dashboard" })) {
    if (event.type === "session.error") throw new Error(event.message);
  }
  console.log(JSON.stringify({ ok: true, workspace: workspace.slug, bootstrapped: bootstrapped.workspace.slug, port, result: result.exitCode, sessionId }, null, 2));
} finally {
  await rm(root, { recursive: true, force: true });
}
