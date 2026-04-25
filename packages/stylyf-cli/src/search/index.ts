import {
  backendApiRouteCatalog,
  backendCapabilityCatalog,
  backendEnvCatalog,
  backendServerTemplateCatalog,
  backendSnippetCatalog,
  type BackendCatalogEntry,
} from "../manifests/backend.js";
import { appShellCatalog, layoutCatalog, pageShellCatalog, type CatalogEntry } from "../manifests/catalog.js";
import { appKindCatalog } from "../manifests/kinds.js";
import { patternCatalog } from "../manifests/patterns.js";
import { loadAssemblyRegistry, type AssemblyItem } from "../manifests/index.js";
import { layoutPropContracts, type CompositionPropContract } from "../manifests/props.js";

export type SearchableEntry = {
  id: string;
  label: string;
  kind:
    | "component"
    | "layout"
    | "page-shell"
    | "app-shell"
    | "capability"
    | "server-function"
    | "api-route"
    | "env-block"
    | "backend-snippet"
    | "app-kind"
    | "pattern"
    | "capability"
    | "generated-surface";
  area: string;
  description: string;
  summary: string;
  keywords: string[];
  props?: string[];
  propContracts?: readonly CompositionPropContract[];
  sourcePath?: string;
  importPath?: string;
  composition?: unknown;
  snippet?: string;
  searchText: string;
};

export type SearchResult = {
  id: string;
  label: string;
  kind: SearchableEntry["kind"];
  score: number;
  area: string;
  reason: string[];
  props?: string[];
  propContracts?: readonly CompositionPropContract[];
  importPath?: string;
  sourcePath?: string;
  composition?: unknown;
  summary: string;
  snippet?: string;
};

function tokenize(value: string) {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .map(token => token.trim())
    .filter(Boolean);
}

function toSearchableComponent(item: AssemblyItem): SearchableEntry {
  return {
    id: item.id,
    label: item.label,
    kind: "component",
    area: item.clusterLabel,
    description: item.description,
    summary: item.notes || item.pattern || item.description,
    keywords: item.keywords,
    props: item.props.map(prop => prop.name),
    propContracts: item.props,
    sourcePath: item.sourcePath,
    importPath: item.importPath,
    composition: {
      component: item.slug,
    },
    snippet: item.snippet,
    searchText: item.searchText,
  };
}

function toSearchableCatalog(item: CatalogEntry): SearchableEntry {
  const layoutContract = item.kind === "layout" ? layoutPropContracts[item.id as keyof typeof layoutPropContracts] : undefined;
  const propContracts = (layoutContract?.props ?? []) as readonly CompositionPropContract[];

  return {
    id: item.id,
    label: item.label,
    kind: item.kind,
    area: item.kind === "layout" ? "Layout" : item.kind === "page-shell" ? "Page Shells" : "App Shells",
    description: item.description,
    summary: item.summary,
    keywords: item.keywords,
    props: item.props,
    propContracts,
    composition:
      item.kind === "layout"
        ? {
            layout: item.id,
            props: Object.fromEntries(propContracts.filter(prop => prop.default !== undefined).map(prop => [prop.name, prop.default])),
            children: [],
          }
        : undefined,
    snippet: item.snippet,
    searchText: [item.label, item.description, item.summary, ...item.keywords, ...(item.props ?? [])].join(" ").toLowerCase(),
  };
}

function toSearchableBackend(item: BackendCatalogEntry): SearchableEntry {
  return {
    id: item.id,
    label: item.label,
    kind: item.kind,
    area: item.area,
    description: item.description,
    summary: item.summary,
    keywords: item.keywords,
    props: item.props,
    sourcePath: item.sourcePath,
    snippet: item.snippet,
    searchText: [item.label, item.description, item.summary, ...item.keywords, ...(item.props ?? [])].join(" ").toLowerCase(),
  };
}

