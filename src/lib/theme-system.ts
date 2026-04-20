export type ThemeMode = "light" | "dark" | "system";
export type ThemePresetId = "stylyf" | "graphite" | "citrus" | "ocean";
export type ThemeDensity = "comfortable" | "compact";
export type ThemeRadius = "balanced" | "soft" | "round";

export type ThemeState = {
  mode: ThemeMode;
  preset: ThemePresetId;
  density: ThemeDensity;
  radius: ThemeRadius;
};

export type ThemePreset = {
  id: ThemePresetId;
  label: string;
  description: string;
  swatches: [string, string, string];
};

export const THEME_STORAGE_KEY = "stylyf-theme-state";
export const THEME_EVENT = "stylyf:theme-change";

export const defaultThemeState: ThemeState = {
  mode: "system",
  preset: "stylyf",
  density: "comfortable",
  radius: "soft",
};

export const themePresets: ThemePreset[] = [
  {
    id: "stylyf",
    label: "Stylyf",
    description: "Warm editorial neutrals with a blue-cyan action lane.",
    swatches: ["oklch(0.97 0.01 84)", "oklch(0.69 0.15 236)", "oklch(0.83 0.1 102)"],
  },
  {
    id: "graphite",
    label: "Graphite",
    description: "Sharper grayscale surfaces with cobalt contrast.",
    swatches: ["oklch(0.96 0.003 255)", "oklch(0.61 0.17 264)", "oklch(0.76 0.07 230)"],
  },
  {
    id: "citrus",
    label: "Citrus",
    description: "Sand, amber, and olive for a warmer product mood.",
    swatches: ["oklch(0.978 0.012 94)", "oklch(0.73 0.16 72)", "oklch(0.74 0.11 150)"],
  },
  {
    id: "ocean",
    label: "Ocean",
    description: "Cool slate surfaces with teal and marine accents.",
    swatches: ["oklch(0.966 0.008 224)", "oklch(0.67 0.13 200)", "oklch(0.59 0.11 245)"],
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
  return value === "balanced" || value === "soft" || value === "round";
}

export function normalizeThemeState(value?: Partial<ThemeState>): ThemeState {
  return {
    mode: value?.mode && isThemeMode(value.mode) ? value.mode : defaultThemeState.mode,
    preset: value?.preset && isThemePreset(value.preset) ? value.preset : defaultThemeState.preset,
    density: value?.density && isThemeDensity(value.density) ? value.density : defaultThemeState.density,
    radius: value?.radius && isThemeRadius(value.radius) ? value.radius : defaultThemeState.radius,
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

  return normalizeThemeState({
    mode: mode && isThemeMode(mode) ? mode : undefined,
    preset: preset && isThemePreset(preset) ? preset : undefined,
    density: density && isThemeDensity(density) ? density : undefined,
    radius: radius && isThemeRadius(radius) ? radius : undefined,
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
    preset: ["stylyf", "graphite", "citrus", "ocean"].includes(value?.preset) ? value.preset : defaults.preset,
    density: value?.density === "compact" || value?.density === "comfortable" ? value.density : defaults.density,
    radius: ["balanced", "soft", "round"].includes(value?.radius) ? value.radius : defaults.radius,
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
  root.classList.toggle("dark", resolvedTheme === "dark");
})();`;
