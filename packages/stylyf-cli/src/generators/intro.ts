import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { listAppShellTemplates, listLayoutTemplates, listPageShellTemplates } from "./templates.js";
import { loadAssemblyRegistry, loadThemeGrammar } from "../manifests/index.js";

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

export async function renderIntroMarkdown(options: IntroOptions = {}) {
  const [themeGrammar, registry] = await Promise.all([loadThemeGrammar(), loadAssemblyRegistry()]);
  const clusterCounts = [...registry.reduce((map, item) => map.set(item.clusterLabel, (map.get(item.clusterLabel) ?? 0) + 1), new Map<string, number>()).entries()].sort(
    ([left], [right]) => left.localeCompare(right),
  );
  const project = options.projectPath ? await snapshotProject(options.projectPath) : null;

  const intro = [
    "# Stylyf Intro",
    "",
    "Stylyf is a JSON-driven frontend assembly line for SolidStart. Its job is to let a coding agent describe the intended app once, generate a real working source tree, and then keep iterating inside that emitted app without redoing the repetitive setup work by hand.",
    "",
    "## What Stylyf Does",
    "",
    "- turns a shallow JSON IR into a standalone SolidStart app",
    "- emits app shell, route files, page shells, layout wrappers, global styling, and copied registry components",
    "- installs dependencies so the target app is runnable immediately",
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
        "  lib/",
        "    theme-system.ts",
        "    cn.ts",
        "  routes/",
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
    "The styling grammar is emitted from the bundled `src/app.css` baseline. Theme choices remain declarative in the IR, while the generated app gets ordinary CSS and theme bootstrap code it can keep evolving independently.",
    "",
    "## Template Inventory",
    "",
    `- app shells: ${listAppShellTemplates().join(", ")}`,
    `- page shells: ${listPageShellTemplates().join(", ")}`,
    `- layouts: ${listLayoutTemplates().join(", ")}`,
    "",
    "## Registry Inventory",
    "",
    `Total bundled components: ${registry.length}`,
    "",
    ...clusterCounts.map(([label, count]) => `- ${label}: ${count}`),
    "",
    "## Search Tips",
    "",
    "- search by user intent first, not exact component name",
    "- combine route shape and UI intent terms, for example `settings panel toggle form`",
    "- use the local HTTP endpoint when an agent wants small targeted reads instead of reopening source trees",
    "",
    codeBlock(
      [
        "curl 'http://127.0.0.1:4310/search?q=docs+sidebar+article&limit=5'",
        "curl 'http://127.0.0.1:4310/item/data-views/table'",
      ].join("\n"),
      "bash",
    ),
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
    "- keep changes source-owned in the generated app rather than trying to reintroduce runtime abstraction",
    "",
    "## Summary",
    "",
    "Stylyf is the fast front-end assembly layer. Use it to eliminate setup repetition, then continue inside the generated app with normal SolidStart engineering discipline.",
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
