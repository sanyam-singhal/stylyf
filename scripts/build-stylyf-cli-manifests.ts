import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  componentFilePath,
  componentImportPath,
  registryItems,
  type RegistryItem,
} from "../packages/stylyf-source/src/lib/registry.ts";
import {
  backendApiRouteCatalog,
  backendCapabilityCatalog,
  backendEnvCatalog,
  backendServerTemplateCatalog,
  backendSnippetCatalog,
} from "../packages/stylyf-cli/src/manifests/backend.ts";
import {
  componentPropContractsFromInventory,
  type CompositionPropContract,
} from "../packages/stylyf-cli/src/manifests/props.ts";
import { defaultThemeState, themePresets } from "../packages/stylyf-source/src/lib/theme-system.ts";

type ThemeGrammar = {
  presets: string[];
  modes: string[];
  radii: string[];
  density: string[];
  spacing: string[];
  tokenGroups: {
    colors: string[];
    surfaces: string[];
    motion: string[];
    sizing: string[];
  };
  fontRoles: ["fancy", "sans", "mono"];
  defaults: {
    preset: string;
    mode: string;
    radius: string;
    density: string;
    spacing: string;
  };
  fonts: {
    fancy: string;
    sans: string;
    mono: string;
  };
};

type AssemblyItem = {
  id: string;
  slug: string;
  label: string;
  kind: "component";
  clusterId: string;
  clusterLabel: string;
  tierId: string;
  tierLabel: string;
  description: string;
  pattern: string;
  styleParams: string[];
  stateParams: string[];
  notes: string;
  registryShape: string;
  sourcePath: string;
  importPath: string;
  exportName: string;
  clusterDirectory: string;
  localDependencies: string[];
  props: CompositionPropContract[];
  requiredProps: string[];
  slots: string[];
  events: string[];
  controlledState: string[];
  defaultDataShape: Record<string, unknown>;
  recommendedBindings: string[];
  a11yNotes: string[];
  compositionExamples: string[];
  snippet: string;
  keywords: string[];
  searchText: string;
};

const rootDir = dirname(fileURLToPath(import.meta.url));
const repoDir = resolve(rootDir, "..");
const sourcePackageDir = resolve(repoDir, "packages/stylyf-source");
const outputDir = resolve(repoDir, "packages/stylyf-cli/src/manifests/generated");
const appCssPath = resolve(sourcePackageDir, "src/app.css");

function unique(values: string[]) {
  return [...new Set(values)];
}

function componentSymbol(name: string) {
  return name.replace(/[^a-zA-Z0-9]/g, "");
}

function splitKeywords(value: string) {
  return value
    .split(/[^a-zA-Z0-9]+/g)
    .map(entry => entry.trim().toLowerCase())
    .filter(Boolean);
}

function matchAllValues(pattern: RegExp, source: string) {
  return unique([...source.matchAll(pattern)].map(match => match[1]));
}

