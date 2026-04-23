import { For, Show, mergeProps, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { Badge } from "~/components/registry/feedback-display/badge";
import { cn } from "~/lib/cn";

export type SidebarNavGroup = {
  items: { active?: boolean; badge?: string; href?: string; icon?: JSX.Element; label: string }[];
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
    <aside
      class={cn(
        "ui-shell-muted space-y-[var(--space-5)] border border-border/80 p-[var(--space-5)] shadow-soft",
        local.collapsed ? "w-[5.5rem]" : "w-full max-w-sm",
        local.class,
      )}
      {...others}
    >
      <div class={cn("flex items-center gap-3", local.collapsed ? "justify-center" : "justify-between")}>
        <div class={cn("min-w-0", local.collapsed && "sr-only")}>
          <div class="text-sm font-semibold text-foreground">{local.title}</div>
          <div class="text-xs uppercase tracking-[0.18em] text-muted-foreground">Workspace</div>
        </div>
        <Badge tone={local.collapsed ? "neutral" : "accent"}>{local.collapsed ? "Rail" : "Expanded"}</Badge>
      </div>

      <div class="space-y-[var(--space-4)]">
        <For each={local.groups}>
          {group => (
            <div class="space-y-2">
              <div class={cn("text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground", local.collapsed && "text-center")}>
                {local.collapsed ? group.label.slice(0, 1) : group.label}
              </div>
              <div class="space-y-1">
                <For each={group.items}>
                  {item => (
                    <div>
                      {item.href ? (
                        <a
                          href={item.href}
                          class={cn(
                            "flex items-center justify-between gap-3 rounded-[var(--radius-lg)] border px-3 py-2.5 text-sm transition",
                            local.collapsed && "justify-center px-2.5",
                            item.active
                              ? "border-accent/50 bg-accent text-accent-foreground shadow-inset"
                              : "border-transparent text-muted-foreground hover:border-border/80 hover:bg-background hover:text-foreground",
                          )}
                          title={item.label}
                        >
                          <span class={cn("flex items-center gap-2", local.collapsed && "justify-center")}>
                            <span class="shrink-0 text-current">{item.icon}</span>
                            <span class={cn(local.collapsed && "sr-only")}>{item.label}</span>
                          </span>
                          <Show when={item.badge && !local.collapsed}>
                            <span class="ui-chip ui-chip-muted">{item.badge}</span>
                          </Show>
                        </a>
                      ) : (
                        <button
                          type="button"
                          class={cn(
                            "flex w-full items-center justify-between gap-3 rounded-[var(--radius-lg)] border px-3 py-2.5 text-left text-sm transition",
                            local.collapsed && "justify-center px-2.5",
                            item.active
                              ? "border-accent/50 bg-accent text-accent-foreground shadow-inset"
                              : "border-transparent text-muted-foreground hover:border-border/80 hover:bg-background hover:text-foreground",
                          )}
                          title={item.label}
                        >
                          <span class={cn("flex items-center gap-2", local.collapsed && "justify-center")}>
                            <span class="shrink-0 text-current">{item.icon}</span>
                            <span class={cn(local.collapsed && "sr-only")}>{item.label}</span>
                          </span>
                          <Show when={item.badge && !local.collapsed}>
                            <span class="ui-chip ui-chip-muted">{item.badge}</span>
                          </Show>
                        </button>
                      )}
                    </div>
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
