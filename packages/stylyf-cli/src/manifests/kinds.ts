import type { SearchableEntry } from "../search/index.js";

export const appKindCatalog: SearchableEntry[] = [
  {
    id: "kind-internal-tool",
    label: "Internal Tool",
    kind: "app-kind",
    area: "v0.4 App Kinds",
    description: "Authenticated operational app with dashboard, resource management, settings, and workflow surfaces.",
    summary: "Best for admin panels, back offices, review queues, resource CRUD, and internal dashboards.",
    keywords: ["internal", "tool", "admin", "ops", "approval", "table", "dashboard", "settings", "resource"],
    snippet: "stylyf new internal-tool --name \"Acme Ops\" --backend portable --media rich --output stylyf.spec.json",
    searchText: "internal tool admin ops approval table dashboard settings resource back office",
  },
  {
    id: "kind-cms-site",
    label: "CMS Site",
    kind: "app-kind",
    area: "v0.4 App Kinds",
    description: "Public content routes plus authenticated editorial management surfaces.",
    summary: "Best for publishing systems, docs-like sites, content operations, articles, pages, and media libraries.",
    keywords: ["cms", "site", "publishing", "articles", "pages", "editorial", "media", "public", "admin"],
    snippet: "stylyf new cms-site --name \"Field Notes\" --backend portable --media rich --output stylyf.spec.json",
    searchText: "cms site publishing articles pages editorial media public admin content",
  },
  {
    id: "kind-free-saas-tool",
    label: "Free SaaS Tool",
    kind: "app-kind",
    area: "v0.4 App Kinds",
    description: "A public tool surface with optional saved results and no billing gateway.",
    summary: "Best for small funnel tools, utilities, calculators, transformers, and lightweight saved-result apps.",
    keywords: ["free", "saas", "tool", "utility", "saved", "results", "landing", "dashboard", "no billing"],
    snippet: "stylyf new free-saas-tool --name \"Resize Kit\" --backend portable --media basic --output stylyf.spec.json",
    searchText: "free saas tool utility saved results landing dashboard no billing payment",
  },
];
