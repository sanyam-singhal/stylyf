import { For, Show, createMemo, createSignal, createUniqueId, mergeProps, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { cn } from "~/lib/cn";

type FieldRadius = "md" | "lg" | "pill";
type FieldSize = "sm" | "md" | "lg";

export type OTPFieldProps = Omit<JSX.InputHTMLAttributes<HTMLInputElement>, "value" | "defaultValue" | "size" | "onInput"> & {
  cellClass?: string;
  class?: string;
  defaultValue?: string;
  description?: JSX.Element;
  errorMessage?: JSX.Element;
  gap?: "tight" | "normal" | "wide";
  invalid?: boolean;
  label?: JSX.Element;
  length?: number;
  masked?: boolean;
  mono?: boolean;
  onValueChange?: (value: string) => void;
  radius?: FieldRadius;
  size?: FieldSize;
  value?: string;
};

const gapClasses = {
  normal: "gap-3",
  tight: "gap-2",
  wide: "gap-4",
} as const;

const cellClasses = {
  sm: "size-11 text-lg",
  md: "size-12 text-xl",
  lg: "size-14 text-2xl",
} as const;

export function OTPField(userProps: OTPFieldProps) {
  const props = mergeProps(
    {
      defaultValue: "",
      gap: "normal" as const,
      invalid: false,
      length: 6,
      masked: false,
      mono: true,
      radius: "lg" as const,
      size: "md" as const,
    },
    userProps,
  );

  const [local, others] = splitProps(props, [
    "cellClass",
    "class",
    "defaultValue",
    "description",
    "errorMessage",
    "gap",
    "id",
    "invalid",
    "label",
    "length",
    "masked",
    "mono",
    "onValueChange",
    "radius",
    "required",
    "size",
    "value",
  ]);

  const [internalValue, setInternalValue] = createSignal(local.defaultValue);
  const currentValue = createMemo(() => (local.value ?? internalValue()).slice(0, local.length));
  const chars = createMemo(() => Array.from({ length: local.length }, (_, index) => currentValue()[index] ?? ""));
  const baseId = local.id ?? createUniqueId();
  const descriptionId = `${baseId}-description`;
  const errorId = `${baseId}-error`;
  const describedBy = [local.description ? descriptionId : undefined, local.invalid && local.errorMessage ? errorId : undefined]
    .filter(Boolean)
    .join(" ") || undefined;
  const refs: Array<HTMLInputElement | undefined> = [];
  const midpoint = createMemo(() => Math.ceil(local.length / 2));

  const commit = (next: string) => {
    const normalized = next.replace(/\s+/g, "").slice(0, local.length);

    if (local.value === undefined) {
      setInternalValue(normalized);
    }

    local.onValueChange?.(normalized);
  };

  const assignAt = (index: number, value: string) => {
    const next = chars().slice();
    next[index] = value;
    commit(next.join(""));
  };

  const focusIndex = (index: number) => refs[index]?.focus();

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
      <div class={cn("inline-flex flex-wrap items-center rounded-[var(--radius-xl)] border border-border/84 bg-[color:color-mix(in_oklab,var(--muted-soft)_78%,var(--background)_22%)] p-3.5 shadow-inset", gapClasses[local.gap])}>
        <For each={chars()}>
          {(value, index) => (
            <>
              <input
                ref={element => {
                  refs[index()] = element;
                }}
                value={local.masked && value ? "•" : value}
                inputMode="numeric"
                type="text"
                maxLength={1}
                id={index() === 0 ? baseId : undefined}
                aria-invalid={local.invalid ? true : undefined}
                aria-describedby={describedBy}
                aria-label={`Digit ${index() + 1}`}
                class={cn(
                  "border border-input bg-background text-center font-semibold outline-none shadow-inset transition focus:border-primary/48 focus:bg-card focus:ring-2 focus:ring-ring/24",
                  cellClasses[local.size],
                  local.mono && "font-mono tracking-[0.2em]",
                  value && "border-primary/24 bg-card text-foreground",
                  !value && "text-muted-foreground",
                  local.invalid && "border-destructive/46 ring-2 ring-destructive/12",
                  local.radius === "md" && "rounded-md",
                  local.radius === "pill" && "rounded-full",
                  local.radius === "lg" && "rounded-[var(--radius-lg)]",
                  local.cellClass,
                )}
                disabled={others.disabled}
                readOnly={others.readOnly}
                onInput={event => {
                  const raw = event.currentTarget.value.replace(/[^0-9A-Za-z]/g, "").slice(-1);
                  assignAt(index(), raw);

                  if (raw && index() < local.length - 1) {
                    focusIndex(index() + 1);
                  }
                }}
                onKeyDown={event => {
                  if (event.key === "Backspace" && chars()[index()]) {
                    event.preventDefault();
                    assignAt(index(), "");
                    return;
                  }

                  if (event.key === "Backspace" && !chars()[index()] && index() > 0) {
                    event.preventDefault();
                    assignAt(index() - 1, "");
                    focusIndex(index() - 1);
                  }

                  if (event.key === "ArrowLeft" && index() > 0) {
                    event.preventDefault();
                    focusIndex(index() - 1);
                  }

                  if (event.key === "ArrowRight" && index() < local.length - 1) {
                    event.preventDefault();
                    focusIndex(index() + 1);
                  }
                }}
                onPaste={event => {
                  event.preventDefault();
                  const pasted = (event.clipboardData?.getData("text") ?? "").replace(/[^0-9A-Za-z]/g, "").slice(0, local.length);
                  commit(pasted);
                  focusIndex(Math.min(pasted.length, local.length - 1));
                }}
                {...others}
              />
              <Show when={index() + 1 === midpoint() && index() + 1 !== local.length}>
                <span class="mx-0.5 h-px w-4 bg-border/70" aria-hidden="true" />
              </Show>
            </>
          )}
        </For>
      </div>

      <Show when={currentValue().length === local.length}>
        <div class="ui-chip ui-chip-accent w-fit text-[0.7rem] font-semibold uppercase tracking-[0.2em]">Complete</div>
      </Show>
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
