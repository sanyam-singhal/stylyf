import { expandSpecToGeneratedApp } from "../compiler/expand.js";
import { createGenerationPlan, renderGenerationPlan } from "../compiler/plan.js";
import { readSpecV04 } from "../spec/read.js";

export async function runPlanCommand(args: string[]) {
  let specPath: string | undefined;
  let json = false;
  let resolved = false;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--spec") {
      specPath = args[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--json") {
      json = true;
      continue;
    }

    if (arg === "--resolved") {
      resolved = true;
      continue;
    }

    if (arg === "--ir") {
      process.stderr.write(
        "Stylyf v0.4 no longer accepts raw --ir fragments. Use --spec stylyf.spec.json, `stylyf compose`, or `stylyf plan --resolved`.\n",
      );
      return 1;
    }
  }

  if (!specPath) {
    process.stderr.write("Missing required option: --spec <path>\n");
    return 1;
  }

  const { spec } = await readSpecV04(specPath);
  const app = expandSpecToGeneratedApp(spec);

  if (resolved) {
    process.stdout.write(`${JSON.stringify(app, null, 2)}\n`);
    return 0;
  }

  const plan = createGenerationPlan(spec, app);

  process.stdout.write(json ? `${JSON.stringify(plan, null, 2)}\n` : `${renderGenerationPlan(plan)}\n`);
  return 0;
}
