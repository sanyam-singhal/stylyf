import { Settings2 } from "lucide-solid";
import { For, mergeProps, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { Button } from "~/components/registry/actions-navigation/button";
import { Checkbox } from "~/components/registry/form-inputs/checkbox";
import { cn } from "~/lib/cn";

export type ColumnVisibilityItem = {
  checked: boolean;
  label: string;
};

export type ColumnVisibilityMenuProps = Omit<JSX.HTMLAttributes<HTMLElement>, "children"> & {
  class?: string;
  columns?: ColumnVisibilityItem[];
};

const defaultColumns: ColumnVisibilityItem[] = [
  { label: "Customer", checked: true },
  { label: "Owner", checked: true },
  { label: "Status", checked: true },
  { label: "MRR", checked: false },
];

export function ColumnVisibilityMenu(userProps: ColumnVisibilityMenuProps) {
  const props = mergeProps(
    {
      columns: defaultColumns,
    },
    userProps,
  );

  const [local, others] = splitProps(props, ["class", "columns"]);

  return (
    <section class={cn("ui-shell-muted max-w-sm space-y-[var(--space-4)] border border-border/80 p-[var(--space-5)] shadow-soft", local.class)} {...others}>
      <div class="flex items-start gap-3">
        <span class="inline-flex size-10 items-center justify-center rounded-[calc(var(--radius)+2px)] bg-[color:color-mix(in_oklab,var(--info)_16%,var(--card)_84%)] text-foreground shadow-inset">
          <Settings2 class="size-4.5" />
        </span>
        <div class="min-w-0">
          <div class="text-sm font-semibold text-foreground">Visible columns</div>
          <div class="text-sm text-muted-foreground">Choose which fields remain visible in dense tables.</div>
        </div>
        <div class="ml-auto text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          {local.columns.filter(column => column.checked).length} shown
        </div>
      </div>
      <div class="rounded-[calc(var(--radius-lg)+2px)] border border-border/70 bg-card/90 p-3 shadow-inset">
        <div class="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Field grouping</div>
        <div class="space-y-2">
          <For each={local.columns}>
            {column => (
              <div class="rounded-[calc(var(--radius)+1px)] border border-transparent px-2 py-1.5 transition hover:border-border/70 hover:bg-background-subtle/65">
                <Checkbox label={column.label} checked={column.checked} />
              </div>
            )}
          </For>
        </div>
      </div>
      <div class="flex gap-2">
        <Button type="button" tone="outline" intent="neutral" size="sm">Reset</Button>
        <Button type="button" size="sm">Apply</Button>
      </div>
    </section>
  );
}
