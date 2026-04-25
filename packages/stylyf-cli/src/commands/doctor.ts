import { CLI_VERSION } from "../index.js";

export async function runDoctorCommand() {
  const checks = [
    { name: "node", ok: Number(process.versions.node.split(".")[0]) >= 22, detail: process.versions.node },
    { name: "package", ok: true, detail: `@depths/stylyf-cli ${CLI_VERSION}` },
    { name: "cwd", ok: Boolean(process.cwd()), detail: process.cwd() },
  ];

  for (const check of checks) {
    process.stdout.write(`${check.ok ? "ok" : "fail"} ${check.name}: ${check.detail}\n`);
  }

  return checks.every(check => check.ok) ? 0 : 1;
}
