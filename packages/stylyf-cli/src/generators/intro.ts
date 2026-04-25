import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { loadAssemblyRegistry, loadThemeGrammar, type AssemblyItem } from "../manifests/index.js";

export type IntroTopic =
  | "overview"
  | "operator"
  | "spec"
  | "ui"
  | "data"
  | "api"
  | "generic"
  | "internal-tool"
  | "cms-site"
  | "free-saas-tool"
  | "backend"
  | "media"
  | "composition"
  | "operations"
  | "generated-output"
  | "full";

export type IntroKind = "generic" | "internal-tool" | "cms-site" | "free-saas-tool";

export const introTopics = [
  "overview",
  "operator",
  "spec",
  "ui",
  "data",
  "api",
  "generic",
  "internal-tool",
  "cms-site",
  "free-saas-tool",
  "backend",
  "media",
  "composition",
  "operations",
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

function json(value: unknown) {
  return codeBlock(JSON.stringify(value, null, 2), "json");
}

function specExample(kind: IntroKind) {
  const base = {
    version: "1.0",
    app: {
      name: kind === "cms-site" ? "Field Notes" : kind === "free-saas-tool" ? "Resize Kit" : kind === "generic" ? "Atlas" : "Acme Ops",
      kind,
      description:
        kind === "cms-site"
          ? "A publishing site with public content and an authenticated editorial workspace."
          : kind === "free-saas-tool"
            ? "A free utility with a public tool and optional saved results."
            : kind === "generic"
              ? "A general authenticated full-stack app."
              : "An internal review and operations workspace.",
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
    experience: {
      theme: "opal",
      mode: "light",
      radius: "trim",
      density: "comfortable",
      spacing: "tight",
    },
  };

  if (kind === "generic") {
    return {
      ...base,
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
            { name: "excerpt", type: "long-text" },
            { name: "body", type: "rich-text" },
            { name: "status", type: "status", options: ["draft", "review", "published", "archived"] },
          ],
          media: [{ name: "heroImage", kind: "image" }],
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
        { name: "Saved Results", kind: "list", object: "tool_runs", path: "/dashboard/results", audience: "user" },
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
          { name: "status", type: "status", options: ["draft", "review", "approved"], default: "draft" },
        ],
        media: [{ name: "evidence", kind: "document", multiple: true }],
      },
    ],
    flows: [{ name: "ticketApproval", object: "tickets", kind: "approval" }],
  };
}

function portableRichExample() {
  return {
    version: "1.0",
    app: {
      name: "Review Desk",
      kind: "internal-tool",
      description: "An authenticated workspace for reviewing submissions with attachments and approvals.",
    },
    backend: {
      mode: "portable",
      portable: { database: "sqlite" },
    },
    media: {
      mode: "rich",
      maxFileSizeBytes: 10485760,
      allowedContentTypes: ["image/png", "image/jpeg", "application/pdf"],
      keyPrefix: "review-desk",
      presignExpiresSeconds: 600,
      objectPolicy: "private",
      deleteMode: "soft",
    },
    experience: {
      theme: "emerald",
      mode: "light",
      radius: "trim",
      density: "comfortable",
      spacing: "balanced",
    },
    policies: {
      roles: [{ name: "admin" }, { name: "reviewer" }, { name: "member" }],
      memberships: [{ name: "workspace", table: "workspace_memberships", roles: ["admin", "reviewer", "member"] }],
      actors: [
        { actor: "admin", role: "admin", membership: "workspace" },
        { actor: "editor", role: "reviewer", membership: "workspace" },
      ],
    },
    objects: [
      {
        name: "submissions",
        ownership: "user",
        visibility: "private",
        access: { list: "owner", read: "owner", create: "user", update: "owner", delete: "owner" },
        fields: [
          { name: "title", type: "short-text", required: true, indexed: true },
          { name: "category", type: "status", options: ["visual", "copy", "strategy"] },
          { name: "status", type: "status", options: ["draft", "review", "approved", "rejected"], default: "draft" },
          { name: "notes", type: "long-text" },
        ],
        media: [
          { name: "coverImage", kind: "image" },
          { name: "sourceFiles", kind: "document", multiple: true },
        ],
      },
    ],
    flows: [
      {
        name: "submissionReview",
        object: "submissions",
        kind: "approval",
        field: "status",
        states: ["draft", "review", "approved", "rejected"],
        transitions: [
          { name: "submit", from: "draft", to: "review", actor: "owner", emits: ["submissions.submitted"], notifies: ["admins"] },
          { name: "approve", from: "review", to: "approved", actor: "admin", emits: ["submissions.approved"], notifies: ["owner"] },
        ],
      },
    ],
    surfaces: [
      { name: "Overview", kind: "dashboard", path: "/", audience: "user" },
      { name: "Submission Queue", kind: "list", object: "submissions", path: "/submissions", audience: "user" },
      { name: "Submit Work", kind: "create", object: "submissions", path: "/submissions/new", audience: "user" },
    ],
    apis: [
      {
        path: "/api/health",
        method: "GET",
        type: "json",
        name: "health",
        auth: "public",
        response: { status: 200, body: { ok: { type: "boolean", required: true }, service: { type: "string", required: true } } },
        rateLimit: { window: "minute", max: 60 },
      },
    ],
    server: [{ name: "submissions.stats", type: "query", resource: "submissions", auth: "user" }],
    fixtures: [{ resource: "submissions", rows: [{ title: "Homepage hero", category: "visual", status: "draft" }] }],
  };
}

