import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { listAppShellTemplates, listLayoutTemplates, listPageShellTemplates } from "./templates.js";
import { loadAssemblyRegistry, loadThemeGrammar } from "../manifests/index.js";
import { appIrSchema } from "../ir/schema.js";

type ProjectSnapshot = {
  packageName?: string;
  packageManager?: string;
  projectPath: string;
  routeFiles: string[];
  appShellFiles: string[];
  pageShellFiles: string[];
  layoutFiles: string[];
  registryFiles: string[];
  hasAppCss: boolean;
  hasThemeSystem: boolean;
};

export type IntroTopic =
  | "overview"
  | "dsl"
  | "portable"
  | "hosted"
  | "components"
  | "examples"
  | "generated-output"
  | "full";

type IntroOptions = {
  projectPath?: string;
  outputPath?: string;
  topic?: IntroTopic;
};

function isIntroTopic(value: string | undefined): value is IntroTopic {
  return (
    value === "overview" ||
    value === "dsl" ||
    value === "portable" ||
    value === "hosted" ||
    value === "components" ||
    value === "examples" ||
    value === "generated-output" ||
    value === "full"
  );
}

async function pathExists(path: string) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function walkFiles(rootPath: string): Promise<string[]> {
  if (!(await pathExists(rootPath))) {
    return [];
  }

  const entries = await readdir(rootPath, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async entry => {
      const entryPath = resolve(rootPath, entry.name);
      if (entry.isDirectory()) {
        return walkFiles(entryPath);
      }

      return [entryPath];
    }),
  );

  return files.flat().sort((left, right) => left.localeCompare(right));
}

async function readPackageName(projectPath: string) {
  const packageJsonPath = resolve(projectPath, "package.json");
  if (!(await pathExists(packageJsonPath))) {
    return {};
  }

  try {
    const raw = await readFile(packageJsonPath, "utf8");
    const parsed = JSON.parse(raw) as { name?: string; packageManager?: string };
    return {
      packageName: parsed.name,
      packageManager: parsed.packageManager,
    };
  } catch {
    return {};
  }
}

async function snapshotProject(projectPath: string): Promise<ProjectSnapshot> {
  const resolvedProjectPath = resolve(projectPath);
  const packageInfo = await readPackageName(resolvedProjectPath);
  const routeFiles = (await walkFiles(resolve(resolvedProjectPath, "src/routes"))).filter(file => /\.(t|j)sx?$/.test(file));
  const appShellFiles = (await walkFiles(resolve(resolvedProjectPath, "src/components/shells/app"))).filter(file => /\.tsx?$/.test(file));
  const pageShellFiles = (await walkFiles(resolve(resolvedProjectPath, "src/components/shells/page"))).filter(file => /\.tsx?$/.test(file));
  const layoutFiles = (await walkFiles(resolve(resolvedProjectPath, "src/components/layout"))).filter(file => /\.tsx?$/.test(file));
  const registryFiles = (await walkFiles(resolve(resolvedProjectPath, "src/components/registry"))).filter(file => /\.tsx?$/.test(file));

  return {
    ...packageInfo,
    projectPath: resolvedProjectPath,
    routeFiles: routeFiles.map(file => relative(resolvedProjectPath, file)),
    appShellFiles: appShellFiles.map(file => relative(resolvedProjectPath, file)),
    pageShellFiles: pageShellFiles.map(file => relative(resolvedProjectPath, file)),
    layoutFiles: layoutFiles.map(file => relative(resolvedProjectPath, file)),
    registryFiles: registryFiles.map(file => relative(resolvedProjectPath, file)),
    hasAppCss: await pathExists(resolve(resolvedProjectPath, "src/app.css")),
    hasThemeSystem: await pathExists(resolve(resolvedProjectPath, "src/lib/theme-system.ts")),
  };
}

function bulletList(items: string[], indent = "") {
  if (items.length === 0) {
    return `${indent}- none`;
  }

  return items.map(item => `${indent}- ${item}`).join("\n");
}

function codeBlock(content: string, language = "") {
  return ["```" + language, content.trimEnd(), "```"].join("\n");
}

function compactCodeBlock(value: unknown) {
  return codeBlock(JSON.stringify(value, null, 2), "json");
}

