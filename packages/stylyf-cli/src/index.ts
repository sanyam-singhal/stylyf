export const CLI_NAME = "stylyf";

export const CLI_VERSION = "0.3.1";

export type CliCommand =
  | "intro"
  | "generate"
  | "validate"
  | "search"
  | "serve-search"
  | "build-index";

export function helpText() {
  return [
    "Stylyf CLI",
    "",
    "JSON-driven full-stack assembly line for SolidStart apps.",
    "",
    "Usage:",
    "  stylyf <command> [options]",
    "",
    "Commands:",
    "  intro         Emit a layered markdown briefing for coding agents",
    "  generate      Generate an app from one or more explicit IR fragments",
    "  validate      Validate one or more explicit IR fragments",
    "  search        Search bundled registry/codeblock manifests",
    "  serve-search  Start the local search HTTP endpoint",
    "  build-index   Rebuild the bundled search index",
    "",
    "Global options:",
    "  -h, --help     Show help",
    "  -v, --version  Show version",
    "",
    "Typical flow:",
    "  stylyf intro",
    "  stylyf validate --ir app.core.json --ir backend.portable.json --ir routes.json --print-resolved",
    "  stylyf generate --ir app.core.json --ir backend.portable.json --ir routes.json --target ./my-app",
  ].join("\n");
}
import { runBuildIndexCommand } from "./commands/build-index.js";
import { runGenerateCommand } from "./commands/generate.js";
import { runIntroCommand } from "./commands/intro.js";
import { runSearchCommand } from "./commands/search.js";
import { runServeSearchCommand } from "./commands/serve-search.js";
import { runValidateCommand } from "./commands/validate.js";
import { commandArgs } from "./utils/args.js";

export async function runCli(argv: string[] = process.argv.slice(2)) {
  const [command] = argv;

  if (!command || command === "--help" || command === "-h") {
    process.stdout.write(`${helpText()}\n`);
    return 0;
  }

  if (command === "--version" || command === "-v") {
    process.stdout.write(`${CLI_VERSION}\n`);
    return 0;
  }

  if (command === "generate") {
    return runGenerateCommand(commandArgs(argv));
  }

  if (command === "intro") {
    return runIntroCommand(commandArgs(argv));
  }

  if (command === "validate") {
    return runValidateCommand(commandArgs(argv));
  }

  if (command === "search") {
    return runSearchCommand(commandArgs(argv));
  }

  if (command === "serve-search") {
    return runServeSearchCommand(commandArgs(argv));
  }

  if (command === "build-index") {
    return runBuildIndexCommand(commandArgs(argv));
  }

  process.stderr.write(`Unknown command: ${command}\n\n${helpText()}\n`);
  return 1;
}
