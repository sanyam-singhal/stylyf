import { spawn, type ChildProcess } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { basename, join, resolve, sep } from "node:path";
export * from "./codex.js";
export { renderProjectAgentsMarkdown } from "./project-agents.js";
import { renderProjectAgentsMarkdown } from "./project-agents.js";

export type BuilderPaths = {
  root: string;
  workspaces: string;
  tmp: string;
  locks: string;
};

export type ProjectWorkspace = {
  projectId: string;
  slug: string;
  root: string;
  app: string;
  specs: string;
  logs: string;
  screenshots: string;
  webknife: string;
  metadata: string;
  handoff: string;
  repo: string;
  events: string;
};

export type CommandResult = {
  command: string;
  args: string[];
  cwd: string;
  exitCode: number | null;
  stdoutPath: string;
  stderrPath: string;
};

export type ManagedProcess = {
  id: string;
  command: string;
  args: string[];
  cwd: string;
  pid: number | null;
  startedAt: Date;
  stop: () => Promise<void>;
};

export type BuilderCommandEvent =
  | { type: "command.started"; command: string; args: string[]; cwd: string; startedAt: string }
  | { type: "command.completed"; result: CommandResult; completedAt: string }
  | { type: "workspace.created"; workspace: ProjectWorkspace; summary: string }
  | { type: "git.initialized"; workspace: ProjectWorkspace; commit?: CommandResult }
  | { type: "github.repo_created"; repoFullName: string; remote?: string }
  | { type: "git.pushed"; repoFullName: string; branch: string; result: CommandResult };

export type BootstrapProjectInput = {
  projectId: string;
  name: string;
  root?: string;
  description?: string;
  initialSpec?: unknown;
  github?: {
    enabled?: boolean;
    org?: string;
    repoName?: string;
    private?: boolean;
  };
  git?: {
    defaultBranch?: string;
    userName?: string;
    userEmail?: string;
  };
};

export type BootstrapProjectResult = {
  workspace: ProjectWorkspace;
  repoFullName?: string;
  remoteUrl?: string;
  commands: CommandResult[];
  events: BuilderCommandEvent[];
};

const defaultAllowedCommands = new Set([
  "stylyf",
  "npm",
  "npx",
  "git",
  "gh",
  "node",
]);

const allowedNpmScripts = new Set([
  "check",
  "build",
  "dev",
  "test:smoke",
  "test",
  "env:check",
]);

const tokenNamePattern = /(TOKEN|SECRET|PASSWORD|KEY|AUTH|COOKIE|SESSION|SUPABASE_SECRET|AWS_SECRET)/i;
const tokenValuePattern = /(sb_secret_[A-Za-z0-9._-]+|sk-[A-Za-z0-9._-]+|gh[pousr]_[A-Za-z0-9_]+|AKIA[0-9A-Z]{16})/g;

export function resolveBuilderPaths(root = process.env.STYLYF_BUILDER_ROOT ?? ".stylyf-builder"): BuilderPaths {
  const absolute = resolve(root);
  return {
    root: absolute,
    workspaces: join(absolute, "workspaces"),
    tmp: join(absolute, "tmp"),
    locks: join(absolute, "locks"),
  };
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "project";
}

function safeSegment(input: string, fallback = "project") {
  return slugify(input).slice(0, 96) || fallback;
}

export function assertInside(parent: string, child: string) {
  const resolvedParent = resolve(parent);
  const resolvedChild = resolve(child);
  if (resolvedChild !== resolvedParent && !resolvedChild.startsWith(`${resolvedParent}${sep}`)) {
    throw new Error(`Path ${resolvedChild} escapes workspace root ${resolvedParent}.`);
  }
  return resolvedChild;
}

export async function ensureBuilderPaths(paths = resolveBuilderPaths()) {
  await mkdir(paths.workspaces, { recursive: true });
  await mkdir(paths.tmp, { recursive: true });
  await mkdir(paths.locks, { recursive: true });
  return paths;
}

