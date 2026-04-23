import { For, mergeProps, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { cn } from "~/lib/cn";

export type TimelineItem = {
  description?: string;
  state: "active" | "completed" | "upcoming";
  title: string;
};

export type TimelineProps = Omit<JSX.HTMLAttributes<HTMLElement>, "children"> & {
  class?: string;
  items?: TimelineItem[];
};

const defaultItems: TimelineItem[] = [
  { title: "Workspace details", description: "Name, slug, and default locale.", state: "completed" },
  { title: "Brand settings", description: "Tokens and shell preferences.", state: "active" },
  { title: "Invite collaborators", description: "Roles, permissions, and first-run guidance.", state: "upcoming" },
];

export function Timeline(userProps: TimelineProps) {
  const props = mergeProps(
    {
      items: defaultItems,
    },
    userProps,
  );

  const [local, others] = splitProps(props, ["class", "items"]);

  return (
    <section class={cn("ui-shell-muted space-y-[var(--space-5)] border border-border/80 p-[var(--space-6)] shadow-soft", local.class)} {...others}>
      <For each={local.items}>
        {item => (
          <div class="relative flex gap-4 pl-1 last:pb-0">
            <div class="relative flex w-7 shrink-0 justify-center">
              <span
                class={cn(
                  "relative z-10 mt-1 size-3 rounded-full border shadow-[0_0_0_6px_color-mix(in_oklab,var(--card)_84%,transparent)]",
                  item.state === "completed" && "border-success/40 bg-success",
                  item.state === "active" && "border-warning/45 bg-warning",
                  item.state === "upcoming" && "border-border/80 bg-background",
                )}
              />
              <span class="absolute top-4 h-[calc(100%+var(--space-5))] w-px bg-[color:color-mix(in_oklab,var(--border)_66%,var(--warning)_34%)] last:hidden" />
            </div>
            <div class="space-y-1.5 rounded-[calc(var(--radius-lg)+2px)] border border-border/70 bg-card/88 px-[var(--space-4)] py-[var(--space-3)] pb-[var(--space-4)] shadow-inset">
              <div class="text-sm font-semibold text-foreground">{item.title}</div>
              <div class="text-sm leading-6 text-muted-foreground">{item.description}</div>
              <div class="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{item.state}</div>
            </div>
          </div>
        )}
      </For>
    </section>
  );
}
