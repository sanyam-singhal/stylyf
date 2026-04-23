import { Show, mergeProps, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { Badge } from "~/components/registry/feedback-display/badge";
import { cn } from "~/lib/cn";

export type BulkActionBarProps = Omit<JSX.HTMLAttributes<HTMLElement>, "children"> & {
  actions?: JSX.Element;
  class?: string;
  count?: number;
  visible?: boolean;
};

export function BulkActionBar(userProps: BulkActionBarProps) {
  const props = mergeProps(
    {
      count: 12,
      visible: true,
    },
    userProps,
  );

  const [local, others] = splitProps(props, ["actions", "class", "count", "visible"]);

  return (
    <Show when={local.visible}>
      <section
        class={cn(
          "ui-shell-muted flex flex-col gap-4 border border-border/80 bg-[linear-gradient(90deg,color-mix(in_oklab,var(--info)_10%,var(--card)_90%),var(--card))] px-[var(--space-5)] py-[var(--space-4)] shadow-soft sm:flex-row sm:items-center sm:justify-between",
          local.class,
        )}
        {...others}
      >
        <div class="flex items-center gap-3">
          <Badge tone="accent">{local.count} selected</Badge>
          <div>
            <div class="text-sm font-semibold text-foreground">Bulk actions ready</div>
            <div class="text-sm text-muted-foreground">Apply changes without leaving the current data context.</div>
          </div>
        </div>
        <Show when={local.actions}>
          <div class="flex flex-wrap gap-2 rounded-[calc(var(--radius-lg)+2px)] border border-border/70 bg-card/92 p-2 shadow-inset">
            {local.actions}
          </div>
        </Show>
      </section>
    </Show>
  );
}
