import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { appKinds, backendModes, mediaModes } from "../spec/schema.js";
import type { AppKind, BackendMode, MediaMode } from "../spec/types.js";
import { createSpecPreset } from "../spec/presets.js";
import { validateSpecV10 } from "../spec/validate.js";

function isOneOf<T extends readonly string[]>(value: string | undefined, allowed: T): value is T[number] {
  return typeof value === "string" && allowed.includes(value);
}

export async function runNewCommand(args: string[]) {
  const kindArg = args[0];
  let name: string | undefined;
  let backend: BackendMode = "portable";
  let media: MediaMode = "basic";
  let outputPath = "stylyf.spec.json";

  if (!isOneOf(kindArg, appKinds)) {
    process.stderr.write(`Missing or invalid app kind. Use one of: ${appKinds.join(", ")}\n`);
    return 1;
  }

  for (let index = 1; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--name") {
      name = args[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--backend") {
      const value = args[index + 1];
      if (!isOneOf(value, backendModes)) {
        process.stderr.write(`Invalid --backend value. Use one of: ${backendModes.join(", ")}\n`);
        return 1;
      }
      backend = value;
      index += 1;
      continue;
    }

    if (arg === "--media") {
      const value = args[index + 1];
      if (!isOneOf(value, mediaModes)) {
        process.stderr.write(`Invalid --media value. Use one of: ${mediaModes.join(", ")}\n`);
        return 1;
      }
      media = value;
      index += 1;
      continue;
    }

    if (arg === "--output") {
      outputPath = args[index + 1] ?? outputPath;
      index += 1;
    }
  }

  if (!name) {
    process.stderr.write("Missing required option: --name <app name>\n");
    return 1;
  }

  const spec = validateSpecV10(createSpecPreset({ kind: kindArg as AppKind, name, backend, media }));
  const resolvedOutputPath = resolve(process.cwd(), outputPath);
  await mkdir(dirname(resolvedOutputPath), { recursive: true });
  await writeFile(resolvedOutputPath, `${JSON.stringify(spec, null, 2)}\n`);

  process.stdout.write(
    [
      `Created Stylyf v1.0 spec at ${resolvedOutputPath}`,
      `  kind: ${spec.app.kind}`,
      `  backend: ${spec.backend.mode}`,
      `  media: ${spec.media?.mode ?? "none"}`,
    ].join("\n") + "\n",
  );

  return 0;
}
