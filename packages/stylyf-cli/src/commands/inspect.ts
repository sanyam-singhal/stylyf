import { loadAssemblyRegistry } from "../manifests/index.js";

function normalizeKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export async function runInspectCommand(args: string[]) {
  const [kind, id] = args;
  if (kind !== "component" || !id) {
    process.stderr.write("Usage: stylyf inspect component <id-or-slug>\n");
    return 1;
  }

  const registry = await loadAssemblyRegistry();
  const target = normalizeKey(id);
  const item = registry.find(entry =>
    [entry.id, entry.slug, entry.label, entry.importPath].some(alias => normalizeKey(alias) === target),
  );

  if (!item) {
    process.stderr.write(`Unknown component: ${id}\n`);
    return 1;
  }

  process.stdout.write(
    `${JSON.stringify(
      {
        id: item.id,
        label: item.label,
        importPath: item.importPath,
        sourcePath: item.sourcePath,
        props: item.props,
        requiredProps: item.requiredProps,
        slots: item.slots,
        events: item.events,
        controlledState: item.controlledState,
        defaultDataShape: item.defaultDataShape,
        recommendedBindings: item.recommendedBindings,
        a11yNotes: item.a11yNotes,
        compositionExamples: item.compositionExamples,
      },
      null,
      2,
    )}\n`,
  );
  return 0;
}
