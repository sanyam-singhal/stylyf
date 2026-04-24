import { resolve } from "node:path";
import { generateFromSpec } from "../generators/generate.js";

export async function runGenerateCommand(args: string[]) {
  let specPath: string | undefined;
  let targetPath: string | undefined;
  let install = true;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--spec") {
      specPath = args[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--target") {
      targetPath = args[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--no-install") {
      install = false;
      continue;
    }

    if (arg === "--ir" || arg === "--print-resolved" || arg === "--write-resolved") {
      process.stderr.write(
        "Stylyf v0.4 no longer accepts --ir fragments. Use --spec stylyf.spec.json. Run `stylyf intro --topic spec` for the v0.4 DSL.\n",
      );
      return 1;
    }
  }

  if (!specPath) {
    process.stderr.write("Missing required option: --spec <path>\n");
    return 1;
  }

  if (!targetPath) {
    process.stderr.write("Missing required option: --target <path>\n");
    return 1;
  }

  const resolvedTargetPath = resolve(process.cwd(), targetPath);
  const result = await generateFromSpec(specPath, resolvedTargetPath, { install });

  process.stdout.write(
    [
      `Generated SolidStart app in ${resolvedTargetPath}`,
      `  spec: ${resolve(process.cwd(), specPath)}`,
      `  kind: ${result.spec.app.kind}`,
      `  routes: ${result.routes}`,
      `  app shells: ${result.appShells}`,
      `  page shells: ${result.pageShells}`,
      `  layouts: ${result.layouts}`,
      `  api routes: ${result.apiRoutes}`,
      `  server modules: ${result.serverModules}`,
      `  copied source files: ${result.copiedFiles}`,
      `  post-generate steps: ${
        result.postGenerateSteps.length > 0 ? result.postGenerateSteps.join(", ") : install ? "none" : "skipped"
      }`,
      `  npm install: ${result.installed ? "completed" : "skipped"}`,
      `  plan: ${resolve(resolvedTargetPath, "stylyf.plan.json")}`,
    ]
      .join("\n") + "\n",
  );

  return 0;
}
