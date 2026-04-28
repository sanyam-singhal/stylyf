export type ThemeMode = "light" | "dark" | "system";
export type ThemePresetId = "amber" | "emerald" | "pearl" | "opal";
export type ThemeDensity = "compact" | "comfortable" | "relaxed";
export type ThemeRadius = "edge" | "trim" | "soft" | "mellow";
export type ThemeSpacing = "tight" | "balanced" | "airy";

export type ThemeState = {
  mode: ThemeMode;
  preset: ThemePresetId;
  density: ThemeDensity;
  radius: ThemeRadius;
  spacing: ThemeSpacing;
};

export const THEME_STORAGE_KEY = "stylyf-generated-theme-state-v1";

export const themeModes = ["light", "dark", "system"] as const;
export const themePresets = ["amber", "emerald", "pearl", "opal"] as const;
export const themeDensities = ["compact", "comfortable", "relaxed"] as const;
export const themeRadii = ["edge", "trim", "soft", "mellow"] as const;
export const themeSpacingOptions = ["tight", "balanced", "airy"] as const;

export const defaultThemeState: ThemeState = {
  mode: "light",
  preset: "opal",
  density: "comfortable",
  radius: "trim",
  spacing: "tight",
};

function getSystemResolvedTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function resolveThemeMode(mode: ThemeMode) {
  return mode === "system" ? getSystemResolvedTheme() : mode;
}

export function normalizeThemeState(value?: Partial<ThemeState>): ThemeState {
  return {
    mode: themeModes.includes((value?.mode ?? '') as ThemeMode) ? (value?.mode as ThemeMode) : defaultThemeState.mode,
    preset: themePresets.includes((value?.preset ?? '') as ThemePresetId) ? (value?.preset as ThemePresetId) : defaultThemeState.preset,
    density: themeDensities.includes((value?.density ?? '') as ThemeDensity) ? (value?.density as ThemeDensity) : defaultThemeState.density,
    radius: themeRadii.includes((value?.radius ?? '') as ThemeRadius) ? (value?.radius as ThemeRadius) : defaultThemeState.radius,
    spacing: themeSpacingOptions.includes((value?.spacing ?? '') as ThemeSpacing) ? (value?.spacing as ThemeSpacing) : defaultThemeState.spacing,
  };
}

export function readStoredThemeState(): ThemeState {
  if (typeof window === "undefined") return defaultThemeState;
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    return raw ? normalizeThemeState(JSON.parse(raw) as Partial<ThemeState>) : defaultThemeState;
  } catch {
    return defaultThemeState;
  }
}

export function applyThemeState(next: Partial<ThemeState>, options?: { persist?: boolean }) {
  if (typeof document === "undefined") return normalizeThemeState(next);
  const persist = options?.persist ?? true;
  const normalized = normalizeThemeState({ ...readStoredThemeState(), ...next });
  const resolvedTheme = resolveThemeMode(normalized.mode);
  const root = document.documentElement;
  root.dataset.themeMode = normalized.mode;
  root.dataset.theme = resolvedTheme;
  root.dataset.themePreset = normalized.preset;
  root.dataset.density = normalized.density;
  root.dataset.radius = normalized.radius;
  root.dataset.spacing = normalized.spacing;
  root.classList.toggle("dark", resolvedTheme === "dark");
  if (persist) {
    window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(normalized));
  }
  return normalized;
}

export const themeBootstrapScript = `(() => {
  const key = "stylyf-generated-theme-state-v1";
  const defaults = {"mode":"light","preset":"opal","density":"comfortable","radius":"trim","spacing":"tight"};

  const normalize = value => ({
    mode: ["light", "dark", "system"].includes(value?.mode) ? value.mode : defaults.mode,
    preset: ["amber", "emerald", "pearl", "opal"].includes(value?.preset) ? value.preset : defaults.preset,
    density: ["compact", "comfortable", "relaxed"].includes(value?.density) ? value.density : defaults.density,
    radius: ["edge", "trim", "soft", "mellow"].includes(value?.radius) ? value.radius : defaults.radius,
    spacing: ["tight", "balanced", "airy"].includes(value?.spacing) ? value.spacing : defaults.spacing,
  });

  let saved = defaults;
  try {
    const raw = localStorage.getItem(key);
    if (raw) saved = normalize(JSON.parse(raw));
  } catch {}

  const root = document.documentElement;
  const resolvedTheme = saved.mode === "system"
    ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    : saved.mode;
  root.dataset.themeMode = saved.mode;
  root.dataset.theme = resolvedTheme;
  root.dataset.themePreset = saved.preset;
  root.dataset.density = saved.density;
  root.dataset.radius = saved.radius;
  root.dataset.spacing = saved.spacing;
  root.classList.toggle("dark", resolvedTheme === "dark");
})();`;
