import { For, mergeProps, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { Avatar } from "~/components/registry/feedback-display/avatar";
import { cn } from "~/lib/cn";

export type ActivityItem = {
  actor: string;
  body: string;
  meta: string;
};

export type ActivityFeedProps = Omit<JSX.HTMLAttributes<HTMLElement>, "children"> & {
  class?: string;
  items?: ActivityItem[];
  title?: JSX.Element;
};

const defaultItems: ActivityItem[] = [
  { actor: "Sanyam Singhal", body: "Updated the registry deployment documentation.", meta: "6 min ago" },
  { actor: "Ops team", body: "Verified TLS issuance for stylyf.com.", meta: "28 min ago" },
  { actor: "Design system", body: "Promoted the feedback surfaces to stable.", meta: "2 h ago" },
];

export function ActivityFeed(userProps: ActivityFeedProps) {
  const props = mergeProps(
    {
      items: defaultItems,
      title: "Activity feed",
    },
    userProps,
  );

  const [local, others] = splitProps(props, ["class", "items", "title"]);

  return (
    <section class={cn("ui-shell-muted space-y-[var(--space-4)] border border-border/80 p-[var(--space-5)] shadow-soft", local.class)} {...others}>
      <div class="flex items-center justify-between gap-3">
        <h3 class="text-sm font-semibold tracking-[-0.01em] text-foreground">{local.title}</h3>
        <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Audit trail</div>
      </div>
      <div class="space-y-[var(--space-4)]">
        <For each={local.items}>
          {item => (
            <div class="relative flex gap-3 pl-1">
              <div class="absolute left-[1.35rem] top-10 h-[calc(100%-0.25rem)] w-px bg-[color:color-mix(in_oklab,var(--border)_66%,var(--info)_34%)] last:hidden" />
              <Avatar alt={item.actor} size="sm" />
              <div class="min-w-0 space-y-1 pt-1">
                <div class="text-sm font-semibold text-foreground">{item.actor}</div>
                <p class="text-sm leading-6 text-muted-foreground">{item.body}</p>
                <div class="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{item.meta}</div>
              </div>
            </div>
          )}
        </For>
      </div>
    </section>
  );
}
