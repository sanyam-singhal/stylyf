import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { validateAppIr } from "../ir/validate.js";

export async function runValidateCommand(args: string[]) {
  const irIndex = args.findIndex(arg => arg === "--ir");
  const irPath = irIndex >= 0 ? args[irIndex + 1] : undefined;

  if (!irPath) {
    process.stderr.write("Missing required option: --ir <path>\n");
    return 1;
  }

  const resolved = resolve(process.cwd(), irPath);
  const raw = await readFile(resolved, "utf8");
  const parsed = JSON.parse(raw) as unknown;
  const result = validateAppIr(parsed);

  if (!result.ok) {
    process.stderr.write(`IR validation failed:\n- ${result.errors.join("\n- ")}\n`);
    return 1;
  }

  process.stdout.write(`IR validation passed for ${resolved}\n`);
  return 0;
}

