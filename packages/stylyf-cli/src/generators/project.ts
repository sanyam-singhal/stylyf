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
  return JSON.stringify(
    {
      name: slugify(app.name),
      private: true,
      type: "module",
      scripts: {
        dev: "vinxi dev",
        build: "vinxi build",
        start: "vinxi start",
        preview: "vinxi preview",
        check: "tsc --noEmit",
      },
      dependencies: {
        "@solidjs/meta": "^0.29.4",
        "@solidjs/router": "^0.15.0",
        "@solidjs/start": "1.3.2",
        "class-variance-authority": "^0.7.1",
        clsx: "^2.1.1",
        "lucide-solid": "^1.8.0",
        "solid-js": "^1.9.12",
        "tailwind-merge": "^3.5.0",
        vinxi: "^0.5.7",
      },
      devDependencies: {
        "@tailwindcss/postcss": "^4.2.2",
        "@types/node": "^25.6.0",
        tailwindcss: "^4.2.2",
        typescript: "^5.9.3",
      },
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
