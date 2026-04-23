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
  return `src/components/registry/${clusterDirectory(item)}/${item.slug}.tsx`;
}

export function clusterDemoFilePath(cluster: Pick<RegistryClusterSection, "id" | "tierId">) {
  return `src/components/registry/${clusterDirectory(cluster)}/demos.tsx`;
}

export function componentImportPath(item: RegistryItem) {
  return `~/components/registry/${clusterDirectory(item)}/${item.slug}`;
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
            name: "Table",
            description: "Semantic table scaffold.",
            pattern: "Table, Head, Body, Row, Cell, Caption.",
            styleParams: ["density", "zebra", "sticky header", "numeric alignment"],
            stateParams: ["selected", "sorted", "hover", "loading"],
            registryShape: "registry:ui",
            notes: "Keep raw table separate from data grid.",
          },
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
            notes: "Base shell for multi-step transactional flows.",
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
    ],
  },
];

export const registryTiers = registryTierInventory;

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
