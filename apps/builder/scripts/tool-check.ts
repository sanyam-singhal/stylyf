import { spawnSync } from "node:child_process";

type ToolCheck = {
  label: string;
  command: string;
  args: string[];
  fallbackArgs?: string[];
  authenticated?: boolean;
};

const secretPattern = /(gh[pousr]_[A-Za-z0-9_]+|sb_secret_[A-Za-z0-9._-]+|sk-[A-Za-z0-9._-]+|AKIA[0-9A-Z]{16})/g;

function redact(input: string) {
  return input.replace(secretPattern, "<redacted>");
}

function firstLine(input: string) {
  return redact(input).split(/\r?\n/).map(line => line.trim()).find(Boolean) ?? "";
}

function run(command: string, args: string[]) {
  return spawnSync(command, args, {
    encoding: "utf8",
    timeout: 8_000,
    shell: false,
  });
}

function checkTool(tool: ToolCheck) {
  let result = run(tool.command, tool.args);
  if (result.error && "code" in result.error && result.error.code === "ENOENT") {
    return {
      ok: false,
      label: tool.label,
      detail: `${tool.command} not found on PATH.`,
    };
  }

  if (result.status !== 0 && tool.fallbackArgs) {
    result = run(tool.command, tool.fallbackArgs);
  }

  if (result.status !== 0) {
    return {
      ok: false,
      label: tool.label,
      detail: firstLine(result.stderr || result.stdout) || `${tool.command} exited with status ${result.status ?? "unknown"}.`,
    };
  }

  if (tool.authenticated) {
    return {
      ok: true,
      label: tool.label,
      detail: "authenticated",
    };
  }

  return {
    ok: true,
    label: tool.label,
    detail: firstLine(result.stdout || result.stderr) || "available",
  };
}

const checks: ToolCheck[] = [
  { label: "Stylyf CLI", command: "stylyf", args: ["--version"] },
  { label: "Webknife", command: "webknife", args: ["--version"], fallbackArgs: ["--help"] },
  { label: "Codex CLI", command: "codex", args: ["--version"] },
  { label: "GitHub CLI", command: "gh", args: ["auth", "status"], authenticated: true },
];

const results = checks.map(checkTool);
const failures = results.filter(result => !result.ok);

for (const result of results) {
  const prefix = result.ok ? "ok" : "missing";
  console.log(`${prefix}: ${result.label} - ${result.detail}`);
}

if (failures.length > 0) {
  console.error(
    [
      "Builder tool check failed.",
      "Install/authenticate the missing tools before running live builder sessions:",
      "npm i -g @depths/stylyf-cli@latest @depths/webknife@latest @openai/codex@latest",
      "gh auth login",
    ].join("\n"),
  );
  process.exitCode = 1;
}
