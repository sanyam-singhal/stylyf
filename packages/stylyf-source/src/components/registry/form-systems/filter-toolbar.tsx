import { Show, mergeProps, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { Badge } from "~/components/registry/feedback-display/badge";
import { cn } from "~/lib/cn";

export type FilterToolbarProps = Omit<JSX.HTMLAttributes<HTMLDivElement>, "children"> & {
  actions?: JSX.Element;
  bulkActions?: JSX.Element;
  chips?: JSX.Element;
  class?: string;
  dirtyFilters?: boolean;
  filters?: JSX.Element;
  search?: JSX.Element;
  selectionCount?: number;
  sticky?: boolean;
  title?: JSX.Element;
};

export function FilterToolbar(userProps: FilterToolbarProps) {
  const props = mergeProps(
    {
      dirtyFilters: false,
      selectionCount: 0,
      sticky: false,
      title: "Filters and actions",
    },
    userProps,
  );

  const [local, others] = splitProps(props, [
    "actions",
    "bulkActions",
    "chips",
    "class",
    "dirtyFilters",
    "filters",
    "search",
    "selectionCount",
    "sticky",
    "title",
  ]);

  return (
    <div
      class={cn(
        "ui-card space-y-[var(--space-4)] p-[var(--space-5)]",
        local.sticky && "top-24 z-10",
        local.class,
      )}
      {...others}
    >
      <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div class="flex flex-wrap items-center gap-2">
          <div class="text-sm font-semibold tracking-[-0.01em] text-foreground">{local.title}</div>
          <Show when={local.dirtyFilters}>
            <Badge tone="accent">Dirty filters</Badge>
          </Show>
          <Show when={local.selectionCount > 0}>
            <Badge tone="neutral">{local.selectionCount} selected</Badge>
          </Show>
        </div>
        <Show when={local.actions}>
          <div class="shrink-0">{local.actions}</div>
        </Show>
      </div>

      <div class="grid gap-3 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_auto] xl:items-start">
        <div class="min-w-0">{local.search}</div>
        <div class="min-w-0">{local.filters}</div>
        <Show when={local.bulkActions}>
          <div class="xl:justify-self-end">{local.bulkActions}</div>
        </Show>
      </div>

      <Show when={local.chips}>
        <div class="flex flex-wrap gap-2 border-t border-border/70 pt-[var(--space-4)]">{local.chips}</div>
      </Show>
    </div>
  );
}
