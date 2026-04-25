import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoDir = resolve(scriptDir, "..");
const packageDir = resolve(repoDir, "packages/stylyf-cli");

const internalRichSpec = {
  version: "1.0",
  app: {
    name: "Pack Verify Internal",
    kind: "internal-tool",
  },
  backend: {
    mode: "portable",
    portable: {
      database: "sqlite",
    },
  },
  media: {
    mode: "rich",
    maxFileSizeBytes: 10485760,
    allowedContentTypes: ["image/png", "image/jpeg", "application/pdf"],
    keyPrefix: "workspace-uploads",
    presignExpiresSeconds: 600,
    objectPolicy: "private",
    deleteMode: "soft",
  },
  policies: {
    roles: [
      { name: "admin" },
      { name: "editor" },
      { name: "member" },
    ],
    memberships: [
      {
        name: "workspace",
        table: "workspace_memberships",
        userField: "user_id",
        workspaceField: "workspace_id",
        roleField: "role",
        roles: ["admin", "editor", "member"],
      },
    ],
    actors: [
      { actor: "admin", role: "admin", membership: "workspace" },
      { actor: "editor", role: "editor", membership: "workspace" },
      { actor: "member", role: "member", membership: "workspace" },
    ],
  },
  objects: [
    {
      name: "tickets",
      ownership: "user",
      visibility: "private",
      fields: [
        { name: "title", type: "short-text", required: true, indexed: true },
        { name: "status", type: "status", options: ["draft", "review", "approved"], default: "draft" },
        { name: "summary", type: "long-text" },
      ],
    },
    {
      name: "projects",
      ownership: "workspace",
      visibility: "private",
      fields: [
        { name: "name", type: "short-text", required: true },
        { name: "status", type: "status", options: ["active", "paused"] },
      ],
    },
  ],
  flows: [{ name: "ticketApproval", object: "tickets", kind: "approval" }],
  fixtures: [
    {
      resource: "tickets",
      rows: [{ title: "Seed ticket", status: "draft", summary: "Generated fixture row" }],
    },
  ],
};

const hostedRichSpec = {
  ...internalRichSpec,
  app: {
    name: "Pack Verify Hosted",
    kind: "internal-tool",
  },
  backend: {
    mode: "hosted",
  },
};

const genericSpec = {
  version: "1.0",
  app: {
    name: "Pack Verify Generic",
    kind: "generic",
  },
  backend: {
    mode: "portable",
    portable: {
      database: "sqlite",
    },
  },
  media: {
    mode: "basic",
  },
  deployment: {
    profile: "docker",
    serviceName: "pack-verify-generic",
  },
  objects: [
    {
      name: "records",
      ownership: "user",
      visibility: "private",
      fields: [
        { name: "title", type: "short-text", required: true },
        { name: "status", type: "status", options: ["draft", "active", "archived"] },
      ],
    },
  ],
  surfaces: [
    {
      name: "Records Inbox",
      kind: "list",
      object: "records",
      path: "/inbox",
      audience: "user",
      bindings: [{ kind: "resource.list", resource: "records" }],
    },
    {
      name: "Record Detail",
      kind: "detail",
      object: "records",
      path: "/inbox/:id",
      audience: "user",
      bindings: [{ kind: "resource.detail", resource: "records" }],
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
          route: { type: "string", required: true },
        },
      },
      rateLimit: { window: "minute", max: 60 },
    },
  ],
};

const freeToolSpec = {
  version: "1.0",
  app: {
    name: "Pack Verify Free Tool",
    kind: "free-saas-tool",
  },
  backend: {
    mode: "portable",
    portable: {
      database: "sqlite",
    },
  },
  media: {
    mode: "basic",
  },
  flows: [{ name: "savedResults", object: "tool_runs", kind: "saved-results" }],
};

const cmsSpec = {
  version: "1.0",
  app: {
    name: "Pack Verify CMS",
    kind: "cms-site",
  },
  backend: {
    mode: "portable",
    portable: {
      database: "sqlite",
    },
  },
  media: {
    mode: "basic",
  },
};

async function run(cmd, args, cwd) {
  return execFileAsync(cmd, args, {
    cwd,
    maxBuffer: 1024 * 1024 * 60,
  });
}

