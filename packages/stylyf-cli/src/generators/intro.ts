import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { loadAssemblyRegistry, loadThemeGrammar } from "../manifests/index.js";

export type IntroTopic =
  | "overview"
  | "spec"
  | "generic"
  | "internal-tool"
  | "cms-site"
  | "free-saas-tool"
  | "backend"
  | "media"
  | "composition"
  | "generated-output"
  | "full";

export type IntroKind = "generic" | "internal-tool" | "cms-site" | "free-saas-tool";

export const introTopics = [
  "overview",
  "spec",
  "generic",
  "internal-tool",
  "cms-site",
  "free-saas-tool",
  "backend",
  "media",
  "composition",
  "generated-output",
  "full",
] as const satisfies readonly IntroTopic[];

export const introKinds = ["generic", "internal-tool", "cms-site", "free-saas-tool"] as const satisfies readonly IntroKind[];

type IntroOptions = {
  projectPath?: string;
  outputPath?: string;
  topic?: IntroTopic;
  kind?: IntroKind;
};

function codeBlock(content: string, language = "") {
  return ["```" + language, content.trimEnd(), "```"].join("\n");
}

function section(title: string, body: string[]) {
  return [`## ${title}`, "", ...body, ""].join("\n");
}

function specExample(kind: IntroKind) {
  const base = {
    version: "1.0",
    app: {
      name: kind === "cms-site" ? "Field Notes" : kind === "free-saas-tool" ? "Resize Kit" : "Acme Ops",
      kind,
    },
    backend: {
      mode: "portable",
      portable: {
        database: "sqlite",
      },
    },
    media: {
      mode: kind === "free-saas-tool" ? "basic" : "rich",
    },
  };

  if (kind === "generic") {
    return {
      ...base,
      app: {
        name: "Atlas",
        kind,
      },
      objects: [
        {
          name: "records",
          ownership: "user",
          visibility: "private",
          fields: [
            { name: "title", type: "short-text", required: true },
            { name: "status", type: "status", options: ["draft", "active", "archived"] },
            { name: "notes", type: "long-text" },
          ],
        },
      ],
      surfaces: [
        { name: "Home", kind: "dashboard", path: "/", audience: "user" },
        { name: "Records", kind: "list", object: "records", path: "/records", audience: "user" },
        { name: "New Record", kind: "create", object: "records", path: "/records/new", audience: "user" },
      ],
    };
  }

  if (kind === "cms-site") {
    return {
      ...base,
      objects: [
        {
          name: "articles",
          ownership: "user",
          visibility: "mixed",
          fields: [
            { name: "title", type: "short-text", required: true },
            { name: "slug", type: "slug", required: true, unique: true },
            { name: "body", type: "rich-text" },
          ],
        },
      ],
      flows: [{ name: "contentPublishing", object: "articles", kind: "publishing" }],
    };
  }

  if (kind === "free-saas-tool") {
    return {
      ...base,
      flows: [{ name: "savedResults", object: "tool_runs", kind: "saved-results" }],
      surfaces: [
        { name: "Landing", kind: "landing", path: "/", audience: "public" },
        { name: "Tool", kind: "tool", path: "/tool", audience: "public" },
      ],
    };
  }

  return {
    ...base,
    objects: [
      {
        name: "tickets",
        ownership: "user",
        visibility: "private",
        fields: [
          { name: "title", type: "short-text", required: true },
          { name: "priority", type: "status", options: ["low", "medium", "high"] },
          { name: "summary", type: "long-text" },
        ],
      },
    ],
    flows: [{ name: "ticketApproval", object: "tickets", kind: "approval" }],
  };
}

