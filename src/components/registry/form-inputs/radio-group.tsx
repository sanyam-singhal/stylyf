import { For, Show, createMemo, createSignal, createUniqueId, mergeProps, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { cn } from "~/lib/cn";

type FieldSize = "sm" | "md" | "lg";

type RadioOption = {
  description?: JSX.Element;
  disabled?: boolean;
  label: JSX.Element;
  value: string;
};

type RadioLayout = "inline" | "card";

export type RadioGroupProps = Omit<JSX.FieldsetHTMLAttributes<HTMLFieldSetElement>, "onChange"> & {
  description?: JSX.Element;
  errorMessage?: JSX.Element;
  invalid?: boolean;
  label?: JSX.Element;
  layout?: RadioLayout;
  name?: string;
  onValueChange?: (value: string) => void;
  options?: RadioOption[];
  required?: boolean;
  size?: FieldSize;
  value?: string;
  defaultValue?: string;
};

const defaultOptions: RadioOption[] = [
  { value: "pro", label: "Pro", description: "Priority support and advanced workspace controls." },
  { value: "team", label: "Team", description: "Shared seats, approvals, and collaboration defaults." },
  { value: "enterprise", label: "Enterprise", description: "Audit, SSO, and contractual billing flows." },
];

export function RadioGroup(userProps: RadioGroupProps) {
  const props = mergeProps(
    {
      defaultValue: "team",
      invalid: false,
      layout: "card" as const,
      options: defaultOptions,
      size: "md" as const,
    },
    userProps,
  );

  const [local, others] = splitProps(props, [
    "class",
    "defaultValue",
    "description",
    "errorMessage",
    "id",
    "invalid",
    "label",
    "layout",
    "name",
    "onValueChange",
    "options",
    "required",
    "size",
    "value",
  ]);

  const [internalValue, setInternalValue] = createSignal(local.defaultValue);
  const currentValue = createMemo(() => local.value ?? internalValue());
  const baseId = local.id ?? createUniqueId();
  const descriptionId = `${baseId}-description`;
  const errorId = `${baseId}-error`;
  const describedBy = [local.description ? descriptionId : undefined, local.invalid && local.errorMessage ? errorId : undefined]
    .filter(Boolean)
    .join(" ") || undefined;

  const commit = (next: string) => {
    if (local.value === undefined) {
      setInternalValue(next);
    }

    local.onValueChange?.(next);
  };

  return (
    <fieldset class={cn("space-y-3", local.class)} aria-describedby={describedBy} {...others}>
      <Show when={local.label}>
        <legend class="text-sm font-semibold tracking-[-0.01em] text-foreground">{local.label}</legend>
      </Show>
      <Show when={local.description}>
        <p id={descriptionId} class="text-sm leading-6 text-muted-foreground">
          {local.description}
        </p>
      </Show>

      <div class={cn("grid gap-3", local.layout === "inline" ? "sm:grid-cols-3" : "grid-cols-1")}>
        <For each={local.options}>
          {option => (
            <label
              class={cn(
                "group relative flex cursor-pointer gap-3 border transition",
                local.layout === "card" ? "rounded-[var(--radius-xl)] p-4" : "rounded-[var(--radius-xl)] px-4 py-3",
                currentValue() === option.value
                  ? "border-primary/28 bg-[color:color-mix(in_oklab,var(--accent)_72%,var(--background)_28%)] shadow-inset"
                  : "border-input bg-background hover:border-primary/24 hover:bg-card",
                option.disabled && "cursor-not-allowed opacity-60",
              )}
              data-state={currentValue() === option.value ? "checked" : "unchecked"}
              onClick={() => {
                if (!option.disabled) {
                  commit(option.value);
                }
              }}
            >
              <input
                class="peer sr-only"
                type="radio"
                name={local.name ?? baseId}
                value={option.value}
                checked={currentValue() === option.value}
                disabled={option.disabled}
                aria-invalid={local.invalid ? true : undefined}
                onChange={() => commit(option.value)}
              />
              <span
                class={cn(
                  "mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full border transition",
                  currentValue() === option.value ? "border-primary/34 bg-primary/12" : "border-input bg-background",
                )}
              >
                <span
                  class={cn(
                    "size-2.5 rounded-full transition",
                    currentValue() === option.value ? "bg-primary opacity-100" : "bg-transparent opacity-0",
                  )}
                />
              </span>
              <span class="min-w-0">
                <span class="block text-sm font-semibold text-foreground">{option.label}</span>
                <Show when={option.description}>
                  <span class="ui-field-description mt-1 block">{option.description}</span>
                </Show>
              </span>
            </label>
          )}
        </For>
      </div>

      <Show when={local.invalid && local.errorMessage}>
        <p id={errorId} class="ui-field-error">
          {local.errorMessage}
        </p>
      </Show>
    </fieldset>
  );
}
