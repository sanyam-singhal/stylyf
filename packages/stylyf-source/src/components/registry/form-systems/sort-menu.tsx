import { ArrowDownWideNarrow } from "lucide-solid";
import { createMemo, createSignal, mergeProps, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { Select, type SelectOption } from "~/components/registry/form-inputs/select";
import { cn } from "~/lib/cn";

export type SortMenuProps = Omit<JSX.HTMLAttributes<HTMLDivElement>, "children"> & {
  class?: string;
  compact?: boolean;
  defaultValue?: string;
  label?: JSX.Element;
  onValueChange?: (value: string) => void;
  options?: SelectOption[];
  value?: string;
};

const defaultOptions: SelectOption[] = [
  { value: "newest", label: "Newest first" },
  { value: "updated", label: "Recently updated" },
  { value: "name", label: "Name (A-Z)" },
  { value: "priority", label: "Highest priority" },
];

export function SortMenu(userProps: SortMenuProps) {
  const props = mergeProps(
    {
      compact: false,
      defaultValue: "updated",
      label: "Sort",
      options: defaultOptions,
      value: undefined,
    },
    userProps,
  );

  const [local, others] = splitProps(props, ["class", "compact", "defaultValue", "label", "onValueChange", "options", "value"]);
  const [internalValue, setInternalValue] = createSignal(local.defaultValue);
  const currentValue = createMemo(() => local.value ?? internalValue());
  const currentLabel = createMemo(() => local.options.find(option => option.value === currentValue())?.label ?? "Custom");

  const commit = (next: string) => {
    if (local.value === undefined) {
      setInternalValue(next);
    }

    local.onValueChange?.(next);
  };

  return (
    <div class={cn("rounded-[calc(var(--radius)*1.05)] border border-border/70 bg-card p-[var(--space-4)] shadow-xs", local.class)} {...others}>
      <div class="flex items-center gap-3">
        <span class="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <ArrowDownWideNarrow class="size-4" />
        </span>
        <div class="min-w-0 flex-1">
          <div class="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{local.label}</div>
          <div class="mt-1 text-sm font-medium text-foreground">{currentLabel()}</div>
        </div>
      </div>
      <div class="mt-[var(--space-4)]">
        <Select
          label={local.compact ? undefined : "Ordering"}
          value={currentValue()}
          onValueChange={commit}
          options={local.options}
          size={local.compact ? "sm" : "md"}
          description={local.compact ? undefined : "Lightweight ordering control designed to pair with toolbars and tables."}
        />
      </div>
    </div>
  );
}
