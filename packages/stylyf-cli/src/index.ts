export const CLI_NAME = "stylyf";

export const CLI_VERSION = "0.5.0";

export type CliCommand =
  | "intro"
  | "new"
  | "compose"
  | "plan"
  | "generate"
  | "validate"
  | "search"
  | "serve-search"
  | "build-index";

export function helpText() {
  return [
    "Stylyf CLI",
    "",
    "Agent-operated scaffolding compiler for SolidStart apps.",
    "",
    "Usage:",
    "  stylyf <command> [options]",
    "",
    "Commands:",
    "  intro         Layered briefing for coding agents",
    "  new           Create a v0.4 spec for an app kind",
    "  compose       Merge explicit additive v0.4 spec chunks",
    "  validate      Validate a v0.4 spec",
    "  plan          Explain what a spec will generate",
    "  generate      Generate a SolidStart app from a v0.4 spec",
    "  search        Search bundled capabilities, patterns, and components",
    "  serve-search  Start the local search HTTP endpoint",
    "  build-index   Rebuild the bundled search index",
    "",
    "Global options:",
    "  -h, --help     Show help",
    "  -v, --version  Show version",
    "",
    "Typical flow:",
    "  stylyf intro",
  "  stylyf new generic --name \"Atlas\" --backend portable --media basic --output stylyf.spec.json",
    "  stylyf compose --base stylyf.spec.json --with routes.json --output stylyf.composed.json",
    "  stylyf validate --spec stylyf.spec.json",
    "  stylyf plan --spec stylyf.spec.json",
    "  stylyf generate --spec stylyf.spec.json --target ./my-app",
  ].join("\n");
}
import { runComposeCommand } from "./commands/compose.js";
import { runBuildIndexCommand } from "./commands/build-index.js";
import { runGenerateCommand } from "./commands/generate.js";
import { runIntroCommand } from "./commands/intro.js";
import { runNewCommand } from "./commands/new.js";
import { runPlanCommand } from "./commands/plan.js";
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

  if (command === "compose") {
    return runComposeCommand(commandArgs(argv));
  }

  if (command === "intro") {
    return runIntroCommand(commandArgs(argv));
  }

  if (command === "new") {
    return runNewCommand(commandArgs(argv));
  }

  if (command === "plan") {
    return runPlanCommand(commandArgs(argv));
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
