import { ChevronDown } from "lucide-solid";
import { For, Show, mergeProps, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { cn } from "~/lib/cn";
import { FieldCopy, FieldFrame, createFieldAria, fieldControlVariants, type FieldRadius, type FieldSize } from "~/components/registry/tier-1/form-inputs/field";

export type SelectOption = {
  disabled?: boolean;
  label: string;
  value: string;
};

export type SelectProps = Omit<JSX.SelectHTMLAttributes<HTMLSelectElement>, "size"> & {
  class?: string;
  description?: JSX.Element;
  errorMessage?: JSX.Element;
  invalid?: boolean;
  label?: JSX.Element;
  options?: SelectOption[];
  placeholder?: string;
  radius?: FieldRadius;
  size?: FieldSize;
};

const defaultOptions: SelectOption[] = [
  { value: "design", label: "Design system" },
  { value: "admin", label: "Admin workspace" },
  { value: "marketing", label: "Marketing site" },
  { value: "docs", label: "Documentation hub" },
];

export function Select(userProps: SelectProps) {
  const props = mergeProps(
    {
      invalid: false,
      options: defaultOptions,
      placeholder: "Choose a surface",
      radius: "lg" as const,
      size: "md" as const,
      value: "",
    },
    userProps,
  );

  const [local, others] = splitProps(props, [
    "class",
    "description",
    "errorMessage",
    "id",
    "invalid",
    "label",
    "options",
    "placeholder",
    "radius",
    "required",
    "size",
  ]);

  const aria = createFieldAria({
    description: local.description,
    errorMessage: local.errorMessage,
    id: local.id,
    invalid: local.invalid,
  });

  return (
    <FieldCopy
      label={local.label}
      labelFor={aria.inputId}
      description={local.description && <span id={aria.descriptionId}>{local.description}</span>}
      invalid={local.invalid}
      errorMessage={local.errorMessage && <span id={aria.errorId}>{local.errorMessage}</span>}
      required={local.required}
      class={local.class}
    >
      <FieldFrame
        size={local.size}
        radius={local.radius}
        invalid={local.invalid}
        disabled={others.disabled}
        readOnly={others.disabled}
        class="pr-2"
      >
        <select
          id={aria.inputId}
          class={cn(fieldControlVariants({ size: local.size }), "appearance-none pr-8")}
          aria-describedby={aria.describedBy}
          aria-invalid={local.invalid ? true : undefined}
          {...others}
        >
          <Show when={local.placeholder}>
            <option value="" disabled={local.required}>
              {local.placeholder}
            </option>
          </Show>
          <For each={local.options}>
            {option => (
              <option value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            )}
          </For>
        </select>
        <ChevronDown class="pointer-events-none mr-1 size-4 shrink-0 text-muted" />
      </FieldFrame>
    </FieldCopy>
  );
}
