import type { AppIR } from "../compiler/generated-app.js";
import { readBundledSourceFile } from "./assets.js";

function quoteFont(value: string) {
  return `"${value.replace(/"/g, '\\"')}"`;
}

function renderThemeArrays(values: string[]) {
  return `[${values.map(value => JSON.stringify(value)).join(", ")}]`;
}

export async function renderGeneratedAppCss(app: AppIR) {
  let source = await readBundledSourceFile("src/app.css");

  source = source.replace(/^@import url\([^\n]+\);\n/m, "");
  source = source.replace(/--font-sans:[^;]+;/, `--font-fancy: ${quoteFont(app.theme.fonts.fancy)}, ui-serif, serif;\n  --font-sans: ${quoteFont(app.theme.fonts.sans)}, "Segoe UI", sans-serif;`);
  source = source.replace(/--font-mono:[^;]+;/, `--font-mono: ${quoteFont(app.theme.fonts.mono)}, "SFMono-Regular", monospace;`);

  if (!source.includes(':root[data-density="relaxed"]')) {
    source = source.replace(
      ':root[data-density="compact"] {\n  --density-factor: 0.92;\n  --header-height: calc(4rem * var(--density-factor));\n  --control-height: calc(2.55rem * var(--density-factor));\n  --control-padding-x: calc(0.875rem * var(--density-factor));\n}\n',
      [
        ':root[data-density="compact"] {',
        "  --density-factor: 0.92;",
        "  --header-height: calc(4rem * var(--density-factor));",
        "  --control-height: calc(2.55rem * var(--density-factor));",
        "  --control-padding-x: calc(0.875rem * var(--density-factor));",
        "}",
        "",
        ':root[data-density="relaxed"] {',
        "  --density-factor: 1.08;",
        "  --header-height: calc(4.55rem * var(--density-factor));",
        "  --control-height: calc(2.95rem * var(--density-factor));",
        "  --control-padding-x: calc(1.1rem * var(--density-factor));",
        "}",
        "",
      ].join("\n"),
    );
  }

  if (!source.includes("--font-fancy")) {
    source = source.replace(
      "@theme inline {\n",
      '@theme inline {\n  --font-fancy: var(--font-fancy);\n',
    );
  }

  if (!source.includes(".font-fancy")) {
    source = source.replace(
      "@layer components {\n",
      '@layer components {\n  .font-fancy {\n    font-family: var(--font-fancy);\n  }\n\n',
    );
  }

  return source;
}

