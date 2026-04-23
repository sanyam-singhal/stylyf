import { Show, children, createMemo, createSignal, createUniqueId, mergeProps, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { CircleX } from "lucide-solid";
import { cn } from "~/lib/cn";

type FieldRadius = "md" | "lg" | "pill";
type FieldSize = "sm" | "md" | "lg";

const frameSizeClasses = {
  sm: "min-h-10 gap-2.5 px-3",
  md: "min-h-11 gap-3 px-3.5",
  lg: "min-h-13 gap-3.5 px-4.5",
} as const;

const frameRadiusClasses = {
  md: "rounded-lg",
  lg: "rounded-xl",
  pill: "rounded-full",
} as const;

const controlSizeClasses = {
  sm: "text-sm",
  md: "text-sm",
  lg: "text-base",
} as const;

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
  const baseId = local.id ?? createUniqueId();
  const descriptionId = `${baseId}-description`;
  const errorId = `${baseId}-error`;
  const describedBy = [local.description ? descriptionId : undefined, local.invalid && local.errorMessage ? errorId : undefined]
    .filter(Boolean)
    .join(" ") || undefined;
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
    <div class={cn("space-y-2.5", local.class)}>
      <Show when={local.label}>
        <div class="ui-field-label-row">
          <label for={baseId} class="ui-field-label">
            {local.label}
          </label>
          <Show when={local.required}>
            <span class="ui-field-required">Required</span>
          </Show>
        </div>
      </Show>
      <div
        class={cn(
          "ui-field-shell",
          frameSizeClasses[local.size],
          frameRadiusClasses[local.radius],
        )}
        data-invalid={local.invalid ? "true" : undefined}
        data-disabled={others.disabled ? "true" : undefined}
        data-readonly={others.readOnly ? "true" : undefined}
      >
        <Show when={resolvedPrefix()}>
          <div class="ui-field-affix shrink-0">{resolvedPrefix()}</div>
        </Show>
        <input
          ref={ref}
          id={baseId}
          class={cn(
            "ui-field-input disabled:cursor-not-allowed",
            controlSizeClasses[local.size],
            local.inputClass,
          )}
          aria-describedby={describedBy}
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
            class="ui-control-button size-8 shrink-0"
            aria-label="Clear field"
          >
            <CircleX class="size-4" />
          </button>
        </Show>
        <Show when={resolvedSuffix()}>
          <div class="ui-field-affix shrink-0">{resolvedSuffix()}</div>
        </Show>
      </div>
      <Show when={local.description}>
        <div id={descriptionId} class="ui-field-description">
          {local.description}
        </div>
      </Show>
      <Show when={local.invalid && local.errorMessage}>
        <div id={errorId} class="ui-field-error">
          {local.errorMessage}
        </div>
      </Show>
    </div>
  );
}
