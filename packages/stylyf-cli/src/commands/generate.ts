import { resolve } from "node:path";
import { generateFrontendDraft } from "../generators/generate.js";

export async function runGenerateCommand(args: string[]) {
  const irIndex = args.findIndex(arg => arg === "--ir");
  const targetIndex = args.findIndex(arg => arg === "--target");
  const irPath = irIndex >= 0 ? args[irIndex + 1] : undefined;
  const targetPath = targetIndex >= 0 ? args[targetIndex + 1] : undefined;
  const install = !args.includes("--no-install");

  if (!irPath) {
    process.stderr.write("Missing required option: --ir <path>\n");
    return 1;
  }

  if (!targetPath) {
    process.stderr.write("Missing required option: --target <path>\n");
    return 1;
  }

  const result = await generateFrontendDraft(irPath, resolve(process.cwd(), targetPath), { install });

  process.stdout.write(
    [
      `Generated frontend draft in ${resolve(process.cwd(), targetPath)}`,
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
    ].join("\n") + "\n",
  );

  return 0;
}
