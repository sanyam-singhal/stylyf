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
    <section class={cn("ui-card space-y-[var(--space-5)] p-[var(--space-6)]", local.class)} {...others}>
      <For each={local.items}>
        {item => (
          <div class="relative flex gap-4 pl-1 last:pb-0">
            <div class="relative flex w-7 shrink-0 justify-center">
              <span
                class={cn(
                  "relative z-10 mt-1 size-3 rounded-full border",
                  item.state === "completed" && "border-success/40 bg-success",
                  item.state === "active" && "border-primary/35 bg-primary",
                  item.state === "upcoming" && "border-border/80 bg-background",
                )}
              />
              <span class="absolute top-4 h-[calc(100%+var(--space-5))] w-px bg-border/70 last:hidden" />
            </div>
            <div class="space-y-1.5 pb-[var(--space-5)]">
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