function renderOverview() {
  return [
    "# Stylyf v1.0 Intro",
    "",
    "Stylyf v1.0 is an agent-operated scaffolding compiler for standalone SolidStart apps.",
    "",
    "The public authoring surface is a small `SpecV10`. Stylyf expands that spec into a private app model, builds a generation plan, and emits ordinary source code that has no runtime dependency on this repo or on `@depths/stylyf-cli`.",
    "",
    section("Default Operator Loop", [
      "1. choose an app kind: `generic`, `internal-tool`, `cms-site`, or `free-saas-tool`",
      "2. create a spec with `stylyf new` or write one directly",
      "3. inspect it with `stylyf plan --spec stylyf.spec.json`",
      "4. generate with `stylyf generate --spec stylyf.spec.json --target ./my-app`",
      "5. run the generated app smoke tests and continue inside the emitted source tree",
    ]),
    section("Core Commands", [
      codeBlock(
        [
          "stylyf intro",
          "stylyf intro --kind generic",
          "stylyf intro --topic backend",
          "stylyf new generic --name \"Atlas\" --backend portable --media basic --output stylyf.spec.json",
          "stylyf validate --spec stylyf.spec.json",
          "stylyf plan --spec stylyf.spec.json",
          "stylyf plan --spec stylyf.spec.json --resolved",
          "stylyf compose --base stylyf.spec.json --with route-chunk.json --output stylyf.composed.json",
          "stylyf generate --spec stylyf.spec.json --target ./my-app",
          "stylyf search internal approvals table",
        ].join("\n"),
        "bash",
      ),
    ]),
    section("Backend Modes", [
      "- `portable`: Better Auth + Drizzle + SQLite/Postgres + Tigris/S3-compatible object storage",
      "- `hosted`: Supabase Auth + Supabase data SDK + Tigris/S3-compatible object storage",
      "- portable SQLite is the default local dogfood path",
      "- hosted is the fast managed deployment path",
    ]),
    section("Drill Down", [
      "- `stylyf intro --topic spec` for the v1.0 DSL",
      "- `stylyf intro --topic backend` for backend choices",
      "- `stylyf intro --topic media` for object storage and attachments",
      "- `stylyf intro --topic composition` for additive chunks, explicit routes, and deeper layout/API control",
      "- `stylyf intro --topic generated-output` for emitted app structure",
      "- `stylyf intro --kind generic` for a general full-stack recipe",
      "- `stylyf intro --kind internal-tool` for an internal app recipe",
      "- `stylyf intro --kind cms-site` for a publishing recipe",
      "- `stylyf intro --kind free-saas-tool` for a free tool recipe",
    ]),
  ].join("\n");
}

function renderSpecTopic() {
  return [
    "# Stylyf v1.0 Spec",
    "",
    "The public DSL type is `SpecV10`. Start with app kind, backend mode, `objects`, `flows`, optional `surfaces`, and experience. Drill down only when needed with explicit `sections`, `routes`, `apis`, `server`, `database.schema`, and `env.extras`.",
    "",
    codeBlock(JSON.stringify(specExample("internal-tool"), null, 2), "json"),
    "",
    section("Top-Level Fields", [
      "- `version`: must be `1.0`",
      "- `app`: name, kind, optional description",
      "- `backend`: `portable` or `hosted`",
      "- `media`: `none`, `basic`, or `rich`",
      "- `experience`: theme, mode, radius, density, spacing",
      "- `objects`: intent-level resources",
      "- `flows`: CRUD, approval, publishing, onboarding, or saved-results mechanics",
      "- `surfaces`: optional high-level route hints",
      "- `routes`: explicit route additions or route replacements by path",
      "- `apis`: explicit API route additions",
      "- `server`: explicit query/action module additions",
      "- `database.schema`: extra tables or columns beyond derived resources",
      "- `env.extras`: extra public/server environment variables",
      "- surface kinds include `dashboard`, `list`, `detail`, `create`, `edit`, `settings`, `landing`, `content-index`, `content-detail`, and `tool`",
    ]),
  ].join("\n");
}

function renderKindTopic(kind: IntroKind) {
  const labels = {
    "internal-tool": "Internal Tool",
    generic: "Generic Full-Stack App",
    "cms-site": "CMS Site",
    "free-saas-tool": "Free SaaS Tool",
  };
  const notes = {
    generic: [
      "Default shape: authenticated app shell, reusable resources, dashboard/list/create/settings surfaces, and portable full-stack primitives.",
      "Good when the prompt does not cleanly fit the internal-tool, CMS, or free-SaaS-tool presets.",
    ],
    "internal-tool": [
      "Default shape: authenticated sidebar app, dashboard, resource list/create/edit routes, and settings.",
      "Good for admin panels, back offices, review queues, and operational dashboards.",
    ],
    "cms-site": [
      "Default shape: public content routes plus authenticated admin content management routes.",
      "Good for editorial sites, docs-like publishing, and small content operations.",
    ],
    "free-saas-tool": [
      "Default shape: public landing, tool route, optional saved-results dashboard, and no billing gateway.",
      "Good for funnel tools, calculators, transformers, and lightweight utilities.",
    ],
  } satisfies Record<IntroKind, string[]>;

  return [
    `# Stylyf v1.0: ${labels[kind]}`,
    "",
    ...notes[kind],
    "",
    section("Minimal Spec", [codeBlock(JSON.stringify(specExample(kind), null, 2), "json")]),
    section("Smoke Loop", [
      codeBlock(
        [
          `stylyf validate --spec ${kind}.json`,
          `stylyf plan --spec ${kind}.json`,
          `stylyf generate --spec ${kind}.json --target ./generated-${kind}`,
          `cd ./generated-${kind}`,
          "npm run check",
          "npm run build",
        ].join("\n"),
        "bash",
      ),
    ]),
  ].join("\n");
}

