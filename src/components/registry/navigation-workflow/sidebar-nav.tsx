import { For, Show, mergeProps, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { Badge } from "~/components/registry/feedback-display/badge";
import { cn } from "~/lib/cn";

export type SidebarNavGroup = {
  items: { active?: boolean; badge?: string; icon?: JSX.Element; label: string }[];
  label: string;
};

export type SidebarNavProps = Omit<JSX.HTMLAttributes<HTMLElement>, "children"> & {
  class?: string;
  collapsed?: boolean;
  groups?: SidebarNavGroup[];
  title?: JSX.Element;
};

const defaultGroups: SidebarNavGroup[] = [
  {
    label: "Workspace",
    items: [
      { label: "Overview", active: true },
      { label: "Members", badge: "12" },
      { label: "Billing" },
    ],
  },
  {
    label: "Settings",
    items: [{ label: "Brand" }, { label: "Security" }, { label: "Notifications", badge: "3" }],
  },
];

export function SidebarNav(userProps: SidebarNavProps) {
  const props = mergeProps(
    {
      collapsed: false,
      groups: defaultGroups,
      title: "Workspace nav",
    },
    userProps,
  );

  const [local, others] = splitProps(props, ["class", "collapsed", "groups", "title"]);

  return (
    <aside class={cn("ui-card space-y-[var(--space-5)] p-[var(--space-5)]", local.class)} {...others}>
      <div class="flex items-center justify-between gap-3">
        <div class="text-sm font-semibold text-foreground">{local.title}</div>
        <Badge>{local.collapsed ? "Collapsed" : "Expanded"}</Badge>
      </div>

      <div class="space-y-[var(--space-4)]">
        <For each={local.groups}>
          {group => (
            <div class="space-y-2">
              <div class="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{group.label}</div>
              <div class="space-y-1">
                <For each={group.items}>
                  {item => (
                    <a
                      href="#"
                      class={cn(
                        "flex items-center justify-between gap-3 rounded-[calc(var(--radius)*0.9)] px-3 py-2.5 text-sm transition",
                        item.active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-background-subtle hover:text-foreground",
                      )}
                    >
                      <span class="flex items-center gap-2">
                        {item.icon}
                        <span>{local.collapsed ? item.label.slice(0, 1) : item.label}</span>
                      </span>
                      <Show when={item.badge && !local.collapsed}>
                        <span class="ui-chip ui-chip-muted">{item.badge}</span>
                      </Show>
                    </a>
                  )}
                </For>
              </div>
            </div>
          )}
        </For>
      </div>
    </aside>
  );
}