function extractThemeGrammar(appCss: string): ThemeGrammar {
  const themePresetIds = matchAllValues(/data-theme-preset="([^"]+)"/g, appCss);
  const radii = matchAllValues(/data-radius="([^"]+)"/g, appCss);
  const density = unique(["comfortable", "compact", "relaxed", ...matchAllValues(/data-density="([^"]+)"/g, appCss)]);
  const spacing = matchAllValues(/data-spacing="([^"]+)"/g, appCss);

  const colorTokens = matchAllValues(/--color-([a-z0-9-]+):/g, appCss);
  const surfaceTokens = unique(
    colorTokens.filter(token =>
      ["background", "card", "popover", "panel", "muted", "highlight", "ink", "accent"].some(prefix =>
        token.startsWith(prefix),
      ),
    ),
  );
  const motionTokens = matchAllValues(/--duration-([a-z0-9-]+):/g, appCss).map(token => `duration-${token}`);
  const sizingTokens = unique(
    matchAllValues(/--([a-z0-9-]+):/g, appCss).filter(token =>
      ["header-height", "control-height", "control-padding-x", "space-", "section-gap", "radius"].some(prefix =>
        token.startsWith(prefix),
      ),
    ),
  );

  const sansMatch = appCss.match(/--font-sans:\s*"([^"]+)"/);
  const monoMatch = appCss.match(/--font-mono:\s*"([^"]+)"/);

  return {
    presets: themePresetIds.length ? themePresetIds : themePresets.map(preset => preset.id),
    modes: ["light", "dark", "system"],
    radii,
    density,
    spacing,
    tokenGroups: {
      colors: colorTokens,
      surfaces: surfaceTokens,
      motion: motionTokens,
      sizing: sizingTokens,
    },
    fontRoles: ["fancy", "sans", "mono"],
    defaults: {
      preset: defaultThemeState.preset,
      mode: defaultThemeState.mode,
      radius: defaultThemeState.radius,
      density: defaultThemeState.density,
      spacing: defaultThemeState.spacing,
    },
    fonts: {
      fancy: "Fraunces Variable",
      sans: sansMatch?.[1] ?? "Manrope Variable",
      mono: monoMatch?.[1] ?? "IBM Plex Mono",
    },
  };
}

function snippetForSource(source: string) {
  return source
    .split("\n")
    .slice(0, 36)
    .join("\n")
    .trim();
}

function localDependenciesForSource(source: string) {
  return unique(
    [...source.matchAll(/from\s+["'](~\/(?:components|lib)\/[^"']+)["']/g)].map(match => match[1]).sort(),
  );
}

function slotsForSource(source: string) {
  const slots = new Set<string>();
  if (source.includes("children")) slots.add("children");
  for (const slot of ["actions", "icon", "header", "footer", "trigger", "content", "label", "description"]) {
    if (source.includes(slot)) slots.add(slot);
  }
  return [...slots].sort();
}

function eventsForContracts(props: CompositionPropContract[]) {
  return props
    .map(prop => prop.name)
    .filter(name => /^on[A-Z]/.test(name))
    .sort();
}

function controlledStateForItem(item: RegistryItem, props: CompositionPropContract[]) {
  const propNames = new Set(props.map(prop => prop.name));
  return unique([
    ...item.stateParams.filter(state => propNames.has(state) || propNames.has(`default${state[0]?.toUpperCase() ?? ""}${state.slice(1)}`)),
    ...props.map(prop => prop.name).filter(name => ["value", "open", "checked", "pressed", "selected", "page"].includes(name)),
  ]).sort();
}

function defaultDataShapeForItem(item: RegistryItem, props: CompositionPropContract[]) {
  const shape: Record<string, unknown> = {};
  if (item.slug.includes("table") || item.slug.includes("list") || item.slug.includes("feed")) {
    shape.items = [{ id: "sample-id", title: "Sample item", status: "draft" }];
  }
  if (item.slug.includes("form") || item.clusterId.includes("form")) {
    shape.values = Object.fromEntries(props.filter(prop => prop.default !== undefined).map(prop => [prop.name, prop.default]));
    shape.errors = {};
  }
  if (item.slug.includes("chart") || item.slug.includes("stat")) {
    shape.metrics = [{ label: "Sample", value: 1 }];
  }
  return shape;
}

function recommendedBindingsForItem(item: RegistryItem) {
  const bindings = new Set<string>();
  const haystack = `${item.clusterLabel} ${item.name} ${item.description} ${item.pattern}`.toLowerCase();
  if (/(table|list|feed|pagination|data|metric|stat)/.test(haystack)) bindings.add("resource.list");
  if (/(detail|profile|preview|card)/.test(haystack)) bindings.add("resource.detail");
  if (/(form|create|upload|input)/.test(haystack)) bindings.add("resource.create");
  if (/(edit|settings|toggle|switch)/.test(haystack)) bindings.add("resource.update");
  if (/(workflow|approval|step|status)/.test(haystack)) bindings.add("workflow.transition");
  if (/(upload|file|media|image|asset)/.test(haystack)) bindings.add("attachment.lifecycle");
  return [...bindings].sort();
}

