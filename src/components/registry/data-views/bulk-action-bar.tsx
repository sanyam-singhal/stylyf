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
          "ui-card flex flex-col gap-3 border-primary/18 bg-accent/22 px-[var(--space-5)] py-[var(--space-4)] sm:flex-row sm:items-center sm:justify-between",
          local.class,
        )}
        {...others}
      >
        <div class="flex items-center gap-3">
          <Badge tone="accent">{local.count} selected</Badge>
          <div class="text-sm text-foreground">Apply bulk actions without leaving the data context.</div>
        </div>
        <Show when={local.actions}>
          <div class="flex flex-wrap gap-2">{local.actions}</div>
        </Show>
      </section>
    </Show>
  );
}
