export type ThemePresetId = "amber" | "emerald" | "pearl" | "opal";
export type ThemeMode = "light" | "dark" | "system";
export type ThemeRadius = "edge" | "trim" | "soft" | "mellow";
export type ThemeDensity = "compact" | "comfortable" | "relaxed";
export type ThemeSpacing = "tight" | "balanced" | "airy";

export type AppShellId = "sidebar-app" | "topbar-app" | "docs-shell" | "marketing-shell";
export type PageShellId = "dashboard" | "resource-index" | "resource-detail" | "settings" | "auth" | "blank";
export type LayoutNodeId = "stack" | "row" | "column" | "grid" | "split" | "panel" | "section" | "toolbar" | "content-frame";

export type ThemeIR = {
  preset: ThemePresetId;
  mode: ThemeMode;
  radius: ThemeRadius;
  density: ThemeDensity;
  spacing: ThemeSpacing;
  fonts: {
    fancy: string;
    sans: string;
    mono: string;
  };
};

export type ComponentRefIR = {
  component: string;
  variant?: string;
  props?: Record<string, unknown>;
  items?: Record<string, unknown>[];
};

export type LayoutNodeIR = {
  layout: LayoutNodeId;
  props?: Record<string, string | number | boolean>;
  children?: Array<LayoutNodeIR | ComponentRefIR | string>;
};

export type SectionIR = {
  id?: string;
  layout: LayoutNodeId;
  children: Array<LayoutNodeIR | ComponentRefIR | string>;
};

export type RouteIR = {
  path: string;
  shell?: AppShellId;
  page: PageShellId;
  title?: string;
  sections: SectionIR[];
};

export type AppIR = {
  name: string;
  shell: AppShellId;
  theme: ThemeIR;
  routes: RouteIR[];
};

