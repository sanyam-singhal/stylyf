import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  componentFilePath,
  componentImportPath,
  registryItems,
  type RegistryItem,
} from "../src/lib/registry.ts";
import { defaultThemeState, themePresets } from "../src/lib/theme-system.ts";

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
  snippet: string;
  keywords: string[];
  searchText: string;
};

const rootDir = dirname(fileURLToPath(import.meta.url));
const repoDir = resolve(rootDir, "..");
const outputDir = resolve(repoDir, "packages/stylyf-cli/src/manifests/generated");
const appCssPath = resolve(repoDir, "src/app.css");

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

async function assemblyItemFor(item: RegistryItem): Promise<AssemblyItem> {
  const sourcePath = componentFilePath(item);
  const absoluteSourcePath = resolve(repoDir, sourcePath);
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

  await writeFile(resolve(outputDir, "theme-grammar.json"), `${JSON.stringify(themeGrammar, null, 2)}\n`);
  await writeFile(resolve(outputDir, "assembly-registry.json"), `${JSON.stringify(assemblyRegistry, null, 2)}\n`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