function hostedRichExample() {
  return {
    version: "1.0",
    app: {
      name: "Launch Library",
      kind: "cms-site",
      description: "A Supabase-backed editorial site with public content and authenticated content management.",
    },
    backend: { mode: "hosted" },
    media: {
      mode: "rich",
      allowedContentTypes: ["image/png", "image/jpeg", "image/webp"],
      keyPrefix: "launch-library",
    },
    experience: {
      theme: "amber",
      mode: "light",
      radius: "edge",
      density: "comfortable",
      spacing: "balanced",
    },
    objects: [
      {
        name: "articles",
        ownership: "user",
        visibility: "mixed",
        fields: [
          { name: "title", type: "short-text", required: true },
          { name: "slug", type: "slug", required: true, unique: true },
          { name: "excerpt", type: "long-text" },
          { name: "body", type: "rich-text" },
          { name: "status", type: "status", options: ["draft", "review", "published"] },
        ],
        media: [{ name: "heroImage", kind: "image" }],
      },
    ],
    flows: [{ name: "publishing", object: "articles", kind: "publishing" }],
    env: {
      extras: [{ name: "PUBLIC_ANALYTICS_ID", exposure: "public", required: false, description: "Optional analytics project id." }],
    },
  };
}

function renderOverview() {
  return [
    "# Stylyf v1.0 Intro",
    "",
    "Stylyf is an agent-operated scaffolding compiler for standalone SolidStart apps. The intended operator is a coding agent: read the prompt, express the app as a compact v1.0 spec, inspect the plan, generate ordinary source code, then continue inside the emitted app.",
    "",
    "The generated app does not import this repo and does not depend on `@depths/stylyf-cli` at runtime. Stylyf is the assembly line, not the runtime framework.",
    "",
    section("Mental Model", [
      "- `app` chooses product archetype: `generic`, `internal-tool`, `cms-site`, or `free-saas-tool`.",
      "- `backend`, `media`, and `experience` choose the stack, storage capability, and visual grammar.",
      "- `objects` define resources; resources drive schema, forms, list/detail/create/edit pages, policies, fixtures, and server modules.",
      "- `flows` define state machines; flows drive workflow actions, event names, and notification/audit scaffolds.",
      "- `surfaces` are high-level route intent; `routes` are exact route overrides/additions.",
      "- `sections` arrange layout nodes and component references; `bindings` tell the generator what data/workflow/attachment intent a section or component represents.",
      "- `apis`, `server`, `database.schema`, `env.extras`, `navigation`, `fixtures`, and `deployment` are deeper full-stack controls.",
    ]),
    section("Cold-Start Operator Loop", [
      "1. Run `stylyf intro` for the overview, then drill only where needed: `--topic operator`, `ui`, `data`, `api`, `backend`, `media`, `composition`, `operations`, or `full`.",
      "2. Pick the archetype and backend path from the product brief.",
      "3. Draft the smallest useful spec: `app`, `backend`, `media`, `experience`, `objects`, `flows`, and coarse `surfaces`.",
      "4. Run `stylyf validate --spec ...` and `stylyf plan --spec ... --resolved` to see the expanded app model.",
      "5. Add explicit chunks only where defaults are too coarse: UI sections, API contracts, server modules, DB additions, env extras, navigation, fixtures.",
      "6. Generate with `--no-install` if you need to inspect the emitted package footprint first; otherwise let Stylyf run visible npm operations.",
      "7. In the generated app, run `npm run check`, `npm run build`, and product-specific smoke checks before custom feature work.",
      "8. Do a design pass immediately after generation: the scaffold is a strong foundation, not the final product voice.",
    ]),
    section("Core Commands", [
      codeBlock(
        [
          "stylyf intro",
          "stylyf intro --topic operator",
          "stylyf intro --topic ui",
          "stylyf intro --topic data",
          "stylyf intro --topic api",
          "stylyf intro --topic full",
          "stylyf new generic --name \"Atlas\" --backend portable --media rich --output stylyf.spec.json",
          "stylyf search \"review queue filters table\" --limit 8",
          "stylyf inspect component filter-toolbar",
          "stylyf validate --spec stylyf.spec.json",
          "stylyf plan --spec stylyf.spec.json --resolved",
          "stylyf compose --base stylyf.spec.json --with ui.chunk.json --with backend.chunk.json --output stylyf.composed.json",
          "stylyf generate --spec stylyf.composed.json --target ./my-app --no-install",
          "stylyf generate --spec stylyf.composed.json --target ./my-app",
        ].join("\n"),
        "bash",
      ),
    ]),
    section("Backend Paths", [
      "- `portable`: Better Auth + Drizzle + SQLite/Postgres + Tigris/S3-compatible object storage.",
      "- `hosted`: Supabase Auth + Supabase data SDK + Tigris/S3-compatible object storage.",
      "- Choose portable SQLite for local agent dogfooding and provider-agnostic apps.",
      "- Choose hosted when Supabase is the intended managed auth+data plane.",
    ]),
    section("Drill-Down Map", [
      "- `stylyf intro --topic operator`: exact agent workflow and decision order.",
      "- `stylyf intro --topic spec`: the public v1.0 DSL surface.",
      "- `stylyf intro --topic ui`: visual grammar, surfaces, routes, sections, components, bindings, and navigation.",
      "- `stylyf intro --topic data`: objects, fields, ownership, access, policies, relations, fixtures, and extra schema.",
      "- `stylyf intro --topic api`: API routes, server modules, contracts, rate limits, idempotency, and webhooks.",
      "- `stylyf intro --topic backend`: portable vs hosted backend wiring.",
      "- `stylyf intro --topic media`: S3/Tigris presigned attachment lifecycle.",
      "- `stylyf intro --topic composition`: additive chunk authoring and merge rules.",
      "- `stylyf intro --topic operations`: validation, generated app checks, env setup, deployment profiles, and package transparency.",
      "- `stylyf intro --topic full`: complete operator context plus grouped component inventory.",
    ]),
  ].join("\n");
}