function section(title: string, body: Array<string | undefined>) {
  return [`## ${title}`, "", ...body.filter(Boolean), ""];
}

function subsection(title: string, body: Array<string | undefined>) {
  return [`### ${title}`, "", ...body.filter(Boolean), ""];
}

function renderOverviewTopic(context: IntroContext) {
  const { themeGrammar, schemaSummary } = context;
  return [
    "# Stylyf Intro",
    "",
    "Stylyf is a JSON-driven full-stack assembly line for SolidStart. The default operator flow is: pick one backend path, describe the app in shallow JSON, generate a real source tree, and keep iterating in the emitted app like a normal codebase.",
    "",
    ...section("Two Backend Paths", [
      "- `portable`: Better Auth + Drizzle + PostgreSQL/SQLite + S3-compatible storage",
      "- `hosted`: Supabase auth + Supabase data SDK + Tigris-friendly S3 storage",
      "- storage remains presigned-URL based in both modes, so browser code never receives raw object-storage credentials",
    ]),
    ...section("When To Choose Each Path", [
      "- choose `portable` when you want provider-agnostic auth/data control, Better Auth plugins, Drizzle schema ownership, or easy SQLite local development",
      "- choose `hosted` when you want the fastest managed deployment path and are comfortable treating Supabase as both the auth and data platform",
      "- choose `portable + sqlite` for the quickest local backend iteration loop",
      "- choose `hosted + supabase + tigris` for the fastest managed deployment path",
    ]),
    ...section("Minimal Operator Workflow", [
      "1. choose a backend path",
      "2. sketch the app with `name`, `shell`, `theme`, and `routes`",
      "3. add `resources` and `workflows` when you want resource-driven app mechanics",
      "4. validate the IR",
      "5. generate the app into a clean target directory",
      "6. move into the emitted app and iterate there",
    ]),
    ...section("Canonical Starting Points", [
      "- portable example: `packages/stylyf-cli/examples/atlas-dashboard-v0.3-local.json`",
      "- hosted example: `packages/stylyf-cli/examples/atlas-dashboard-v0.3-supabase.json`",
      "- shells: " + schemaSummary.shells.join(", "),
      "- page shells: " + schemaSummary.pageShells.join(", "),
      "- layouts: " + schemaSummary.layouts.join(", "),
    ]),
    ...section("Theme Defaults", [
      `Default generated theme: \`${themeGrammar.defaults.mode} + ${themeGrammar.defaults.preset} + ${themeGrammar.defaults.radius} + ${themeGrammar.defaults.density} + ${themeGrammar.defaults.spacing}\``,
      `Available presets: ${themeGrammar.presets.join(", ")}`,
      `Available radii: ${themeGrammar.radii.join(", ")}`,
      `Available density: ${themeGrammar.density.join(", ")}`,
      `Available spacing: ${themeGrammar.spacing.join(", ")}`,
    ]),
    ...section("Core Commands", [
      codeBlock(
        [
          "stylyf intro",
          "stylyf intro --topic dsl",
          "stylyf validate --ir app.core.json --ir backend.portable.json --ir routes.json",
          "stylyf generate --ir app.core.json --ir backend.portable.json --ir routes.json --target ./my-app",
          "stylyf search dashboard filters table",
        ].join("\n"),
        "bash",
      ),
    ]),
    ...section("Drill Down", [
      "- `stylyf intro --topic dsl` for the IR contract",
      "- `stylyf intro --topic portable` for Better Auth + Drizzle + Tigris",
      "- `stylyf intro --topic hosted` for Supabase + Tigris",
      "- `stylyf intro --topic components` for the bundled component inventory",
      "- `stylyf intro --topic examples` for canonical and reference example files",
      "- `stylyf intro --topic generated-output` for the generated app shape",
      "- `stylyf intro --topic full` for the full reference view",
    ]),
  ];
}

