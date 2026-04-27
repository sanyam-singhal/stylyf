#!/usr/bin/env node
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const full = process.argv.includes("--full");
const keep = process.argv.includes("--keep");

function run(command, args, cwd, options = {}) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, args, {
      cwd,
      shell: false,
      stdio: options.capture ? ["ignore", "pipe", "pipe"] : "inherit",
      env: process.env,
    });
    let stdout = "";
    let stderr = "";
    if (child.stdout) child.stdout.on("data", chunk => (stdout += chunk.toString()));
    if (child.stderr) child.stderr.on("data", chunk => (stderr += chunk.toString()));
    child.on("error", reject);
    child.on("close", code => {
      if (code === 0) resolveRun({ code, stdout, stderr });
      else reject(new Error(`${command} ${args.join(" ")} failed with exit code ${code}\n${stderr}`));
    });
  });
}

async function main() {
  const root = await mkdtemp(join(tmpdir(), "stylyf-builder-smoke-"));
  const projectId = randomUUID();
  const workspace = join(root, "workspaces", `dogfood-${projectId}`);
  const specs = join(workspace, "specs");
  const app = join(workspace, "app");
  const logs = join(workspace, "logs");
  const webknife = join(workspace, ".webknife");
  await Promise.all([mkdir(specs, { recursive: true }), mkdir(app, { recursive: true }), mkdir(logs, { recursive: true }), mkdir(webknife, { recursive: true })]);

  const specPath = join(specs, "stylyf.spec.json");
  const handoffPath = join(workspace, "handoff.md");
  const spec = {
    version: "1.0",
    app: {
      name: "Builder Smoke App",
      kind: "internal-tool",
      description: "Local mock project for Stylyf Builder dogfood smoke.",
    },
    backend: {
      mode: "portable",
      portable: {
        database: "sqlite",
      },
    },
    media: {
      mode: "basic",
    },
    objects: [
      {
        name: "tasks",
        ownership: "user",
        visibility: "private",
        fields: [
          { name: "title", type: "short-text", required: true },
          { name: "status", type: "status", options: ["draft", "review", "done"], default: "draft" },
          { name: "summary", type: "long-text" },
        ],
      },
    ],
    surfaces: [
      { name: "Dashboard", kind: "dashboard", path: "/", audience: "user" },
      { name: "Tasks", kind: "list", object: "tasks", path: "/tasks", audience: "user" },
      { name: "New Task", kind: "create", object: "tasks", path: "/tasks/new", audience: "user" },
    ],
  };
  await writeFile(specPath, `${JSON.stringify(spec, null, 2)}\n`, "utf8");

  const cli = join(repoRoot, "packages/stylyf-cli/dist/bin.js");
  if (!existsSync(cli)) {
    await run("npm", ["run", "cli:build"], repoRoot);
  }

  await run("node", [cli, "validate", "--spec", specPath], repoRoot);
  await run("node", [cli, "plan", "--spec", specPath, "--resolved"], repoRoot, { capture: true });
  await run("node", [cli, "generate", "--spec", specPath, "--target", app, "--no-install"], repoRoot);

  if (full) {
    await run("npm", ["install"], app);
    await run("npm", ["run", "check"], app);
    await run("npm", ["run", "build"], app);
  }

  await writeFile(handoffPath, "# Builder Smoke App\n\nGenerated through the local mock builder smoke.\n", "utf8");
  await run("git", ["init"], app);
  await run("git", ["config", "user.email", "builder@depthsai.com"], app);
  await run("git", ["config", "user.name", "Stylyf Builder"], app);
  await run("git", ["branch", "-M", "main"], app);
  await run("git", ["add", "."], app);
  await run("git", ["commit", "-m", "Smoke generated app"], app);

  console.log(JSON.stringify({ ok: true, mode: full ? "full" : "quick", root, app, handoffPath }, null, 2));
  if (!keep) await rm(root, { recursive: true, force: true });
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
