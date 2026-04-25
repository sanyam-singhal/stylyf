import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { AppIR } from "../compiler/generated-app.js";
import { writeGeneratedFile } from "./assets.js";

const execFileAsync = promisify(execFile);

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function renderGeneratedPackageJson(app: AppIR) {
  const scripts: Record<string, string> = {
    dev: "vinxi dev",
    build: "vinxi build",
    start: "vinxi start",
    preview: "vinxi preview",
    check: "tsc --noEmit",
    test: "npm run test:types && npm run test:smoke",
    "test:types": "tsc --noEmit",
    "test:e2e": "playwright test",
    "test:smoke": "playwright test tests/smoke",
    "env:check": "tsx src/lib/env.check.ts",
    seed: "tsx scripts/seed.ts",
    preflight: "npm run env:check && npm run check",
  };

  const dependencies: Record<string, string> = {
    "@solidjs/meta": "^0.29.4",
    "@solidjs/router": "^0.15.0",
    "@solidjs/start": "1.3.2",
    "class-variance-authority": "^0.7.1",
    clsx: "^2.1.1",
    "lucide-solid": "^1.8.0",
    "solid-js": "^1.9.12",
    "tailwind-merge": "^3.5.0",
    vinxi: "^0.5.7",
  };

  const devDependencies: Record<string, string> = {
    "@tailwindcss/postcss": "^4.2.2",
    "@playwright/test": "^1.57.0",
    "@types/node": "^25.6.0",
    tailwindcss: "^4.2.2",
    tsx: "^4.21.0",
    typescript: "^5.9.3",
  };

  if (app.database) {
    if (app.database.provider === "supabase") {
      dependencies["@supabase/ssr"] = "^0.10.2";
      dependencies["@supabase/supabase-js"] = "^2.104.0";
    } else {
      dependencies["drizzle-orm"] = "^0.45.2";
      if (app.database.dialect === "sqlite") {
        dependencies["@libsql/client"] = "^0.17.2";
      } else {
        dependencies.postgres = "^3.4.9";
      }
      devDependencies["drizzle-kit"] = "^0.31.10";
      scripts["db:generate"] = "drizzle-kit generate";
      scripts["db:migrate"] = "drizzle-kit migrate";
      scripts["db:studio"] = "drizzle-kit studio";
    }
  }

  if (app.auth) {
    if (app.auth.provider === "better-auth") {
      dependencies["better-auth"] = "^1.6.6";
      dependencies["@better-auth/drizzle-adapter"] = "^1.6.6";
      devDependencies["@better-auth/cli"] = "^1.4.21";
      scripts["auth:generate"] = "better-auth generate --config ./src/lib/auth-schema.config.ts --output ./src/lib/db/auth-schema.ts --yes";
      scripts["auth:sync"] = "npm run auth:generate && npm run db:generate";
      scripts["auth:secret"] = "better-auth secret";
    } else {
      dependencies["@supabase/ssr"] = "^0.10.2";
      dependencies["@supabase/supabase-js"] = "^2.104.0";
    }
  }

  if (app.storage) {
    dependencies["@aws-sdk/client-s3"] = "^3.883.0";
    dependencies["@aws-sdk/s3-request-presigner"] = "^3.883.0";
  }

  return JSON.stringify(
    {
      name: slugify(app.name),
      private: true,
      type: "module",
      scripts,
      dependencies,
      devDependencies,
      engines: {
        node: ">=22",
      },
    },
    null,
    2,
  );
}

function hasRouteProtection(app: AppIR) {
  return (app.auth?.protect ?? []).some(entry => entry.kind === "route" && entry.access === "user");
}

export function renderGeneratedAppConfig(app: AppIR) {
  if (app.auth?.provider === "supabase" || hasRouteProtection(app)) {
    return [
      'import { defineConfig } from "@solidjs/start/config";',
      "",
      "export default defineConfig({",
      '  middleware: "./src/middleware.ts",',
      "});",
      "",
    ].join("\n");
  }

  return ['import { defineConfig } from "@solidjs/start/config";', "", "export default defineConfig({});", ""].join("\n");
}

export function renderGeneratedPostcssConfig() {
  return ['export default {', '  plugins: {', '    "@tailwindcss/postcss": {},', "  },", "};", ""].join("\n");
}

export function renderGeneratedTsConfig() {
  return JSON.stringify(
    {
      compilerOptions: {
        target: "ESNext",
        module: "ESNext",
        moduleResolution: "bundler",
        allowSyntheticDefaultImports: true,
        esModuleInterop: true,
        jsx: "preserve",
        jsxImportSource: "solid-js",
        allowJs: true,
        strict: true,
        noEmit: true,
        skipLibCheck: true,
        types: ["vinxi/types/client", "node"],
        isolatedModules: true,
        paths: {
          "~/*": ["./src/*"],
        },
      },
    },
    null,
    2,
  );
}

export function renderGeneratedGitignore() {
  return [".output", ".vinxi", "dist", "node_modules", "", ".DS_Store", "Thumbs.db", ""].join("\n");
}

function renderGeneratedPlaywrightConfig() {
  return [
    'import { defineConfig, devices } from "@playwright/test";',
    "",
    "export default defineConfig({",
    '  testDir: "./tests",',
    "  timeout: 30_000,",
    "  expect: { timeout: 5_000 },",
    "  fullyParallel: true,",
    "  reporter: process.env.CI ? \"github\" : \"list\",",
    "  use: {",
    '    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000",',
    "    trace: \"on-first-retry\",",
    "  },",
    "  projects: [",
    '    { name: "chromium", use: { ...devices["Desktop Chrome"] } },',
    "  ],",
    "  webServer: {",
    '    command: "npm run dev -- --host 127.0.0.1",',
    '    url: "http://127.0.0.1:3000",',
    "    reuseExistingServer: !process.env.CI,",
    "    timeout: 120_000,",
    "  },",
    "});",
    "",
  ].join("\n");
}