async function assertCommandFails(cmd, args, cwd, expectedText) {
  try {
    await run(cmd, args, cwd);
  } catch (error) {
    const output = `${error.stdout ?? ""}\n${error.stderr ?? ""}`;
    if (expectedText && !output.includes(expectedText)) {
      throw new Error(`Expected failed command output to include "${expectedText}", got:\n${output}`);
    }
    return;
  }

  throw new Error(`Expected command to fail: ${cmd} ${args.join(" ")}`);
}


async function assertFile(path) {
  try {
    await readFile(path, "utf8");
  } catch {
    throw new Error(`Missing expected file: ${path}`);
  }
}

async function assertNoRuntimeStylyfImports(root, label) {
  const candidatePaths = [
    "src",
    "package.json",
    "vite.config.ts",
    "app.config.ts",
    "tsconfig.json",
    "drizzle.config.ts",
    "eslint.config.js",
  ];
  const existingPaths = [];
  for (const candidatePath of candidatePaths) {
    try {
      await readFile(resolve(root, candidatePath), "utf8");
      existingPaths.push(candidatePath);
    } catch {
      if (candidatePath === "src") {
        existingPaths.push(candidatePath);
      }
    }
  }

  const { stdout } = await run(
    "rg",
    [
      "-n",
      "/root/stylyf|@depths/stylyf-cli|@stylyf/cli",
      ...existingPaths,
    ],
    root,
  ).catch(error => {
    if (error.code === 1) {
      return { stdout: "" };
    }
    throw error;
  });

  if (stdout.trim()) {
    throw new Error(`${label} still references the repo or CLI package:\n${stdout}`);
  }
}