function fuzzyScore(queryToken: string, candidateToken: string) {
  if (candidateToken === queryToken) return 14;
  if (candidateToken.startsWith(queryToken)) return 9;
  if (candidateToken.includes(queryToken)) return 6;

  let score = 0;
  let queryIndex = 0;

  for (const char of candidateToken) {
    if (char === queryToken[queryIndex]) {
      queryIndex += 1;
      score += 1;
      if (queryIndex === queryToken.length) {
        return score;
      }
    }
  }

  return 0;
}

function scoreEntry(entry: SearchableEntry, query: string) {
  const queryTokens = tokenize(query);

  if (queryTokens.length === 0) {
    return { score: 0, reason: [] as string[] };
  }

  const haystackTokens = tokenize(entry.searchText);
  let score = 0;
  const reason: string[] = [];

  for (const queryToken of queryTokens) {
    let bestTokenScore = 0;
    let bestToken = "";

    for (const candidateToken of haystackTokens) {
      const tokenScore = fuzzyScore(queryToken, candidateToken);
      if (tokenScore > bestTokenScore) {
        bestTokenScore = tokenScore;
        bestToken = candidateToken;
      }
    }

    score += bestTokenScore;

    if (bestTokenScore >= 14) {
      reason.push(`exact:${queryToken}`);
    } else if (bestTokenScore >= 9) {
      reason.push(`prefix:${queryToken}->${bestToken}`);
    } else if (bestTokenScore > 0) {
      reason.push(`fuzzy:${queryToken}->${bestToken}`);
    }
  }

  if (tokenize(entry.label).some(token => queryTokens.includes(token))) {
    score += 8;
    reason.push("label");
  }

  const keywordHits = entry.keywords.filter(keyword => queryTokens.includes(keyword.toLowerCase())).length;
  if (keywordHits > 0) {
    score += keywordHits * 4;
    reason.push(`keywords:${keywordHits}`);
  }

  const propHits = (entry.props ?? []).filter(prop => queryTokens.includes(prop.toLowerCase())).length;
  if (propHits > 0) {
    score += propHits * 5;
    reason.push(`props:${propHits}`);
  }

  if (entry.kind === "app-kind") {
    score += 18;
    reason.push("app-kind");
  }

  if (entry.kind === "pattern") {
    score += 12;
    reason.push("pattern");
  }

  return { score, reason };
}

export async function buildSearchEntries() {
  const registry = await loadAssemblyRegistry();

  return [
    ...appKindCatalog,
    ...patternCatalog,
    ...registry.map(toSearchableComponent),
    ...appShellCatalog.map(toSearchableCatalog),
    ...pageShellCatalog.map(toSearchableCatalog),
    ...layoutCatalog.map(toSearchableCatalog),
    ...backendCapabilityCatalog.map(toSearchableBackend),
    ...backendServerTemplateCatalog.map(toSearchableBackend),
    ...backendApiRouteCatalog.map(toSearchableBackend),
    ...backendEnvCatalog.map(toSearchableBackend),
    ...backendSnippetCatalog.map(toSearchableBackend),
  ];
}

export async function buildSearchIndex() {
  const entries = await buildSearchEntries();
  const byId = Object.fromEntries(entries.map(entry => [entry.id, entry])) as Record<string, SearchableEntry>;

  return {
    entries,
    byId,
    metadata: {
      generatedAt: new Date().toISOString(),
      count: entries.length,
    },
  };
}

export async function querySearchIndex(query: string, options?: { limit?: number }) {
  const index = await buildSearchIndex();
  const limit = Math.max(1, options?.limit ?? 10);

  return index.entries
    .map(entry => {
      const scored = scoreEntry(entry, query);
      return {
        id: entry.id,
        label: entry.label,
        kind: entry.kind,
        score: scored.score,
        area: entry.area,
        reason: scored.reason,
        props: entry.props,
        propContracts: entry.propContracts,
        importPath: entry.importPath,
        sourcePath: entry.sourcePath,
        composition: entry.composition,
        summary: entry.summary,
        snippet: entry.snippet,
      } satisfies SearchResult;
    })
    .filter(entry => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.label.localeCompare(right.label))
    .slice(0, limit);
}
