import { readFile } from "node:fs/promises";

export type ThemeGrammar = {
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

export type AssemblyItem = {
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

export type BackendManifestIndex = {
  capabilities: string[];
  serverFunctions: string[];
  apiRoutes: string[];
  envBlocks: string[];
  snippets: string[];
};

async function readJsonAsset<T>(relativePath: string): Promise<T> {
  const url = new URL(relativePath, import.meta.url);
  const content = await readFile(url, "utf8");
  return JSON.parse(content) as T;
}

export function loadThemeGrammar() {
  return readJsonAsset<ThemeGrammar>("./generated/theme-grammar.json");
}

export function loadAssemblyRegistry() {
  return readJsonAsset<AssemblyItem[]>("./generated/assembly-registry.json");
}

export function loadBackendManifestIndex() {
  return readJsonAsset<BackendManifestIndex>("./generated/backend-manifests.json");
}
