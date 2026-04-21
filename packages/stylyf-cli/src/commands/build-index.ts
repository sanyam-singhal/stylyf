import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { buildSearchIndex } from "../search/index.js";

export async function runBuildIndexCommand(args: string[]) {
  const outputIndex = args.findIndex(arg => arg === "--output");
  const outputPath = outputIndex >= 0 ? args[outputIndex + 1] : "stylyf-search-index.json";
  const resolved = resolve(process.cwd(), outputPath);
  const index = await buildSearchIndex();

  await mkdir(dirname(resolved), { recursive: true });
  await writeFile(resolved, `${JSON.stringify(index, null, 2)}\n`);

  process.stdout.write(`Wrote search index (${index.metadata.count} entries) to ${resolved}\n`);
  return 0;
}

