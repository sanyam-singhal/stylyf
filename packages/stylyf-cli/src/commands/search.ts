import { querySearchIndex } from "../search/index.js";

export async function runSearchCommand(args: string[]) {
  let json = false;
  let limit = 10;
  const queryParts: string[] = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--json") {
      json = true;
      continue;
    }

    if (arg === "--limit") {
      limit = Number(args[index + 1] ?? "10");
      index += 1;
      continue;
    }

    queryParts.push(arg);
  }

  const query = queryParts.join(" ").trim();

  if (!query) {
    process.stderr.write("Search query is required. Example: stylyf search dashboard filters table\n");
    return 1;
  }

  const results = await querySearchIndex(query, { limit: Number.isFinite(limit) ? limit : 10 });

  if (json) {
    process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);
    return 0;
  }

  if (results.length === 0) {
    process.stdout.write(`No results for: ${query}\n`);
    return 0;
  }

  process.stdout.write(
    `${results
      .map(
        result =>
          [
            `${result.label} [${result.kind}]`,
            `  area: ${result.area}`,
            `  score: ${result.score}`,
            `  reason: ${result.reason.join(", ") || "match"}`,
            result.props?.length ? `  props: ${result.props.join(", ")}` : undefined,
            result.propContracts?.length
              ? `  prop contracts: ${result.propContracts.map(prop => `${prop.name}:${prop.type}`).join(", ")}`
              : undefined,
            result.importPath ? `  import: ${result.importPath}` : undefined,
            result.sourcePath ? `  source: ${result.sourcePath}` : undefined,
            result.composition ? `  composition:\n${JSON.stringify(result.composition, null, 2).split("\n").map(line => `    ${line}`).join("\n")}` : undefined,
            `  summary: ${result.summary}`,
            result.snippet ? `  snippet:\n${result.snippet.split("\n").map(line => `    ${line}`).join("\n")}` : undefined,
          ]
            .filter(Boolean)
            .join("\n"),
      )
      .join("\n\n")}\n`,
  );

  return 0;
}
