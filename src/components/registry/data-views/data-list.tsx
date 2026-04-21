import { For, Show, mergeProps, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { Badge } from "~/components/registry/feedback-display/badge";
import { cn } from "~/lib/cn";

export type DataListRow = {
  meta?: string;
  summary?: string;
  title: string;
};

export type DataListProps = Omit<JSX.HTMLAttributes<HTMLElement>, "children"> & {
  class?: string;
  footer?: JSX.Element;
  header?: JSX.Element;
  rows?: DataListRow[];
  selectedIndex?: number;
};

const defaultRows: DataListRow[] = [
  { title: "Q2 workspace launch", summary: "Final design QA and rollout sequencing", meta: "Updated 14m ago" },
  { title: "Security review", summary: "Collect 2FA screenshots and audit controls", meta: "Updated 1h ago" },
  { title: "Pricing refresh", summary: "Legal review pending on enterprise contract text", meta: "Updated yesterday" },
];

export function DataList(userProps: DataListProps) {
  const props = mergeProps(
    {
      footer: undefined,
      header: "Recent records",
      rows: defaultRows,
      selectedIndex: 0,
    },
    userProps,
  );

  const [local, others] = splitProps(props, ["class", "footer", "header", "rows", "selectedIndex"]);

  return (
    <section class={cn("ui-card overflow-hidden p-0", local.class)} {...others}>
      <div class="border-b border-border/70 px-[var(--space-5)] py-[var(--space-4)]">
        <div class="text-sm font-semibold tracking-[-0.01em] text-foreground">{local.header}</div>
      </div>
      <div class="divide-y divide-border/70">
        <For each={local.rows}>
          {(row, index) => (
            <div
              class={cn(
                "flex flex-col gap-2 px-[var(--space-5)] py-[var(--space-4)] transition hover:bg-background-subtle/65",
                local.selectedIndex === index() && "bg-accent/30",
              )}
            >
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div class="text-sm font-semibold text-foreground">{row.title}</div>
                <Badge>{row.meta}</Badge>
              </div>
              <Show when={row.summary}>
                <p class="text-sm leading-6 text-muted-foreground">{row.summary}</p>
              </Show>
            </div>
          )}
        </For>
      </div>
      <Show when={local.footer}>
        <div class="border-t border-border/70 bg-background-subtle/60 px-[var(--space-5)] py-[var(--space-4)]">{local.footer}</div>
      </Show>
    </section>
  );
}
