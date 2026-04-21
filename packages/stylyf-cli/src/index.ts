export const CLI_NAME = "stylyf";

export const CLI_VERSION = "0.1.0";

export type CliCommand =
  | "generate"
  | "validate"
  | "search"
  | "serve-search"
  | "build-index";

export function helpText() {
  return [
    "Stylyf CLI",
    "",
    "JSON-driven frontend assembly line for SolidStart apps.",
    "",
    "Usage:",
    "  stylyf <command> [options]",
    "",
    "Commands:",
    "  generate      Generate an app from a JSON IR",
    "  validate      Validate a JSON IR",
    "  search        Search bundled registry/codeblock manifests",
    "  serve-search  Start the local search HTTP endpoint",
    "  build-index   Rebuild the bundled search index",
    "",
    "Global options:",
    "  -h, --help     Show help",
    "  -v, --version  Show version",
    "",
    "Phase 1 status:",
    "  Manifests, validation, and search are implemented.",
    "  Generation is scaffolded and lands next.",
  ].join("\n");
}

function commandStub(command: "generate") {
  return [
    `The '${command}' command is scaffolded but not implemented yet.`,
    "Next implementation steps live in FRONTEND_ASSEMBLY_LINE_PLAN.md.",
  ].join("\n");
}

import { runBuildIndexCommand } from "./commands/build-index.js";
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
    process.stdout.write(`${commandStub(command)}\n`);
    return 0;
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