function renderDslTopic(context: IntroContext) {
  const { themeGrammar, schemaSummary } = context;
  return [
    "# Stylyf Intro: DSL",
    "",
    "Stylyf keeps a full `AppIR` as the internal generation contract. As an operator, you can now compose that final app from one or many explicit IR fragments passed in order with repeated `--ir` flags.",
    "",
    ...section("Root Shape", [
      compactCodeBlock({
        type: "AppIR",
        properties: {
          name: "string",
          shell: schemaSummary.shells,
          theme: {
            preset: themeGrammar.presets,
            mode: themeGrammar.modes,
            radius: themeGrammar.radii,
            density: themeGrammar.density,
            spacing: themeGrammar.spacing,
            fonts: {
              fancy: "string",
              sans: "string",
              mono: "string",
            },
          },
          env: {
            extras: [{ name: "string", exposure: "server | public", required: "boolean", example: "string" }],
          },
          database: {
            provider: ["drizzle", "supabase"],
            dialect: ["postgres", "sqlite", "(omit for supabase)"],
            migrations: ["drizzle-kit", "(omit for supabase)"],
            schema: "DatabaseSchemaIR[]",
          },
          resources: "ResourceIR[]",
          workflows: "WorkflowIR[]",
          auth: {
            provider: ["better-auth", "supabase"],
            mode: ["session"],
            features: { emailPassword: "boolean", emailOtp: "boolean", magicLink: "boolean" },
            protect: "AuthProtectionIR[]",
          },
          storage: {
            provider: ["s3"],
            mode: ["presigned-put"],
            bucketAlias: "string",
          },
          apis: "ApiRouteIR[]",
          server: "ServerModuleIR[]",
          routes: [
            {
              path: "string",
              shell: `${schemaSummary.shells.join(" | ")} (optional override)`,
              page: schemaSummary.pageShells,
              title: "string (optional)",
              resource: "string (for resource-create/resource-edit)",
              sections: "SectionIR[]",
            },
          ],
        },
      }),
    ]),
    ...section("Section And Layout Nodes", [
      compactCodeBlock({
        type: "SectionIR",
        shape: {
          id: "string (optional)",
          layout: schemaSummary.layouts,
          children: [
            "string component shorthand",
            {
              component: "string",
              variant: "string (optional)",
              props: { anyProp: "any JSON-serializable value" },
              items: [{ anyItemShape: "array data for components that accept items" }],
            },
            {
              layout: schemaSummary.layouts,
              props: { anyLayoutProp: "string | number | boolean" },
              children: ["recursive child nodes"],
            },
          ],
        },
      }),
    ]),
    ...section("Composition Rules", [
      "- `shell` sets the default app shell for all routes",
      "- each route must choose a `page` shell",
      "- each route contains one or more `sections`",
      "- each section starts with one layout wrapper",
      "- child nodes can be component strings, component objects, or nested layout objects",
      "- string component children are shorthand for `{ \"component\": \"...\" }`",
      "- use `props` when a component or layout needs named values",
      "- use `items` when a component expects repeatable data collections",
      "- add `database`, `auth`, `storage`, `apis`, and `server` only when the app actually needs those backend capabilities",
      "- add `resources` and `workflows` when you want Stylyf's generalized app-mechanics layer instead of only raw backend primitives",
      "- `auth.protect` supplies default protection rules for generated routes, API routes, and server modules",
      "- for API routes and server modules, an explicit `auth` field on the item overrides any matching `auth.protect` entry",
    ]),
    ...section("Additive Composition", [
      "Stylyf does not require one giant JSON file. You can compose the final app from several explicit fragments in CLI argument order.",
      codeBlock(
        [
          "stylyf validate \\",
          "  --ir app.core.json \\",
          "  --ir backend.portable.json \\",
          "  --ir resources.json \\",
          "  --ir routes.json \\",
          "  --print-resolved",
        ].join("\n"),
        "bash",
      ),
      compactCodeBlock({
        "app.core.json": {
          name: "Atlas",
          shell: "sidebar-app",
          theme: {
            preset: "opal",
            mode: "light",
            radius: "trim",
            density: "comfortable",
            spacing: "tight",
            fonts: {
              fancy: "Fraunces",
              sans: "Manrope",
              mono: "IBM Plex Mono",
            },
          },
        },
        "backend.portable.json": {
          database: { dialect: "sqlite", migrations: "drizzle-kit" },
          auth: { provider: "better-auth", mode: "session", features: { emailPassword: true } },
          storage: { provider: "s3", mode: "presigned-put", bucketAlias: "uploads" },
        },
      }),
    ]),
    ...section("v0.3 Resource And Workflow DSL", [
      "The v0.3 surface stays broad across app types. It describes generalized app mechanics instead of product-genre language.",
      compactCodeBlock({
        resources: [
          {
            name: "records",
            visibility: "mixed",
            fields: [
              { name: "title", type: "varchar", required: true },
              { name: "status", type: "enum", enumValues: ["draft", "review", "published"] },
            ],
            ownership: { model: "user", ownerField: "owner_id" },
            access: {
              list: "owner-or-public",
              read: "owner-or-public",
              create: "user",
              update: "owner",
              delete: "owner",
            },
            relations: [{ target: "profiles", kind: "belongs-to", field: "owner_id" }],
            attachments: [{ name: "coverImage", kind: "image" }],
            workflow: "recordLifecycle",
          },
        ],
        workflows: [
          {
            name: "recordLifecycle",
            resource: "records",
            field: "status",
            initial: "draft",
            states: ["draft", "review", "published"],
            transitions: [
              {
                name: "submitForReview",
                from: "draft",
                to: "review",
                actor: "owner",
                emits: ["record.submitted"],
                notifies: ["owner", "admins"],
              },
            ],
          },
        ],
      }),
    ]),
    ...section("Mechanics Semantics", [
      "- `resources`: generalized app entities that Stylyf maps to schema, CRUD surfaces, route shells, and generated server modules",
      "- `ownership`: whether a resource is unowned, user-owned, or workspace-owned",
      "- `access`: broad policy presets for list/read/create/update/delete surfaces",
      "- `relations`: explicit links between resources without forcing a deep ORM-specific DSL into the top-level IR",
      "- `attachments`: generalized file/media attachment declarations on top of the shared S3/Tigris substrate",
      "- `workflows`: state machines for approvals, publishing, onboarding, or other repeatable transitions",
      "- `transitions.emits`: event names that Stylyf maps to event-log records and notification fan-out",
      "- `transitions.notifies`: notification audiences kept broad so they fit internal apps as well as customer-facing products",
    ]),
    ...section("Supported Vocabulary", [
      "- ownership models: `none`, `user`, `workspace`",
      "- access presets: `public`, `user`, `owner`, `owner-or-public`, `workspace-member`, `admin`",
      "- visibility presets: `private`, `public`, `mixed`",
      "- relation kinds: `belongs-to`, `has-many`, `many-to-many`",
      "- attachment kinds: `file`, `image`, `video`, `audio`, `document`",
      "- workflow notification audiences: `owner`, `workspace`, `watchers`, `admins`",
      "- note: the `admin` access preset is reserved for explicit role-aware customization; generated defaults fail closed until you wire app-specific admin logic",
    ]),
  ];
}

