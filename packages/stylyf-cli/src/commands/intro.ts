import { resolve } from "node:path";
import { renderIntroMarkdown, writeIntroMarkdown } from "../generators/intro.js";

export async function runIntroCommand(args: string[]) {
  const projectIndex = args.findIndex(arg => arg === "--project");
  const outputIndex = args.findIndex(arg => arg === "--output");
  const projectPath = projectIndex >= 0 ? args[projectIndex + 1] : undefined;
  const outputPath = outputIndex >= 0 ? args[outputIndex + 1] : undefined;
  const markdown = await renderIntroMarkdown({
    projectPath: projectPath ? resolve(process.cwd(), projectPath) : undefined,
    outputPath: outputPath ? resolve(process.cwd(), outputPath) : undefined,
  });

  if (!outputPath) {
    process.stdout.write(`${markdown}\n`);
    return 0;
  }

  const writtenPath = await writeIntroMarkdown(markdown, resolve(process.cwd(), outputPath));
  process.stdout.write(`Wrote Stylyf intro markdown to ${writtenPath}\n`);
  return 0;
}
