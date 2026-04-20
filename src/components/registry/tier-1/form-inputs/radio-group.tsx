import { CircleDot } from "lucide-solid";
import { For, Show, createMemo, createSignal, mergeProps, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { cn } from "~/lib/cn";
import { createFieldAria, type FieldSize } from "~/components/registry/tier-1/form-inputs/field";

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
  const aria = createFieldAria({
    description: local.description,
    errorMessage: local.errorMessage,
    id: local.id,
    invalid: local.invalid,
  });

  const commit = (next: string) => {
    if (local.value === undefined) {
      setInternalValue(next);
    }

    local.onValueChange?.(next);
  };

  return (
    <fieldset class={cn("space-y-3", local.class)} aria-describedby={aria.describedBy} {...others}>
      <Show when={local.label}>
        <legend class="text-sm font-semibold tracking-[-0.01em] text-foreground">{local.label}</legend>
      </Show>
      <Show when={local.description}>
        <p id={aria.descriptionId} class="text-sm leading-6 text-muted">
          {local.description}
        </p>
      </Show>

      <div class={cn("grid gap-3", local.layout === "inline" ? "sm:grid-cols-3" : "grid-cols-1")}>
        <For each={local.options}>
          {option => (
            <label
              class={cn(
                "group relative flex cursor-pointer gap-3 border transition",
                local.layout === "card" ? "rounded-[1.25rem] p-4" : "rounded-full px-4 py-3",
                currentValue() === option.value
                  ? "border-accent/35 bg-accent/10"
                  : "border-border/70 bg-background hover:border-accent/25",
                option.disabled && "cursor-not-allowed opacity-60",
              )}
            >
              <input
                class="peer sr-only"
                type="radio"
                name={local.name ?? aria.inputId}
                value={option.value}
                checked={currentValue() === option.value}
                disabled={option.disabled}
                aria-invalid={local.invalid ? true : undefined}
                onChange={() => commit(option.value)}
              />
              <span class="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-border/70 bg-panel">
                <CircleDot class={cn("size-3.5 text-accent-strong transition", currentValue() === option.value ? "opacity-100" : "opacity-0")} />
              </span>
              <span class="min-w-0">
                <span class="block text-sm font-semibold text-foreground">{option.label}</span>
                <Show when={option.description}>
                  <span class="mt-1 block text-sm leading-6 text-muted">{option.description}</span>
                </Show>
              </span>
            </label>
          )}
        </For>
      </div>

      <Show when={local.invalid && local.errorMessage}>
        <p id={aria.errorId} class="text-sm font-medium leading-6 text-rose-300">
          {local.errorMessage}
        </p>
      </Show>
    </fieldset>
  );
}
