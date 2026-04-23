import type { Component } from "solid-js";
import {
  BellRing,
  Blend,
  Blocks,
  BookOpenText,
  BriefcaseBusiness,
  CalendarDays,
 ChartColumnBig,
  CircleAlert,
  CircleHelp,
  CircleUserRound,
  ClipboardCheck,
  Columns2,
  Command,
  Component as ComponentIcon,
  CreditCard,
  Database,
  FileCog,
  FileText,
  Filter,
  FolderKanban,
  FormInput,
  Gauge,
  Grid2x2,
  HandHelping,
  House,
  Image,
  Inbox,
  KeyRound,
  LayoutTemplate,
  LibraryBig,
  ListFilter,
  Logs,
  MailCheck,
  MenuSquare,
  MessageCircleMore,
  MonitorSmartphone,
  MousePointer2,
  Newspaper,
  PanelsTopLeft,
  PanelTop,
  ScanSearch,
  Search,
  SlidersHorizontal,
  SquareMenu,
  SquareStack,
  Table2,
  Tag,
  TextCursorInput,
  TimerReset,
  ToggleLeft,
  Waypoints,
  Workflow,
  type LucideIcon,
} from "lucide-solid";

type ClusterVisual = {
  color: string;
  contrast: string;
  icon: LucideIcon;
};

const clusterVisuals: Record<string, ClusterVisual> = {
  "tier-1-actions-navigation": { color: "var(--primary)", contrast: "var(--primary-foreground)", icon: MousePointer2 },
  "tier-1-form-inputs": { color: "var(--info)", contrast: "var(--info-foreground)", icon: FormInput },
  "tier-1-disclosure-overlay": { color: "var(--accent-strong)", contrast: "var(--primary-foreground)", icon: SquareStack },
  "tier-1-feedback-display": { color: "var(--success)", contrast: "var(--success-foreground)", icon: BellRing },
  "tier-2-form-systems": { color: "var(--info)", contrast: "var(--info-foreground)", icon: ClipboardCheck },
  "tier-2-information-states": { color: "var(--secondary-foreground)", contrast: "var(--secondary)", icon: Gauge },
  "tier-2-data-views": { color: "var(--primary)", contrast: "var(--primary-foreground)", icon: ChartColumnBig },
  "tier-2-navigation-workflow": { color: "var(--accent-strong)", contrast: "var(--primary-foreground)", icon: Workflow },
};

const keywordIcons: Array<[RegExp, LucideIcon]> = [
  [/button|toggle/i, MousePointer2],
  [/link|breadcrumb|pagination/i, Waypoints],
  [/text|field|textarea|otp/i, TextCursorInput],
  [/number|slider/i, SlidersHorizontal],
  [/select|combobox|filter|sort/i, ListFilter],
  [/checkbox|radio|switch/i, ToggleLeft],
  [/calendar|date/i, CalendarDays],
  [/command/i, Command],
  [/tabs|menubar/i, PanelsTopLeft],
  [/accordion|collapsible/i, Blend],
  [/dialog|drawer|popover|tooltip|menu/i, SquareMenu],
  [/progress|loading|skeleton/i, TimerReset],
  [/badge|pricing|plan|feature|testimonial/i, Tag],
  [/avatar|profile|member/i, CircleUserRound],
  [/toast|notification|activity|comment/i, MessageCircleMore],
  [/separator/i, Columns2],
  [/table|column|data|audit|usage/i, Table2],
  [/page|docs|blog|changelog/i, FileText],
  [/header|navbar|footer/i, PanelTop],
  [/sidebar|layout|dashboard/i, LayoutTemplate],
  [/wizard|step|flow|onboarding/i, Workflow],
  [/search/i, Search],
  [/empty|error|status/i, CircleAlert],
  [/upload|media|import/i, Image],
  [/security|2fa|verify|api/i, KeyRound],
  [/billing|revenue|pricing/i, CreditCard],
  [/team|workspace|project/i, FolderKanban],
  [/docs|article/i, LibraryBig],
  [/support|inbox/i, Inbox],
  [/contact|sales|newsletter|cta/i, MailCheck],
  [/crm/i, Database],
  [/careers|company|logo|trust/i, HandHelping],
  [/settings/i, FileCog],
];

export function visualForCluster(clusterId: string) {
  return clusterVisuals[clusterId] ?? {
    color: "var(--primary)",
    contrast: "var(--primary-foreground)",
    icon: ComponentIcon,
  };
}

export function iconForItem(name: string, clusterId: string): Component<{ class?: string }> {
  const match = keywordIcons.find(([pattern]) => pattern.test(name));
  return (match?.[1] ?? visualForCluster(clusterId).icon) as unknown as Component<{ class?: string }>;
}

export function clusterVisualStyle(clusterId: string) {
  const meta = visualForCluster(clusterId);

  return {
    "--cluster-color": meta.color,
    "--cluster-contrast": meta.contrast,
    "--cluster-soft": `color-mix(in oklab, ${meta.color} 16%, var(--card) 84%)`,
    "--cluster-muted": `color-mix(in oklab, ${meta.color} 10%, var(--muted-soft) 90%)`,
    "--cluster-line": `color-mix(in oklab, ${meta.color} 42%, var(--border) 58%)`,
  };
}