export async function createProjectWorkspace(input: { projectId: string; name: string; root?: string }) {
  const paths = await ensureBuilderPaths(resolveBuilderPaths(input.root));
  const slug = slugify(input.name);
  const projectSegment = safeSegment(input.projectId, "project");
  const workspaceRoot = assertInside(paths.workspaces, join(paths.workspaces, `${slug}-${projectSegment}`));
  const workspace: ProjectWorkspace = {
    projectId: input.projectId,
    slug,
    root: workspaceRoot,
    app: join(workspaceRoot, "app"),
    specs: join(workspaceRoot, "specs"),
    logs: join(workspaceRoot, "logs"),
    screenshots: join(workspaceRoot, "screenshots"),
    webknife: join(workspaceRoot, ".webknife"),
    metadata: join(workspaceRoot, "metadata.json"),
    handoff: join(workspaceRoot, "handoff.md"),
    repo: join(workspaceRoot, "repo.json"),
    events: join(workspaceRoot, "events.jsonl"),
  };

  for (const directory of [workspace.root, workspace.app, workspace.specs, workspace.logs, workspace.screenshots, workspace.webknife]) {
    await mkdir(directory, { recursive: true });
  }

  await writeJson(workspace.metadata, {
    projectId: input.projectId,
    name: input.name,
    slug,
    createdAt: new Date().toISOString(),
  });

  return workspace;
}

export async function writeJson(path: string, value: unknown) {
  await mkdir(resolve(path, ".."), { recursive: true }).catch(() => undefined);
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, "utf8")) as T;
}

