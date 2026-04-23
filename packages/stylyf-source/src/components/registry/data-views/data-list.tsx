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
    <section class={cn("ui-shell-muted overflow-hidden border border-border/80 p-0 shadow-soft", local.class)} {...others}>
      <div class="flex items-center justify-between gap-3 border-b border-border/70 px-[var(--space-5)] py-[var(--space-4)]">
        <div>
          <div class="text-sm font-semibold tracking-[-0.01em] text-foreground">{local.header}</div>
          <div class="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Focused list treatment</div>
        </div>
        <Badge tone="accent">{local.rows.length} items</Badge>
      </div>
      <div class="divide-y divide-border/70 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--card)_97%,white_3%),color-mix(in_oklab,var(--card)_90%,var(--muted-soft)_10%))]">
        <For each={local.rows}>
          {(row, index) => (
            <div
              class={cn(
                "grid gap-3 px-[var(--space-5)] py-[var(--space-4)] transition hover:bg-background-subtle/72 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-start",
                local.selectedIndex === index() && "bg-[color:color-mix(in_oklab,var(--info)_12%,var(--card)_88%)]",
              )}
            >
              <div class={cn("mt-1 hidden h-10 w-1 rounded-full bg-transparent md:block", local.selectedIndex === index() && "bg-primary")} />
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <div class="text-sm font-semibold text-foreground">{row.title}</div>
                  <Show when={local.selectedIndex === index()}>
                    <Badge tone="accent" size="sm">Selected</Badge>
                  </Show>
                </div>
                <Show when={row.summary}>
                  <p class="mt-1 text-sm leading-6 text-muted-foreground">{row.summary}</p>
                </Show>
              </div>
              <Badge class="justify-self-start md:justify-self-end">{row.meta}</Badge>
            </div>
          )}
        </For>
      </div>
      <Show when={local.footer}>
        <div class="border-t border-border/70 bg-[color:color-mix(in_oklab,var(--muted-soft)_74%,var(--background)_26%)] px-[var(--space-5)] py-[var(--space-4)]">
          {local.footer}
        </div>
      </Show>
    </section>
  );
}
