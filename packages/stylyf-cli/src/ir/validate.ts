import type { AppIR, AppShellId, ComponentRefIR, LayoutNodeIR, LayoutNodeId, PageShellId, RouteIR, SectionIR, ThemeDensity, ThemeMode, ThemePresetId, ThemeRadius, ThemeSpacing } from "./types.js";

export type ValidationResult = {
  ok: boolean;
  errors: string[];
};

const appShellIds = new Set<AppShellId>(["sidebar-app", "topbar-app", "docs-shell", "marketing-shell"]);
const pageShellIds = new Set<PageShellId>(["dashboard", "resource-index", "resource-detail", "settings", "auth", "blank"]);
const layoutIds = new Set<LayoutNodeId>(["stack", "row", "column", "grid", "split", "panel", "section", "toolbar", "content-frame"]);
const themePresets = new Set<ThemePresetId>(["amber", "emerald", "pearl", "opal"]);
const themeModes = new Set<ThemeMode>(["light", "dark", "system"]);
const themeRadii = new Set<ThemeRadius>(["edge", "trim", "soft", "mellow"]);
const themeDensity = new Set<ThemeDensity>(["compact", "comfortable", "relaxed"]);
const themeSpacing = new Set<ThemeSpacing>(["tight", "balanced", "airy"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isLayoutNode(value: unknown): value is LayoutNodeIR {
  return isRecord(value) && typeof value.layout === "string";
}

function isComponentRef(value: unknown): value is ComponentRefIR {
  return isRecord(value) && typeof value.component === "string";
}

function validateChild(value: unknown, path: string, errors: string[]) {
  if (typeof value === "string") {
    return;
  }

  if (isLayoutNode(value)) {
    validateLayoutNode(value, path, errors);
    return;
  }

  if (isComponentRef(value)) {
    if (!value.component.trim()) {
      errors.push(`${path}.component must not be empty`);
    }
    if (value.props !== undefined && !isRecord(value.props)) {
      errors.push(`${path}.props must be an object when provided`);
    }
    if (value.items !== undefined && !Array.isArray(value.items)) {
      errors.push(`${path}.items must be an array when provided`);
    }
    return;
  }

  errors.push(`${path} must be a string, layout node, or component ref`);
}

function validateLayoutNode(node: LayoutNodeIR, path: string, errors: string[]) {
  if (!layoutIds.has(node.layout)) {
    errors.push(`${path}.layout must be one of ${[...layoutIds].join(", ")}`);
  }

  if (node.props !== undefined && !isRecord(node.props)) {
    errors.push(`${path}.props must be an object when provided`);
  }

  if (node.children !== undefined) {
    if (!Array.isArray(node.children)) {
      errors.push(`${path}.children must be an array when provided`);
    } else {
      node.children.forEach((child, index) => validateChild(child, `${path}.children[${index}]`, errors));
    }
  }
}

function validateSection(section: SectionIR, path: string, errors: string[]) {
  if (!layoutIds.has(section.layout)) {
    errors.push(`${path}.layout must be one of ${[...layoutIds].join(", ")}`);
  }

  if (!Array.isArray(section.children) || section.children.length === 0) {
    errors.push(`${path}.children must be a non-empty array`);
    return;
  }

  section.children.forEach((child, index) => validateChild(child, `${path}.children[${index}]`, errors));
}

function validateRoute(route: RouteIR, path: string, errors: string[], seenPaths: Set<string>) {
  if (!route.path || !route.path.startsWith("/")) {
    errors.push(`${path}.path must start with '/'`);
  } else if (seenPaths.has(route.path)) {
    errors.push(`${path}.path duplicates an earlier route: ${route.path}`);
  } else {
    seenPaths.add(route.path);
  }

  if (!pageShellIds.has(route.page)) {
    errors.push(`${path}.page must be one of ${[...pageShellIds].join(", ")}`);
  }

  if (route.shell !== undefined && !appShellIds.has(route.shell)) {
    errors.push(`${path}.shell must be one of ${[...appShellIds].join(", ")}`);
  }

  if (!Array.isArray(route.sections) || route.sections.length === 0) {
    errors.push(`${path}.sections must be a non-empty array`);
    return;
  }

  route.sections.forEach((section, index) => validateSection(section, `${path}.sections[${index}]`, errors));
}

export function validateAppIr(value: unknown): ValidationResult {
  const errors: string[] = [];

  if (!isRecord(value)) {
    return { ok: false, errors: ["App IR must be a JSON object"] };
  }

  if (typeof value.name !== "string" || !value.name.trim()) {
    errors.push("name must be a non-empty string");
  }

  if (typeof value.shell !== "string" || !appShellIds.has(value.shell as AppShellId)) {
    errors.push(`shell must be one of ${[...appShellIds].join(", ")}`);
  }

  if (!isRecord(value.theme)) {
    errors.push("theme must be an object");
  } else {
    if (!themePresets.has(value.theme.preset as ThemePresetId)) {
      errors.push(`theme.preset must be one of ${[...themePresets].join(", ")}`);
    }
    if (!themeModes.has(value.theme.mode as ThemeMode)) {
      errors.push(`theme.mode must be one of ${[...themeModes].join(", ")}`);
    }
    if (!themeRadii.has(value.theme.radius as ThemeRadius)) {
      errors.push(`theme.radius must be one of ${[...themeRadii].join(", ")}`);
    }
    if (!themeDensity.has(value.theme.density as ThemeDensity)) {
      errors.push(`theme.density must be one of ${[...themeDensity].join(", ")}`);
    }
    if (!themeSpacing.has(value.theme.spacing as ThemeSpacing)) {
      errors.push(`theme.spacing must be one of ${[...themeSpacing].join(", ")}`);
    }
    if (!isRecord(value.theme.fonts)) {
      errors.push("theme.fonts must be an object");
    } else {
      for (const key of ["fancy", "sans", "mono"] as const) {
        if (typeof value.theme.fonts[key] !== "string" || !value.theme.fonts[key]?.trim()) {
          errors.push(`theme.fonts.${key} must be a non-empty string`);
        }
      }
    }
  }

  if (!Array.isArray(value.routes) || value.routes.length === 0) {
    errors.push("routes must be a non-empty array");
  } else {
    const seenPaths = new Set<string>();
    value.routes.forEach((route, index) => validateRoute(route as RouteIR, `routes[${index}]`, errors, seenPaths));
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

export function assertValidAppIr(value: unknown): asserts value is AppIR {
  const result = validateAppIr(value);

  if (!result.ok) {
    throw new Error(result.errors.join("\n"));
  }
}
