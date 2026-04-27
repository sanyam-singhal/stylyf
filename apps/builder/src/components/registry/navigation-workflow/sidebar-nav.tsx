import { For, Show, mergeProps, splitProps } from "solid-js";
import type { JSX } from "solid-js";
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
    <aside class={cn("builder-sidebar space-y-[var(--space-6)] p-[var(--space-5)]", local.collapsed ? "w-[5.5rem]" : "w-full max-w-sm", local.class)} {...others}>
      <div class={cn("flex items-center gap-3", local.collapsed ? "justify-center" : "justify-between")}>
        <div class="builder-orb size-11 shrink-0 font-mono text-sm font-black">S</div>
        <div class={cn("min-w-0", local.collapsed && "sr-only")}>
          <div class="text-sm font-semibold text-ink-foreground">{local.title}</div>
          <div class="text-xs uppercase tracking-[0.22em] text-ink-foreground/55">AI app factory</div>
        </div>
      </div>

      <div class={cn("builder-rail-card space-y-2", local.collapsed && "hidden")}>
        <div class="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-ink-foreground/50">Current loop</div>
        <div class="text-sm font-semibold text-ink-foreground">Prompt / IR / Repo</div>
        <p class="text-xs leading-5 text-ink-foreground/58">Every accepted iteration is tracked, pushed, and ready for dev review.</p>
      </div>

      <div class="space-y-[var(--space-4)]">
        <For each={local.groups}>
          {group => (
            <div class="space-y-2">
              <div class={cn("text-xs font-semibold uppercase tracking-[0.2em] text-ink-foreground/48", local.collapsed && "text-center")}>
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
                            "builder-sidebar-link justify-between text-sm",
                            local.collapsed && "justify-center px-2.5",
                          )}
                          data-active={item.active ? "true" : "false"}
                          title={item.label}
                        >
                          <span class={cn("flex items-center gap-2", local.collapsed && "justify-center")}>
                            <span class="shrink-0 text-current">{item.icon}</span>
                            <span class={cn(local.collapsed && "sr-only")}>{item.label}</span>
                          </span>
                          <Show when={item.badge && !local.collapsed}>
                            <span class="rounded-full bg-ink-foreground/10 px-2 py-0.5 text-xs text-ink-foreground/72">{item.badge}</span>
                          </Show>
                        </a>
                      ) : (
                        <button
                          type="button"
                          class={cn(
                            "builder-sidebar-link w-full justify-between text-left text-sm",
                            local.collapsed && "justify-center px-2.5",
                          )}
                          data-active={item.active ? "true" : "false"}
                          title={item.label}
                        >
                          <span class={cn("flex items-center gap-2", local.collapsed && "justify-center")}>
                            <span class="shrink-0 text-current">{item.icon}</span>
                            <span class={cn(local.collapsed && "sr-only")}>{item.label}</span>
                          </span>
                          <Show when={item.badge && !local.collapsed}>
                            <span class="rounded-full bg-ink-foreground/10 px-2 py-0.5 text-xs text-ink-foreground/72">{item.badge}</span>
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
