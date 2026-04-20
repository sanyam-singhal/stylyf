import { For, Show, createMemo, createSignal, mergeProps, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { cn } from "~/lib/cn";
import { FieldCopy, createFieldAria, type FieldRadius, type FieldSize } from "~/components/registry/tier-1/form-inputs/field";

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
  const aria = createFieldAria({
    description: local.description,
    errorMessage: local.errorMessage,
    id: local.id,
    invalid: local.invalid,
  });
  const refs: Array<HTMLInputElement | undefined> = [];

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
    <FieldCopy
      label={local.label}
      labelFor={aria.inputId}
      description={local.description && <span id={aria.descriptionId}>{local.description}</span>}
      invalid={local.invalid}
      errorMessage={local.errorMessage && <span id={aria.errorId}>{local.errorMessage}</span>}
      required={local.required}
      class={local.class}
    >
      <div class={cn("flex flex-wrap items-center", gapClasses[local.gap])}>
        <For each={chars()}>
          {(value, index) => (
            <input
              ref={element => {
                refs[index()] = element;
              }}
              value={local.masked && value ? "•" : value}
              inputMode="numeric"
              type={local.masked ? "password" : "text"}
              maxLength={1}
              id={index() === 0 ? aria.inputId : undefined}
              aria-invalid={local.invalid ? true : undefined}
              aria-describedby={aria.describedBy}
              aria-label={`Digit ${index() + 1}`}
              class={cn(
                "rounded-[1.15rem] border border-border/70 bg-background text-center font-semibold outline-none transition focus:border-accent/45 focus:ring-2 focus:ring-ring/18",
                cellClasses[local.size],
                local.mono && "font-mono tracking-[0.16em]",
                local.invalid && "border-rose-500/45 ring-2 ring-rose-500/12",
                local.radius === "md" && "rounded-[0.95rem]",
                local.radius === "pill" && "rounded-full",
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
                if (event.key === "Backspace" && !chars()[index()] && index() > 0) {
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
          )}
        </For>
      </div>

      <Show when={currentValue().length === local.length}>
        <div class="text-xs font-semibold uppercase tracking-[0.2em] text-accent-strong">Complete</div>
      </Show>
    </FieldCopy>
  );
}