function renderBackendTopic() {
  return [
    "# Stylyf v1.0 Backend",
    "",
    section("Portable", [
      "- Better Auth for sessions and auth routes",
      "- Drizzle ORM for SQLite or Postgres",
      "- SQLite/libsql is the preferred local smoke path",
      "- generated apps include auth, DB, schema, guards, resource policies, server modules, and migration scripts",
    ]),
    section("Hosted", [
      "- Supabase Auth for email/password and email OTP capable flows",
      "- Supabase SDK for data access",
      "- generated apps include SSR-aware Supabase clients, auth routes, callback route, schema SQL, and policy SQL",
    ]),
    section("Shared Storage", [
      "- Tigris/S3-compatible storage through AWS SDK v3",
      "- browser access is presigned URL based",
      "- raw object-storage credentials stay server-side",
    ]),
  ].join("\n");
}

function renderMediaTopic() {
  return [
    "# Stylyf v1.0 Media",
    "",
    "`media.mode` controls whether Stylyf generates object-storage capability and attachment lifecycle code.",
    "",
    section("Modes", [
      "- `none`: no storage or attachment routes",
      "- `basic`: one generic file attachment on media-capable objects",
      "- `rich`: image/document attachments plus metadata tables and lifecycle helpers",
    ]),
    section("Generated Flow", [
      "- create upload intent",
      "- upload directly to S3-compatible storage with a presigned URL",
      "- confirm metadata into the app database",
      "- replace or delete through server-owned routes",
    ]),
  ].join("\n");
}

function renderCompositionTopic() {
  return [
    "# Stylyf v1.0 Composition",
    "",
    "Stylyf is layered. Use a small intent spec first, then add explicit chunks only where the generated defaults are too coarse. Composition is explicit: no directory magic, no hidden globbing.",
    "",
    section("Chunk Workflow", [
      codeBlock(
        [
          "stylyf new generic --name \"Atlas\" --backend portable --media rich --output stylyf.base.json",
          "stylyf compose --base stylyf.base.json --with ui.chunk.json --with backend.chunk.json --output stylyf.spec.json",
          "stylyf validate --spec stylyf.spec.json",
          "stylyf plan --spec stylyf.spec.json --resolved",
          "stylyf generate --spec stylyf.spec.json --target ./atlas",
        ].join("\n"),
        "bash",
      ),
    ]),
    section("UI Chunk", [
      codeBlock(
        JSON.stringify(
          {
            surfaces: [
              {
                name: "Records",
                kind: "list",
                object: "records",
                path: "/records",
                page: "resource-index",
                bindings: [{ kind: "resource.list", resource: "records" }],
                sections: [
                  {
                    id: "records-workspace",
                    layout: "stack",
                    props: { gap: "loose" },
                    children: [
                      { component: "page-header", props: { title: "Records", description: "Review and organize submitted records." } },
                      {
                        layout: "grid",
                        props: { cols: 2 },
                        children: [{ component: "filter-toolbar" }, { component: "bulk-action-bar" }],
                      },
                      { component: "data-table-shell" },
                    ],
                  },
                ],
              },
            ],
            routes: [
              {
                path: "/about",
                shell: "marketing-shell",
                page: "blank",
                sections: [{ layout: "stack", children: [{ component: "page-header", props: { title: "About Atlas" } }, "empty-state"] }],
              },
            ],
          },
          null,
          2,
        ),
        "json",
      ),
    ]),
    section("Backend Chunk", [
      codeBlock(
        JSON.stringify(
          {
            objects: [
              {
                name: "records",
                table: "records",
                access: { list: "owner", read: "owner", create: "user", update: "owner", delete: "owner" },
                media: [{ name: "cover", kind: "image", bucketAlias: "uploads", metadataTable: "record_assets" }],
              },
            ],
            flows: [
              {
                name: "recordReview",
                object: "records",
                kind: "approval",
                field: "status",
                transitions: [
                  { name: "approve", from: "review", to: "approved", actor: "admin", emits: ["records.approved"], notifies: ["owner", "admins"] },
                ],
              },
            ],
            apis: [
              {
                path: "/api/health",
                method: "GET",
                type: "json",
                name: "health",
                auth: "public",
                response: {
                  status: 200,
                  body: {
                    ok: { type: "boolean", required: true },
                    service: { type: "string", required: true },
                  },
                },
              },
            ],
            server: [{ name: "records.stats", type: "query", resource: "records", auth: "user" }],
            env: { extras: [{ name: "PUBLIC_ANALYTICS_ID", exposure: "public", required: false }] },
          },
          null,
          2,
        ),
        "json",
      ),
    ]),
    section("Merge Rules", [
      "- arrays merge by stable keys: object/flow/server names, route paths, API method+path, surface path or surface identity",
      "- object `fields`, `media`, and `relations` merge by name or relation identity",
      "- flow `transitions` merge by transition name",
      "- `database.schema` merges by table and column name",
      "- later chunks override matching earlier chunks",
    ]),
  ].join("\n");
}

