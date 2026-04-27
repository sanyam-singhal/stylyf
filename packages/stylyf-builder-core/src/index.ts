import { spawn, type ChildProcess } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { basename, join, resolve, sep } from "node:path";

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

const defaultAllowedCommands = new Set([
  "stylyf",
  "npm",
  "npx",
  "git",
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
  const workspaceRoot = assertInside(paths.workspaces, join(paths.workspaces, `${slug}-${input.projectId}`));
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
  if (base === "git" && !["status", "diff", "add", "commit", "push", "init", "remote", "branch"].includes(args[0] ?? "")) {
    throw new Error(`git subcommand is not allowlisted: ${args[0] ?? "<missing>"}`);
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
    args,
    cwd: input.cwd,
    exitCode,
    stdoutPath,
    stderrPath,
  } satisfies CommandResult;
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