function renderPortableTopic() {
  return [
    "# Stylyf Intro: Portable Backend Path",
    "",
    "The portable path is the Better Auth + Drizzle branch. Use it when you want provider-agnostic auth/data control, Better Auth plugins, Drizzle schema ownership, or easy SQLite local development.",
    "",
    ...section("What It Generates", [
      "- Better Auth server and client modules",
      "- Better Auth auth route at `/api/auth/[...auth]`",
      "- Drizzle database wiring and schema modules",
      "- Drizzle config and migration scripts",
      "- route/API/server protection defaults enforced through middleware and guards",
      "- S3-compatible storage helpers when storage is enabled",
    ]),
    ...section("Portable Canonical Example", [
      "- primary example: `packages/stylyf-cli/examples/atlas-dashboard-v0.3-local.json`",
      compactCodeBlock({
        database: {
          dialect: "sqlite",
          migrations: "drizzle-kit",
        },
        auth: {
          provider: "better-auth",
          mode: "session",
          features: {
            emailPassword: true,
          },
        },
        storage: {
          provider: "s3",
          mode: "presigned-put",
          bucketAlias: "uploads",
        },
      }),
    ]),
    ...section("Portable Variants", [
      "- local development: `database.dialect: \"sqlite\"` with `DATABASE_URL=file:./local.db`",
      "- managed relational path: `database.dialect: \"postgres\"` with a Postgres connection URL",
      "- Better Auth features can include `emailPassword`, `emailOtp`, and `magicLink`",
    ]),
    ...section("Portable Notes", [
      "- generated auth schema and DB migrations are explicit source files, not runtime magic",
      "- this is the right branch when the app wants deeper ownership over auth/data seams",
      "- this is also the easiest branch for offline/local smoke testing",
    ]),
  ];
}

