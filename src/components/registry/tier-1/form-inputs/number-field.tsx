import { Minus, Plus } from "lucide-solid";
import { Show, children, createMemo, createSignal, mergeProps, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { cn } from "~/lib/cn";
import { FieldCopy, FieldFrame, createFieldAria, fieldControlVariants, type FieldRadius, type FieldSize } from "~/components/registry/tier-1/form-inputs/field";

type NumberAlign = "start" | "center" | "end";
type NumberControlPlacement = "inline" | "stacked";

export type NumberFieldProps = Omit<JSX.InputHTMLAttributes<HTMLInputElement>, "defaultValue" | "prefix" | "size" | "type" | "value"> & {
  align?: NumberAlign;
  class?: string;
  controlPlacement?: NumberControlPlacement;
  defaultValue?: number;
  description?: JSX.Element;
  errorMessage?: JSX.Element;
  formatOptions?: Intl.NumberFormatOptions;
  invalid?: boolean;
  label?: JSX.Element;
  max?: number;
  min?: number;
  onValueChange?: (value: number | undefined) => void;
  prefix?: JSX.Element;
  radius?: FieldRadius;
  size?: FieldSize;
  step?: number;
  suffix?: JSX.Element;
  value?: number;
};

function clamp(value: number, min?: number, max?: number) {
  return Math.min(Math.max(value, min ?? Number.NEGATIVE_INFINITY), max ?? Number.POSITIVE_INFINITY);
}

export function NumberField(userProps: NumberFieldProps) {
  const props = mergeProps(
    {
      align: "end" as const,
      controlPlacement: "inline" as const,
      formatOptions: undefined,
      invalid: false,
      radius: "lg" as const,
      size: "md" as const,
      step: 1,
    },
    userProps,
  );

  const [local, others] = splitProps(props, [
    "align",
    "class",
    "controlPlacement",
    "defaultValue",
    "description",
    "errorMessage",
    "formatOptions",
    "id",
    "invalid",
    "label",
    "max",
    "min",
    "onInput",
    "onValueChange",
    "prefix",
    "radius",
    "required",
    "size",
    "step",
    "suffix",
    "value",
  ]);

  const [internalValue, setInternalValue] = createSignal<number | undefined>(local.defaultValue);
  const [draft, setDraft] = createSignal(local.defaultValue?.toString() ?? "");
  const resolvedPrefix = children(() => local.prefix);
  const resolvedSuffix = children(() => local.suffix);
  const currentValue = createMemo(() => local.value ?? internalValue());
  const aria = createFieldAria({
    description: local.description,
    errorMessage: local.errorMessage,
    id: local.id,
    invalid: local.invalid,
  });
  let ref: HTMLInputElement | undefined;

  const displayValue = createMemo(() => {
    if (typeof document !== "undefined" && document.activeElement === ref) {
      return draft();
    }

    if (currentValue() === undefined || Number.isNaN(currentValue())) {
      return "";
    }

    if (local.formatOptions) {
      return new Intl.NumberFormat(undefined, local.formatOptions).format(currentValue()!);
    }

    return `${currentValue()}`;
  });

  const commit = (next: number | undefined) => {
    if (local.value === undefined) {
      setInternalValue(next);
    }

    setDraft(next === undefined ? "" : `${next}`);
    local.onValueChange?.(next);
  };

  const parse = (raw: string) => {
    const normalized = raw.replace(/,/g, "").trim();

    if (!normalized) {
      return undefined;
    }

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? clamp(parsed, local.min, local.max) : undefined;
  };

  const bump = (delta: number) => {
    if (others.disabled || others.readOnly) {
      return;
    }

    const base = currentValue() ?? local.min ?? 0;
    const next = clamp(base + delta, local.min, local.max);
    commit(next);
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
          type="text"
          inputMode="decimal"
          class={cn(fieldControlVariants({ size: local.size, align: local.align }), "tabular-nums")}
          aria-describedby={aria.describedBy}
          aria-invalid={local.invalid ? true : undefined}
          value={displayValue()}
          onFocus={() => setDraft(currentValue() === undefined ? "" : `${currentValue()}`)}
          onBlur={event => {
            const parsed = parse(event.currentTarget.value);
            commit(parsed);
          }}
          onInput={event => {
            const onInput = local.onInput as JSX.EventHandler<HTMLInputElement, InputEvent> | undefined;
            onInput?.(event);

            if (event.defaultPrevented) {
              return;
            }

            setDraft(event.currentTarget.value);
            local.onValueChange?.(parse(event.currentTarget.value));
          }}
          {...others}
        />

        <Show when={resolvedSuffix()}>
          <div class="shrink-0 text-muted">{resolvedSuffix()}</div>
        </Show>

        <div class={cn("shrink-0", local.controlPlacement === "stacked" ? "grid gap-1" : "inline-flex items-center gap-1")}>
          <button
            type="button"
            class="inline-flex size-8 items-center justify-center rounded-full border border-border/70 bg-panel text-muted transition hover:text-foreground"
            aria-label="Decrease value"
            onClick={() => bump(-local.step)}
            disabled={others.disabled || (currentValue() ?? local.min ?? 0) <= (local.min ?? Number.NEGATIVE_INFINITY)}
          >
            <Minus class="size-4" />
          </button>
          <button
            type="button"
            class="inline-flex size-8 items-center justify-center rounded-full border border-border/70 bg-panel text-muted transition hover:text-foreground"
            aria-label="Increase value"
            onClick={() => bump(local.step)}
            disabled={others.disabled || (currentValue() ?? local.max ?? 0) >= (local.max ?? Number.POSITIVE_INFINITY)}
          >
            <Plus class="size-4" />
          </button>
        </div>
      </FieldFrame>
    </FieldCopy>
  );
}
