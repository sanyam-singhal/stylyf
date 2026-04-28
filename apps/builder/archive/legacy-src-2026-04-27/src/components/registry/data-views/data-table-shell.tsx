import { Show, mergeProps, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { cn } from "~/lib/cn";

export type DataTableShellProps = Omit<JSX.HTMLAttributes<HTMLElement>, "children"> & {
  class?: string;
  emptyState?: JSX.Element;
  pagination?: JSX.Element;
  selectionBar?: JSX.Element;
  table?: JSX.Element;
  toolbar?: JSX.Element;
};

export function DataTableShell(userProps: DataTableShellProps) {
  const props = mergeProps(userProps);
  const [local, others] = splitProps(props, ["class", "emptyState", "pagination", "selectionBar", "table", "toolbar"]);

  return (
    <section class={cn("ui-shell-muted overflow-hidden border border-border/80 p-0 shadow-soft", local.class)} {...others}>
      <Show when={local.toolbar}>
        <div class="border-b border-border/70 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--card)_96%,white_4%),color-mix(in_oklab,var(--muted-soft)_82%,var(--card)_18%))] px-[var(--space-5)] py-[var(--space-4)]">
          {local.toolbar}
        </div>
      </Show>
      <Show when={local.selectionBar}>
        <div class="border-b border-border/70 bg-[color:color-mix(in_oklab,var(--info)_10%,var(--card)_90%)] px-[var(--space-5)] py-[var(--space-3)]">
          {local.selectionBar}
        </div>
      </Show>
      <div class="bg-[linear-gradient(180deg,color-mix(in_oklab,var(--card)_98%,white_2%),color-mix(in_oklab,var(--card)_92%,var(--muted-soft)_8%))] px-[var(--space-5)] py-[var(--space-5)]">
        <Show when={local.table} fallback={local.emptyState}>
          {local.table}
        </Show>
      </div>
      <Show when={local.pagination}>
        <div class="border-t border-border/70 bg-[color:color-mix(in_oklab,var(--muted-soft)_66%,var(--background)_34%)] px-[var(--space-5)] py-[var(--space-4)]">
          {local.pagination}
        </div>
      </Show>
    </section>
  );
}
