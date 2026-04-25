import { readSpecV10 } from "../spec/read.js";
import { expandSpecToGeneratedApp } from "../compiler/expand.js";
import { createGenerationPlan } from "../compiler/plan.js";

export async function runValidateCommand(args: string[]) {
  let specPath: string | undefined;
  let deep = false;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--spec") {
      specPath = args[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--ir" || arg === "--print-resolved" || arg === "--write-resolved") {
      process.stderr.write(
        "Stylyf v1.0 no longer accepts --ir fragments. Use --spec stylyf.spec.json. Run `stylyf intro --topic spec` for the v1.0 DSL.\n",
      );
      return 1;
    }

    if (arg === "--deep") {
      deep = true;
      continue;
    }
  }

  if (!specPath) {
    process.stderr.write("Missing required option: --spec <path>\n");
    return 1;
  }

  const { path, spec } = await readSpecV10(specPath);
  const app = deep ? expandSpecToGeneratedApp(spec) : undefined;
  const plan = app ? createGenerationPlan(spec, app) : undefined;

  process.stdout.write(
    [
      `Spec validation passed`,
      deep ? "  deep: true" : undefined,
      `  path: ${path}`,
      `  version: ${spec.version}`,
      `  kind: ${spec.app.kind}`,
      `  backend: ${spec.backend.mode}`,
      `  objects: ${spec.objects?.length ?? 0}`,
      `  flows: ${spec.flows?.length ?? 0}`,
      `  surfaces: ${spec.surfaces?.length ?? 0}`,
      plan ? `  generated routes: ${plan.routes.length}` : undefined,
      app ? `  generated server modules: ${app.server?.length ?? 0}` : undefined,
    ]
      .filter(Boolean)
      .join("\n") + "\n",
  );
  return 0;
}