function renderGeneratedOutputTopic() {
  return [
    "# Stylyf v1.0 Generated Output",
    "",
    "Generated apps are ordinary SolidStart source trees. They do not import this repo and do not depend on the CLI package at runtime.",
    "",
    section("Core Files", [
      "- `package.json`, `app.config.ts`, `tsconfig.json`, `postcss.config.mjs`",
      "- `src/app.tsx`, `src/app.css`, `src/entry-client.tsx`, `src/entry-server.tsx`",
      "- `src/routes/**` for generated pages and API routes",
      "- `src/lib/**` for auth, env, data, storage, resources, workflows, and guards",
      "- `stylyf.spec.json` and `stylyf.plan.json` for handoff",
    ]),
  ].join("\n");
}

async function renderFullTopic() {
  const [themeGrammar, registry] = await Promise.all([loadThemeGrammar(), loadAssemblyRegistry()]);
  return [
    renderOverview(),
    renderSpecTopic(),
    renderBackendTopic(),
    renderMediaTopic(),
    renderCompositionTopic(),
    renderGeneratedOutputTopic(),
    section("Theme Grammar", [
      `- presets: ${themeGrammar.presets.join(", ")}`,
      `- modes: ${themeGrammar.modes.join(", ")}`,
      `- radii: ${themeGrammar.radii.join(", ")}`,
      `- density: ${themeGrammar.density.join(", ")}`,
      `- spacing: ${themeGrammar.spacing.join(", ")}`,
    ]),
    section("Component Inventory", registry.slice(0, 80).map(item => `- ${item.label} (${item.clusterLabel})`)),
  ].join("\n\n");
}

async function renderProjectNote(projectPath: string | undefined) {
  if (!projectPath) {
    return "";
  }
  try {
    const raw = await readFile(resolve(projectPath, "package.json"), "utf8");
    const parsed = JSON.parse(raw) as { name?: string };
    return `\n\n## Project Snapshot\n\n- path: ${resolve(projectPath)}\n- package: ${parsed.name ?? "unknown"}\n`;
  } catch {
    return `\n\n## Project Snapshot\n\n- path: ${resolve(projectPath)}\n- package: unknown\n`;
  }
}

export async function renderIntroMarkdown(options: IntroOptions = {}) {
  const topic = options.kind ?? options.topic ?? "overview";
  let markdown: string;

  if (topic === "generic" || topic === "internal-tool" || topic === "cms-site" || topic === "free-saas-tool") {
    markdown = renderKindTopic(topic);
  } else if (topic === "overview") {
    markdown = renderOverview();
  } else if (topic === "spec") {
    markdown = renderSpecTopic();
  } else if (topic === "backend") {
    markdown = renderBackendTopic();
  } else if (topic === "media") {
    markdown = renderMediaTopic();
  } else if (topic === "composition") {
    markdown = renderCompositionTopic();
  } else if (topic === "generated-output") {
    markdown = renderGeneratedOutputTopic();
  } else if (topic === "full") {
    markdown = await renderFullTopic();
  } else {
    throw new Error(`Unknown intro topic "${topic}". Use one of: ${introTopics.join(", ")}.`);
  }

  return `${markdown}${await renderProjectNote(options.projectPath)}`.trimEnd();
}

export async function writeIntroMarkdown(markdown: string, outputPath: string) {
  const resolvedOutputPath = resolve(outputPath);
  await mkdir(dirname(resolvedOutputPath), { recursive: true });
  await writeFile(resolvedOutputPath, `${markdown}\n`);
  return resolvedOutputPath;
}
