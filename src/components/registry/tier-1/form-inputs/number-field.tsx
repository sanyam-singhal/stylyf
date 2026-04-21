import { Minus, Plus } from "lucide-solid";
import { Show, children, createMemo, createSignal, createUniqueId, mergeProps, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { cn } from "~/lib/cn";

type NumberAlign = "start" | "center" | "end";
type NumberControlPlacement = "inline" | "stacked";
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

const alignClasses = {
  start: "text-left",
  center: "text-center",
  end: "text-right",
} as const;

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
  const baseId = local.id ?? createUniqueId();
  const descriptionId = `${baseId}-description`;
  const errorId = `${baseId}-error`;
  const describedBy = [local.description ? descriptionId : undefined, local.invalid && local.errorMessage ? errorId : undefined]
    .filter(Boolean)
    .join(" ") || undefined;
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

  const canDecrease = createMemo(() => {
    if (others.disabled) return false;
    return (currentValue() ?? local.min ?? 0) > (local.min ?? Number.NEGATIVE_INFINITY);
  });

  const canIncrease = createMemo(() => {
    if (others.disabled) return false;
    return (currentValue() ?? local.max ?? 0) < (local.max ?? Number.POSITIVE_INFINITY);
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
          type="text"
          inputMode="decimal"
          class={cn(
            "ui-field-input disabled:cursor-not-allowed",
            controlSizeClasses[local.size],
            alignClasses[local.align],
            "tabular-nums font-semibold tracking-[0.08em]",
          )}
          aria-describedby={describedBy}
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
          <div class="ui-field-affix shrink-0">{resolvedSuffix()}</div>
        </Show>

        <div
          class={cn(
            "ml-1 shrink-0 border-l border-border/72 pl-3",
            local.controlPlacement === "stacked" ? "grid gap-1" : "inline-flex items-center gap-1",
          )}
        >
          <button
            type="button"
            class="ui-control-button size-8"
            aria-label="Decrease value"
            onClick={() => bump(-local.step)}
            disabled={!canDecrease()}
          >
            <Minus class="size-4" />
          </button>
          <Show when={local.controlPlacement === "inline"}>
            <span class="h-5 w-px bg-border/72" />
          </Show>
          <button
            type="button"
            class="ui-control-button size-8"
            aria-label="Increase value"
            onClick={() => bump(local.step)}
            disabled={!canIncrease()}
          >
            <Plus class="size-4" />
          </button>
        </div>
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
