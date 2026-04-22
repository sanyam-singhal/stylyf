import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { AppIR } from "../ir/types.js";
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
    "@types/node": "^25.6.0",
    tailwindcss: "^4.2.2",
    typescript: "^5.9.3",
  };

  if (app.database) {
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

  if (app.auth) {
    dependencies["better-auth"] = "^1.6.6";
    dependencies["@better-auth/drizzle-adapter"] = "^1.6.6";
    devDependencies["@better-auth/cli"] = "^1.4.21";
    scripts["auth:generate"] = "better-auth generate --config ./src/lib/auth-schema.config.ts --output ./src/lib/db/auth-schema.ts --yes";
    scripts["auth:sync"] = "npm run auth:generate && npm run db:generate";
    scripts["auth:secret"] = "better-auth secret";
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

export function renderGeneratedAppConfig() {
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

export async function writeProjectScaffold(app: AppIR, targetPath: string) {
  await writeGeneratedFile(`${targetPath}/package.json`, `${renderGeneratedPackageJson(app)}\n`);
  await writeGeneratedFile(`${targetPath}/app.config.ts`, renderGeneratedAppConfig());
  await writeGeneratedFile(`${targetPath}/postcss.config.mjs`, renderGeneratedPostcssConfig());
  await writeGeneratedFile(`${targetPath}/tsconfig.json`, `${renderGeneratedTsConfig()}\n`);
  await writeGeneratedFile(`${targetPath}/.gitignore`, renderGeneratedGitignore());
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
