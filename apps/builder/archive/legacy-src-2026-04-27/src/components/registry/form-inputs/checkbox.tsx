import { Check, Minus } from "lucide-solid";
import { Show, createEffect, createSignal, createUniqueId, mergeProps, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { cn } from "~/lib/cn";

type FieldRadius = "md" | "lg" | "pill";
type FieldSize = "sm" | "md" | "lg";

type CheckboxTone = "soft" | "outline" | "solid";

const indicatorSizes = {
  sm: "size-5",
  md: "size-5.5",
  lg: "size-6",
} as const;

const labelSizes = {
  sm: "text-sm",
  md: "text-sm",
  lg: "text-base",
} as const;

export type CheckboxProps = Omit<JSX.InputHTMLAttributes<HTMLInputElement>, "size" | "onChange"> & {
  checked?: boolean;
  class?: string;
  defaultChecked?: boolean;
  description?: JSX.Element;
  errorMessage?: JSX.Element;
  indeterminate?: boolean;
  invalid?: boolean;
  label?: JSX.Element;
  onCheckedChange?: (checked: boolean) => void;
  radius?: FieldRadius;
  size?: FieldSize;
  tone?: CheckboxTone;
};

export function Checkbox(userProps: CheckboxProps) {
  const props = mergeProps(
    {
      defaultChecked: false,
      invalid: false,
      radius: "md" as const,
      size: "md" as const,
      tone: "soft" as const,
    },
    userProps,
  );

  const [local, others] = splitProps(props, [
    "checked",
    "class",
    "defaultChecked",
    "description",
    "errorMessage",
    "id",
    "indeterminate",
    "invalid",
    "label",
    "onCheckedChange",
    "radius",
    "required",
    "size",
    "tone",
  ]);

  const [internalChecked, setInternalChecked] = createSignal(local.defaultChecked);
  const checked = () => local.checked ?? internalChecked();
  const baseId = local.id ?? createUniqueId();
  const descriptionId = `${baseId}-description`;
  const errorId = `${baseId}-error`;
  const describedBy = [local.description ? descriptionId : undefined, local.invalid && local.errorMessage ? errorId : undefined]
    .filter(Boolean)
    .join(" ") || undefined;
  let ref: HTMLInputElement | undefined;

  createEffect(() => {
    if (ref) {
      ref.indeterminate = Boolean(local.indeterminate && !checked());
    }
  });

  const commit = (next: boolean) => {
    if (local.checked === undefined) {
      setInternalChecked(next);
    }

    local.onCheckedChange?.(next);
  };

  return (
    <label class={cn("flex items-start gap-3", others.disabled && "opacity-70", local.class)} for={baseId}>
      <span class="relative mt-0.5">
        <input
          ref={ref}
          id={baseId}
          type="checkbox"
          class="peer sr-only"
          checked={checked()}
          aria-describedby={describedBy}
          aria-invalid={local.invalid ? true : undefined}
          onChange={event => commit(event.currentTarget.checked)}
          {...others}
        />
        <span
          class={cn(
            "inline-flex items-center justify-center border shadow-inset transition peer-focus-visible:ring-2 peer-focus-visible:ring-ring/24",
            indicatorSizes[local.size],
            local.radius === "md" && "rounded-md",
            local.radius === "lg" && "rounded-lg",
            local.radius === "pill" && "rounded-full",
            !checked() && !local.indeterminate && local.tone === "soft" && "border-input bg-background text-transparent",
            !checked() && !local.indeterminate && local.tone === "outline" && "border-input bg-background text-transparent",
            (checked() || local.indeterminate) && local.tone === "soft" && "border-primary/24 bg-primary text-primary-foreground",
            (checked() || local.indeterminate) && local.tone === "outline" && "border-primary/28 bg-accent text-accent-foreground",
            local.tone === "solid" && "border-primary/12 bg-primary text-primary-foreground",
            local.invalid && "border-destructive/46 ring-2 ring-destructive/12",
          )}
          data-state={local.indeterminate && !checked() ? "indeterminate" : checked() ? "checked" : "unchecked"}
        >
          <Show when={local.indeterminate && !checked()} fallback={<Check class="size-3.5" />}>
            <Minus class="size-3.5" />
          </Show>
        </span>
      </span>

      <span class="min-w-0">
        <Show when={local.label}>
          <span class={cn("block font-semibold tracking-[-0.01em] text-foreground", labelSizes[local.size])}>
            {local.label}
          </span>
        </Show>
        <Show when={local.description}>
          <span id={descriptionId} class="ui-field-description mt-1 block">
            {local.description}
          </span>
        </Show>
        <Show when={local.invalid && local.errorMessage}>
          <span id={errorId} class="ui-field-error mt-1 block">
            {local.errorMessage}
          </span>
        </Show>
      </span>
    </label>
  );
}
