import { Search, SlidersHorizontal, Sparkles } from "lucide-solid";
import { Show, createMemo, createSignal, mergeProps, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { Button } from "~/components/registry/actions-navigation/button";
import { TextField } from "~/components/registry/form-inputs/text-field";
import { cn } from "~/lib/cn";

export type SearchFieldProps = Omit<JSX.HTMLAttributes<HTMLDivElement>, "children"> & {
  class?: string;
  defaultValue?: string;
  loading?: boolean;
  onSearch?: (value: string) => void;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  shortcut?: string;
  submitLabel?: string;
  value?: string;
};

export function SearchField(userProps: SearchFieldProps) {
  const props = mergeProps(
    {
      defaultValue: "",
      loading: false,
      placeholder: "Search projects, customers, or commands",
      shortcut: "⌘K",
      submitLabel: "Search",
      value: undefined,
    },
    userProps,
  );

  const [local, others] = splitProps(props, [
    "class",
    "defaultValue",
    "loading",
    "onSearch",
    "onValueChange",
    "placeholder",
    "shortcut",
    "submitLabel",
    "value",
  ]);
  const [internalValue, setInternalValue] = createSignal(local.defaultValue);
  const currentValue = createMemo(() => local.value ?? internalValue());

  const commit = (next: string) => {
    if (local.value === undefined) {
      setInternalValue(next);
    }

    local.onValueChange?.(next);
  };

  return (
    <div class={cn("flex flex-col gap-3 sm:flex-row sm:items-center", local.class)} {...others}>
      <div class="min-w-0 flex-1">
        <TextField
          value={currentValue()}
          onValueChange={commit}
          clearable
          label="Search"
          description="Reusable search treatment with an icon prefix, clear affordance, and keyboard shortcut token."
          placeholder={local.placeholder}
          prefix={<Search class="size-4" />}
          suffix={
            <div class="flex items-center gap-2">
              <Show when={currentValue().length > 0 && !local.loading}>
                <Sparkles class="size-4 text-primary" />
              </Show>
              <span class="ui-chip ui-chip-muted">{local.shortcut}</span>
            </div>
          }
        />
      </div>
      <div class="flex shrink-0 items-center gap-2">
        <Button type="button" tone="outline" intent="neutral" leftIcon={<SlidersHorizontal />}>
          Filters
        </Button>
        <Button
          type="button"
          leftIcon={<Search />}
          loading={local.loading}
          onClick={() => local.onSearch?.(currentValue())}
        >
          {local.submitLabel}
        </Button>
      </div>
    </div>
  );
}
