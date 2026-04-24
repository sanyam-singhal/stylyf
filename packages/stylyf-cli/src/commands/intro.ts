import { resolve } from "node:path";
import { introKinds, introTopics, renderIntroMarkdown, writeIntroMarkdown, type IntroKind, type IntroTopic } from "../generators/intro.js";

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
      const value = args[index + 1];
      if (!introTopics.includes(value as IntroTopic)) {
        process.stderr.write(`Invalid --topic value. Use one of: ${introTopics.join(", ")}\n`);
        return 1;
      }
      topic = value as IntroTopic;
      index += 1;
      continue;
    }

    if (arg === "--kind") {
      const value = args[index + 1];
      if (!introKinds.includes(value as IntroKind)) {
        process.stderr.write(`Invalid --kind value. Use one of: ${introKinds.join(", ")}\n`);
        return 1;
      }
      kind = value as IntroKind;
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