function renderGeneratedRouteSmokeTest(app: AppIR) {
  const routes = app.routes.map(route => ({
    path: route.path.replace(/:([A-Za-z0-9_]+)/g, "sample-$1"),
    access: route.access ?? "user",
    title: route.title ?? route.path,
  }));

  return [
    'import { expect, test } from "@playwright/test";',
    "",
    `const routes = ${JSON.stringify(routes, null, 2)} as const;`,
    "",
    "for (const route of routes) {",
    "  test(`route ${route.path} responds without a server error`, async ({ page }) => {",
    "    const response = await page.goto(route.path);",
    "    expect(response?.status() ?? 0).toBeLessThan(500);",
    "    await expect(page.locator(\"body\")).toBeVisible();",
    "  });",
    "}",
    "",
  ].join("\n");
}

function renderGeneratedAuthSmokeTest(app: AppIR) {
  if (!app.auth) {
    return [
      'import { test } from "@playwright/test";',
      "",
      'test("auth scaffold is not enabled", async () => {',
      "  test.skip(true, \"This Stylyf spec did not request auth.\");",
      "});",
      "",
    ].join("\n");
  }

  return [
    'import { expect, test } from "@playwright/test";',
    "",
    'test("login route renders the generated auth form", async ({ page }) => {',
    '  const response = await page.goto("/login");',
    "  expect(response?.status() ?? 0).toBeLessThan(500);",
    '  await expect(page.getByLabel("Email")).toBeVisible();',
    '  await expect(page.getByLabel("Password")).toBeVisible();',
    "});",
    "",
  ].join("\n");
}

function renderGeneratedResourceFormsSmokeTest(app: AppIR) {
  const formRoutes = app.routes
    .filter(route => route.page === "resource-create" || route.page === "resource-edit")
    .map(route => ({
      path: route.path.replace(/:([A-Za-z0-9_]+)/g, "sample-$1"),
      page: route.page,
      resource: route.resource ?? "resource",
    }));

  if (formRoutes.length === 0) {
    return [
      'import { test } from "@playwright/test";',
      "",
      'test("resource form scaffold is not enabled", async () => {',
      "  test.skip(true, \"This Stylyf spec did not generate resource form routes.\");",
      "});",
      "",
    ].join("\n");
  }

  return [
    'import { expect, test } from "@playwright/test";',
    "",
    `const formRoutes = ${JSON.stringify(formRoutes, null, 2)} as const;`,
    "",
    "for (const route of formRoutes) {",
    "  test(`resource form route ${route.path} responds without a server error`, async ({ page }) => {",
    "    const response = await page.goto(route.path);",
    "    expect(response?.status() ?? 0).toBeLessThan(500);",
    "    await expect(page.locator(\"body\")).toBeVisible();",
    "  });",
    "}",
    "",
  ].join("\n");
}

function renderGeneratedTestFactories(app: AppIR) {
  const resources = app.resources?.map(resource => ({
    name: resource.name,
    fields: resource.fields ?? [],
  })) ?? [];

  return [
    `export const testResources = ${JSON.stringify(resources, null, 2)} as const;`,
    "",
    "export function uniqueTestEmail(prefix = \"stylyf\") {",
    "  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`;",
    "}",
    "",
    "export function sampleRecord(overrides: Record<string, unknown> = {}) {",
    "  return {",
    '    title: "Generated smoke record",',
    '    status: "draft",',
    "    ...overrides,",
    "  };",
    "}",
    "",
  ].join("\n");
}

export async function writeProjectScaffold(app: AppIR, targetPath: string) {
  await writeGeneratedFile(`${targetPath}/package.json`, `${renderGeneratedPackageJson(app)}\n`);
  await writeGeneratedFile(`${targetPath}/app.config.ts`, renderGeneratedAppConfig(app));
  await writeGeneratedFile(`${targetPath}/postcss.config.mjs`, renderGeneratedPostcssConfig());
  await writeGeneratedFile(`${targetPath}/tsconfig.json`, `${renderGeneratedTsConfig()}\n`);
  await writeGeneratedFile(`${targetPath}/.gitignore`, renderGeneratedGitignore());
  await writeGeneratedFile(`${targetPath}/playwright.config.ts`, renderGeneratedPlaywrightConfig());
  await writeGeneratedFile(`${targetPath}/tests/smoke/routes.spec.ts`, renderGeneratedRouteSmokeTest(app));
  await writeGeneratedFile(`${targetPath}/tests/smoke/auth.spec.ts`, renderGeneratedAuthSmokeTest(app));
  await writeGeneratedFile(`${targetPath}/tests/smoke/resource-forms.spec.ts`, renderGeneratedResourceFormsSmokeTest(app));
  await writeGeneratedFile(`${targetPath}/src/lib/test/factories.ts`, renderGeneratedTestFactories(app));
}

export async function installGeneratedProjectDependencies(targetPath: string) {
  await execFileAsync("npm", ["install"], {
    cwd: targetPath,
    maxBuffer: 1024 * 1024 * 20,
  });
}

export async function runGeneratedProjectScript(targetPath: string, scriptName: string) {
  await execFileAsync("npm", ["run", scriptName], {
    cwd: targetPath,
    maxBuffer: 1024 * 1024 * 20,
  });
}
