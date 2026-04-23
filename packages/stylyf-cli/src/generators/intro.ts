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

type IntroOptions = {
  projectPath?: string;
  outputPath?: string;
};

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

function uniqueSorted(values: string[]) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function clusterInventoryLines(
  clusters: Array<{
    label: string;
    items: string[];
  }>,
) {
  return clusters.flatMap(cluster => [`- ${cluster.label}: ${cluster.items.join(", ")}`, ""]);
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

  const intro = [
    "# Stylyf Intro",
    "",
    "Stylyf is a JSON-driven full-stack assembly line for SolidStart. Its job is to let a coding agent describe the intended app once, generate a real working source tree, and then keep iterating inside that emitted app without redoing the repetitive setup work by hand.",
    "",
    "## Backend Modes",
    "",
    "- portable mode: `better-auth + drizzle + postgres/sqlite + s3-compatible storage`",
    "- hosted mode: `supabase auth + supabase data sdk + tigris-compatible s3 storage`",
    "- storage remains presigned-URL based in both modes, so browser code never receives raw object storage credentials",
    "",
    "### Which Backend Mode Should An Agent Choose?",
    "",
    "- choose `portable` when you want provider-agnostic app ownership, Drizzle schema control, Better Auth plugins, or easy local SQLite development",
    "- choose `hosted` when you want the fastest managed deployment path and are comfortable treating Supabase as both the auth and data platform",
    "- choose `portable + sqlite` for local smoke tests and backend iteration without external services",
    "- choose `hosted + supabase + tigris` when speed of deployment matters more than provider portability",
    "",
    "## What Stylyf Does",
    "",
    "- turns a shallow JSON IR into a standalone SolidStart app",
    "- emits app shell, route files, page shells, layout wrappers, global styling, and copied registry components",
    "- emits backend capability files for both supported backend branches when requested",
    "- the portable branch uses PostgreSQL or SQLite via Drizzle plus Better Auth",
    "- the hosted branch uses Supabase SDKs for both auth and data access, and emits `supabase/schema.sql` instead of Drizzle files",
    "- emits S3-compatible storage helpers for both branches, including AWS-compatible aliases that fit Tigris well",
    "- installs dependencies and runs post-generate auth/db scaffolding so the target app is runnable immediately",
    "- exposes search and intro commands so an agent can orient itself quickly during follow-up work",
    "",
    "## Operator Workflow",
    "",
    "1. Search the bundled inventory to find the right building blocks.",
    "2. Write or refine a shallow JSON IR describing app shell, routes, page shells, layout wrappers, and component composition.",
    "3. Validate the IR before generation.",
    "4. Generate the app into a clean target directory.",
    "5. Move into the generated app and iterate there like a normal SolidStart codebase.",
    "6. Use `stylyf intro --project <path>` whenever a coding agent needs a compact refresher on the generated app structure.",
    "7. Treat `auth.protect` as the route/API/server default policy surface; explicit `auth` fields on API routes and server modules still win when set.",
    "",
    "## What Stylyf Still Expects The Agent To Decide",
    "",
    "- product-specific domain rules",
    "- final authorization and role design beyond the bundled access presets",
    "- ownership nuances such as workspace role hierarchies or admin back-office flows",
    "- final Supabase RLS rules when the hosted branch needs stronger tenant or role isolation",
    "- email delivery wiring for Better Auth OTP or production-grade notification delivery",
    "- storage retention, moderation, and lifecycle policy beyond the generated attachment baseline",
    "",
    "## Can An Agent Start Cold With This?",
    "",
    "Yes, that is the point of this document. A fresh coding agent should be able to:",
    "",
    "- understand the available shells, layouts, themes, components, and backend capabilities",
    "- write valid JSON IR without opening the Stylyf source tree first",
    "- generate a SolidStart app scaffold quickly",
    "- move into the emitted app and continue iterative UI development there",
    "",
    "## Core Commands",
    "",
    codeBlock(
      [
        "stylyf intro",
        "stylyf intro --project ./my-app --output STYLYF_INTRO.md",
        "stylyf search dashboard filters table",
        "stylyf validate --ir app.json",
        "stylyf generate --ir app.json --target ./my-app",
        "stylyf serve-search --port 4310",
      ].join("\n"),
      "bash",
    ),
    "",
    "## JSON IR DSL",
    "",
    "Stylyf uses a shallow JSON IR. The root shape is:",
    "",
    codeBlock(
      JSON.stringify(
        {
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
                sections: "SectionIR[]",
              },
            ],
          },
        },
        null,
        2,
      ),
      "json",
    ),
    "",
    "### Section And Layout Nodes",
    "",
    codeBlock(
      JSON.stringify(
        {
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
        },
        null,
        2,
      ),
      "json",
    ),
    "",
    "### Composition Rules",
    "",
    "- `shell` sets the default app shell for all routes",
    "- each route must choose a `page` shell",
    "- each route contains one or more `sections`",
    "- each section starts with one layout wrapper",
    "- child nodes can be component strings, component objects, or nested layout objects",
    "- string component children are shorthand for `{ \"component\": \"...\" }`",
    "- use `props` when a component or layout needs named values",
    "- use `items` when a component expects repeatable data collections",
    "- add `database`, `auth`, `storage`, `apis`, and `server` only when the app actually needs those backend capabilities",
    "- add `resources` and `workflows` when you want Stylyf's v0.3 generalized app-mechanics layer instead of only raw backend primitives",
    "- `auth.protect` supplies default protection rules for generated routes, API routes, and server modules",
    "- for API routes and server modules, an explicit `auth` field on the item overrides any matching `auth.protect` entry",
    "",
    "### v0.3 Resource And Workflow DSL",
    "",
    "The v0.3 surface is meant to stay broad across app types. It uses generalized mechanics instead of product-genre language.",
    "",
    codeBlock(
      JSON.stringify(
        {
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
        },
        null,
        2,
      ),
      "json",
    ),
    "",
    "### v0.3 Mechanics Semantics",
    "",
    "- `resources`: generalized app entities that Stylyf maps to schema, CRUD surfaces, route shells, and generated server modules",
    "- `ownership`: whether a resource is unowned, user-owned, or workspace-owned",
    "- `access`: broad policy presets for list/read/create/update/delete surfaces",
    "- `relations`: explicit links between resources without forcing a deep ORM-specific DSL into the top-level IR",
    "- `attachments`: generalized file/media attachment declarations on top of the shared S3/Tigris substrate",
    "- `workflows`: state machines for approvals, publishing, onboarding, or other repeatable transitions",
    "- `transitions.emits`: event names that Stylyf maps to event-log records and notification fan-out",
    "- `transitions.notifies`: notification audiences, kept broad so they fit internal apps as well as customer-facing products",
    "",
    "### v0.3 Supported Vocabulary",
    "",
    "- ownership models: `none`, `user`, `workspace`",
    "- access presets: `public`, `user`, `owner`, `owner-or-public`, `workspace-member`, `admin`",
    "- visibility presets: `private`, `public`, `mixed`",
    "- relation kinds: `belongs-to`, `has-many`, `many-to-many`",
    "- attachment kinds: `file`, `image`, `video`, `audio`, `document`",
    "- workflow notification audiences: `owner`, `workspace`, `watchers`, `admins`",
    "- note: the `admin` access preset is reserved for explicit role-aware customization; generated defaults fail closed until you wire app-specific admin logic",
    "",
    "### What v0.3 Generates From That DSL",
    "",
    "- resource-derived schema in both backend branches",
    "- generated list/detail/create/update/delete server modules",
    "- generated `resource-create` and `resource-edit` route/page shells when requested",
    "- generated resource form components and server-side form parsing helpers",
    "- ownership-aware guard helpers for the portable branch",
    "- Supabase RLS policy SQL for the hosted branch",
    "- attachment metadata tables plus presign, confirm, replace, and delete flows",
    "- workflow definitions, transition actions, event log queries, and notification queries/actions",
    "",
    "### Hosted Branch Apply Checklist",
    "",
    "After generating a hosted app, an agent should treat these as the required first-run steps:",
    "",
    "1. fill in `.env` with `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, and the S3/Tigris values",
    "2. apply the generated `supabase/schema.sql` to the target Supabase project",
    "3. review and apply the generated `supabase/policies.sql` before treating the hosted CRUD surface as production-ready",
    "4. only then run hosted auth, CRUD, and attachment smoke tests against the real project",
    "",
    "### Recommended Starting Points",
    "",
    "- portable v0.3 path: `packages/stylyf-cli/examples/atlas-dashboard-v0.3-local.json`",
    "- hosted v0.3 path: `packages/stylyf-cli/examples/atlas-dashboard-v0.3-supabase.json`",
    "- broad contract reference: `packages/stylyf-cli/examples/atlas-dashboard-v0.3.json`",
    "",
    "### Backend Capability DSL",
    "",
    codeBlock(
      JSON.stringify(
        {
          database: {
            provider: "drizzle",
            dialect: "sqlite",
            migrations: "drizzle-kit",
            schema: [
              {
                table: "records",
                columns: [
                  { name: "id", type: "uuid", primaryKey: true },
                  { name: "name", type: "varchar" },
                ],
                timestamps: true,
              },
            ],
          },
          auth: {
            provider: "better-auth",
            mode: "session",
            features: {
              emailPassword: true,
              emailOtp: false,
              magicLink: false,
            },
            protect: [{ target: "/records", kind: "route", access: "user" }],
          },
          storage: {
            provider: "s3",
            mode: "presigned-put",
            bucketAlias: "uploads",
          },
          apis: [
            {
              path: "/api/uploads/presign",
              method: "POST",
              type: "presign-upload",
              name: "create-record-upload",
              auth: "user",
            },
          ],
          server: [
            {
              name: "records.list",
              type: "query",
              resource: "records",
              auth: "user",
            },
            {
              name: "records.create",
              type: "action",
              resource: "records",
              auth: "user",
            },
          ],
        },
        null,
        2,
      ),
      "json",
    ),
    "",
    "### Hosted Supabase + Tigris Example IR",
    "",
    codeBlock(
      JSON.stringify(
        {
          name: "Atlas Hosted",
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
          database: {
            provider: "supabase",
            schema: [
              {
                table: "records",
                timestamps: true,
                columns: [
                  { name: "id", type: "uuid", primaryKey: true },
                  { name: "name", type: "varchar" },
                  { name: "status", type: "varchar" },
                  { name: "owner_id", type: "uuid" },
                ],
              },
            ],
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
          apis: [
            {
              path: "/api/uploads/presign",
              method: "POST",
              type: "presign-upload",
              name: "create-record-upload",
              auth: "user",
            },
          ],
          server: [
            {
              name: "records.list",
              type: "query",
              resource: "records",
              auth: "user",
            },
            {
              name: "records.create",
              type: "action",
              resource: "records",
              auth: "user",
            },
          ],
          routes: [
            {
              path: "/",
              page: "dashboard",
              title: "Atlas Overview",
              sections: [
                {
                  layout: "grid",
                  children: [
                    "stat-card",
                    {
                      component: "stat-grid",
                    },
                  ],
                },
                {
                  layout: "stack",
                  children: [
                    {
                      component: "activity-feed",
                    },
                    {
                      component: "notification-list",
                    },
                  ],
                },
              ],
            },
          ],
        },
        null,
        2,
      ),
      "json",
    ),
    "",
    "Portable local development: use `database.provider: \"drizzle\"`, `database.dialect: \"sqlite\"`, and `DATABASE_URL=file:./local.db`. `DATABASE_AUTH_TOKEN` stays optional and is only needed later for remote libsql providers such as Turso.",
    "",
    "Hosted fast path: pair `database.provider: \"supabase\"` with `auth.provider: \"supabase\"`. That branch emits `src/lib/supabase.ts`, `src/lib/supabase-browser.ts`, auth API routes, middleware, and `supabase/schema.sql` instead of Drizzle files.",
    "",
    "For email OTP on the Supabase branch, Stylyf scaffolds the code path with `signInWithOtp` and `verifyOtp`. Per Supabase's current docs, whether users receive an OTP code or a magic link depends on the email template variables configured in Supabase.",
    "",
    "## Quick Start",
    "",
    codeBlock(
      [
        "stylyf search internal dashboard analytics",
        "stylyf validate --ir atlas.json",
        "stylyf generate --ir atlas.json --target ./atlas",
        "cd atlas",
        "npm run dev",
      ].join("\n"),
      "bash",
    ),
    "",
    "## Generated App Structure",
    "",
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
    "",
    "## How To Navigate A Generated App",
    "",
    "- start with `src/routes/` to understand the app surface area",
    "- inspect `src/components/shells/app/` for the global shell pattern applied to routes",
    "- inspect `src/components/shells/page/` for page rhythm and framing",
    "- inspect `src/components/layout/` for spatial composition wrappers",
    "- inspect `src/components/registry/` for the copied UI building blocks used by the generated routes",
    "- inspect `src/lib/env.ts`, `src/lib/auth.ts`, and `src/lib/storage.ts` for the generated backend capability surface",
    "- if the app uses the portable branch, inspect `src/lib/db.ts`, `src/lib/db/schema.ts`, and `drizzle.config.ts`",
    "- if the app uses the hosted branch, inspect `src/lib/supabase.ts`, `src/lib/supabase-browser.ts`, and `supabase/schema.sql`",
    "- inspect `src/routes/api/` and `src/lib/server/` for explicit machine-facing API routes and server functions",
    "- inspect `src/app.css` and `src/lib/theme-system.ts` for the styling grammar and default theme behavior",
    "",
    "## Iterative UI Development With Stylyf",
    "",
    "Stylyf is not just for the first scaffold. A good working loop is:",
    "",
    "- use Stylyf to generate the first draft quickly",
    "- continue refining the emitted app directly like any normal SolidStart project",
    "- use `stylyf search` to locate better component/layout candidates when the UI needs another pass",
    "- regenerate into a fresh scratch directory when comparing alternate shells or route plans",
    "- keep the destination app as the source of truth once bespoke refinement starts",
    "",
    "## Theme And Styling Grammar",
    "",
    `Default theme state: \`${themeGrammar.defaults.mode} + ${themeGrammar.defaults.preset} + ${themeGrammar.defaults.radius} + ${themeGrammar.defaults.density} + ${themeGrammar.defaults.spacing}\``,
    "",
    `- presets: ${themeGrammar.presets.join(", ")}`,
    `- modes: ${themeGrammar.modes.join(", ")}`,
    `- radii: ${themeGrammar.radii.join(", ")}`,
    `- density: ${themeGrammar.density.join(", ")}`,
    `- spacing: ${themeGrammar.spacing.join(", ")}`,
    `- font roles: ${themeGrammar.fontRoles.join(", ")}`,
    "",
    "### Theme Control Meanings",
    "",
    "- `preset`: picks the color palette family emitted into the generated app",
    "- `mode`: sets default light, dark, or system-following startup behavior",
    "- `radius`: controls corner sharpness across cards, controls, panels, and surfaces",
    "- `density`: controls macro and control sizing such as header height, control height, and horizontal padding",
    "- `spacing`: controls overall breathing room and section rhythm",
    "- `fonts.fancy`: display or editorial type role",
    "- `fonts.sans`: primary UI copy role",
    "- `fonts.mono`: code, metrics, and tabular detail role",
    "",
    "### Radius Semantics",
    "",
    "- `edge`: nearly square, just barely softened",
    "- `trim`: sharp but not harsh; good default for serious product UIs",
    "- `soft`: visibly rounded but still restrained",
    "- `mellow`: the most rounded option in the current grammar",
    "",
    "### Density Semantics",
    "",
    "- `compact`: tighter controls and denser layout rhythm",
    "- `comfortable`: default balance for most apps",
    "- `relaxed`: roomier controls and section spacing",
    "",
    "### Spacing Semantics",
    "",
    "- `tight`: close section rhythm and compact page pacing",
    "- `balanced`: more even editorial spacing",
    "- `airy`: the loosest built-in rhythm",
    "",
    "The styling grammar is emitted from the bundled `src/app.css` baseline. Theme choices remain declarative in the IR, while the generated app gets ordinary CSS and theme bootstrap code it can keep evolving independently.",
    "",
    "## Template Inventory",
    "",
    `- app shells: ${listAppShellTemplates().join(", ")}`,
    `- page shells: ${listPageShellTemplates().join(", ")}`,
    `- layouts: ${listLayoutTemplates().join(", ")}`,
    "",
    "### Backend Capability Inventory",
    "",
    "- portable database: `drizzle` provider with `postgres` or `sqlite`",
    "- hosted database: `supabase` provider using generated Supabase SDK clients",
    "- portable auth: `better-auth` in session mode, wired to Drizzle",
    "- hosted auth: `supabase` in session mode, with `emailPassword` and optional `emailOtp` scaffolding",
    "- storage: `s3` with presigned PUT upload helpers and AWS-compatible aliases that fit Tigris",
    "- api route types: `json`, `webhook`, `presign-upload`, plus generated auth routes for the selected auth provider",
    "- server module types: `query`, `action`",
    "- generated route protection is enforced in middleware rather than by embedding auth checks into page components",
    "",
    "### App Shell Intent",
    "",
    "- `sidebar-app`: internal tools, dashboards, admin products",
    "- `topbar-app`: lighter app shells with more horizontal emphasis",
    "- `docs-shell`: documentation and knowledge-base surfaces",
    "- `marketing-shell`: public-facing site shells",
    "",
    "### Page Shell Intent",
    "",
    "- `dashboard`: overview-heavy operational or analytics pages",
    "- `resource-index`: lists, tables, collections, and filtered indexes",
    "- `resource-detail`: detail pages and article-like surfaces",
    "- `resource-create`: create flows with a generated resource form surface",
    "- `resource-edit`: edit flows with data loading and a generated resource form surface",
    "- `settings`: grouped forms and configuration pages",
    "- `auth`: focused authentication and entry flows",
    "- `blank`: minimal frame when the route wants to control most of its own structure",
    "",
    "### Layout Intent",
    "",
    "- `stack`: vertical flow",
    "- `row`: horizontal flow",
    "- `column`: constrained vertical column",
    "- `grid`: responsive grid composition",
    "- `split`: two-region split layouts",
    "- `panel`: framed surface wrapper",
    "- `section`: titled grouped content region",
    "- `toolbar`: filter/action/control row",
    "- `content-frame`: max-width and page content framing",
    "",
    "## Registry Inventory",
    "",
    `Total bundled components: ${registry.length}`,
    "",
    ...clusterCounts.map(([label, count]) => `- ${label}: ${count}`),
    "",
    "### Components By Cluster",
    "",
    ...clusterInventoryLines(clusterInventory),
    "## Search Tips",
    "",
    "- search by user intent first, not exact component name",
    "- combine route shape and UI intent terms, for example `settings panel toggle form`",
    "- use the local HTTP endpoint when an agent wants small targeted reads instead of reopening source trees",
    "- use `stylyf search` first, then only open the files or blocks you actually plan to use",
    "",
    codeBlock(
      [
        "curl 'http://127.0.0.1:4310/search?q=docs+sidebar+article&limit=5'",
        "curl 'http://127.0.0.1:4310/item/data-views/table'",
      ].join("\n"),
      "bash",
    ),
    "",
    "## How To Efficiently Scaffold An App With Zero Prior Context",
    "",
    "1. Choose the app shell that matches the product surface.",
    "2. Choose the default theme values and three font roles.",
    "3. Decide whether the app needs database, auth, storage, API routes, or server functions.",
    "4. Sketch routes using page shells first, before thinking about specific components.",
    "5. Choose one layout wrapper per section.",
    "6. Fill each section with the smallest set of relevant components.",
    "7. Generate the app.",
    "8. Move into the generated app and continue normal UI and backend development there.",
    "",
    "If uncertain about which components fit, start with `stylyf search` and query by page intent rather than component label.",
    "",
  ];

  if (project) {
    intro.push(
      "## Project Snapshot",
      "",
      `- project path: \`${project.projectPath}\``,
      `- package name: \`${project.packageName ?? "unknown"}\``,
      `- package manager hint: \`${project.packageManager ?? "npm"}\``,
      `- routes: ${project.routeFiles.length}`,
      `- app shells: ${project.appShellFiles.length}`,
      `- page shells: ${project.pageShellFiles.length}`,
      `- layouts: ${project.layoutFiles.length}`,
      `- copied registry components: ${project.registryFiles.length}`,
      `- has app.css: ${project.hasAppCss ? "yes" : "no"}`,
      `- has theme-system.ts: ${project.hasThemeSystem ? "yes" : "no"}`,
      "",
      "### Routes",
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
      "### Registry Components Copied Into The App",
      "",
      bulletList(project.registryFiles.slice(0, 25)),
      project.registryFiles.length > 25 ? `- ...and ${project.registryFiles.length - 25} more` : "",
      "",
      "## Recommended First Reads For An Agent",
      "",
      bulletList(
        uniqueSorted([
          ...project.routeFiles.slice(0, 5),
          ...project.appShellFiles.slice(0, 2),
          ...project.pageShellFiles.slice(0, 2),
          ...(project.hasAppCss ? ["src/app.css"] : []),
          ...(project.hasThemeSystem ? ["src/lib/theme-system.ts"] : []),
        ]),
      ),
      "",
    );
  }

  intro.push(
    "## Agent Rules Of Thumb",
    "",
    "- treat the emitted app as a normal SolidStart codebase",
    "- preserve the styling grammar unless there is a clear reason to extend it",
    "- prefer composing from copied registry components before inventing new base primitives",
    "- choose one backend branch per generated app: portable (`better-auth + drizzle`) or hosted (`supabase + tigris`)",
    "- prefer request-scoped auth/data clients by default; treat the Supabase secret/admin client as an explicit escape hatch for privileged operations only",
    "- keep changes source-owned in the generated app rather than trying to reintroduce runtime abstraction",
    "",
    "## Summary",
    "",
    "Stylyf is the fast full-stack assembly layer. Use it to eliminate setup repetition, then continue inside the generated app with normal SolidStart engineering discipline.",
    "",
  );

  return intro.filter(Boolean).join("\n");
}

export async function writeIntroMarkdown(markdown: string, outputPath: string) {
  const resolvedOutput = resolve(outputPath);
  await mkdir(dirname(resolvedOutput), { recursive: true });
  await writeFile(resolvedOutput, `${markdown.trimEnd()}\n`);
  return resolvedOutput;
}