export function renderGeneratedThemeSystem(app: AppIR) {
  return [
    `export type ThemeMode = "light" | "dark" | "system";`,
    `export type ThemePresetId = "amber" | "emerald" | "pearl" | "opal";`,
    `export type ThemeDensity = "compact" | "comfortable" | "relaxed";`,
    `export type ThemeRadius = "edge" | "trim" | "soft" | "mellow";`,
    `export type ThemeSpacing = "tight" | "balanced" | "airy";`,
    "",
    "export type ThemeState = {",
    "  mode: ThemeMode;",
    "  preset: ThemePresetId;",
    "  density: ThemeDensity;",
    "  radius: ThemeRadius;",
    "  spacing: ThemeSpacing;",
    "};",
    "",
    'export const THEME_STORAGE_KEY = "stylyf-generated-theme-state-v1";',
    "",
    "export const themeModes = " + renderThemeArrays(["light", "dark", "system"]) + " as const;",
    "export const themePresets = " + renderThemeArrays(["amber", "emerald", "pearl", "opal"]) + " as const;",
    "export const themeDensities = " + renderThemeArrays(["compact", "comfortable", "relaxed"]) + " as const;",
    "export const themeRadii = " + renderThemeArrays(["edge", "trim", "soft", "mellow"]) + " as const;",
    "export const themeSpacingOptions = " + renderThemeArrays(["tight", "balanced", "airy"]) + " as const;",
    "",
    "export const defaultThemeState: ThemeState = {",
    `  mode: ${JSON.stringify(app.theme.mode)},`,
    `  preset: ${JSON.stringify(app.theme.preset)},`,
    `  density: ${JSON.stringify(app.theme.density)},`,
    `  radius: ${JSON.stringify(app.theme.radius)},`,
    `  spacing: ${JSON.stringify(app.theme.spacing)},`,
    "};",
    "",
    "function getSystemResolvedTheme() {",
    '  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";',
    "}",
    "",
    "export function resolveThemeMode(mode: ThemeMode) {",
    '  return mode === "system" ? getSystemResolvedTheme() : mode;',
    "}",
    "",
    "export function normalizeThemeState(value?: Partial<ThemeState>): ThemeState {",
    "  return {",
    "    mode: themeModes.includes((value?.mode ?? '') as ThemeMode) ? (value?.mode as ThemeMode) : defaultThemeState.mode,",
    "    preset: themePresets.includes((value?.preset ?? '') as ThemePresetId) ? (value?.preset as ThemePresetId) : defaultThemeState.preset,",
    "    density: themeDensities.includes((value?.density ?? '') as ThemeDensity) ? (value?.density as ThemeDensity) : defaultThemeState.density,",
    "    radius: themeRadii.includes((value?.radius ?? '') as ThemeRadius) ? (value?.radius as ThemeRadius) : defaultThemeState.radius,",
    "    spacing: themeSpacingOptions.includes((value?.spacing ?? '') as ThemeSpacing) ? (value?.spacing as ThemeSpacing) : defaultThemeState.spacing,",
    "  };",
    "}",
    "",
    "export function readStoredThemeState(): ThemeState {",
    '  if (typeof window === "undefined") return defaultThemeState;',
    "  try {",
    "    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);",
    "    return raw ? normalizeThemeState(JSON.parse(raw) as Partial<ThemeState>) : defaultThemeState;",
    "  } catch {",
    "    return defaultThemeState;",
    "  }",
    "}",
    "",
    "export function applyThemeState(next: Partial<ThemeState>, options?: { persist?: boolean }) {",
    '  if (typeof document === "undefined") return normalizeThemeState(next);',
    "  const persist = options?.persist ?? true;",
    "  const normalized = normalizeThemeState({ ...readStoredThemeState(), ...next });",
    "  const resolvedTheme = resolveThemeMode(normalized.mode);",
    "  const root = document.documentElement;",
    '  root.dataset.themeMode = normalized.mode;',
    '  root.dataset.theme = resolvedTheme;',
    '  root.dataset.themePreset = normalized.preset;',
    '  root.dataset.density = normalized.density;',
    '  root.dataset.radius = normalized.radius;',
    '  root.dataset.spacing = normalized.spacing;',
    '  root.classList.toggle("dark", resolvedTheme === "dark");',
    "  if (persist) {",
    "    window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(normalized));",
    "  }",
    "  return normalized;",
    "}",
    "",
    "export const themeBootstrapScript = `(() => {",
    `  const key = ${JSON.stringify("stylyf-generated-theme-state-v1")};`,
    `  const defaults = ${JSON.stringify({
      mode: app.theme.mode,
      preset: app.theme.preset,
      density: app.theme.density,
      radius: app.theme.radius,
      spacing: app.theme.spacing,
    })};`,
    "",
    "  const normalize = value => ({",
    `    mode: ${renderThemeArrays(["light", "dark", "system"])}.includes(value?.mode) ? value.mode : defaults.mode,`,
    `    preset: ${renderThemeArrays(["amber", "emerald", "pearl", "opal"])}.includes(value?.preset) ? value.preset : defaults.preset,`,
    `    density: ${renderThemeArrays(["compact", "comfortable", "relaxed"])}.includes(value?.density) ? value.density : defaults.density,`,
    `    radius: ${renderThemeArrays(["edge", "trim", "soft", "mellow"])}.includes(value?.radius) ? value.radius : defaults.radius,`,
    `    spacing: ${renderThemeArrays(["tight", "balanced", "airy"])}.includes(value?.spacing) ? value.spacing : defaults.spacing,`,
    "  });",
    "",
    "  let saved = defaults;",
    "  try {",
    "    const raw = localStorage.getItem(key);",
    "    if (raw) saved = normalize(JSON.parse(raw));",
    "  } catch {}",
    "",
    "  const root = document.documentElement;",
    '  const resolvedTheme = saved.mode === "system"',
    '    ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")',
    "    : saved.mode;",
    '  root.dataset.themeMode = saved.mode;',
    '  root.dataset.theme = resolvedTheme;',
    '  root.dataset.themePreset = saved.preset;',
    '  root.dataset.density = saved.density;',
    '  root.dataset.radius = saved.radius;',
    '  root.dataset.spacing = saved.spacing;',
    '  root.classList.toggle("dark", resolvedTheme === "dark");',
    "})();`;",
    "",
  ].join("\n");
}

export function renderGeneratedAppRoot(app: AppIR) {
  return [
    'import { Meta, MetaProvider, Title } from "@solidjs/meta";',
    'import { Router } from "@solidjs/router";',
    'import { FileRoutes } from "@solidjs/start/router";',
    'import { Suspense } from "solid-js";',
    'import "./app.css";',
    "",
    "export default function App() {",
    "  return (",
    "    <Router",
    "      root={props => (",
    "        <MetaProvider>",
    `          <Title>${app.name}</Title>`,
    `          <Meta name="description" content=${JSON.stringify(`${app.name} generated by Stylyf CLI.`)} />`,
    '          <div class="min-h-screen bg-background text-foreground">',
    "            <Suspense>{props.children}</Suspense>",
    "          </div>",
    "        </MetaProvider>",
    "      )}",
    "    >",
    "      <FileRoutes />",
    "    </Router>",
    "  );",
    "}",
    "",
  ].join("\n");
}

export function renderGeneratedEntryServer() {
  return [
    "// @refresh reload",
    'import { createHandler, StartServer } from "@solidjs/start/server";',
    'import { themeBootstrapScript } from "~/lib/theme-system";',
    "",
    "export default createHandler(() => (",
    "  <StartServer",
    "    document={({ assets, children, scripts }) => (",
    '      <html lang="en">',
    "        <head>",
    '          <meta charset="utf-8" />',
    '          <meta name="viewport" content="width=device-width, initial-scale=1" />',
    '          <script innerHTML={themeBootstrapScript} />',
    "          {assets}",
    "        </head>",
    "        <body>",
    '          <div id="app">{children}</div>',
    "          {scripts}",
    "        </body>",
    "      </html>",
    "    )}",
    "  />",
    "));",
    "",
  ].join("\n");
}

export function renderGeneratedEntryClient() {
  return [
    "// @refresh reload",
    'import { mount, StartClient } from "@solidjs/start/client";',
    "",
    'export default mount(() => <StartClient />, document.getElementById("app")!);',
    "",
  ].join("\n");
}
