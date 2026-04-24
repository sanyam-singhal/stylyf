import { resolve } from "node:path";
import { renderIntroMarkdown, writeIntroMarkdown, type IntroKind, type IntroTopic } from "../generators/intro.js";

export async function runIntroCommand(args: string[]) {
  let projectPath: string | undefined;
  let outputPath: string | undefined;
  let topic: IntroTopic | undefined;
  let kind: IntroKind | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--project") {
      projectPath = args[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--output") {
      outputPath = args[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--topic") {
      topic = args[index + 1] as IntroTopic | undefined;
      index += 1;
      continue;
    }

    if (arg === "--kind") {
      kind = args[index + 1] as IntroKind | undefined;
      index += 1;
    }
  }

  const markdown = await renderIntroMarkdown({
    projectPath: projectPath ? resolve(process.cwd(), projectPath) : undefined,
    outputPath: outputPath ? resolve(process.cwd(), outputPath) : undefined,
    topic,
    kind,
  });

  if (!outputPath) {
    process.stdout.write(`${markdown}\n`);
    return 0;
  }

  const writtenPath = await writeIntroMarkdown(markdown, resolve(process.cwd(), outputPath));
  process.stdout.write(`Wrote Stylyf intro markdown to ${writtenPath}\n`);
  return 0;
}