function renderOperatorTopic() {
  return [
    "# Stylyf v1.0 Operator Protocol",
    "",
    "Use this when you are a fresh coding agent and need to turn a product prompt into a generated SolidStart app without prior project memory.",
    "",
    section("Decision Order", [
      "1. Classify the product: `generic`, `internal-tool`, `cms-site`, or `free-saas-tool`.",
      "2. Choose backend: `portable` for Better Auth + Drizzle, `hosted` for Supabase Auth + data SDK.",
      "3. Choose media: `none`, `basic`, or `rich`; use `rich` when resources have named image/document assets.",
      "4. Define resources in `objects`: names, fields, ownership, visibility, access, relations, and media attachments.",
      "5. Define repeatable mechanics in `flows`: approvals, publishing, onboarding, saved-results, or CRUD state machines.",
      "6. Define route intent in `surfaces`; override exact pages through `routes` only when needed.",
      "7. Add explicit UI sections only for product-shaped pages that defaults cannot express.",
      "8. Add `apis`, `server`, `database.schema`, `env.extras`, `navigation`, `fixtures`, and `deployment` as deeper controls.",
      "9. Validate, inspect the resolved app, generate, then typecheck/build the generated app.",
    ]),
    section("Prompt-To-Spec Heuristics", [
      "- If the prompt says dashboard, admin, review queue, moderation, CRM, inventory, or operations: start with `internal-tool`.",
      "- If it says articles, docs, editorial, public content, blog, directory, knowledge base, or publishing: start with `cms-site`.",
      "- If it says calculator, checker, converter, analyzer, generator, public utility, or saved results: start with `free-saas-tool`.",
      "- If it is a normal authenticated SaaS or does not fit the other three: start with `generic`.",
      "- If resource rows should be user-private: `ownership: \"user\"`, `visibility: \"private\"`, owner access.",
      "- If content should be public after publishing: `visibility: \"mixed\"`, `owner-or-public` read/list defaults.",
      "- If team/workspace semantics are important: `ownership: \"workspace\"`, `workspace-member` access, and explicit `policies.memberships`.",
    ]),
    section("Minimal But Product-Shaped Workflow", [
      codeBlock(
        [
          "stylyf intro --topic ui > STYLYF_UI.md",
          "stylyf intro --topic data > STYLYF_DATA.md",
          "stylyf search \"dashboard stats activity table filters\" --limit 12",
          "stylyf inspect component data-table-shell",
          "stylyf validate --spec stylyf.spec.json",
          "stylyf plan --spec stylyf.spec.json --resolved > stylyf.resolved.json",
          "stylyf generate --spec stylyf.spec.json --target ./app --no-install",
          "cd ./app && npm install && npm run check && npm run build",
        ].join("\n"),
        "bash",
      ),
    ]),
    section("Do Not Guess", [
      "- Do not invent component props: run `stylyf inspect component <id>` and use its `props` contract.",
      "- Do not use owner access on `ownership: \"none\"` or workspace access on non-workspace objects; validation rejects that.",
      "- Do not use GET request bodies; use query params.",
      "- Do not expose raw storage credentials to the browser; storage is presigned URL based.",
      "- Do not depend on the CLI package after generation; generated apps are standalone.",
    ]),
  ].join("\n");
}

