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
    <section class={cn("ui-card max-w-sm space-y-[var(--space-4)] p-[var(--space-5)]", local.class)} {...others}>
      <div class="flex items-center gap-3">
        <span class="inline-flex size-10 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <Settings2 class="size-4.5" />
        </span>
        <div>
          <div class="text-sm font-semibold text-foreground">Visible columns</div>
          <div class="text-sm text-muted-foreground">Choose which fields remain visible in dense tables.</div>
        </div>
      </div>
      <div class="space-y-3">
        <For each={local.columns}>{column => <Checkbox label={column.label} checked={column.checked} />}</For>
      </div>
      <div class="flex gap-2">
        <Button type="button" tone="outline" intent="neutral" size="sm">Reset</Button>
        <Button type="button" size="sm">Apply</Button>
      </div>
    </section>
  );
}
