import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { composeSpecFragments } from "../spec/compose.js";

async function readJson(path: string) {
  return JSON.parse(await readFile(path, "utf8")) as unknown;
}

export async function runComposeCommand(args: string[]) {
  let basePath: string | undefined;
  let outputPath: string | undefined;
  let explain = false;
  const fragmentPaths: string[] = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--base") {
      basePath = args[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--with") {
      fragmentPaths.push(args[index + 1]);
      index += 1;
      continue;
    }

    if (arg === "--output") {
      outputPath = args[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--explain") {
      explain = true;
      continue;
    }
  }

  if (!basePath) {
    process.stderr.write("Missing required option: --base <path>\n");
    return 1;
  }

  if (fragmentPaths.length === 0) {
    process.stderr.write("Missing required option: --with <path>. Provide one or more additive spec fragments.\n");
    return 1;
  }

  if (!outputPath) {
    process.stderr.write("Missing required option: --output <path>\n");
    return 1;
  }

  const resolvedBasePath = resolve(process.cwd(), basePath);
  const resolvedFragmentPaths = fragmentPaths.map(path => resolve(process.cwd(), path));
  const resolvedOutputPath = resolve(process.cwd(), outputPath);
  const base = await readJson(resolvedBasePath);
  const fragments = await Promise.all(resolvedFragmentPaths.map(readJson));
  const composed = composeSpecFragments(base, fragments);

  await mkdir(dirname(resolvedOutputPath), { recursive: true });
  await writeFile(resolvedOutputPath, `${JSON.stringify(composed, null, 2)}\n`);

  process.stdout.write(
    [
      "Composed Stylyf spec",
      `  base: ${resolvedBasePath}`,
      ...resolvedFragmentPaths.map(path => `  with: ${path}`),
      `  output: ${resolvedOutputPath}`,
      `  objects: ${composed.objects?.length ?? 0}`,
      `  surfaces: ${composed.surfaces?.length ?? 0}`,
      `  routes: ${composed.routes?.length ?? 0}`,
      `  apis: ${composed.apis?.length ?? 0}`,
      `  server modules: ${composed.server?.length ?? 0}`,
      explain ? "  explain: later chunks override arrays by stable keys such as route path, API method+path, object name, and server module name." : undefined,
    ].join("\n") + "\n",
  );

  return 0;
}
