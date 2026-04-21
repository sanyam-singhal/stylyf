export type RegistryItem = {
  name: string;
  slug: string;
  description: string;
  pattern: string;
  styleParams: string[];
  stateParams: string[];
  registryShape: string;
  notes: string;
  tierId: string;
  tierLabel: string;
  clusterId: string;
  clusterLabel: string;
};

export type RegistryCluster = {
  id: string;
  title: string;
  description: string;
  items: RegistryItem[];
};

export type RegistryTier = {
  id: string;
  label: string;
  title: string;
  description: string;
  clusters: RegistryCluster[];
};

export type RegistryClusterSection = RegistryCluster & {
  tierId: string;
  tierLabel: string;
  tierTitle: string;
  tierDescription: string;
};

type ItemSeed = Omit<
  RegistryItem,
  "slug" | "tierId" | "tierLabel" | "clusterId" | "clusterLabel"
> & {
  slug?: string;
};

function slugify(value: string) {
  return value
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function withContext(
  tierId: string,
  tierLabel: string,
  clusterId: string,
  clusterLabel: string,
  items: ItemSeed[],
): RegistryItem[] {
  return items.map(item => ({
    ...item,
    slug: item.slug ?? slugify(item.name),
    tierId,
    tierLabel,
    clusterId,
    clusterLabel,
  }));
}

function componentSymbol(name: string) {
  return name.replace(/[^a-zA-Z0-9]/g, "");
}

export function clusterDirectory(entry: Pick<RegistryItem, "tierId" | "clusterId"> | Pick<RegistryClusterSection, "tierId" | "id">) {
  if ("clusterId" in entry) {
    return entry.clusterId.replace(`${entry.tierId}-`, "");
  }

  return entry.id.replace(`${entry.tierId}-`, "");
}

export function componentFilePath(item: RegistryItem) {
  return `src/components/registry/${item.tierId}/${clusterDirectory(item)}/${item.slug}.tsx`;
}

export function clusterDemoFilePath(cluster: Pick<RegistryClusterSection, "id" | "tierId">) {
  return `src/components/registry/${cluster.tierId}/${clusterDirectory(cluster)}/demos.tsx`;
}

export function componentImportPath(item: RegistryItem) {
  return `~/components/registry/${item.tierId}/${clusterDirectory(item)}/${item.slug}`;
}

export function targetPath(item: RegistryItem) {
  if (item.registryShape.includes("page")) {
    return `src/routes/${item.slug}.tsx`;
  }

  return componentFilePath(item);
}

export function starterSourceFor(item: RegistryItem) {
  const symbol = componentSymbol(item.name);

  if (item.registryShape.includes("page")) {
    return [
      'import { Title } from "@solidjs/meta";',
      'import { RegistryPageShell } from "~/components/registry-page-shell";',
      `import { ${symbol} } from "${componentImportPath(item)}";`,
      'import { registryItemBySlug } from "~/lib/registry";',
      "",
      `export default function ${symbol}Page() {`,
      "  return (",
      "    <>",
      `      <Title>${item.name} | Stylyf</Title>`,
      `      <RegistryPageShell item={registryItemBySlug["${item.slug}"]}>`,
      `        <${symbol} />`,
      "      </RegistryPageShell>",
      "    </>",
      "  );",
      "}",
    ].join("\n");
  }

  return [
    'import { mergeProps, splitProps } from "solid-js";',
    'import type { JSX } from "solid-js";',
    'import { RegistryComponentShell } from "~/components/registry-component-shell";',
    'import { registryItemBySlug } from "~/lib/registry";',
    "",
    `export type ${symbol}Props = JSX.HTMLAttributes<HTMLElement> & {`,
    "  class?: string;",
    "};",
    "",
    `export function ${symbol}(userProps: ${symbol}Props) {`,
    "  const props = mergeProps(userProps);",
    '  const [local, others] = splitProps(props, ["class", "children"]);',
    "",
    "  return (",
    `    <RegistryComponentShell item={registryItemBySlug["${item.slug}"]} class={local.class} {...others}>`,
    "      {local.children}",
    "    </RegistryComponentShell>",
    "  );",
    "}",
  ].join("\n");
}

const registryTierInventory: RegistryTier[] = [
  {
    id: "tier-1",
    label: "Tier 1",
    title: "Foundational Primitives",
    description:
      "Stable, accessibility-first building blocks with disciplined APIs, explicit states, and strong override ergonomics.",
    clusters: [
      {
        id: "tier-1-actions-navigation",
        title: "Actions & Navigation",
        description:
          "Primary triggers and wayfinding primitives that establish motion, density, and interaction contracts across the registry.",
        items: withContext("tier-1", "Tier 1", "tier-1-actions-navigation", "Actions & Navigation", [
          {
            name: "Button",
            description: "Primary action trigger.",
            pattern: "Single-root action; supports left/right icon and asChild.",
            styleParams: ["intent", "size", "density", "tone", "radius", "fullWidth", "destructive"],
            stateParams: ["disabled", "loading", "pending"],
            registryShape: "registry:ui",
            notes: "Base primitive for every CTA.",
          },
          {
            name: "IconButton",
            description: "Compact action for icon-only affordances.",
            pattern: "Button variant with required accessible label.",
            styleParams: ["intent", "size", "shape", "ghost/solid", "tooltip pairing"],
            stateParams: ["disabled", "loading", "pressed"],
            registryShape: "registry:ui",
            notes: "Require aria-label when no text.",
          },
          {
            name: "LinkButton",
            description: "Button visual treatment on link/navigation semantics.",
            pattern: "Anchor or router-link root with button recipes.",
            styleParams: ["intent", "size", "underline", "external badge"],
            stateParams: ["disabled", "current", "pending nav"],
            registryShape: "registry:ui",
            notes: "Use for navigation, not mutations.",
          },
          {
            name: "Toggle",
            description: "Two-state pressed button.",
            pattern: "Single button with pressed styling.",
            styleParams: ["intent", "size", "shape", "iconOnly"],
            stateParams: ["pressed", "disabled"],
            registryShape: "registry:ui",
            notes: "For formatting/stateful actions.",
          },
          {
            name: "ToggleGroup",
            description: "Exclusive or multi-select pressed set.",
            pattern: "Group plus item parts.",
            styleParams: ["intent", "size", "density", "segmented/card layout"],
            stateParams: ["pressed items", "disabled", "rovingFocus"],
            registryShape: "registry:ui",
            notes: "Supports single or multiple mode.",
          },
          {
            name: "Breadcrumb",
            description: "Hierarchical navigation trail.",
            pattern: "List, Item, Separator, Current.",
            styleParams: ["size", "truncation", "icon separator"],
            stateParams: ["current", "overflowed"],
            registryShape: "registry:ui",
            notes: "Support collapsed middle items.",
          },
          {
            name: "Pagination",
            description: "Paged navigation controls.",
            pattern: "Prev, pages, next, summary.",
            styleParams: ["size", "compact/full", "show edges"],
            stateParams: ["current", "disabled"],
            registryShape: "registry:ui",
            notes: "Expose controlled paging state.",
          },
        ]),
      },
      {
        id: "tier-1-form-inputs",
        title: "Form Inputs & Selection",
        description:
          "Core field and selection primitives intended to be wrapped by Tier 2 form infrastructure without hiding state.",
        items: withContext("tier-1", "Tier 1", "tier-1-form-inputs", "Form Inputs & Selection", [
          {
            name: "TextField",
            description: "Single-line text entry.",
            pattern: "Root, Label, Input, Description, ErrorMessage.",
            styleParams: ["size", "density", "radius", "tone", "prefix/suffix", "clearable"],
            stateParams: ["disabled", "readOnly", "invalid", "focused", "dirty"],
            registryShape: "registry:ui",
            notes: "Use native input semantics.",
          },
          {
            name: "TextArea",
            description: "Multi-line text entry.",
            pattern: "Same field shell as TextField with textarea control.",
            styleParams: ["size", "minRows", "maxRows", "autoResize", "resizeHandle"],
            stateParams: ["disabled", "readOnly", "invalid", "focused"],
            registryShape: "registry:ui",
            notes: "Share field shell tokens.",
          },
          {
            name: "NumberField",
            description: "Text entry with numeric stepping.",
            pattern: "Input plus increment/decrement controls.",
            styleParams: ["size", "control placement", "align", "suffix/prefix"],
            stateParams: ["disabled", "invalid", "min/max reached", "scrubbing"],
            registryShape: "ui + hook",
            notes: "Prefer machine logic over raw number input UX.",
          },
          {
            name: "OTPField",
            slug: "otp-field",
            description: "One-time code entry.",
            pattern: "Grouped slots with hidden aggregate value.",
            styleParams: ["size", "gap", "masked", "mono", "cell shape"],
            stateParams: ["disabled", "invalid", "complete", "focusedIndex"],
            registryShape: "registry:ui",
            notes: "Useful for auth and verification.",
          },
          {
            name: "Checkbox",
            description: "Multi-select boolean control.",
            pattern: "Indicator, label, description.",
            styleParams: ["size", "tone", "checkbox shape", "emphasis"],
            stateParams: ["checked", "unchecked", "indeterminate", "disabled", "invalid"],
            registryShape: "registry:ui",
            notes: "Support indeterminate state.",
          },
          {
            name: "RadioGroup",
            description: "Mutually exclusive selection set.",
            pattern: "Root, Item, Indicator, Label, Description.",
            styleParams: ["size", "card/inline", "gap", "emphasis"],
            stateParams: ["checked", "focused", "disabled", "invalid"],
            registryShape: "registry:ui",
            notes: "Arrow-key navigation required.",
          },
          {
            name: "Switch",
            description: "Immediate on/off toggle.",
            pattern: "Thumb and track with optional label row.",
            styleParams: ["size", "tone", "label placement", "icon thumb"],
            stateParams: ["checked", "unchecked", "disabled", "invalid"],
            registryShape: "registry:ui",
            notes: "Use for instant settings.",
          },
          {
            name: "Select",
            description: "Closed-choice picker.",
            pattern: "Trigger, Value, Icon, Content, Item, Group.",
            styleParams: ["size", "width", "placement", "searchable badge"],
            stateParams: ["open", "closed", "highlighted", "selected", "invalid"],
            registryShape: "registry:ui",
            notes: "Use for finite lists.",
          },
          {
            name: "Combobox",
            description: "Searchable option picker.",
            pattern: "Input, listbox/grid popup, clear button.",
            styleParams: ["size", "debounce", "chip mode", "async affordances"],
            stateParams: ["open", "loading", "highlighted", "selected", "empty", "invalid"],
            registryShape: "ui + hook",
            notes: "Needed for typeahead and async search.",
          },
          {
            name: "Slider",
            description: "Continuous range input.",
            pattern: "Track, range, thumb(s), marks.",
            styleParams: ["size", "orientation", "marks", "thumb label"],
            stateParams: ["disabled", "dragging", "min/max", "invalid"],
            registryShape: "registry:ui",
            notes: "Support single and range modes.",
          },
          {
            name: "Calendar",
            description: "Date grid primitive.",
            pattern: "Header, nav, month grid, day cell.",
            styleParams: ["size", "range/single", "week numbers", "compact"],
            stateParams: ["selected", "highlighted", "disabled", "outsideMonth"],
            registryShape: "registry:ui",
            notes: "Needed for date-based flows.",
          },
          {
            name: "DatePicker",
            description: "Date field plus calendar overlay.",
            pattern: "Field shell + popover/dialog calendar.",
            styleParams: ["size", "format", "presets", "timezone hint"],
            stateParams: ["open", "invalid", "selected", "range-start/end"],
            registryShape: "block + ui",
            notes: "Wrap Calendar into field UX.",
          },
        ]),
      },
      {
        id: "tier-1-disclosure-overlay",
        title: "Disclosure & Overlay",
        description:
          "Focus management, layering, and keyboard-heavy surfaces that need stable semantics before higher-order compositions land.",
        items: withContext("tier-1", "Tier 1", "tier-1-disclosure-overlay", "Disclosure & Overlay", [
          {
            name: "CommandMenu",
            description: "Keyboard-first command surface.",
            pattern: "Dialog/Popover shell plus search, groups, items.",
            styleParams: ["size", "density", "shortcut lane", "icon treatment"],
            stateParams: ["open", "loading", "empty", "highlighted"],
            registryShape: "registry:ui",
            notes: "Foundation for global cmd-k.",
          },
          {
            name: "Tabs",
            description: "Parallel content sections.",
            pattern: "Root, List, Trigger, Content.",
            styleParams: ["orientation", "size", "underline/pill/card"],
            stateParams: ["active", "disabled", "manual/automatic activation"],
            registryShape: "registry:ui",
            notes: "Follow APG tab pattern.",
          },
          {
            name: "Accordion",
            description: "Progressive disclosure stack.",
            pattern: "Item, Trigger, Content.",
            styleParams: ["size", "icon position", "divider/card mode"],
            stateParams: ["open", "closed", "disabled"],
            registryShape: "registry:ui",
            notes: "Support single/multiple mode.",
          },
          {
            name: "Collapsible",
            description: "Simple show-hide region.",
            pattern: "Trigger and Content with retained state.",
            styleParams: ["density", "inline/card shell", "icon"],
            stateParams: ["open", "closed", "disabled"],
            registryShape: "registry:ui",
            notes: "Lighter than accordion.",
          },
          {
            name: "Dialog",
            description: "Blocking modal surface.",
            pattern: "Portal, Overlay, Content, Header, Footer.",
            styleParams: ["size", "placement", "padding", "tone", "motion preset"],
            stateParams: ["open", "closing", "busy", "destructive confirm"],
            registryShape: "registry:ui",
            notes: "Trap focus and restore on close.",
          },
          {
            name: "AlertDialog",
            description: "High-risk confirmation modal.",
            pattern: "Dialog specialization with decision emphasis.",
            styleParams: ["tone", "icon", "button order", "severity"],
            stateParams: ["open", "busy"],
            registryShape: "registry:ui",
            notes: "For destructive or irreversible actions.",
          },
          {
            name: "Drawer",
            description: "Edge-anchored modal panel.",
            pattern: "Portal, Overlay, Content, Header, Footer.",
            styleParams: ["side", "width", "handle", "backdrop", "motion"],
            stateParams: ["open", "dragging", "closing", "busy"],
            registryShape: "registry:ui",
            notes: "Use on mobile and contextual edit.",
          },
          {
            name: "Popover",
            description: "Anchored non-modal surface.",
            pattern: "Trigger, Content, Arrow, Close.",
            styleParams: ["size", "placement", "offset", "shadow", "padding"],
            stateParams: ["open", "closed", "positioned"],
            registryShape: "registry:ui",
            notes: "For rich inline overlays.",
          },
          {
            name: "Tooltip",
            description: "Supplementary hover/focus hint.",
            pattern: "Trigger and Content.",
            styleParams: ["size", "placement", "delay", "maxWidth"],
            stateParams: ["open", "delayed", "disabled"],
            registryShape: "registry:ui",
            notes: "Never hide required information in tooltip.",
          },
          {
            name: "DropdownMenu",
            description: "Action menu from trigger.",
            pattern: "Trigger, Content, Item, CheckboxItem, Sub.",
            styleParams: ["size", "placement", "inset", "shortcut lane"],
            stateParams: ["open", "highlighted", "checked", "disabled"],
            registryShape: "registry:ui",
            notes: "Keyboard menu semantics required.",
          },
          {
            name: "ContextMenu",
            description: "Right-click or long-press menu.",
            pattern: "Context trigger region plus menu parts.",
            styleParams: ["size", "placement", "shortcut lane"],
            stateParams: ["open", "highlighted", "checked", "disabled"],
            registryShape: "registry:ui",
            notes: "Use same menu item anatomy.",
          },
          {
            name: "Menubar",
            description: "Desktop-style application menu.",
            pattern: "Root, Menu, Trigger, Content, Item.",
            styleParams: ["density", "chrome", "shortcut lane"],
            stateParams: ["open", "highlighted", "disabled"],
            registryShape: "registry:ui",
            notes: "Use only for app-like IA.",
          },
        ]),
      },
      {
        id: "tier-1-feedback-display",
        title: "Feedback & Display",
        description:
          "Status, identity, and non-blocking feedback primitives that make system state legible without inventing app-specific patterns too early.",
        items: withContext("tier-1", "Tier 1", "tier-1-feedback-display", "Feedback & Display", [
          {
            name: "Progress",
            description: "Read-only progress feedback.",
            pattern: "Track plus indicator plus label slots.",
            styleParams: ["size", "tone", "striped", "animated"],
            stateParams: ["indeterminate", "complete", "error"],
            registryShape: "registry:ui",
            notes: "For long-running work.",
          },
          {
            name: "Badge",
            description: "Small status/category label.",
            pattern: "Inline pill with optional icon or remove control.",
            styleParams: ["tone", "emphasis", "size", "removable"],
            stateParams: ["selected", "removable", "disabled"],
            registryShape: "registry:ui",
            notes: "Use for status and metadata.",
          },
          {
            name: "Avatar",
            description: "Identity surface.",
            pattern: "Image, fallback, status dot.",
            styleParams: ["size", "shape", "border", "group overlap"],
            stateParams: ["loading", "fallback", "online/offline"],
            registryShape: "registry:ui",
            notes: "Always safe fallback path.",
          },
          {
            name: "Toast",
            description: "Transient notification.",
            pattern: "Provider, Viewport, Root, Title, Action.",
            styleParams: ["tone", "placement", "action slot", "dismiss style"],
            stateParams: ["open", "closing", "paused", "swipe"],
            registryShape: "ui + hook",
            notes: "Non-blocking feedback.",
          },
          {
            name: "Skeleton",
            description: "Loading placeholder shape.",
            pattern: "Rect/text/circle recipes.",
            styleParams: ["shape", "width", "height", "shimmer", "radius"],
            stateParams: ["loading"],
            registryShape: "registry:ui",
            notes: "Use layout-faithful placeholders.",
          },
          {
            name: "Separator",
            description: "Visual divider.",
            pattern: "Horizontal/vertical rule with optional label.",
            styleParams: ["orientation", "inset", "tone", "spacing"],
            stateParams: [],
            registryShape: "registry:ui",
            notes: "Keep semantic role minimal.",
          },
        ]),
      },
      {
        id: "tier-1-data-structure",
        title: "Data & Structure",
        description:
          "Foundational structure for dense information displays that should stay semantic and low-magic before data logic is layered on top.",
        items: withContext("tier-1", "Tier 1", "tier-1-data-structure", "Data & Structure", [
          {
            name: "Table",
            description: "Semantic table scaffold.",
            pattern: "Table, Head, Body, Row, Cell, Caption.",
            styleParams: ["density", "zebra", "sticky header", "numeric alignment"],
            stateParams: ["selected", "sorted", "hover", "loading"],
            registryShape: "registry:ui",
            notes: "Keep raw table separate from data grid.",
          },
        ]),
      },
    ],
  },
  {
    id: "tier-2",
    label: "Tier 2",
    title: "Generic Derived Compositions",
    description:
      "Composable product-agnostic patterns assembled from Tier 1 pieces and intended to carry consistent shells across routes and features.",
    clusters: [
      {
        id: "tier-2-form-systems",
        title: "Form Systems",
        description:
          "Field layout, filters, settings rows, and upload scaffolds that normalize common form-heavy workflows without becoming product-specific.",
        items: withContext("tier-2", "Tier 2", "tier-2-form-systems", "Form Systems", [
          {
            name: "FieldRow",
            description: "Canonical field wrapper for forms.",
            pattern: "Label + control + description + error lane.",
            styleParams: ["gap", "label width", "required mark", "inline/stacked"],
            stateParams: ["invalid", "disabled", "busy"],
            registryShape: "registry:block",
            notes: "Build once; every field composes through it.",
          },
          {
            name: "FieldsetCard",
            description: "Grouped form controls in a framed section.",
            pattern: "Header, body, footer actions.",
            styleParams: ["padding", "border", "heading size", "tone"],
            stateParams: ["disabled subtree", "dirty"],
            registryShape: "registry:block",
            notes: "Great for settings surfaces.",
          },
          {
            name: "FormSection",
            description: "Large grouped form region.",
            pattern: "Section header plus field groups and actions.",
            styleParams: ["spacing", "columns", "divider mode"],
            stateParams: ["submitting", "valid", "invalid", "dirty"],
            registryShape: "registry:block",
            notes: "Works with client or server validation.",
          },
          {
            name: "SearchField",
            description: "Reusable search input with affordances.",
            pattern: "TextField + icon + clear + submit slots.",
            styleParams: ["size", "width", "placeholder tone", "shortcut badge"],
            stateParams: ["focused", "loading", "hasValue"],
            registryShape: "registry:block",
            notes: "Used across tables and pages.",
          },
          {
            name: "FilterToolbar",
            description: "Query/filter/action toolbar.",
            pattern: "Search, filters, chips, view controls, bulk actions.",
            styleParams: ["density", "wrap mode", "sticky", "compact"],
            stateParams: ["dirty filters", "selection count", "busy"],
            registryShape: "registry:block",
            notes: "Backbone of list pages.",
          },
          {
            name: "SortMenu",
            description: "Lightweight ordering control.",
            pattern: "Button/Select + current sort summary.",
            styleParams: ["size", "icon", "compact/full label"],
            stateParams: ["open", "active sort", "disabled"],
            registryShape: "registry:block",
            notes: "Often paired with FilterToolbar.",
          },
          {
            name: "InlineEditableField",
            description: "Read mode that turns into edit mode.",
            pattern: "Display view, trigger, editor, save/cancel actions.",
            styleParams: ["dense/comfortable", "highlight on hover"],
            stateParams: ["editing", "saving", "invalid", "readonly"],
            registryShape: "block + hook",
            notes: "Useful in profile/settings screens.",
          },
          {
            name: "SettingsRow",
            description: "Standard settings item layout.",
            pattern: "Label, description, control, meta/help.",
            styleParams: ["density", "inset", "borderless/card"],
            stateParams: ["disabled", "invalid", "pending"],
            registryShape: "registry:block",
            notes: "Critical for settings consistency.",
          },
          {
            name: "SettingsPanel",
            description: "Reusable settings subsection card.",
            pattern: "Header, body rows, footer actions.",
            styleParams: ["padding", "divider", "heading scale"],
            stateParams: ["dirty", "saving", "readonly"],
            registryShape: "registry:block",
            notes: "Wraps SettingsRows.",
          },
          {
            name: "FileUploader",
            description: "Drag/drop file ingestion shell.",
            pattern: "Dropzone, file list, status, actions.",
            styleParams: ["size", "dashed/solid zone", "compact/full"],
            stateParams: ["dragging", "uploading", "error", "complete"],
            registryShape: "block + hook",
            notes: "Foundation for import flows.",
          },
          {
            name: "MediaUploader",
            description: "Image/video oriented uploader.",
            pattern: "Dropzone, preview grid, crop/replace slots.",
            styleParams: ["thumb ratio", "grid density", "overlay controls"],
            stateParams: ["uploading", "cropping", "failed"],
            registryShape: "block + hook",
            notes: "For avatars, banners, gallery content.",
          },
          {
            name: "AuthCardShell",
            description: "Opinionated auth container.",
            pattern: "Branding, title, body, legal footer.",
            styleParams: ["maxWidth", "visual side", "card chrome"],
            stateParams: ["submitting", "error", "success"],
            registryShape: "registry:block",
            notes: "Base for login/signup variants.",
          },
        ]),
      },
      {
        id: "tier-2-information-states",
        title: "Information & States",
        description:
          "Section identity, KPI, and stateful empty/error/loading surfaces designed to keep route-level information architecture coherent.",
        items: withContext("tier-2", "Tier 2", "tier-2-information-states", "Information & States", [
          {
            name: "PageHeader",
            description: "Page identity and primary actions.",
            pattern: "Eyebrow, title, description, actions, meta.",
            styleParams: ["size", "align", "sticky", "divider"],
            stateParams: ["busy", "stale data", "readonly"],
            registryShape: "registry:block",
            notes: "Use on almost every route.",
          },
          {
            name: "SectionHeader",
            description: "Subsection title block.",
            pattern: "Title, description, actions, anchor link.",
            styleParams: ["size", "divider", "muted/strong tone"],
            stateParams: [],
            registryShape: "registry:block",
            notes: "Keeps long pages structured.",
          },
          {
            name: "StatCard",
            description: "Single KPI surface.",
            pattern: "Label, value, delta, sparkline, footer.",
            styleParams: ["tone", "size", "icon placement", "accent level"],
            stateParams: ["loading", "positive/negative/neutral"],
            registryShape: "registry:block",
            notes: "Base for dashboards.",
          },
          {
            name: "StatGrid",
            description: "Responsive metric collection.",
            pattern: "Grid of StatCards with shared scale.",
            styleParams: ["columns", "gap", "card chrome"],
            stateParams: ["loading", "empty"],
            registryShape: "registry:block",
            notes: "Use for analytics headers.",
          },
          {
            name: "EmptyState",
            description: "No-data and first-run surface.",
            pattern: "Icon/illustration, title, text, actions.",
            styleParams: ["size", "illustration style", "align"],
            stateParams: ["empty", "firstRun", "filteredEmpty"],
            registryShape: "registry:block",
            notes: "One component, many contexts.",
          },
          {
            name: "ErrorState",
            description: "Recoverable failure surface.",
            pattern: "Icon, summary, detail, retry action.",
            styleParams: ["tone", "compact/full", "bordered"],
            stateParams: ["retrying"],
            registryShape: "registry:block",
            notes: "For route, card, and widget scope.",
          },
          {
            name: "LoadingState",
            description: "Non-skeleton loading module.",
            pattern: "Spinner/progress + message + optional cancel.",
            styleParams: ["tone", "compact/full"],
            stateParams: ["loading", "cancellable"],
            registryShape: "registry:block",
            notes: "For indeterminate waits.",
          },
        ]),
      },
      {
        id: "tier-2-data-views",
        title: "Data Views",
        description:
          "List, detail, activity, and inbox-style compositions used to structure dense operational interfaces with predictable affordances.",
        items: withContext("tier-2", "Tier 2", "tier-2-data-views", "Data Views", [
          {
            name: "DataList",
            description: "Opinionated vertical list.",
            pattern: "Header, rows, row actions, footer.",
            styleParams: ["density", "dividers", "card/list mode"],
            stateParams: ["loading", "empty", "selected row"],
            registryShape: "registry:block",
            notes: "Simpler than a table.",
          },
          {
            name: "DataTableShell",
            description: "Table page wrapper.",
            pattern: "Toolbar, table, selection bar, pagination.",
            styleParams: ["density", "sticky controls", "bordered/chrome"],
            stateParams: ["loading", "empty", "selection", "sync"],
            registryShape: "registry:block",
            notes: "No row logic; just shell.",
          },
          {
            name: "ColumnVisibilityMenu",
            description: "Table/display field chooser.",
            pattern: "Dropdown of toggles with reset.",
            styleParams: ["size", "icon", "grouping"],
            stateParams: ["open", "selected count"],
            registryShape: "registry:block",
            notes: "Pairs with data table.",
          },
          {
            name: "BulkActionBar",
            description: "Context bar for selected items.",
            pattern: "Selection count, actions, clear selection.",
            styleParams: ["tone", "sticky/floating", "compact"],
            stateParams: ["visible", "busy"],
            registryShape: "registry:block",
            notes: "For multi-row actions.",
          },
          {
            name: "DetailPanel",
            description: "Companion view for selected record.",
            pattern: "Header, body sections, actions.",
            styleParams: ["side placement", "width", "tabs/sections"],
            stateParams: ["open", "loading", "dirty"],
            registryShape: "registry:block",
            notes: "Often docked beside tables.",
          },
          {
            name: "ActivityFeed",
            description: "Chronological event stream.",
            pattern: "Feed, item, actor, content, meta.",
            styleParams: ["density", "connectors", "avatar mode"],
            stateParams: ["loading", "unread", "collapsed"],
            registryShape: "registry:block",
            notes: "Use for audits and timelines.",
          },
          {
            name: "Timeline",
            description: "Temporal milestone presentation.",
            pattern: "Rail, item, marker, content.",
            styleParams: ["density", "vertical/horizontal", "compact"],
            stateParams: ["active", "completed", "upcoming"],
            registryShape: "registry:block",
            notes: "For onboarding and history.",
          },
          {
            name: "NotificationList",
            description: "In-app inbox pattern.",
            pattern: "Groups, items, filters, action row.",
            styleParams: ["density", "card/list mode"],
            stateParams: ["unread", "selected", "loading"],
            registryShape: "registry:block",
            notes: "Can back both page and popover.",
          },
          {
            name: "CommentThread",
            description: "Discussion and annotation pattern.",
            pattern: "Thread, comment, composer, reply chain.",
            styleParams: ["density", "avatar size", "attachment lane"],
            stateParams: ["replying", "editing", "sending"],
            registryShape: "registry:block",
            notes: "Use for collaboration UIs.",
          },
        ]),
      },
      {
        id: "tier-2-navigation-workflow",
        title: "Navigation & Workflow",
        description:
          "Layout and progress scaffolds for multi-step journeys and app chrome that should stay reusable across product domains.",
        items: withContext("tier-2", "Tier 2", "tier-2-navigation-workflow", "Navigation & Workflow", [
          {
            name: "Stepper",
            description: "Linear progress navigator.",
            pattern: "Steps, connectors, labels, optional actions.",
            styleParams: ["orientation", "size", "icon/badge markers"],
            stateParams: ["current", "complete", "error", "disabled"],
            registryShape: "registry:block",
            notes: "For multi-step workflows.",
          },
          {
            name: "WizardShell",
            description: "Multi-step transactional container.",
            pattern: "Header, progress, step body, footer actions.",
            styleParams: ["size", "sticky footer", "side summary"],
            stateParams: ["currentStep", "pending", "invalid", "complete"],
            registryShape: "registry:block",
            notes: "Tier-2 base for tier-3 flows.",
          },
          {
            name: "SidebarNav",
            description: "Generic app side navigation.",
            pattern: "Groups, items, badges, collapse rail.",
            styleParams: ["width", "density", "icon mode", "compact labels"],
            stateParams: ["active", "expanded", "collapsed"],
            registryShape: "registry:block",
            notes: "Basis for dashboard sidebars.",
          },
          {
            name: "TopNavBar",
            description: "Generic top-level navigation bar.",
            pattern: "Brand, nav, search, actions, profile.",
            styleParams: ["height", "centered/split", "glass/solid"],
            stateParams: ["active route", "scrolled", "menu open"],
            registryShape: "registry:block",
            notes: "Basis for marketing/app nav.",
          },
          {
            name: "AppHeader",
            description: "Contextual app workspace header.",
            pattern: "Breadcrumbs, title, tabs, actions.",
            styleParams: ["height", "sticky", "border", "compact"],
            stateParams: ["syncing", "stale", "readonly"],
            registryShape: "registry:block",
            notes: "Pairs with SidebarNav.",
          },
        ]),
      },
      {
        id: "tier-2-commercial-content",
        title: "Commercial & Content",
        description:
          "Reusable content units for pricing, marketing, and FAQ surfaces that remain product-neutral while carrying strong presentation defaults.",
        items: withContext("tier-2", "Tier 2", "tier-2-commercial-content", "Commercial & Content", [
          {
            name: "PricingCard",
            description: "Plan/commercial offer card.",
            pattern: "Plan title, price, features, CTA, badge.",
            styleParams: ["tone", "emphasis", "featured state"],
            stateParams: ["featured", "disabled CTA"],
            registryShape: "registry:block",
            notes: "Use on SaaS pricing pages.",
          },
          {
            name: "FeatureCard",
            description: "Marketing feature unit.",
            pattern: "Icon/media, title, copy, CTA.",
            styleParams: ["chrome", "icon frame", "orientation"],
            stateParams: ["hovered"],
            registryShape: "registry:block",
            notes: "Basis for grids and bento layouts.",
          },
          {
            name: "TestimonialCard",
            description: "Quote/social proof unit.",
            pattern: "Quote, author, role, avatar/logo.",
            styleParams: ["alignment", "quote mark", "compact/full"],
            stateParams: [],
            registryShape: "registry:block",
            notes: "For marketing/social proof.",
          },
          {
            name: "FAQList",
            slug: "faq-list",
            description: "Question-answer disclosure group.",
            pattern: "Accordion plus search/filter hook.",
            styleParams: ["density", "divided/card", "default-open behavior"],
            stateParams: ["open items", "filtered"],
            registryShape: "registry:block",
            notes: "Tier-2 generic FAQ pattern.",
          },
        ]),
      },
    ],
  },
  {
    id: "tier-3",
    label: "Tier 3",
    title: "Specialized Blocks & Route-Ready Modules",
    description:
      "Purpose-built flows, layouts, and landing sections composed from lower tiers and intentionally optimized for real product or marketing routes.",
    clusters: [
      {
        id: "tier-3-authentication",
        title: "Authentication",
        description:
          "Sign-in, sign-up, recovery, and verification journeys that should feel ready to storyboard before behavior details are implemented.",
        items: withContext("tier-3", "Tier 3", "tier-3-authentication", "Authentication", [
          {
            name: "LoginBasic",
            description: "Minimal email/password login page.",
            pattern: "AuthCardShell + TextField + Button.",
            styleParams: ["brand treatment", "split/centered", "compact/full"],
            stateParams: ["submitting", "invalid", "locked-out"],
            registryShape: "block + page",
            notes: "Default auth entry.",
          },
          {
            name: "LoginSplit",
            description: "Login with visual side panel.",
            pattern: "AuthCardShell with hero/support content.",
            styleParams: ["image/illustration side", "theme contrast"],
            stateParams: ["submitting", "invalid"],
            registryShape: "block + page",
            notes: "Good for enterprise/SaaS.",
          },
          {
            name: "LoginMagicLink",
            description: "Passwordless login flow.",
            pattern: "Email field + send-link status states.",
            styleParams: ["brand treatment", "security note", "compact/full"],
            stateParams: ["sending", "sent", "resend cooldown"],
            registryShape: "block + page",
            notes: "Useful for low-friction auth.",
          },
          {
            name: "SignupBasic",
            description: "Simple account creation page.",
            pattern: "AuthCardShell with name/email/password fields.",
            styleParams: ["brand treatment", "legal copy", "compact/full"],
            stateParams: ["submitting", "invalid", "success"],
            registryShape: "block + page",
            notes: "Default self-serve signup.",
          },
          {
            name: "SignupInvite",
            description: "Invite-accept signup page.",
            pattern: "Prefilled org/email plus password/profile fields.",
            styleParams: ["readonly invite fields", "org badge"],
            stateParams: ["validating invite", "expired", "submitting"],
            registryShape: "block + page",
            notes: "For B2B team onboarding.",
          },
          {
            name: "SignupWorkspace",
            description: "Account plus workspace creation flow.",
            pattern: "WizardShell with account and team steps.",
            styleParams: ["step layout", "illustration", "summary card"],
            stateParams: ["currentStep", "pending", "invalid", "success"],
            registryShape: "block + page",
            notes: "Good first-run SaaS flow.",
          },
          {
            name: "ForgotPassword",
            description: "Password reset request page.",
            pattern: "Email field + confirmation state.",
            styleParams: ["compact/full", "help text emphasis"],
            stateParams: ["sending", "sent", "rate-limited"],
            registryShape: "block + page",
            notes: "Keep low-complexity.",
          },
          {
            name: "ResetPassword",
            description: "Set new password page.",
            pattern: "Password + confirm + strength lane.",
            styleParams: ["brand treatment", "strength meter style"],
            stateParams: ["submitting", "invalid", "expired token"],
            registryShape: "block + page",
            notes: "Use server action feedback.",
          },
          {
            name: "VerifyEmail",
            description: "Email verification status page.",
            pattern: "Status panel with retry/change-email actions.",
            styleParams: ["tone", "illustration", "compact/full"],
            stateParams: ["checking", "verified", "expired"],
            registryShape: "block + page",
            notes: "Works post-signup.",
          },
          {
            name: "OTPVerify",
            slug: "otp-verify",
            description: "6-digit verification step.",
            pattern: "OTPField + resend + support actions.",
            styleParams: ["cell style", "mono font", "compact/full"],
            stateParams: ["focusedIndex", "complete", "resend cooldown"],
            registryShape: "block + page",
            notes: "Reusable in auth and security.",
          },
          {
            name: "TwoFactorSetup",
            description: "Enable 2FA onboarding.",
            pattern: "QR, secret fallback, OTP verify, backup code slots.",
            styleParams: ["layout", "emphasis", "warning callouts"],
            stateParams: ["loading secret", "verifying", "enabled"],
            registryShape: "block + page",
            notes: "Security-critical journey.",
          },
          {
            name: "TwoFactorChallenge",
            description: "2FA challenge page.",
            pattern: "OTPField plus backup-method switcher.",
            styleParams: ["brand treatment", "alt-method layout"],
            stateParams: ["submitting", "invalid", "locked"],
            registryShape: "block + page",
            notes: "For step-up auth.",
          },
        ]),
      },
      {
        id: "tier-3-app-shells-dashboards",
        title: "App Shells & Dashboards",
        description:
          "Internal product shells and operational overview pages that combine navigation, summary, and detail patterns into route-ready frames.",
        items: withContext("tier-3", "Tier 3", "tier-3-app-shells-dashboards", "App Shells & Dashboards", [
          {
            name: "DashboardSidebarSimple",
            description: "Standard product sidebar shell.",
            pattern: "SidebarNav + AppHeader + content frame.",
            styleParams: ["width", "density", "icon mode", "section badges"],
            stateParams: ["collapsed", "active route"],
            registryShape: "block + page",
            notes: "Default internal app shell.",
          },
          {
            name: "DashboardSidebarCollapsible",
            description: "Sidebar with rail collapse behavior.",
            pattern: "SidebarNav with icon rail and tooltips.",
            styleParams: ["rail width", "collapse breakpoint"],
            stateParams: ["collapsed", "hovered rail", "active"],
            registryShape: "block + page",
            notes: "Great for dense tools.",
          },
          {
            name: "DashboardSidebarWorkspace",
            description: "Workspace/team switcher sidebar.",
            pattern: "SidebarNav + workspace switcher + user menu.",
            styleParams: ["workspace badge style", "nested groups"],
            stateParams: ["active workspace", "collapsed"],
            registryShape: "block + page",
            notes: "For multi-tenant SaaS.",
          },
          {
            name: "DashboardTopbarOnly",
            description: "Top-nav dashboard shell.",
            pattern: "AppHeader + tabs + page content.",
            styleParams: ["header density", "sticky behavior"],
            stateParams: ["active tab", "sync status"],
            registryShape: "block + page",
            notes: "For lighter products.",
          },
          {
            name: "AnalyticsOverview",
            description: "KPI + charts + recent activity layout.",
            pattern: "StatGrid + chart cards + table shell.",
            styleParams: ["card chrome", "chart density", "spacing"],
            stateParams: ["loading", "empty", "filtered"],
            registryShape: "block + page",
            notes: "Generic analytics home.",
          },
          {
            name: "RevenueDashboard",
            description: "Commercial metrics dashboard.",
            pattern: "StatGrid + revenue chart + invoices list.",
            styleParams: ["financial tone", "delta emphasis"],
            stateParams: ["loading", "filtered"],
            registryShape: "block + page",
            notes: "Revenue/admin flavor.",
          },
          {
            name: "ProjectsDashboard",
            description: "Project and task overview.",
            pattern: "List cards + activity + due-date widgets.",
            styleParams: ["compact/comfortable", "priority accents"],
            stateParams: ["loading", "empty", "filtered"],
            registryShape: "block + page",
            notes: "Good for PM tools.",
          },
          {
            name: "CRMWorkspace",
            slug: "crm-workspace",
            description: "Sales/customer dashboard.",
            pattern: "Pipeline summary + account list + detail pane.",
            styleParams: ["density", "avatar use", "badge intensity"],
            stateParams: ["loading", "selected record"],
            registryShape: "block + page",
            notes: "CRM-style operational workspace.",
          },
          {
            name: "SupportInbox",
            description: "Ticket/support operations page.",
            pattern: "FilterToolbar + table/list + conversation detail.",
            styleParams: ["density", "queue badges", "SLA emphasis"],
            stateParams: ["loading", "selection", "syncing"],
            registryShape: "block + page",
            notes: "Great for helpdesk products.",
          },
          {
            name: "MembersDirectory",
            description: "Team members management page.",
            pattern: "Search + filter + table/cards + detail drawer.",
            styleParams: ["card/table mode", "role badge style"],
            stateParams: ["loading", "selection", "invite pending"],
            registryShape: "block + page",
            notes: "Shared admin page.",
          },
        ]),
      },
      {
        id: "tier-3-settings-admin",
        title: "Settings & Admin",
        description:
          "Pages and drop-in modules for billing, security, governance, and developer administration across account and workspace surfaces.",
        items: withContext("tier-3", "Tier 3", "tier-3-settings-admin", "Settings & Admin", [
          {
            name: "BillingSettings",
            description: "Billing management page.",
            pattern: "Plan summary + payment methods + invoices.",
            styleParams: ["commercial tone", "highlighted plan card"],
            stateParams: ["loading", "updating", "payment failure"],
            registryShape: "block + page",
            notes: "Common SaaS admin page.",
          },
          {
            name: "ProfileSettings",
            description: "User profile settings page.",
            pattern: "Avatar editor + personal info + preferences.",
            styleParams: ["field density", "avatar prominence"],
            stateParams: ["dirty", "saving", "success"],
            registryShape: "block + page",
            notes: "Essential account page.",
          },
          {
            name: "SecuritySettings",
            description: "Password/session/security controls page.",
            pattern: "SettingsPanels + session list + 2FA card.",
            styleParams: ["warning tone", "severity accents"],
            stateParams: ["saving", "revoking", "enabled"],
            registryShape: "block + page",
            notes: "Security-focused IA.",
          },
          {
            name: "TeamSettings",
            description: "Workspace/team admin page.",
            pattern: "Members, roles, invites, defaults sections.",
            styleParams: ["density", "role-chip style"],
            stateParams: ["saving", "invite pending"],
            registryShape: "block + page",
            notes: "Multi-tenant admin.",
          },
          {
            name: "NotificationSettings",
            description: "Channel and category preferences page.",
            pattern: "SettingsRows grouped by product area.",
            styleParams: ["toggle density", "quiet/compact mode"],
            stateParams: ["dirty", "saving"],
            registryShape: "block + page",
            notes: "Works for app + email prefs.",
          },
          {
            name: "APIKeysPage",
            slug: "api-keys-page",
            description: "API key management page.",
            pattern: "Table/list + create dialog + secret reveal flow.",
            styleParams: ["mono key style", "danger emphasis"],
            stateParams: ["creating", "revealing", "revoking"],
            registryShape: "block + page",
            notes: "Developer-focused admin.",
          },
          {
            name: "AuditLogPage",
            description: "Operational audit history page.",
            pattern: "FilterToolbar + table + detail panel.",
            styleParams: ["dense table", "diff view style"],
            stateParams: ["loading", "filtered"],
            registryShape: "block + page",
            notes: "Enterprise requirement.",
          },
          {
            name: "UsageMeterPanel",
            description: "Quota and usage summary block.",
            pattern: "Stat cards + progress + upsell CTA.",
            styleParams: ["warning/healthy tone", "compact/full"],
            stateParams: ["near limit", "over limit"],
            registryShape: "registry:block",
            notes: "Can live in settings or dashboard.",
          },
          {
            name: "PlanUpgradePanel",
            description: "Upgrade and upsell block.",
            pattern: "Pricing comparison + CTA + feature deltas.",
            styleParams: ["featured plan treatment", "badge tone"],
            stateParams: ["current", "recommended"],
            registryShape: "registry:block",
            notes: "Drop into billing/settings.",
          },
          {
            name: "InviteMembersDialogBlock",
            description: "Team invite modal block.",
            pattern: "Dialog + email chip input + role select.",
            styleParams: ["dialog size", "chip density"],
            stateParams: ["submitting", "invalid", "sent"],
            registryShape: "registry:block",
            notes: "Common admin task block.",
          },
        ]),
      },
      {
        id: "tier-3-workflows-onboarding",
        title: "Workflows & Onboarding",
        description:
          "Transactional flows and first-run modules intended for setup, import, search, and activity-heavy journeys inside the product.",
        items: withContext("tier-3", "Tier 3", "tier-3-workflows-onboarding", "Workflows & Onboarding", [
          {
            name: "CreateProjectFlow",
            description: "New project creation wizard.",
            pattern: "WizardShell with naming/template/privacy steps.",
            styleParams: ["stepper size", "summary aside"],
            stateParams: ["currentStep", "invalid", "creating"],
            registryShape: "block + page",
            notes: "Reusable creation flow.",
          },
          {
            name: "ImportDataWizard",
            description: "CSV/API import journey.",
            pattern: "WizardShell + uploader + mapping + review.",
            styleParams: ["table density", "mapping chrome"],
            stateParams: ["uploading", "mapping", "validating", "importing"],
            registryShape: "block + page",
            notes: "High-value B2B workflow.",
          },
          {
            name: "OnboardingChecklist",
            description: "First-run progress module.",
            pattern: "Checklist + progress + CTAs.",
            styleParams: ["card chrome", "compact/full"],
            stateParams: ["completed items", "dismissed"],
            registryShape: "registry:block",
            notes: "Useful on dashboard home.",
          },
          {
            name: "EmptyWorkspace",
            description: "First project/team empty page.",
            pattern: "Hero-like empty state with setup actions.",
            styleParams: ["illustration scale", "CTA emphasis"],
            stateParams: ["empty", "loading templates"],
            registryShape: "block + page",
            notes: "First-run SaaS block.",
          },
          {
            name: "SearchResultsPage",
            description: "Global search results layout.",
            pattern: "Search header + grouped results + filters.",
            styleParams: ["group chrome", "keyboard hint lane"],
            stateParams: ["loading", "empty", "selected"],
            registryShape: "block + page",
            notes: "Works with cmd-k deep link.",
          },
          {
            name: "ActivityInboxPage",
            description: "Actionable activity center.",
            pattern: "NotificationList + filters + detail drawer.",
            styleParams: ["density", "unread emphasis"],
            stateParams: ["loading", "selection", "unread-only"],
            registryShape: "block + page",
            notes: "Operations/home feed page.",
          },
        ]),
      },
      {
        id: "tier-3-marketing-navigation-hero",
        title: "Marketing Navigation & Hero",
        description:
          "Top-of-funnel navigation, hero, comparison, and persuasion blocks for polished marketing routes with strong editorial structure.",
        items: withContext(
          "tier-3",
          "Tier 3",
          "tier-3-marketing-navigation-hero",
          "Marketing Navigation & Hero",
          [
            {
              name: "NavbarSimple",
              description: "Lightweight marketing navigation.",
              pattern: "Brand, primary links, CTA, mobile sheet.",
              styleParams: ["height", "cta emphasis", "sticky/glass"],
              stateParams: ["mobile open", "active link"],
              registryShape: "registry:block",
              notes: "Good default marketing nav.",
            },
            {
              name: "NavbarProductMega",
              description: "Marketing nav with rich dropdowns.",
              pattern: "TopNavBar + mega panels + badges.",
              styleParams: ["panel width", "promo lane", "glass/solid"],
              stateParams: ["open section", "active link"],
              registryShape: "registry:block",
              notes: "For product-heavy websites.",
            },
            {
              name: "NavbarDocs",
              description: "Documentation-oriented navigation.",
              pattern: "Brand, docs tabs, search, version switcher.",
              styleParams: ["height", "compact/full", "border style"],
              stateParams: ["active section", "mobile open"],
              registryShape: "registry:block",
              notes: "For docs or help centers.",
            },
            {
              name: "HeroSaaS",
              slug: "hero-saas",
              description: "Main product hero section.",
              pattern: "Heading, subcopy, CTA pair, social proof, screenshot.",
              styleParams: ["alignment", "media ratio", "accent intensity"],
              stateParams: [],
              registryShape: "registry:block",
              notes: "Default SaaS landing hero.",
            },
            {
              name: "HeroDocs",
              description: "Documentation/index hero.",
              pattern: "Title, search, quick links, version/meta.",
              styleParams: ["compact/full", "muted/strong tone"],
              stateParams: [],
              registryShape: "registry:block",
              notes: "For docs home pages.",
            },
            {
              name: "HeroWaitlist",
              description: "Early-access signup hero.",
              pattern: "Heading + value prop + inline form.",
              styleParams: ["layout", "image placement", "urgency tone"],
              stateParams: ["submitting", "success"],
              registryShape: "registry:block",
              notes: "Launch/waitlist page hero.",
            },
            {
              name: "LogoCloud",
              description: "Customer or partner logos section.",
              pattern: "Responsive logo grid/rail.",
              styleParams: ["mono/color mode", "density", "heading treatment"],
              stateParams: [],
              registryShape: "registry:block",
              notes: "Social proof section.",
            },
            {
              name: "FeatureGridBento",
              description: "Feature highlight section.",
              pattern: "Mixed card sizes with media/text.",
              styleParams: ["grid density", "card chrome", "icon style"],
              stateParams: ["hovered"],
              registryShape: "registry:block",
              notes: "High-richness marketing block.",
            },
            {
              name: "FeatureComparison",
              description: "Plan/feature comparison section.",
              pattern: "Sticky column table/cards hybrid.",
              styleParams: ["density", "highlight current plan"],
              stateParams: ["current plan", "hover"],
              registryShape: "registry:block",
              notes: "Pairs with pricing.",
            },
            {
              name: "PricingSection",
              description: "Pricing plans section.",
              pattern: "PricingCards + billing toggle + FAQ link.",
              styleParams: ["featured plan", "toggle style", "card density"],
              stateParams: ["monthly/yearly", "current plan"],
              registryShape: "registry:block",
              notes: "Commercial landing section.",
            },
            {
              name: "FAQSection",
              slug: "faq-section",
              description: "Landing page FAQ block.",
              pattern: "SectionHeader + FAQList + support CTA.",
              styleParams: ["density", "background band", "CTA style"],
              stateParams: ["filtered", "open items"],
              registryShape: "registry:block",
              notes: "Marketing-ready FAQ.",
            },
            {
              name: "TestimonialsSection",
              description: "Quotes/social proof section.",
              pattern: "Grid/carousel of TestimonialCards.",
              styleParams: ["carousel/grid mode", "card chrome"],
              stateParams: ["autoplay paused", "active slide"],
              registryShape: "registry:block",
              notes: "For marketing pages.",
            },
            {
              name: "CTASection",
              slug: "cta-section",
              description: "Strong conversion section.",
              pattern: "Heading, support copy, CTA(s), trust note.",
              styleParams: ["background band", "contrast", "compact/full"],
              stateParams: [],
              registryShape: "registry:block",
              notes: "Reusable final page section.",
            },
          ],
        ),
      },
      {
        id: "tier-3-footer-conversion",
        title: "Footer & Conversion",
        description:
          "Footer systems and lead-capture surfaces that close marketing routes cleanly while staying consistent with the broader site shell.",
        items: withContext("tier-3", "Tier 3", "tier-3-footer-conversion", "Footer & Conversion", [
          {
            name: "FooterSimple",
            description: "Compact site footer.",
            pattern: "Link columns, socials, legal row.",
            styleParams: ["density", "divider", "minimal/full"],
            stateParams: [],
            registryShape: "registry:block",
            notes: "For simple sites.",
          },
          {
            name: "FooterProduct",
            description: "Rich product footer.",
            pattern: "Multi-column links, CTA, socials, locale.",
            styleParams: ["density", "heading tone", "top promo band"],
            stateParams: [],
            registryShape: "registry:block",
            notes: "For larger product sites.",
          },
          {
            name: "FooterDocs",
            description: "Documentation footer.",
            pattern: "Doc links, community links, version/legal.",
            styleParams: ["compact/full", "border style"],
            stateParams: [],
            registryShape: "registry:block",
            notes: "Docs/help-center footer.",
          },
          {
            name: "NewsletterSection",
            description: "Newsletter signup block.",
            pattern: "Inline or card email capture pattern.",
            styleParams: ["compact/full", "background band"],
            stateParams: ["submitting", "success", "invalid"],
            registryShape: "registry:block",
            notes: "Reusable growth section.",
          },
          {
            name: "ContactSalesSection",
            description: "Sales/contact conversion section.",
            pattern: "Form + trust copy + calendar/contact options.",
            styleParams: ["layout", "field density", "enterprise tone"],
            stateParams: ["submitting", "success", "invalid"],
            registryShape: "registry:block",
            notes: "B2B lead capture section.",
          },
          {
            name: "BlogIndexHeader",
            description: "Blog listing intro block.",
            pattern: "Title, category chips, featured article slot.",
            styleParams: ["compact/full", "chip style"],
            stateParams: ["active category"],
            registryShape: "registry:block",
            notes: "Editorial listing top section.",
          },
        ]),
      },
      {
        id: "tier-3-docs-editorial",
        title: "Docs & Editorial",
        description:
          "Knowledge-base and editorial route modules intended for docs shells, article framing, and release communication.",
        items: withContext("tier-3", "Tier 3", "tier-3-docs-editorial", "Docs & Editorial", [
          {
            name: "DocsSidebarLayout",
            description: "Documentation app shell.",
            pattern: "Sidebar tree + content header + right TOC.",
            styleParams: ["density", "width", "sticky rails"],
            stateParams: ["active page", "collapsed nav"],
            registryShape: "block + page",
            notes: "Docs/knowledge base layout.",
          },
          {
            name: "DocsArticleHeader",
            description: "Docs article intro block.",
            pattern: "Eyebrow, title, metadata, actions.",
            styleParams: ["compact/full", "meta density"],
            stateParams: [],
            registryShape: "registry:block",
            notes: "For article pages.",
          },
          {
            name: "DocsPaginationFooter",
            description: "Prev/next article block.",
            pattern: "Two-card footer nav with labels.",
            styleParams: ["compact/full", "border/card mode"],
            stateParams: ["disabled edge"],
            registryShape: "registry:block",
            notes: "Docs article continuation.",
          },
          {
            name: "ChangelogTimelinePage",
            description: "Release/changelog page.",
            pattern: "Timeline + grouped release notes.",
            styleParams: ["density", "badge tone", "sticky year nav"],
            stateParams: ["active version", "filtered"],
            registryShape: "block + page",
            notes: "Docs/marketing crossover page.",
          },
        ]),
      },
      {
        id: "tier-3-trust-company",
        title: "Trust & Company",
        description:
          "Company and trust-oriented modules for jobs, service health, and supporting pages that sit adjacent to the product and marketing system.",
        items: withContext("tier-3", "Tier 3", "tier-3-trust-company", "Trust & Company", [
          {
            name: "CareersListing",
            description: "Jobs index section.",
            pattern: "Role cards/table + filters + CTA.",
            styleParams: ["card/table mode", "compact/full"],
            stateParams: ["filtered", "empty"],
            registryShape: "block + page",
            notes: "Company marketing block.",
          },
          {
            name: "StatusPageSummary",
            description: "Operational status/incident page.",
            pattern: "Current status hero + component list + incidents.",
            styleParams: ["severity tone", "compact/full"],
            stateParams: ["degraded", "outage", "resolved"],
            registryShape: "block + page",
            notes: "Useful for SaaS trust pages.",
          },
        ]),
      },
    ],
  },
];

export const registryTiers = registryTierInventory.filter(tier => tier.id !== "tier-3");

export const registryItems = registryTiers.flatMap(tier => tier.clusters.flatMap(cluster => cluster.items));

export const registryItemBySlug = Object.fromEntries(
  registryItems.map(item => [item.slug, item]),
) as Record<string, RegistryItem>;

export const registryClusters: RegistryClusterSection[] = registryTiers.flatMap(tier =>
  tier.clusters.map(cluster => ({
    ...cluster,
    tierId: tier.id,
    tierLabel: tier.label,
    tierTitle: tier.title,
    tierDescription: tier.description,
  })),
);

export const registryCounts = {
  total: registryItems.length,
  clusters: registryClusters.length,
};