async function writeJson(path, value) {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

async function newestTarballPath(directory) {
  const entries = await readdir(directory);
  const tarballs = await Promise.all(
    entries
      .filter(entry => entry.endsWith(".tgz"))
      .map(async entry => {
        const path = resolve(directory, entry);
        const stats = await stat(path);
        return { path, mtimeMs: stats.mtimeMs };
      }),
  );

  tarballs.sort((left, right) => right.mtimeMs - left.mtimeMs);
  return tarballs[0]?.path;
}

async function packCliTarball(packRoot) {
  const packDestination = resolve(packRoot, "tarballs");
  await mkdir(packDestination, { recursive: true });

  const { stdout } = await run("npm", ["pack", "--json", "--pack-destination", packDestination], packageDir);
  const trimmed = stdout.trim();
  if (trimmed) {
    const [packResult] = JSON.parse(trimmed);
    if (packResult?.filename) {
      return resolve(packDestination, packResult.filename);
    }
  }

  const tarballPath = await newestTarballPath(packDestination);
  if (!tarballPath) {
    throw new Error("npm pack did not return JSON and no tarball was found in the pack destination");
  }
  return tarballPath;
}

async function main() {
  process.stdout.write("Type checking CLI package...\n");
  await run("npm", ["--prefix", packageDir, "run", "check"], repoDir);

  process.stdout.write("Building CLI package assets...\n");
  await run("npm", ["run", "cli:build"], repoDir);

  const packRoot = await mkdtemp(join(tmpdir(), "stylyf-pack-"));
  const verifyRoot = resolve(packRoot, "verify-install");
  await mkdir(verifyRoot, { recursive: true });

  process.stdout.write("Packing CLI tarball...\n");
  const tarballPath = await packCliTarball(packRoot);
  const { stdout: tarList } = await run("tar", ["-tf", tarballPath], packageDir);
  const tarEntries = tarList.split("\n").filter(Boolean);
  const requiredEntries = [
    "package/dist/bin.js",
    "package/dist/manifests/generated/theme-grammar.json",
    "package/dist/manifests/generated/assembly-registry.json",
    "package/dist/manifests/generated/backend-manifests.json",
    "package/dist/templates/app-shells/sidebar-app.tsx.tpl",
    "package/dist/templates/server-functions/list-query.ts.tpl",
    "package/dist/templates/api-routes/presign-upload.ts.tpl",
    "package/dist/assets/source/src/app.css",
    "package/dist/assets/source/src/components/registry/actions-navigation/button.tsx",
  ];

  for (const entry of requiredEntries) {
    if (!tarEntries.includes(entry)) {
      throw new Error(`Packed tarball is missing required entry: ${entry}`);
    }
  }
  if (tarEntries.some(entry => entry.startsWith("package/dist/ir/"))) {
    throw new Error("Packed tarball still contains the removed public v0.3 IR layer");
  }

  process.stdout.write("Installing packed CLI outside the repo...\n");
  await writeJson(resolve(verifyRoot, "package.json"), {
    name: "stylyf-pack-verify",
    private: true,
    type: "module",
  });

  await run("npm", ["install", tarballPath], verifyRoot);

  const stylyfBin = resolve(verifyRoot, "node_modules/.bin/stylyf");
  process.stdout.write("Smoke testing installed CLI commands...\n");
  await run(stylyfBin, ["--help"], verifyRoot);
  await run(stylyfBin, ["doctor"], verifyRoot);
  const { stdout: inspectedComponent } = await run(stylyfBin, ["inspect", "component", "data-table-shell"], verifyRoot);
  if (!inspectedComponent.includes("recommendedBindings") || !inspectedComponent.includes("defaultDataShape")) {
    throw new Error("stylyf inspect component did not return enriched component contracts.");
  }

  await run(stylyfBin, ["intro", "--output", "STYLYF_INTRO.md"], verifyRoot);
  await run(stylyfBin, ["intro", "--topic", "spec", "--output", "STYLYF_SPEC.md"], verifyRoot);
  await run(stylyfBin, ["intro", "--kind", "internal-tool", "--output", "STYLYF_INTERNAL.md"], verifyRoot);

  const intro = await readFile(resolve(verifyRoot, "STYLYF_INTRO.md"), "utf8");
  const specIntro = await readFile(resolve(verifyRoot, "STYLYF_SPEC.md"), "utf8");
  if (!intro.includes("generic") || !intro.includes("internal-tool") || !intro.includes("Supabase") || !intro.includes("Tigris/S3-compatible")) {
    throw new Error("Generated intro overview does not mention v1.0 app kinds and backend paths");
  }
  if (!specIntro.includes("SpecV10") || !specIntro.includes("objects") || !specIntro.includes("flows") || !specIntro.includes("surfaces")) {
    throw new Error("Generated spec intro topic does not explain the v1.0 DSL");
  }

  for (const kind of ["generic", "internal-tool", "cms-site", "free-saas-tool"]) {
    const output = `new-command-${kind}.spec.json`;
    await run(
      stylyfBin,
      ["new", kind, "--name", `New Command Verify ${kind}`, "--backend", "portable", "--media", "rich", "--output", output],
      verifyRoot,
    );
    await run(stylyfBin, ["validate", "--spec", output], verifyRoot);
    await run(stylyfBin, ["plan", "--spec", output, "--json"], verifyRoot);
  }
  const { stdout: componentSearchJson } = await run(stylyfBin, ["search", "data-table-shell", "--json", "--limit", "1"], verifyRoot);
  const [componentSearchResult] = JSON.parse(componentSearchJson);
  if (
    !componentSearchResult?.slots ||
    !componentSearchResult?.controlledState ||
    !componentSearchResult?.recommendedBindings?.includes("resource.list") ||
    !componentSearchResult?.defaultDataShape
  ) {
    throw new Error("Component search JSON is missing enriched machine-operable inventory contracts.");
  }
  const { stdout: filterToolbarInspectJson } = await run(stylyfBin, ["inspect", "component", "filter-toolbar", "--json"], verifyRoot);
  const filterToolbarInspectResult = JSON.parse(filterToolbarInspectJson);
  const selectionCountContract = filterToolbarInspectResult?.props?.find(prop => prop.name === "selectionCount");
  if (selectionCountContract?.type !== "number") {
    throw new Error("Component prop contracts must be source-backed: filter-toolbar.selectionCount should be a number.");
  }

  const aliasLayoutSpec = {
    ...genericSpec,
    surfaces: [
      {
        name: "Alias Grid",
        kind: "list",
        object: "records",
        path: "/alias-grid",
        audience: "user",
        sections: [
          {
            layout: "grid",
            props: { columns: 2 },
            children: ["data-table-shell"],
          },
        ],
      },
    ],
  };
  const invalidLayoutSpec = {
    ...genericSpec,
    surfaces: [
      {
        name: "Invalid Grid",
        kind: "list",
        object: "records",
        path: "/invalid-grid",
        audience: "user",
        sections: [
          {
            layout: "grid",
            props: { columns: 8 },
            children: ["data-table-shell"],
          },
        ],
      },
    ],
  };
  const invalidComponentPropSpec = {
    ...genericSpec,
    surfaces: [
      {
        name: "Invalid Component Props",
        kind: "list",
        object: "records",
        path: "/invalid-component-props",
        audience: "user",
        sections: [
          {
            layout: "toolbar",
            children: [
              {
                component: "filter-toolbar",
                props: { selectionCount: true },
              },
            ],
          },
        ],
      },
    ],
  };
  const invalidOwnerAccessSpec = {
    ...genericSpec,
    objects: [
      {
        name: "catalog_items",
        ownership: "none",
        fields: [{ name: "title", type: "short-text", required: true }],
        access: { update: "owner" },
      },
    ],
  };
  const invalidWorkspaceAccessSpec = {
    ...genericSpec,
    objects: [
      {
        name: "catalog_items",
        ownership: "user",
        fields: [{ name: "title", type: "short-text", required: true }],
        access: { read: "workspace-member" },
      },
    ],
  };
  const invalidApiGetBodySpec = {
    ...genericSpec,
    apis: [
      {
        path: "/api/search",
        method: "GET",
        type: "json",
        name: "search",
        request: { body: { term: { type: "string", required: true } } },
        response: { body: { ok: { type: "boolean", required: true } } },
      },
    ],
  };
  const invalidApiDraftSpec = {
    ...genericSpec,
    apis: [
      {
        path: "/api/placeholder",
        method: "POST",
        type: "json",
        name: "placeholder",
      },
    ],
  };

  await writeJson(resolve(verifyRoot, "alias-layout.spec.json"), aliasLayoutSpec);
  await writeJson(resolve(verifyRoot, "invalid-layout.spec.json"), invalidLayoutSpec);
  await writeJson(resolve(verifyRoot, "invalid-component-prop.spec.json"), invalidComponentPropSpec);
  await writeJson(resolve(verifyRoot, "invalid-owner-access.spec.json"), invalidOwnerAccessSpec);
  await writeJson(resolve(verifyRoot, "invalid-workspace-access.spec.json"), invalidWorkspaceAccessSpec);
  await writeJson(resolve(verifyRoot, "invalid-api-get-body.spec.json"), invalidApiGetBodySpec);
  await writeJson(resolve(verifyRoot, "invalid-api-draft.spec.json"), invalidApiDraftSpec);
  await run(stylyfBin, ["validate", "--spec", "alias-layout.spec.json"], verifyRoot);
  const { stdout: resolvedAliasPlan } = await run(stylyfBin, ["plan", "--spec", "alias-layout.spec.json", "--resolved"], verifyRoot);
  if (!resolvedAliasPlan.includes('"cols": 2') || resolvedAliasPlan.includes('"columns"')) {
    throw new Error("Documented grid.columns alias was not normalized to grid.cols in the resolved plan.");
  }
  await assertCommandFails(stylyfBin, ["validate", "--spec", "invalid-layout.spec.json"], verifyRoot, "props.cols must be one of");
  await assertCommandFails(stylyfBin, ["validate", "--spec", "invalid-component-prop.spec.json"], verifyRoot, "selectionCount must be a number");
  await assertCommandFails(stylyfBin, ["validate", "--spec", "invalid-owner-access.spec.json"], verifyRoot, 'owner access requires ownership: "user"');
  await assertCommandFails(stylyfBin, ["validate", "--spec", "invalid-workspace-access.spec.json"], verifyRoot, 'workspace access requires ownership: "workspace"');
  await assertCommandFails(stylyfBin, ["validate", "--spec", "invalid-api-get-body.spec.json"], verifyRoot, "request.body is not supported for GET routes");
  await assertCommandFails(stylyfBin, ["validate", "--spec", "invalid-api-draft.spec.json"], verifyRoot, "must provide request/response contracts or set draft: true");

  await writeJson(resolve(verifyRoot, "generic.spec.json"), genericSpec);
  await writeJson(resolve(verifyRoot, "internal-rich.spec.json"), internalRichSpec);
  await writeJson(resolve(verifyRoot, "hosted-rich.spec.json"), hostedRichSpec);
  await writeJson(resolve(verifyRoot, "free-tool.spec.json"), freeToolSpec);
  await writeJson(resolve(verifyRoot, "cms.spec.json"), cmsSpec);
  const { stdout: resolvedGenericPlan } = await run(stylyfBin, ["plan", "--spec", "generic.spec.json", "--resolved"], verifyRoot);
  if (!resolvedGenericPlan.includes('"kind": "resource.list"') || !resolvedGenericPlan.includes('"kind": "resource.detail"')) {
    throw new Error("Resource bindings did not survive spec -> resolved App IR.");
  }
  const { stdout: deepValidation } = await run(stylyfBin, ["validate", "--spec", "generic.spec.json", "--deep"], verifyRoot);
  if (!deepValidation.includes("deep: true") || !deepValidation.includes("generated routes")) {
    throw new Error("stylyf validate --deep did not report generated contract checks.");
  }
  const { stdout: dryRunOutput } = await run(stylyfBin, ["generate", "--spec", "generic.spec.json", "--target", "./dry-run-target", "--dry-run"], verifyRoot);
  if (!dryRunOutput.includes('"dryRun": true') || !dryRunOutput.includes('"deployment": "docker"')) {
    throw new Error("stylyf generate --dry-run did not report planned operations.");
  }

  process.stdout.write("Generating/checking v1.0 archetypes in parallel...\n");
  await Promise.all([
    ["generic.spec.json", "./generated-generic"],
    ["internal-rich.spec.json", "./generated-internal"],
    ["free-tool.spec.json", "./generated-free-tool"],
    ["hosted-rich.spec.json", "./generated-hosted"],
    ["cms.spec.json", "./generated-cms"],
  ].map(async ([specPath, targetPath]) => {
    await run(stylyfBin, ["validate", "--spec", specPath], verifyRoot);
    await run(stylyfBin, ["plan", "--spec", specPath], verifyRoot);
    await run(stylyfBin, ["generate", "--spec", specPath, "--target", targetPath, "--no-install"], verifyRoot);
  }));

  const genericRoot = resolve(verifyRoot, "generated-generic");
  for (const relativePath of [
    "src/routes/inbox/index.tsx",
    "src/routes/inbox/[id].tsx",
    "src/routes/records/index.tsx",
    "src/routes/records/new.tsx",
    "src/routes/api/health.ts",
    "src/routes/api/readiness.ts",
    "src/api.contracts.json",
    "src/lib/server/observability.ts",
    "DEPLOYMENT.md",
    "Dockerfile",
    "playwright.config.ts",
    "tests/smoke/routes.spec.ts",
    "tests/smoke/auth.spec.ts",
    "tests/smoke/resource-forms.spec.ts",
    "src/lib/test/factories.ts",
    "src/components/generated-navigation.tsx",
    ".env.local.example",
    ".env.production.example",
    "src/lib/env.server.ts",
    "src/lib/env.public.ts",
    "src/lib/env.check.ts",
    "src/routes/login.tsx",
    "stylyf.spec.json",
    "stylyf.plan.json",
  ]) {
    await assertFile(resolve(genericRoot, relativePath));
  }
  const genericListRoute = await readFile(resolve(genericRoot, "src/routes/inbox/index.tsx"), "utf8");
  for (const expectedText of [
    'import { createAsync } from "@solidjs/router";',
    'import { listRecords } from "~/lib/server/queries/records-list";',
    "const recordsRows = createAsync(() => listRecords());",
    "<LoadingState",
    "<EmptyState",
    "<ErrorState",
  ]) {
    if (!genericListRoute.includes(expectedText)) {
      throw new Error(`Generated generic list route is missing data-bound route wiring: ${expectedText}`);
    }
  }
  const genericDetailRoute = await readFile(resolve(genericRoot, "src/routes/inbox/[id].tsx"), "utf8");
  for (const expectedText of [
    'import { createAsync, useParams } from "@solidjs/router";',
    'import { getRecords } from "~/lib/server/queries/records-detail";',
    "const params = useParams();",
    'const recordData = createAsync(() => getRecords(params.id ?? ""));',
    "<LoadingState",
    "<EmptyState",
    "<ErrorState",
  ]) {
    if (!genericDetailRoute.includes(expectedText)) {
      throw new Error(`Generated generic detail route is missing data-bound route wiring: ${expectedText}`);
    }
  }
  const genericApiRoute = await readFile(resolve(genericRoot, "src/routes/api/health.ts"), "utf8");
  for (const expectedText of [
    "const responseContract",
    "function validateSchema",
    "function jsonOk",
    "function jsonError",
    "Rate-limit contract: max 60 request(s) per minute",
    "return jsonOk(",
  ]) {
    if (!genericApiRoute.includes(expectedText)) {
      throw new Error(`Generated generic API route is missing contracted API wiring: ${expectedText}`);
    }
  }
  const apiContracts = await readFile(resolve(genericRoot, "src/api.contracts.json"), "utf8");
  if (!apiContracts.includes('"path": "/api/health"') || !apiContracts.includes('"rateLimit"')) {
    throw new Error("Generated API contracts summary does not include the contracted health route.");
  }
  const genericPackageJson = await readFile(resolve(genericRoot, "package.json"), "utf8");
  for (const expectedText of [
    '"test:smoke": "playwright test tests/smoke"',
    '"test:types": "tsc --noEmit"',
    '"env:check": "tsx src/lib/env.check.ts"',
    '"preflight": "npm run env:check && npm run check"',
    '"@playwright/test"',
    '"tsx"',
  ]) {
    if (!genericPackageJson.includes(expectedText)) {
      throw new Error(`Generated package is missing test harness package wiring: ${expectedText}`);
    }
  }
  const envModule = await readFile(resolve(genericRoot, "src/lib/env.ts"), "utf8");
  if (!envModule.includes('export { env } from "./env.server"') || !envModule.includes('export { publicEnv } from "./env.public"')) {
    throw new Error("Generated env.ts is not a thin server/public env re-export.");
  }
  const envCheck = await readFile(resolve(genericRoot, "src/lib/env.check.ts"), "utf8");
  if (!envCheck.includes("Stylyf env preflight failed") || !envCheck.includes("APP_BASE_URL")) {
    throw new Error("Generated env preflight module is missing required env validation.");
  }
  const routeSmoke = await readFile(resolve(genericRoot, "tests/smoke/routes.spec.ts"), "utf8");
  if (!routeSmoke.includes("/inbox") || !routeSmoke.includes("toBeLessThan(500)")) {
    throw new Error("Generated route smoke test does not cover generated routes safely.");
  }
  const generatedNavigation = await readFile(resolve(genericRoot, "src/components/generated-navigation.tsx"), "utf8");
  if (!generatedNavigation.includes("navigationConfig") || !generatedNavigation.includes("/inbox")) {
    throw new Error("Generated navigation config does not derive coherent route navigation.");
  }
  const genericIndexRoute = await readFile(resolve(genericRoot, "src/routes/inbox/index.tsx"), "utf8");
  if (!genericIndexRoute.includes("GeneratedNavigation")) {
    throw new Error("Generated app routes do not pass generated navigation into app shells.");
  }
  if (!genericIndexRoute.includes('name="robots" content="noindex"') || !genericIndexRoute.includes('name="description"')) {
    throw new Error("Generated private app routes are missing route metadata/noindex defaults.");
  }
  const readinessRoute = await readFile(resolve(genericRoot, "src/routes/api/readiness.ts"), "utf8");
  const observabilityModule = await readFile(resolve(genericRoot, "src/lib/server/observability.ts"), "utf8");
  if (!readinessRoute.includes("missingEnv") || !observabilityModule.includes("logInfo") || !observabilityModule.includes("logError")) {
    throw new Error("Generated app is missing observability/readiness baseline.");
  }
  const deploymentMarkdown = await readFile(resolve(genericRoot, "DEPLOYMENT.md"), "utf8");
  const dockerfile = await readFile(resolve(genericRoot, "Dockerfile"), "utf8");
  if (!deploymentMarkdown.includes("Profile: docker") || !dockerfile.includes("npm run build")) {
    throw new Error("Generated app is missing opt-in deployment profile scaffolding.");
  }
  await assertNoRuntimeStylyfImports(genericRoot, "Generated generic app");

  const internalRoot = resolve(verifyRoot, "generated-internal");

  for (const relativePath of [
    "src/lib/db/schema.ts",
    "src/lib/auth.ts",
    "src/lib/storage.ts",
    "src/lib/attachments.ts",
    "src/lib/workflows.ts",
    "src/lib/server/seed.ts",
    "scripts/seed.ts",
    "tests/factories/resources.ts",
    "src/routes/api/auth/[...auth].ts",
    "src/routes/login.tsx",
    "src/routes/api/attachments/intent.ts",
    "src/routes/tickets/new.tsx",
    "src/routes/tickets/[id]/edit.tsx",
    "HANDOFF.md",
    "LOCAL_SMOKE.md",
    "SECURITY_NOTES.md",
    "OPERATIONS.md",
    "stylyf.spec.json",
    "stylyf.plan.json",
  ]) {
    await assertFile(resolve(internalRoot, relativePath));
  }
  const internalSchema = await readFile(resolve(internalRoot, "src/lib/db/schema.ts"), "utf8");
  for (const expectedText of [
    'export const workspaceMemberships = sqliteTable("workspace_memberships"',
    'userId: text("user_id").notNull()',
    'workspaceId: text("workspace_id").notNull()',
    'role: text("role").notNull()',
    'index("tickets_title_idx").on(table.title)',
    'status: text("status").default("draft")',
  ]) {
    if (!internalSchema.includes(expectedText)) {
      throw new Error(`Generated portable app is missing membership policy schema: ${expectedText}`);
    }
  }
  const internalPolicy = await readFile(resolve(internalRoot, "src/lib/server/resource-policy.ts"), "utf8");
  for (const expectedText of [
    "export async function requireRole",
    "export async function requireWorkspaceMember",
    "export async function requireOwner",
    "export const membershipPolicies",
    "workspace_memberships",
  ]) {
    if (!internalPolicy.includes(expectedText)) {
      throw new Error(`Generated portable app is missing policy helper wiring: ${expectedText}`);
    }
  }
  const internalSeed = await readFile(resolve(internalRoot, "src/lib/server/seed.ts"), "utf8");
  if (!internalSeed.includes("Seed ticket") || !internalSeed.includes("runSeed")) {
    throw new Error("Generated portable app is missing explicit fixture-backed seed module.");
  }
  const internalFactories = await readFile(resolve(internalRoot, "tests/factories/resources.ts"), "utf8");
  if (!internalFactories.includes("makeTicketsFixture")) {
    throw new Error("Generated portable app is missing resource-aware test factories.");
  }
  const internalStorage = await readFile(resolve(internalRoot, "src/lib/storage.ts"), "utf8");
  for (const expectedText of [
    "storagePolicy",
    "10485760",
    "workspace-uploads",
    "allowedContentTypes",
    "assertUploadAllowed",
  ]) {
    if (!internalStorage.includes(expectedText)) {
      throw new Error(`Generated storage module is missing storage policy/lifecycle enforcement: ${expectedText}`);
    }
  }
  await assertNoRuntimeStylyfImports(internalRoot, "Generated portable app");

  const freeRoot = resolve(verifyRoot, "generated-free-tool");
  const { stdout: billingScan } = await run(
    "rg",
    ["-n", "\\b(stripe|billing|checkout|payment)\\b", "src", "package.json", "stylyf.spec.json", "stylyf.plan.json"],
    freeRoot,
  ).catch(error => {
    if (error.code === 1) {
      return { stdout: "" };
    }
    throw error;
  });
  if (billingScan.trim()) {
    throw new Error(`Generated free tool contains billing/payment language:\n${billingScan}`);
  }

  const cmsRoot = resolve(verifyRoot, "generated-cms");
  for (const relativePath of [
    "src/middleware.ts",
    "src/routes/admin/content/index.tsx",
    "src/routes/admin/content/new.tsx",
    "src/routes/admin/content/[id]/edit.tsx",
  ]) {
    await assertFile(resolve(cmsRoot, relativePath));
  }
  const cmsMiddleware = await readFile(resolve(cmsRoot, "src/middleware.ts"), "utf8");
  for (const protectedPath of ["/admin/content", "/admin/content/new", "/admin/content/:id/edit"]) {
    if (!cmsMiddleware.includes(protectedPath)) {
      throw new Error(`Generated CMS middleware does not protect ${protectedPath}`);
    }
  }
  const cmsAdminRoute = await readFile(resolve(cmsRoot, "src/routes/admin/content/index.tsx"), "utf8");
  if (!cmsAdminRoute.includes("SidebarAppShell")) {
    throw new Error("Generated CMS admin content index must use an authenticated app shell, not marketing shell.");
  }
  await assertNoRuntimeStylyfImports(cmsRoot, "Generated CMS app");

  const hostedRoot = resolve(verifyRoot, "generated-hosted");

  for (const relativePath of [
    "src/lib/supabase.ts",
    "src/lib/supabase-browser.ts",
    "src/lib/storage.ts",
    "src/lib/attachments.ts",
    "src/routes/api/auth/sign-up/password.ts",
    "src/routes/api/auth/sign-in/password.ts",
    "src/routes/login.tsx",
    "src/routes/auth/callback.ts",
    "src/routes/api/attachments/intent.ts",
    "supabase/schema.sql",
    "supabase/policies.sql",
  ]) {
    await assertFile(resolve(hostedRoot, relativePath));
  }
  const hostedPolicies = await readFile(resolve(hostedRoot, "supabase/policies.sql"), "utf8");
  for (const expectedText of [
    'alter table if exists public."workspace_memberships" enable row level security;',
    'create index if not exists "workspace_memberships_user_id_idx"',
    'create policy "workspace_memberships_select_own"',
    'create policy "workspace_memberships_insert_reserved"',
    '"workspace_id" in (select "workspace_id" from public."workspace_memberships"',
  ]) {
    if (!hostedPolicies.includes(expectedText)) {
      throw new Error(`Generated hosted app is missing policy-model Supabase RLS: ${expectedText}`);
    }
  }
  await assertNoRuntimeStylyfImports(hostedRoot, "Generated hosted app");

  process.stdout.write(
    [
      `Packed CLI tarball: ${tarballPath}`,
      `Verification root: ${verifyRoot}`,
      "Verified:",
      "  - tarball bundles dist manifests, templates, and source assets",
      "  - installed stylyf binary runs outside the repo",
      "  - doctor, inspect, validate --deep, and generate --dry-run operator commands work",
      "  - intro/new/validate/plan/generate v1.0 commands work",
      "  - component inventory search exposes slots/state/data-shape/binding metadata",
      "  - component prop contracts are source-backed and reject stale manifest type drift",
      "  - layout prop contracts validate values and normalize documented aliases",
      "  - invalid owner/workspace access semantics are rejected before generation",
      "  - API contract grammar rejects unsafe method/schema and placeholder defaults",
      "  - contracted API routes emit validation helpers and machine-readable API summary",
      "  - generated apps include Playwright smoke test harness and package scripts",
      "  - generated apps include split env profiles, thin env re-export, and env preflight",
      "  - generated apps include route-derived navigation config wired into shells",
      "  - generated routes include metadata tags and private noindex defaults",
      "  - generated apps include observability module, readiness route, and operations notes",
      "  - opt-in deployment profiles emit source-only deployment notes/files",
      "  - route bindings survive spec expansion into resolved app IR",
      "  - bound list/detail routes import generated queries and route-level loading/empty/error states",
      "  - generic app source honors explicit surface route hints",
      "  - CMS admin content routes are generated under authenticated app shell protection",
      "  - portable app generates membership policy schema and role/workspace/owner helpers",
      "  - database field defaults and indexes compile into generated Drizzle schema",
      "  - explicit seed modules and resource factories are generated without auto-running seed",
      "  - storage policy knobs compile into presign validation and key prefixing",
      "  - portable internal rich app source is generated with auth/data/media files",
      "  - free SaaS tool app generates and has no billing/payment surface",
      "  - hosted app generates membership-backed Supabase RLS policies",
      "  - hosted Supabase/Tigris app generates expected auth/data/storage files",
      "  - generated apps do not import the repo or CLI package",
    ].join("\n") + "\n",
  );

  await rm(tarballPath, { force: true });
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
