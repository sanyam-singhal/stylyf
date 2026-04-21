export type ThemeMode = "light" | "dark" | "system";
export type ThemePresetId = "amber" | "emerald" | "pearl" | "opal";
export type ThemeDensity = "comfortable" | "compact";
export type ThemeRadius = "edge" | "trim" | "soft" | "mellow";
export type ThemeSpacing = "tight" | "balanced" | "airy";

export type ThemeState = {
  mode: ThemeMode;
  preset: ThemePresetId;
  density: ThemeDensity;
  radius: ThemeRadius;
  spacing: ThemeSpacing;
};

export type ThemePreset = {
  id: ThemePresetId;
  label: string;
  description: string;
  swatches: [string, string, string];
};

export const THEME_STORAGE_KEY = "stylyf-theme-state-v2";
export const THEME_EVENT = "stylyf:theme-change";

export const defaultThemeState: ThemeState = {
  mode: "light",
  preset: "opal",
  density: "comfortable",
  radius: "trim",
  spacing: "tight",
};

export const themePresets: ThemePreset[] = [
  {
    id: "amber",
    label: "Amber",
    description: "Pastel cream, peach, muted red, and ochre with editorial warmth.",
    swatches: ["oklch(0.97 0.02 80)", "oklch(0.84 0.07 56)", "oklch(0.7 0.13 58)"],
  },
  {
    id: "emerald",
    label: "Emerald",
    description: "Blue-green oceanic contrast with crisp marine depth.",
    swatches: ["oklch(0.95 0.03 196)", "oklch(0.71 0.11 187)", "oklch(0.58 0.1 162)"],
  },
  {
    id: "pearl",
    label: "Pearl",
    description: "Stone greys with cool contrast and restrained polish.",
    swatches: ["oklch(0.96 0.004 260)", "oklch(0.76 0.01 260)", "oklch(0.34 0.02 250)"],
  },
  {
    id: "opal",
    label: "Opal",
    description: "Retro contrast with teal, coral, parchment, and lacquered navy.",
    swatches: ["oklch(0.93 0.03 92)", "oklch(0.74 0.13 36)", "oklch(0.61 0.11 220)"],
  },
];

type ThemeListener = (state: ThemeState) => void;

function isThemeMode(value: string): value is ThemeMode {
  return value === "light" || value === "dark" || value === "system";
}

function isThemePreset(value: string): value is ThemePresetId {
  return themePresets.some(preset => preset.id === value);
}

function isThemeDensity(value: string): value is ThemeDensity {
  return value === "comfortable" || value === "compact";
}

function isThemeRadius(value: string): value is ThemeRadius {
  return value === "edge" || value === "trim" || value === "soft" || value === "mellow";
}

function isThemeSpacing(value: string): value is ThemeSpacing {
  return value === "tight" || value === "balanced" || value === "airy";
}

export function normalizeThemeState(value?: Partial<ThemeState>): ThemeState {
  return {
    mode: value?.mode && isThemeMode(value.mode) ? value.mode : defaultThemeState.mode,
    preset: value?.preset && isThemePreset(value.preset) ? value.preset : defaultThemeState.preset,
    density: value?.density && isThemeDensity(value.density) ? value.density : defaultThemeState.density,
    radius: value?.radius && isThemeRadius(value.radius) ? value.radius : defaultThemeState.radius,
    spacing: value?.spacing && isThemeSpacing(value.spacing) ? value.spacing : defaultThemeState.spacing,
  };
}

function getSystemResolvedTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function resolveThemeMode(mode: ThemeMode) {
  return mode === "system" ? getSystemResolvedTheme() : mode;
}

export function readStoredThemeState(): ThemeState {
  if (typeof window === "undefined") {
    return defaultThemeState;
  }

  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    return raw ? normalizeThemeState(JSON.parse(raw) as Partial<ThemeState>) : defaultThemeState;
  } catch {
    return defaultThemeState;
  }
}

export function readThemeStateFromDocument(): ThemeState {
  if (typeof document === "undefined") {
    return defaultThemeState;
  }

  const root = document.documentElement;
  const mode = root.dataset.themeMode;
  const preset = root.dataset.themePreset;
  const density = root.dataset.density;
  const radius = root.dataset.radius;
  const spacing = root.dataset.spacing;

  return normalizeThemeState({
    mode: mode && isThemeMode(mode) ? mode : undefined,
    preset: preset && isThemePreset(preset) ? preset : undefined,
    density: density && isThemeDensity(density) ? density : undefined,
    radius: radius && isThemeRadius(radius) ? radius : undefined,
    spacing: spacing && isThemeSpacing(spacing) ? spacing : undefined,
  });
}

export function applyThemeState(next: Partial<ThemeState>, options?: { persist?: boolean }) {
  if (typeof document === "undefined") {
    return normalizeThemeState(next);
  }

  const persist = options?.persist ?? true;
  const normalized = normalizeThemeState({ ...readThemeStateFromDocument(), ...next });
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

  window.dispatchEvent(new CustomEvent<ThemeState>(THEME_EVENT, { detail: normalized }));
  return normalized;
}

export function syncThemeFromStorage() {
  if (typeof window === "undefined") {
    return defaultThemeState;
  }

  return applyThemeState(readStoredThemeState(), { persist: false });
}

export function subscribeThemeState(listener: ThemeListener) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleThemeChange = (event: Event) => {
    const detail = (event as CustomEvent<ThemeState>).detail;
    listener(detail ?? readThemeStateFromDocument());
  };

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const handleSystemChange = () => {
    const state = readThemeStateFromDocument();

    if (state.mode === "system") {
      listener(applyThemeState(state, { persist: false }));
    }
  };

  window.addEventListener(THEME_EVENT, handleThemeChange as EventListener);
  mediaQuery.addEventListener("change", handleSystemChange);

  return () => {
    window.removeEventListener(THEME_EVENT, handleThemeChange as EventListener);
    mediaQuery.removeEventListener("change", handleSystemChange);
  };
}

export const themeBootstrapScript = `(() => {
  const key = ${JSON.stringify(THEME_STORAGE_KEY)};
  const defaults = ${JSON.stringify(defaultThemeState)};

  const normalize = value => ({
    mode: value?.mode === "light" || value?.mode === "dark" || value?.mode === "system" ? value.mode : defaults.mode,
    preset: ["amber", "emerald", "pearl", "opal"].includes(value?.preset) ? value.preset : defaults.preset,
    density: value?.density === "compact" || value?.density === "comfortable" ? value.density : defaults.density,
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