function renderHostedTopic() {
  return [
    "# Stylyf Intro: Hosted Backend Path",
    "",
    "The hosted path is the Supabase + Tigris branch. Use it when you want the fastest managed deployment path and are comfortable treating Supabase as both the auth and data platform.",
    "",
    ...section("What It Generates", [
      "- request-scoped Supabase server client",
      "- Supabase browser client",
      "- generated auth API routes for password and OTP flows",
      "- Supabase auth middleware and guards",
      "- `supabase/schema.sql` instead of Drizzle files",
      "- `supabase/policies.sql` for hosted policy scaffolding",
      "- S3-compatible storage helpers that fit Tigris cleanly",
    ]),
    ...section("Hosted Canonical Example", [
      "- primary example: `packages/stylyf-cli/examples/atlas-dashboard-v0.3-supabase.json`",
      compactCodeBlock({
        database: {
          provider: "supabase",
        },
        auth: {
          provider: "supabase",
          mode: "session",
          features: {
            emailPassword: true,
            emailOtp: true,
          },
        },
        storage: {
          provider: "s3",
          mode: "presigned-put",
          bucketAlias: "uploads",
        },
      }),
    ]),
    ...section("Hosted Apply Checklist", [
      "1. fill in `.env` with `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, and the S3/Tigris values",
      "2. apply the generated `supabase/schema.sql` to the target Supabase project",
      "3. review and apply the generated `supabase/policies.sql` before treating hosted CRUD as production-ready",
      "4. only then run hosted auth, CRUD, and attachment smoke tests against the real project",
    ]),
    ...section("Hosted Notes", [
      "- the hosted branch uses Supabase SDKs for both auth and data access",
      "- `emailOtp` scaffolding is generated, but email template behavior still depends on Supabase configuration",
      "- this is the fastest route to a managed full-stack deployment",
    ]),
  ];
}

function renderComponentsTopic(context: IntroContext) {
  const { clusterCounts, clusterInventory, schemaSummary } = context;
  return [
    "# Stylyf Intro: Components And Templates",
    "",
    "Stylyf bundles app shells, page shells, layouts, and copied registry components. Search is the fastest way to discover the right building blocks without reopening the full source tree.",
    "",
    ...section("Search First", [
      codeBlock(
        [
          "stylyf search dashboard analytics",
          "stylyf search filter toolbar table",
          "stylyf search upload attachment presign",
          "stylyf search auth session route protection",
        ].join("\n"),
        "bash",
      ),
    ]),
    ...section("Template Inventory", [
      `- app shells: ${schemaSummary.shells.join(", ")}`,
      `- page shells: ${schemaSummary.pageShells.join(", ")}`,
      `- layouts: ${schemaSummary.layouts.join(", ")}`,
    ]),
    ...section("Bundled Component Clusters", [
      ...clusterCounts.map(([label, count]) => `- ${label}: ${count} components`),
    ]),
    ...section("Full Component Inventory", [
      ...clusterInventory.flatMap(cluster => [`- ${cluster.label}: ${cluster.items.join(", ")}`, ""]),
    ]),
  ];
}

function renderExamplesTopic() {
  return [
    "# Stylyf Intro: Examples",
    "",
    "Stylyf’s examples are meant to do two things at once: provide canonical starting points and preserve richer reference coverage for deeper scaffolding work.",
    "",
    ...section("Canonical Starting Points", [
      "- portable branch: `packages/stylyf-cli/examples/atlas-dashboard-v0.3-local.json`",
      "- hosted branch: `packages/stylyf-cli/examples/atlas-dashboard-v0.3-supabase.json`",
      "- broad contract reference: `packages/stylyf-cli/examples/atlas-dashboard-v0.3.json`",
    ]),
    ...section("Reference Examples", [
      "- `atlas-dashboard.json`: minimal frontend-only dashboard scaffold",
      "- `atlas-dashboard-local.json`: portable pre-v0.3 local full-stack baseline",
      "- `atlas-dashboard-fullstack.json`: portable Postgres full-stack baseline",
      "- `atlas-dashboard-supabase.json`: hosted pre-v0.3 managed baseline",
      "- `field-manual-docs.json`: minimal docs/content scaffold",
      "- `field-manual-docs-fullstack.json`: docs/content full-stack baseline",
    ]),
    ...section("How To Use Examples", [
      "- start from a canonical example when possible",
      "- split your app into explicit fragments if you want a cleaner authoring flow",
      "- use reference examples when you need a richer reminder of edge capabilities",
      "- use `stylyf validate --print-resolved` to inspect what the composed app will actually generate",
    ]),
  ];
}