function a11yNotesForItem(item: RegistryItem, source: string) {
  const notes = new Set<string>();
  if (/aria-|role=|label/i.test(source)) notes.add("Includes explicit ARIA/role/label semantics in source.");
  if (/button|input|select|textarea/i.test(item.name + source)) notes.add("Preserve native keyboard and focus behavior when composing.");
  if (/dialog|popover|drawer|menu|combobox|tooltip/i.test(item.name)) notes.add("Review focus management and escape/blur interactions in context.");
  if (item.notes) notes.add(item.notes);
  return [...notes];
}

async function assemblyItemFor(item: RegistryItem): Promise<AssemblyItem> {
  const sourcePath = componentFilePath(item);
  const absoluteSourcePath = resolve(sourcePackageDir, sourcePath);
  const source = await readFile(absoluteSourcePath, "utf8");
  const clusterDirectory = sourcePath.split("/").slice(-2, -1)[0] ?? item.clusterId;
  const keywords = unique(
    [
      item.name,
      item.description,
      item.pattern,
      item.notes,
      item.clusterLabel,
      item.tierLabel,
      ...item.styleParams,
      ...item.stateParams,
    ].flatMap(splitKeywords),
  ).sort();
  const props = componentPropContractsFromInventory(item, source);

  return {
    id: `${clusterDirectory}/${item.slug}`,
    slug: item.slug,
    label: item.name,
    kind: "component",
    clusterId: item.clusterId,
    clusterLabel: item.clusterLabel,
    tierId: item.tierId,
    tierLabel: item.tierLabel,
    description: item.description,
    pattern: item.pattern,
    styleParams: item.styleParams,
    stateParams: item.stateParams,
    notes: item.notes,
    registryShape: item.registryShape,
    sourcePath,
    importPath: componentImportPath(item),
    exportName: componentSymbol(item.name),
    clusterDirectory,
    localDependencies: localDependenciesForSource(source),
    props,
    requiredProps: props.filter(prop => prop.required).map(prop => prop.name),
    slots: slotsForSource(source),
    events: eventsForContracts(props),
    controlledState: controlledStateForItem(item, props),
    defaultDataShape: defaultDataShapeForItem(item, props),
    recommendedBindings: recommendedBindingsForItem(item),
    a11yNotes: a11yNotesForItem(item, source),
    compositionExamples: [
      JSON.stringify({
        component: item.slug,
        props: Object.fromEntries(props.filter(prop => prop.default !== undefined).map(prop => [prop.name, prop.default])),
      }),
    ],
    snippet: snippetForSource(source),
    keywords,
    searchText: [
      item.name,
      item.description,
      item.pattern,
      item.notes,
      item.clusterLabel,
      item.tierLabel,
      ...item.styleParams,
      ...item.stateParams,
      ...keywords,
    ]
      .join(" ")
      .toLowerCase(),
  };
}

async function main() {
  await mkdir(outputDir, { recursive: true });
  const appCss = await readFile(appCssPath, "utf8");
  const themeGrammar = extractThemeGrammar(appCss);
  const assemblyRegistry = await Promise.all(registryItems.map(item => assemblyItemFor(item)));
  const backendManifestIndex = {
    capabilities: backendCapabilityCatalog.map(entry => entry.id),
    serverFunctions: backendServerTemplateCatalog.map(entry => entry.id),
    apiRoutes: backendApiRouteCatalog.map(entry => entry.id),
    envBlocks: backendEnvCatalog.map(entry => entry.id),
    snippets: backendSnippetCatalog.map(entry => entry.id),
  };

  await writeFile(resolve(outputDir, "theme-grammar.json"), `${JSON.stringify(themeGrammar, null, 2)}\n`);
  await writeFile(resolve(outputDir, "assembly-registry.json"), `${JSON.stringify(assemblyRegistry, null, 2)}\n`);
  await writeFile(resolve(outputDir, "backend-manifests.json"), `${JSON.stringify(backendManifestIndex, null, 2)}\n`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
