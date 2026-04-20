import { Show, children, createMemo, createSignal, mergeProps, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { CircleX } from "lucide-solid";
import { cn } from "~/lib/cn";
import { FieldCopy, FieldFrame, createFieldAria, fieldControlVariants, type FieldRadius, type FieldSize } from "~/components/registry/tier-1/form-inputs/field";

export type TextFieldProps = Omit<JSX.InputHTMLAttributes<HTMLInputElement>, "defaultValue" | "prefix" | "size" | "value"> & {
  class?: string;
  clearable?: boolean;
  description?: JSX.Element;
  dirty?: boolean;
  errorMessage?: JSX.Element;
  inputClass?: string;
  invalid?: boolean;
  label?: JSX.Element;
  onValueChange?: (value: string) => void;
  prefix?: JSX.Element;
  radius?: FieldRadius;
  size?: FieldSize;
  suffix?: JSX.Element;
  value?: string;
  defaultValue?: string;
};

export function TextField(userProps: TextFieldProps) {
  const props = mergeProps(
    {
      autoComplete: "off",
      defaultValue: "",
      invalid: false,
      radius: "lg" as const,
      size: "md" as const,
      type: "text",
    },
    userProps,
  );

  const [local, others] = splitProps(props, [
    "class",
    "clearable",
    "defaultValue",
    "description",
    "dirty",
    "errorMessage",
    "id",
    "inputClass",
    "invalid",
    "label",
    "onInput",
    "onValueChange",
    "prefix",
    "radius",
    "required",
    "size",
    "suffix",
    "value",
  ]);

  const [internalValue, setInternalValue] = createSignal(local.defaultValue);
  const resolvedPrefix = children(() => local.prefix);
  const resolvedSuffix = children(() => local.suffix);
  const aria = createFieldAria({
    description: local.description,
    errorMessage: local.errorMessage,
    id: local.id,
    invalid: local.invalid,
  });
  let ref: HTMLInputElement | undefined;

  const currentValue = createMemo(() => local.value ?? internalValue());
  const dirty = createMemo(() => local.dirty ?? currentValue().length > 0);

  const commit = (next: string) => {
    if (local.value === undefined) {
      setInternalValue(next);
    }

    local.onValueChange?.(next);
  };

  const clear = () => {
    commit("");
    ref?.focus();
  };

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
        readOnly={others.readOnly}
      >
        <Show when={resolvedPrefix()}>
          <div class="shrink-0 text-muted">{resolvedPrefix()}</div>
        </Show>
        <input
          ref={ref}
          id={aria.inputId}
          class={cn(fieldControlVariants({ size: local.size }), local.inputClass)}
          aria-describedby={aria.describedBy}
          aria-invalid={local.invalid ? true : undefined}
          value={currentValue()}
          onInput={event => {
            const onInput = local.onInput as JSX.EventHandler<HTMLInputElement, InputEvent> | undefined;
            onInput?.(event);

            if (event.defaultPrevented) {
              return;
            }

            commit(event.currentTarget.value);
          }}
          data-dirty={dirty() ? "true" : "false"}
          {...others}
        />
        <Show when={local.clearable && currentValue().length > 0 && !others.disabled && !others.readOnly}>
          <button
            type="button"
            onClick={clear}
            class="inline-flex size-8 items-center justify-center rounded-full text-muted transition hover:bg-panel hover:text-foreground"
            aria-label="Clear field"
          >
            <CircleX class="size-4" />
          </button>
        </Show>
        <Show when={resolvedSuffix()}>
          <div class="shrink-0 text-muted">{resolvedSuffix()}</div>
        </Show>
      </FieldFrame>
    </FieldCopy>
  );
}