function renderGeneratedOutputTopic(context: IntroContext) {
  const { themeGrammar } = context;
  return [
    "# Stylyf Intro: Generated Output",
    "",
    "Generated apps are ordinary checked-in source trees. They do not import from this repo and do not depend on `@depths/stylyf-cli` at runtime.",
    "",
    ...section("Generated App Structure", [
      codeBlock(
        [
          "src/",
          "  app.tsx",
          "  app.css",
          "  entry-client.tsx",
          "  entry-server.tsx",
          ".env.example",
          "  lib/",
          "    env.ts",
          "    theme-system.ts",
          "    cn.ts",
          "    auth.ts",
          "    auth-client.ts",
          "    storage.ts",
          "    # portable branch:",
          "    db.ts",
          "    db/schema.ts",
          "    # hosted branch:",
          "    supabase.ts",
          "    supabase-browser.ts",
          "    server/",
          "      guards.ts",
          "      queries/",
          "      actions/",
          "  routes/",
          "    api/",
          "    auth/callback.ts",
          "  components/",
          "    layout/",
          "    shells/",
          "      app/",
          "      page/",
          "    registry/",
        ].join("\n"),
        "text",
      ),
    ]),
    ...section("How To Navigate A Generated App", [
      "- start with `src/routes/` to understand the app surface area",
      "- inspect `src/components/shells/app/` for the global shell pattern",
      "- inspect `src/components/shells/page/` for page rhythm and framing",
      "- inspect `src/components/layout/` for spatial composition wrappers",
      "- inspect `src/components/registry/` for the copied UI building blocks",
      "- inspect `src/lib/env.ts`, `src/lib/auth.ts`, and `src/lib/storage.ts` for the generated backend capability surface",
      "- if the app uses the portable branch, inspect `src/lib/db.ts`, `src/lib/db/schema.ts`, and `drizzle.config.ts`",
      "- if the app uses the hosted branch, inspect `src/lib/supabase.ts`, `src/lib/supabase-browser.ts`, `supabase/schema.sql`, and `supabase/policies.sql`",
    ]),
    ...section("Iterative UI Development", [
      "- use Stylyf to generate the first draft quickly",
      "- continue refining the emitted app directly like any normal SolidStart project",
      "- use `stylyf search` to locate better component/layout candidates when the UI needs another pass",
      "- regenerate into a fresh scratch directory when comparing alternate shells or route plans",
      "- keep the destination app as the source of truth once bespoke refinement starts",
    ]),
    ...section("Theme And Styling Grammar", [
      `Default theme state: \`${themeGrammar.defaults.mode} + ${themeGrammar.defaults.preset} + ${themeGrammar.defaults.radius} + ${themeGrammar.defaults.density} + ${themeGrammar.defaults.spacing}\``,
      `- presets: ${themeGrammar.presets.join(", ")}`,
      `- modes: ${themeGrammar.modes.join(", ")}`,
      `- radii: ${themeGrammar.radii.join(", ")}`,
      `- density: ${themeGrammar.density.join(", ")}`,
      `- spacing: ${themeGrammar.spacing.join(", ")}`,
      `- font roles: ${themeGrammar.fontRoles.join(", ")}`,
      "",
      "Stylyf emits ordinary CSS and theme bootstrap code. Theme choices remain declarative in the IR, while the generated app stays fully source-owned afterward.",
    ]),
  ];
}

