import { createEffect, createMemo, createSignal, mergeProps, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { cn } from "~/lib/cn";
import { FieldCopy, FieldFrame, createFieldAria, fieldControlVariants, type FieldRadius, type FieldSize } from "~/components/registry/tier-1/form-inputs/field";

export type TextAreaProps = Omit<JSX.TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "defaultValue"> & {
  autoResize?: boolean;
  class?: string;
  defaultValue?: string;
  description?: JSX.Element;
  errorMessage?: JSX.Element;
  invalid?: boolean;
  label?: JSX.Element;
  maxRows?: number;
  minRows?: number;
  onValueChange?: (value: string) => void;
  radius?: FieldRadius;
  resizeHandle?: "none" | "vertical" | "both";
  size?: FieldSize;
  value?: string;
};

export function TextArea(userProps: TextAreaProps) {
  const props = mergeProps(
    {
      autoResize: false,
      defaultValue: "",
      invalid: false,
      maxRows: 8,
      minRows: 4,
      radius: "lg" as const,
      resizeHandle: "vertical" as const,
      size: "md" as const,
    },
    userProps,
  );

  const [local, others] = splitProps(props, [
    "autoResize",
    "class",
    "defaultValue",
    "description",
    "errorMessage",
    "id",
    "invalid",
    "label",
    "maxRows",
    "minRows",
    "onInput",
    "onValueChange",
    "radius",
    "required",
    "resizeHandle",
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
  let ref: HTMLTextAreaElement | undefined;

  const commit = (next: string) => {
    if (local.value === undefined) {
      setInternalValue(next);
    }

    local.onValueChange?.(next);
  };

  createEffect(() => {
    if (!local.autoResize || !ref || typeof window === "undefined") {
      return;
    }

    ref.style.height = "0px";
    const lineHeight = Number.parseFloat(window.getComputedStyle(ref).lineHeight || "24");
    const minHeight = lineHeight * local.minRows;
    const maxHeight = lineHeight * local.maxRows;
    ref.style.height = `${Math.min(Math.max(ref.scrollHeight, minHeight), maxHeight)}px`;
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
        readOnly={others.readOnly}
        class="items-start py-3"
      >
        <textarea
          ref={ref}
          id={aria.inputId}
          class={cn(
            fieldControlVariants({ size: local.size }),
            "min-h-[6rem] resize-y leading-6",
            local.resizeHandle === "none" && "resize-none",
            local.resizeHandle === "both" && "resize",
          )}
          aria-describedby={aria.describedBy}
          aria-invalid={local.invalid ? true : undefined}
          rows={local.minRows}
          value={currentValue()}
          onInput={event => {
            const onInput = local.onInput as JSX.EventHandler<HTMLTextAreaElement, InputEvent> | undefined;
            onInput?.(event);

            if (event.defaultPrevented) {
              return;
            }

            commit(event.currentTarget.value);
          }}
          {...others}
        />
      </FieldFrame>
    </FieldCopy>
  );
}