export function redact(input: string) {
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

function redactArgs(args: string[]) {
  return args.map(arg => redact(arg));
}

export function assertAllowedCommand(command: string, args: string[]) {
  const base = basename(command);
  if (!defaultAllowedCommands.has(base)) {
    throw new Error(`Command is not allowlisted: ${base}`);
  }
  if (base === "npm" && args[0] === "run") {
    const script = args[1];
    if (!script || !allowedNpmScripts.has(script)) {
      throw new Error(`npm script is not allowlisted: ${script ?? "<missing>"}`);
    }
  }
  if (base === "npx" && args[0] !== "webknife" && args[0] !== "@depths/webknife") {
    throw new Error(`npx command is not allowlisted: ${args[0] ?? "<missing>"}`);
  }
  if (base === "git" && !["status", "diff", "add", "commit", "push", "init", "remote", "branch", "config", "rev-parse"].includes(args[0] ?? "")) {
    throw new Error(`git subcommand is not allowlisted: ${args[0] ?? "<missing>"}`);
  }
  if (base === "gh" && !["auth", "repo"].includes(args[0] ?? "")) {
    throw new Error(`gh subcommand is not allowlisted: ${args[0] ?? "<missing>"}`);
  }
}

export async function runCommand(input: { command: string; args?: string[]; cwd: string; logsDir: string }) {
  const args = input.args ?? [];
  assertAllowedCommand(input.command, args);
  await mkdir(input.logsDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const label = `${stamp}-${basename(input.command)}-${args[0] ?? "run"}`;
  const stdoutPath = join(input.logsDir, `${label}.stdout.log`);
  const stderrPath = join(input.logsDir, `${label}.stderr.log`);

  const child = spawn(input.command, args, {
    cwd: input.cwd,
    shell: false,
    env: process.env,
  });

  let stdout = "";
  let stderr = "";
  child.stdout.on("data", chunk => {
    stdout += chunk.toString();
  });
  child.stderr.on("data", chunk => {
    stderr += chunk.toString();
  });

  const exitCode = await new Promise<number | null>((resolveExit, reject) => {
    child.on("error", reject);
    child.on("close", resolveExit);
  });

  await writeFile(stdoutPath, redact(stdout), "utf8");
  await writeFile(stderrPath, redact(stderr), "utf8");

  return {
    command: input.command,
    args: redactArgs(args),
    cwd: input.cwd,
    exitCode,
    stdoutPath,
    stderrPath,
  } satisfies CommandResult;
}

async function runRequiredCommand(input: { command: string; args?: string[]; cwd: string; logsDir: string }) {
  const result = await runCommand(input);
  if (result.exitCode !== 0) {
    throw new Error(`Command failed: ${result.command} ${result.args.join(" ")}. See ${result.stderrPath}`);
  }
  return result;
}

function defaultInitialSpec(name: string) {
  return {
    version: "1.0",
    app: {
      name,
      kind: "generic",
      description: "A Stylyf-generated SolidStart app draft.",
    },
    backend: {
      mode: "portable",
    },
    media: {
      mode: "none",
    },
    experience: {
      theme: "opal",
      mode: "light",
      radius: "trim",
      density: "comfortable",
      spacing: "tight",
    },
    objects: [],
    surfaces: [],
    navigation: {
      primary: [],
      userMenu: [],
    },
    deployment: {
      profile: "none",
    },
  };
}

export function renderProjectReadme(input: { projectName: string; description?: string }) {
  return `# ${input.projectName}

${input.description ?? "Generated by the internal Stylyf Builder."}

This repository is a Stylyf Builder workspace. The generated app lives in \`app/\`; explicit Stylyf IR lives in \`specs/\`.

## Agent Loop

Use \`AGENTS.md\` as the operating contract. Prefer Stylyf IR and CLI regeneration before raw source edits.

## Workspace Layout

- \`specs/base.json\` starts the app contract.
- \`specs/*.chunk.json\` should hold incremental app, style, route, object, API, and media edits.
- \`app/\` is the generated app and must stay standalone.
- \`logs/\`, \`screenshots/\`, and \`.webknife/\` are artifact directories.
- \`repo.json\`, \`metadata.json\`, \`events.jsonl\`, and \`handoff.md\` are builder-owned handoff files.
`;
}

export async function bootstrapProjectWorkspace(input: BootstrapProjectInput): Promise<BootstrapProjectResult> {
  const workspace = await createProjectWorkspace({ projectId: input.projectId, name: input.name, root: input.root });
  const commands: CommandResult[] = [];
  const defaultBranch = input.git?.defaultBranch ?? "main";
  const githubEnabled = input.github?.enabled === true;
  const repoFullName = githubEnabled
    ? `${input.github?.org ?? process.env.STYLYF_GITHUB_ORG ?? ""}/${input.github?.repoName ?? workspace.slug}`
    : undefined;
  if (githubEnabled && (!repoFullName || repoFullName.startsWith("/"))) {
    throw new Error("GitHub bootstrap requires github.org or STYLYF_GITHUB_ORG.");
  }
  const events: BuilderCommandEvent[] = [
    {
      type: "workspace.created",
      workspace,
      summary: `Created builder workspace for ${input.name}.`,
    },
  ];

  await writeFile(join(workspace.root, "AGENTS.md"), renderProjectAgentsMarkdown({ projectName: input.name }), "utf8");
  await writeFile(join(workspace.root, "README.md"), renderProjectReadme({ projectName: input.name, description: input.description }), "utf8");
  await writeFile(
    join(workspace.root, ".gitignore"),
    ["node_modules/", "app/node_modules/", "app/.output/", "app/.vinxi/", "logs/", ".webknife/", "screenshots/", ".env", ".env.*", "!.env.example", ""].join("\n"),
    "utf8",
  );
  await writeFile(join(workspace.root, "handoff.md"), `# Handoff\n\n- Project created: ${new Date().toISOString()}\n`, "utf8");
  await writeJson(join(workspace.specs, "base.json"), input.initialSpec ?? defaultInitialSpec(input.name));
  await writeJson(join(workspace.specs, "metadata.json"), {
    projectId: input.projectId,
    name: input.name,
    slug: workspace.slug,
    createdAt: new Date().toISOString(),
  });
  await writeJson(workspace.repo, {
    repoFullName: repoFullName ?? null,
    remoteUrl: null,
    defaultBranch,
    createdAt: new Date().toISOString(),
  });
  await writeFile(workspace.events, `${JSON.stringify(events[0])}\n`, "utf8");

  commands.push(await runRequiredCommand({ command: "git", args: ["init"], cwd: workspace.root, logsDir: workspace.logs }));
  commands.push(await runRequiredCommand({ command: "git", args: ["branch", "-M", defaultBranch], cwd: workspace.root, logsDir: workspace.logs }));
  if (input.git?.userName) {
    commands.push(await runRequiredCommand({ command: "git", args: ["config", "user.name", input.git.userName], cwd: workspace.root, logsDir: workspace.logs }));
  }
  if (input.git?.userEmail) {
    commands.push(await runRequiredCommand({ command: "git", args: ["config", "user.email", input.git.userEmail], cwd: workspace.root, logsDir: workspace.logs }));
  }

  let remoteUrl: string | undefined;
  if (githubEnabled && repoFullName) {
    const visibility = input.github?.private === false ? "--public" : "--private";
    commands.push(await runRequiredCommand({
      command: "gh",
      args: ["repo", "create", repoFullName, visibility, "--source", workspace.root, "--remote", "origin"],
      cwd: workspace.root,
      logsDir: workspace.logs,
    }));
    const remoteResult = await runRequiredCommand({ command: "git", args: ["remote", "get-url", "origin"], cwd: workspace.root, logsDir: workspace.logs });
    commands.push(remoteResult);
    remoteUrl = (await readFile(remoteResult.stdoutPath, "utf8")).trim() || undefined;
    await writeJson(workspace.repo, {
      repoFullName,
      remoteUrl: remoteUrl ?? null,
      defaultBranch,
      createdAt: new Date().toISOString(),
    });
    events.push({ type: "github.repo_created", repoFullName, remote: remoteUrl });
  }

  commands.push(await runRequiredCommand({ command: "git", args: ["add", "."], cwd: workspace.root, logsDir: workspace.logs }));
  const commit = await runRequiredCommand({ command: "git", args: ["commit", "-m", "bootstrap stylyf builder workspace"], cwd: workspace.root, logsDir: workspace.logs });
  commands.push(commit);
  events.push({ type: "git.initialized", workspace, commit });

  if (githubEnabled && repoFullName) {
    const push = await runRequiredCommand({ command: "git", args: ["push", "-u", "origin", defaultBranch], cwd: workspace.root, logsDir: workspace.logs });
    commands.push(push);
    events.push({ type: "git.pushed", repoFullName, branch: defaultBranch, result: push });
  }

  await writeFile(workspace.events, `${events.map(event => JSON.stringify(event)).join("\n")}\n`, "utf8");

  return { workspace, repoFullName, remoteUrl, commands, events };
}

export async function allocatePort(start = 4100, end = 4999) {
  for (let port = start; port <= end; port += 1) {
    if (await isPortFree(port)) return port;
  }
  throw new Error(`No free port found in range ${start}-${end}.`);
}

async function isPortFree(port: number) {
  return new Promise<boolean>(resolvePort => {
    const server = createServer();
    server.once("error", () => resolvePort(false));
    server.once("listening", () => {
      server.close(() => resolvePort(true));
    });
    server.listen(port, "127.0.0.1");
  });
}

export function startManagedProcess(input: { id: string; command: string; args?: string[]; cwd: string }): ManagedProcess {
  const args = input.args ?? [];
  assertAllowedCommand(input.command, args);
  const child: ChildProcess = spawn(input.command, args, {
    cwd: input.cwd,
    shell: false,
    detached: true,
    stdio: "ignore",
    env: process.env,
  });
  child.unref();
  return {
    id: input.id,
    command: input.command,
    args,
    cwd: input.cwd,
    pid: child.pid ?? null,
    startedAt: new Date(),
    async stop() {
      if (child.pid) {
        try {
          process.kill(-child.pid, "SIGTERM");
        } catch {
          child.kill("SIGTERM");
        }
      }
    },
  };
}

export async function cleanupWorkspace(path: string, root = resolveBuilderPaths().workspaces) {
  await rm(assertInside(root, path), { recursive: true, force: true });
}

export * from "./codex.js";