function renderProjectSnapshot(project: ProjectSnapshot | null) {
  if (!project) {
    return [];
  }

  return [
    "## Project Snapshot",
    "",
    `- project path: \`${project.projectPath}\``,
    project.packageName ? `- package name: \`${project.packageName}\`` : undefined,
    project.packageManager ? `- package manager: \`${project.packageManager}\`` : undefined,
    `- route files: ${project.routeFiles.length}`,
    `- app shell files: ${project.appShellFiles.length}`,
    `- page shell files: ${project.pageShellFiles.length}`,
    `- layout files: ${project.layoutFiles.length}`,
    `- registry files: ${project.registryFiles.length}`,
    `- has src/app.css: ${project.hasAppCss ? "yes" : "no"}`,
    `- has src/lib/theme-system.ts: ${project.hasThemeSystem ? "yes" : "no"}`,
    "",
    "### Route Files",
    "",
    bulletList(project.routeFiles),
    "",
    "### App Shell Files",
    "",
    bulletList(project.appShellFiles),
    "",
    "### Page Shell Files",
    "",
    bulletList(project.pageShellFiles),
    "",
    "### Layout Files",
    "",
    bulletList(project.layoutFiles),
    "",
    "### Registry Files",
    "",
    bulletList(project.registryFiles),
    "",
  ].filter(Boolean) as string[];
}

type IntroContext = {
  themeGrammar: Awaited<ReturnType<typeof loadThemeGrammar>>;
  clusterCounts: Array<[string, number]>;
  clusterInventory: Array<{ label: string; items: string[] }>;
  project: ProjectSnapshot | null;
  schemaSummary: {
    root: string[];
    shells: string[];
    pageShells: string[];
    layouts: string[];
  };
};

function renderTopic(topic: IntroTopic, context: IntroContext) {
  const topicLines =
    topic === "overview"
      ? renderOverviewTopic(context)
      : topic === "dsl"
        ? renderDslTopic(context)
        : topic === "portable"
          ? renderPortableTopic()
          : topic === "hosted"
            ? renderHostedTopic()
            : topic === "components"
              ? renderComponentsTopic(context)
              : topic === "examples"
                ? renderExamplesTopic()
                : topic === "generated-output"
                  ? renderGeneratedOutputTopic(context)
                  : [
                      ...renderOverviewTopic(context),
                      ...renderDslTopic(context).slice(2),
                      ...renderPortableTopic().slice(2),
                      ...renderHostedTopic().slice(2),
                      ...renderComponentsTopic(context).slice(2),
                      ...renderExamplesTopic().slice(2),
                      ...renderGeneratedOutputTopic(context).slice(2),
                    ];

  return [...topicLines, ...renderProjectSnapshot(context.project)];
}

export async function renderIntroMarkdown(options: IntroOptions = {}) {
  const [themeGrammar, registry] = await Promise.all([loadThemeGrammar(), loadAssemblyRegistry()]);
  const clusterCounts = [...registry.reduce((map, item) => map.set(item.clusterLabel, (map.get(item.clusterLabel) ?? 0) + 1), new Map<string, number>()).entries()].sort(
    ([left], [right]) => left.localeCompare(right),
  );
  const clusterInventory = [...registry.reduce((map, item) => {
    const current = map.get(item.clusterLabel) ?? [];
    current.push(item.label);
    map.set(item.clusterLabel, current);
    return map;
  }, new Map<string, string[]>()).entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([label, items]) => ({
      label,
      items: items.sort((left, right) => left.localeCompare(right)),
    }));
  const project = options.projectPath ? await snapshotProject(options.projectPath) : null;
  const schemaSummary = {
    root: Object.keys(appIrSchema.properties),
    shells: [...(appIrSchema.properties.shell as { enum: readonly string[] }).enum],
    pageShells: listPageShellTemplates(),
    layouts: listLayoutTemplates(),
  };
  const topic = isIntroTopic(options.topic) ? options.topic : "overview";

  return renderTopic(topic, {
    themeGrammar,
    clusterCounts,
    clusterInventory,
    project,
    schemaSummary,
  }).join("\n");
}

export async function writeIntroMarkdown(markdown: string, outputPath: string) {
  const resolved = resolve(outputPath);
  await mkdir(dirname(resolved), { recursive: true });
  await writeFile(resolved, `${markdown.trimEnd()}\n`);
  return resolved;
}