function renderSpecTopic() {
  return [
    "# Stylyf v1.0 Spec",
    "",
    "The public DSL type is `SpecV10`. Start small, then layer only the depth needed by the product. The generator expands public intent into a richer private app model; inspect that model with `stylyf plan --resolved`.",
    "",
    section("Canonical Portable Example", [json(portableRichExample())]),
    section("Canonical Hosted Example", [json(hostedRichExample())]),
    section("Top-Level Fields", [
      "- `version`: must be `1.0`.",
      "- `app`: `name`, `kind`, optional `description`.",
      "- `backend`: `mode: \"portable\" | \"hosted\"`; portable may choose `sqlite` or `postgres`.",
      "- `media`: storage mode and upload policy: `none`, `basic`, `rich`, size/type/key/expiry/delete settings.",
      "- `experience`: theme preset, light/dark/system mode, radius, density, spacing.",
      "- `actors` and `policies`: role/membership vocabulary for generated policy helpers.",
      "- `objects`: resources, fields, ownership, visibility, access, relations, and media attachments.",
      "- `flows`: workflow state machines for approvals, publishing, onboarding, CRUD, and saved results.",
      "- `surfaces`: high-level route/page intent.",
      "- `routes`: explicit route additions or replacements by path.",
      "- `apis`: explicit HTTP API routes with request/response contracts.",
      "- `server`: explicit query/action modules.",
      "- `database.schema`: extra tables/columns beyond resource-derived schema.",
      "- `env.extras`: additional server/public env vars.",
      "- `fixtures`: seed rows for generated resource fixtures.",
      "- `navigation`: primary/secondary/user/command menu overrides.",
      "- `deployment`: generated deployment notes for `none`, `node`, `docker`, or `systemd-caddy`.",
    ]),
    section("Validation Is Part Of Authoring", [
      "- `stylyf validate --spec spec.json` checks enum values, supported keys, references, component prop contracts, layout props, access/ownership compatibility, and API contract rules.",
      "- `stylyf plan --spec spec.json` shows generated files/routes/resources.",
      "- `stylyf plan --spec spec.json --resolved` prints the expanded private app model; use this to confirm defaults before generation.",
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
      "Best for ordinary SaaS apps or prompts that should not inherit CMS, internal-tool, or public utility assumptions.",
    ],
    "internal-tool": [
      "Default shape: authenticated sidebar app, dashboard, resource list/create/edit routes, settings, review queues, and operational forms.",
      "Best for admin panels, back offices, moderation, CRM-ish tools, workflow dashboards, and data operations.",
    ],
    "cms-site": [
      "Default shape: public content routes plus authenticated admin content management routes.",
      "Best for editorial sites, docs-like publishing, directories, resource libraries, and public content backed by review/publishing flows.",
    ],
    "free-saas-tool": [
      "Default shape: public landing, public tool route, optional saved-results dashboard, and no billing gateway.",
      "Best for funnel tools, calculators, validators, transformers, lightweight utilities, and lead magnets.",
    ],
  } satisfies Record<IntroKind, string[]>;

  return [
    `# Stylyf v1.0: ${labels[kind]}`,
    "",
    ...notes[kind],
    "",
    section("Minimal Spec", [json(specExample(kind))]),
    section("When To Add Depth", [
      "- Add `objects.fields` when domain shape matters.",
      "- Add `flows.transitions` when state changes need named actions/events.",
      "- Add `surfaces.sections` when the generated default page feels too generic.",
      "- Add `apis` for machine-facing endpoints or webhooks.",
      "- Add `server` for app-internal server queries/actions that route code can call.",
      "- Add `navigation` when route-derived nav is not the product navigation.",
    ]),
    section("Smoke Loop", [
      codeBlock(
        [
          `stylyf validate --spec ${kind}.json`,
          `stylyf plan --spec ${kind}.json --resolved`,
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

function renderUiTopic() {
  return [
    "# Stylyf v1.0 UI Composition",
    "",
    "UI is authored in layers: `experience` sets the global visual grammar, `surfaces` create page intent, `routes` override exact pages, `sections` arrange layout nodes, and component refs insert source-owned registry components.",
    "",
    section("Experience Grammar", [
      "- `theme`: `amber`, `emerald`, `pearl`, `opal`.",
      "- `mode`: `light`, `dark`, `system`.",
      "- `radius`: `edge`, `trim`, `soft`, `mellow`.",
      "- `density`: `compact`, `comfortable`, `relaxed`.",
      "- `spacing`: `tight`, `balanced`, `airy`.",
      "- Use these to match the product: utility tools often tolerate sharper/faster layouts; CMS sites often want more prose spacing; internal tools usually want density and low radius.",
    ]),
    section("Surfaces vs Routes", [
      "- Use `surfaces` first. They are intent-level and can derive shell/page/default sections.",
      "- Use `routes` when you need an exact route path, shell, page shell, access, metadata, or section replacement.",
      "- Surface kinds: `dashboard`, `list`, `detail`, `create`, `edit`, `settings`, `landing`, `content-index`, `content-detail`, `tool`.",
      "- App shells: `sidebar-app`, `topbar-app`, `docs-shell`, `marketing-shell`.",
      "- Page shells: `dashboard`, `resource-index`, `resource-detail`, `resource-create`, `resource-edit`, `settings`, `auth`, `blank`.",
    ]),
    section("Sections And Layout Nodes", [
      "- A section has `id`, `layout`, optional `props`, optional `bindings`, and `children`.",
      "- Layout nodes can nest: `stack`, `row`, `column`, `grid`, `split`, `panel`, `section`, `toolbar`, `content-frame`.",
      "- Children can be strings like `\"page-header\"`, component objects like `{ \"component\": \"filter-toolbar\", \"props\": {...} }`, or nested layout objects.",
      "- Prefer explicit component objects when passing props or bindings; strings are best for simple default components.",
      "- Layout props are validated; for example `grid` supports `cols`, `gap`, and `min`.",
    ]),
    section("UI Chunk Example", [
      json({
        surfaces: [
          {
            name: "Review Queue",
            kind: "list",
            object: "submissions",
            path: "/submissions",
            audience: "user",
            title: "Review Queue",
            bindings: [{ kind: "resource.list", resource: "submissions" }],
            sections: [
              {
                id: "queue-hero",
                layout: "content-frame",
                props: { width: "wide" },
                children: [
                  {
                    component: "page-header",
                    props: {
                      title: "Review Queue",
                      description: "Triage submissions, inspect assets, and move work through approval.",
                    },
                  },
                ],
              },
              {
                id: "queue-workspace",
                layout: "stack",
                props: { gap: "comfortable" },
                children: [
                  { layout: "toolbar", props: { wrap: true }, children: ["filter-toolbar", "bulk-action-bar"] },
                  { layout: "grid", props: { cols: 2, gap: "comfortable" }, children: ["data-table-shell", "detail-panel"] },
                ],
              },
            ],
          },
        ],
      }),
    ]),
    section("Bindings", [
      "- `resource.list`: list/index sections or components for a resource.",
      "- `resource.detail`: detail panel/page sections for a resource.",
      "- `resource.create`: create forms.",
      "- `resource.update`: edit/update forms.",
      "- `workflow.transition`: buttons or controls that trigger named flow transitions.",
      "- `attachment.lifecycle`: upload/confirm/replace/delete UI around a named object attachment.",
    ]),
    section("Component Discovery", [
      "- Search intent first: `stylyf search \"upload dropzone attachment\" --limit 12`.",
      "- Inspect before passing props: `stylyf inspect component media-upload-dropzone`.",
      "- Search results expose prop contracts, events, slots, controlled state, recommended bindings, a11y notes, import path, and composition hints.",
      "- The registry currently covers actions/navigation, form inputs/selection, disclosure/overlay, feedback/display, form systems, information/states, data views, and navigation/workflow.",
    ]),
    section("Navigation", [
      "- If omitted, Stylyf derives nav from non-dynamic routes.",
      "- Override `navigation.primary`, `secondary`, `userMenu`, and `commandMenu` when product navigation should differ from routes.",
      "- Nav items support `label`, `href`, optional `group`, `auth`, `role`, and `command`.",
    ]),
  ].join("\n");
}

function renderDataTopic() {
  return [
    "# Stylyf v1.0 Data, Resources, Policies",
    "",
    "`objects` are the central full-stack lego blocks. A good object definition can drive database schema, resource forms, list/detail/create/edit routes, server modules, policy helpers, attachments, fixtures, and workflow actions.",
    "",
    section("Object Grammar", [
      "- `name`: logical resource name; plural names are fine.",
      "- `table`: optional physical table name.",
      "- `label` and `purpose`: human-facing hints.",
      "- `ownership`: `none`, `user`, or `workspace`.",
      "- `visibility`: `private`, `public`, or `mixed`.",
      "- `access`: operation presets for `list`, `read`, `create`, `update`, `delete`.",
      "- `fields`: typed fields used for schema and forms.",
      "- `relations`: `belongs-to`, `has-many`, or `many-to-many` links to other objects.",
      "- `media`: named attachments on this resource.",
    ]),
    section("Fields", [
      "- Field types: `short-text`, `long-text`, `rich-text`, `number`, `boolean`, `date`, `datetime`, `status`, `slug`, `json`.",
      "- Field controls: `required`, `unique`, `indexed`, `default`, `options`.",
      "- Use `status` fields with `options` when workflows should mutate a named state field.",
    ]),
    section("Ownership And Access", [
      "- `ownership: \"user\"` supports `owner` and `owner-or-public` access.",
      "- `ownership: \"workspace\"` supports `workspace-member` access and membership policies.",
      "- `ownership: \"none\"` is for app-level/global resources; do not use owner/workspace access.",
      "- `visibility: \"mixed\"` is a good fit for CMS and publishable resources.",
      "- Validation rejects impossible combinations instead of silently normalizing them.",
    ]),
    section("Resource Example", [
      json({
        objects: [
          {
            name: "designs",
            ownership: "user",
            visibility: "mixed",
            access: { list: "owner-or-public", read: "owner-or-public", create: "user", update: "owner", delete: "owner" },
            fields: [
              { name: "title", type: "short-text", required: true },
              { name: "slug", type: "slug", required: true, unique: true },
              { name: "status", type: "status", options: ["draft", "review", "published"] },
              { name: "critique", type: "long-text" },
            ],
            media: [{ name: "previewImage", kind: "image", required: true }],
          },
        ],
      }),
    ]),
    section("Policies", [
      "- `policies.roles` declares role names such as `admin`, `editor`, `member`, `reviewer`.",
      "- `policies.memberships` declares the membership table and role/workspace/user fields.",
      "- `policies.actors` maps actor names used by flows to roles and memberships.",
      "- Defaults exist, but explicit policies are better for workspace-heavy apps.",
    ]),
    section("Database Extras", [
      "- Use `database.schema` for tables that are not resource objects: audit tables, integration state, snapshots, webhook deliveries, denormalized counters.",
      "- Column types: `text`, `varchar`, `integer`, `boolean`, `timestamp`, `jsonb`, `uuid`.",
      "- Table controls: `timestamps` and `softDelete`.",
    ]),
    section("Fixtures", [
      "- `fixtures` seed resource rows for generated local testing helpers.",
      "- Rows should match object field names and are intentionally simple JSON objects.",
    ]),
  ].join("\n");
}

function renderApiTopic() {
  return [
    "# Stylyf v1.0 API And Server Composition",
    "",
    "Use `server` for app-internal SolidStart query/action modules. Use `apis` for HTTP endpoints that external clients, webhooks, or browser fetches should call directly.",
    "",
    section("Server Modules", [
      "- `server[].name`: stable module name; generated file names are slugified.",
      "- `server[].type`: `query` or `action`.",
      "- `server[].resource`: optional object name for resource-aware helpers.",
      "- `server[].auth`: `public` or `user`.",
      "- Good examples: `submissions.stats`, `articles.related`, `toolRuns.create`, `settings.updateProfile`.",
    ]),
    section("API Routes", [
      "- `path`: route path such as `/api/health` or `/api/webhooks/github`.",
      "- `method`: `GET`, `POST`, `PATCH`, `DELETE`.",
      "- `type`: `json`, `webhook`, or `presign-upload`.",
      "- `name`: stable contract name.",
      "- `auth`: `public` or `user`.",
      "- `request`: body/query/params/headers schema.",
      "- `response`: status/body schema.",
      "- `rateLimit`: declarative note with `window` and `max`.",
      "- `idempotency`: header requirement for mutation safety.",
      "- `webhook`: provider/signature/secret metadata; only valid on `type: \"webhook\"`.",
      "- `draft: true`: allowed for placeholder JSON/webhook routes when exact contracts are not ready.",
    ]),
    section("API Contract Example", [
      json({
        apis: [
          {
            path: "/api/ratings",
            method: "POST",
            type: "json",
            name: "createRating",
            auth: "user",
            request: {
              body: {
                targetId: { type: "uuid", required: true },
                score: { type: "integer", required: true, min: 1, max: 10 },
                comment: { type: "string" },
              },
            },
            response: {
              status: 201,
              body: {
                id: { type: "uuid", required: true },
                score: { type: "integer", required: true },
              },
            },
            rateLimit: { window: "minute", max: 30 },
            idempotency: { required: true, header: "Idempotency-Key" },
          },
        ],
      }),
    ]),
    section("Webhook Example", [
      json({
        apis: [
          {
            path: "/api/webhooks/github",
            method: "POST",
            type: "webhook",
            name: "githubWebhook",
            auth: "public",
            request: { headers: { "x-github-event": { type: "string", required: true } } },
            response: { status: 204 },
            webhook: { provider: "github", signatureHeader: "x-hub-signature-256", secretEnv: "GITHUB_WEBHOOK_SECRET" },
          },
        ],
        env: {
          extras: [{ name: "GITHUB_WEBHOOK_SECRET", exposure: "server", required: true }],
        },
      }),
    ]),
    section("Rules", [
      "- GET routes cannot have request bodies; use `request.query`.",
      "- `webhook` and `presign-upload` route types must use POST.",
      "- Non-presign routes need request/response contracts unless `draft: true` is explicit.",
      "- API contracts generate typed helpers/stubs; product-specific logic still belongs in the emitted app.",
    ]),
  ].join("\n");
}

function renderBackendTopic() {
  return [
    "# Stylyf v1.0 Backend",
    "",
    section("Portable Path", [
      "- Spec: `backend.mode: \"portable\"`.",
      "- Auth: Better Auth sessions and generated auth route.",
      "- Data: Drizzle ORM with SQLite/libsql or Postgres.",
      "- Local default: SQLite via `DATABASE_URL=file:./local.db`.",
      "- Generated app includes auth modules, DB modules, schema, guards, resource policies, workflow modules, seed helpers, migrations, and typed env.",
      "- Post-generate scripts include `auth:generate` and `db:generate` when applicable.",
    ]),
    section("Hosted Path", [
      "- Spec: `backend.mode: \"hosted\"`.",
      "- Auth: Supabase Auth, password and email OTP capable flows.",
      "- Data: Supabase SDK for data access, not Drizzle.",
      "- Generated app includes browser/server/admin Supabase clients, auth routes, middleware, callback route, schema SQL, policy SQL, and typed env.",
      "- Apply `supabase/schema.sql` and review/apply `supabase/policies.sql` before hosted CRUD testing.",
    ]),
    section("Environment Blocks", [
      "- All apps: `APP_BASE_URL`, `NODE_ENV`.",
      "- Portable auth: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`.",
      "- Portable database: `DATABASE_URL`, optional `DATABASE_AUTH_TOKEN` for libsql/Turso-like connections.",
      "- Hosted Supabase: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`.",
      "- Storage: `S3_BUCKET`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_ENDPOINT_URL_S3`, `S3_FORCE_PATH_STYLE`, optional `S3_PUBLIC_BASE_URL`.",
      "- Add app-specific values through `env.extras`.",
    ]),
    section("Backend Selection Guidance", [
      "- Use portable when the app should own auth/database abstractions, stay provider-agnostic, or smoke locally with SQLite.",
      "- Use hosted when Supabase is deliberately the auth+data platform and faster managed setup matters more than ORM portability.",
      "- Both paths use the same public resource/workflow/media/API grammar where possible.",
    ]),
  ].join("\n");
}

function renderMediaTopic() {
  return [
    "# Stylyf v1.0 Media",
    "",
    "`media` controls object-storage capability, while `objects[].media` controls resource-specific attachments. Storage is always server-owned and browser access is presigned.",
    "",
    section("Global Media Modes", [
      "- `none`: no S3/Tigris storage module or attachment lifecycle routes.",
      "- `basic`: one generic file attachment on media-capable objects.",
      "- `rich`: image/document attachment defaults plus metadata tables and lifecycle helpers.",
    ]),
    section("Global Media Policy", [
      "- `maxFileSizeBytes`: generated server-side guard value.",
      "- `allowedContentTypes`: allowlist checked before presign.",
      "- `keyPrefix`: object key prefix for the app or environment.",
      "- `presignExpiresSeconds`: signed URL expiry.",
      "- `objectPolicy`: `private` or `public` metadata posture.",
      "- `deleteMode`: `soft` or `hard` delete semantics.",
    ]),
    section("Attachment Lifecycle", [
      "- Create upload intent on the server.",
      "- Browser uploads directly to S3-compatible storage using the presigned URL.",
      "- Confirm upload metadata into the database.",
      "- Replace or delete through server-owned helpers/routes.",
      "- Keep raw object-storage credentials server-side only.",
    ]),
    section("Attachment Example", [
      json({
        media: {
          mode: "rich",
          maxFileSizeBytes: 5242880,
          allowedContentTypes: ["image/png", "image/jpeg", "application/pdf"],
          keyPrefix: "ugc-assets",
          deleteMode: "soft",
        },
        objects: [
          {
            name: "posts",
            media: [
              { name: "preview", kind: "image", required: true },
              { name: "sourceFiles", kind: "document", multiple: true },
            ],
          },
        ],
      }),
    ]),
  ].join("\n");
}

function renderCompositionTopic() {
  return [
    "# Stylyf v1.0 Composition",
    "",
    "Composition is explicit and additive. Start with a base spec, then merge named JSON chunks with `stylyf compose`. There is no directory magic and no hidden globbing; the agent chooses the chunks consciously.",
    "",
    section("Chunk Workflow", [
      codeBlock(
        [
          "stylyf new generic --name \"Atlas\" --backend portable --media rich --output stylyf.base.json",
          "stylyf compose --base stylyf.base.json --with data.chunk.json --with ui.chunk.json --with api.chunk.json --output stylyf.spec.json",
          "stylyf validate --spec stylyf.spec.json",
          "stylyf plan --spec stylyf.spec.json --resolved",
          "stylyf generate --spec stylyf.spec.json --target ./atlas",
        ].join("\n"),
        "bash",
      ),
    ]),
    section("Data Chunk", [
      json({
        objects: [
          {
            name: "records",
            fields: [
              { name: "title", type: "short-text", required: true },
              { name: "status", type: "status", options: ["draft", "review", "published"] },
            ],
            media: [{ name: "cover", kind: "image" }],
          },
        ],
        flows: [{ name: "recordReview", object: "records", kind: "approval" }],
      }),
    ]),
    section("UI Chunk", [
      json({
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
                  { component: "page-header", props: { title: "Records", description: "Review and organize records." } },
                  {
                    layout: "grid",
                    props: { cols: 2, gap: "comfortable" },
                    children: [{ component: "filter-toolbar" }, { component: "bulk-action-bar" }],
                  },
                  { component: "data-table-shell" },
                ],
              },
            ],
          },
        ],
      }),
    ]),
    section("API Chunk", [
      json({
        apis: [
          {
            path: "/api/health",
            method: "GET",
            type: "json",
            name: "health",
            auth: "public",
            response: { status: 200, body: { ok: { type: "boolean", required: true } } },
          },
        ],
        server: [{ name: "records.stats", type: "query", resource: "records", auth: "user" }],
        env: { extras: [{ name: "PUBLIC_ANALYTICS_ID", exposure: "public", required: false }] },
      }),
    ]),
    section("Merge Rules", [
      "- Later chunks override earlier chunks when stable keys match.",
      "- `objects` merge by `name`; object `fields` and `media` merge by `name`; relations merge by relation identity.",
      "- `flows` merge by `name`; flow `transitions` merge by transition name.",
      "- `surfaces` merge by `path`, or by kind/object/name identity if no path exists.",
      "- `routes` merge by `path`.",
      "- `apis` merge by `method:path`.",
      "- `server`, `actors`, `env.extras`, and fixtures merge by `name`/resource keys.",
      "- `database.schema` merges by table; columns merge by name.",
    ]),
  ].join("\n");
}

function renderOperationsTopic() {
  return [
    "# Stylyf v1.0 Operations",
    "",
    "This is the validation and handoff checklist for agents. Use it before trusting a scaffold.",
    "",
    section("Before Generation", [
      "- Run `stylyf validate --spec stylyf.spec.json`.",
      "- Run `stylyf plan --spec stylyf.spec.json` for a human summary.",
      "- Run `stylyf plan --spec stylyf.spec.json --resolved` when you need to inspect exact expanded routes/resources/auth/storage/server/API models.",
      "- Use `stylyf generate --no-install` if you want to inspect `package.json`, emitted files, and dependency footprint before npm install.",
    ]),
    section("NPM Transparency", [
      "- When install is enabled, Stylyf runs npm operations visibly with command, cwd, streamed output, and elapsed time.",
      "- Portable Better Auth + Drizzle generation may run `auth:generate` and `db:generate` after dependency install.",
      "- The generated app's `package.json` is standalone; inspect it before install if dependency footprint matters.",
    ]),
    section("Generated App Checks", [
      codeBlock(
        [
          "cd ./generated-app",
          "npm run env:check",
          "npm run check",
          "npm run build",
          "npm run test:smoke",
        ].join("\n"),
        "bash",
      ),
    ]),
    section("Hosted Supabase Checklist", [
      "- Fill generated `.env` values for Supabase and S3/Tigris.",
      "- Apply `supabase/schema.sql`.",
      "- Review and apply `supabase/policies.sql`; do not treat generated RLS as final without product review.",
      "- Smoke auth, CRUD, and storage with real hosted env values.",
    ]),
    section("Deployment Profile", [
      "- `deployment.profile: \"none\"`: no deployment notes beyond generic scripts.",
      "- `node`: generated notes for Node/Vinxi runtime.",
      "- `docker`: generated Docker-oriented notes.",
      "- `systemd-caddy`: generated systemd/Caddy-oriented deployment notes.",
      "- Deployment profiles are handoff aids; final infra hardening remains app/deployment-specific.",
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
      "- `package.json`, `app.config.ts`, `tsconfig.json`, `postcss.config.mjs`.",
      "- `src/app.tsx`, `src/app.css`, `src/entry-client.tsx`, `src/entry-server.tsx`.",
      "- `src/routes/**` for pages and API routes.",
      "- `src/components/**` for copied registry components and generated resource forms.",
      "- `src/lib/**` for auth, env, data, storage, resources, workflows, observability, test factories, and guards.",
      "- `scripts/seed.ts`, generated Playwright smoke tests, and generated handoff docs.",
      "- `stylyf.spec.json` and `stylyf.plan.json` preserve the generation contract.",
    ]),
    section("Standalone Contract", [
      "- No runtime imports from `@depths/stylyf-cli`.",
      "- No runtime imports from this monorepo.",
      "- Generated source is meant to be edited normally after scaffold.",
      "- Stylyf helps eliminate repeatable setup; product-specific behavior still belongs in the generated app.",
    ]),
  ].join("\n");
}

function componentInventoryLines(registry: AssemblyItem[]) {
  const byCluster = new Map<string, AssemblyItem[]>();
  for (const item of registry) {
    byCluster.set(item.clusterLabel, [...(byCluster.get(item.clusterLabel) ?? []), item]);
  }

  return [...byCluster.entries()].flatMap(([cluster, items]) => [
    `### ${cluster}`,
    "",
    ...items.map(item => {
      const props = item.props.length > 0 ? ` props: ${item.props.map(prop => `${prop.name}:${prop.type}`).join(", ")}` : "";
      const bindings = item.recommendedBindings.length > 0 ? ` bindings: ${item.recommendedBindings.join(", ")}` : "";
      return `- ${item.slug}: ${item.description}${props}${bindings}`;
    }),
    "",
  ]);
}

async function renderFullTopic() {
  const [themeGrammar, registry] = await Promise.all([loadThemeGrammar(), loadAssemblyRegistry()]);
  return [
    renderOverview(),
    renderOperatorTopic(),
    renderSpecTopic(),
    renderUiTopic(),
    renderDataTopic(),
    renderApiTopic(),
    renderBackendTopic(),
    renderMediaTopic(),
    renderCompositionTopic(),
    renderOperationsTopic(),
    renderGeneratedOutputTopic(),
    section("Theme Grammar", [
      `- presets: ${themeGrammar.presets.join(", ")}`,
      `- modes: ${themeGrammar.modes.join(", ")}`,
      `- radii: ${themeGrammar.radii.join(", ")}`,
      `- density: ${themeGrammar.density.join(", ")}`,
      `- spacing: ${themeGrammar.spacing.join(", ")}`,
      "- Always pair this with a product-specific design pass after generation.",
    ]),
    ["## Component Inventory", "", ...componentInventoryLines(registry)].join("\n"),
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
  } else if (topic === "operator") {
    markdown = renderOperatorTopic();
  } else if (topic === "spec") {
    markdown = renderSpecTopic();
  } else if (topic === "ui") {
    markdown = renderUiTopic();
  } else if (topic === "data") {
    markdown = renderDataTopic();
  } else if (topic === "api") {
    markdown = renderApiTopic();
  } else if (topic === "backend") {
    markdown = renderBackendTopic();
  } else if (topic === "media") {
    markdown = renderMediaTopic();
  } else if (topic === "composition") {
    markdown = renderCompositionTopic();
  } else if (topic === "operations") {
    markdown = renderOperationsTopic();
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
