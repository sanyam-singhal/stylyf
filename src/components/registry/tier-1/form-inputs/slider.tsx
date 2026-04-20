import { For, Show, createMemo, createSignal, mergeProps, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { cn } from "~/lib/cn";
import { FieldCopy, createFieldAria, type FieldSize } from "~/components/registry/tier-1/form-inputs/field";

type SliderOrientation = "horizontal" | "vertical";

export type SliderProps = Omit<JSX.InputHTMLAttributes<HTMLInputElement>, "value" | "defaultValue" | "size" | "type"> & {
  class?: string;
  defaultValue?: number | [number, number];
  description?: JSX.Element;
  errorMessage?: JSX.Element;
  invalid?: boolean;
  label?: JSX.Element;
  marks?: number[];
  max?: number;
  min?: number;
  onValueChange?: (value: number | [number, number]) => void;
  orientation?: SliderOrientation;
  size?: FieldSize;
  step?: number;
  value?: number | [number, number];
};

function normalize(value: number | [number, number] | undefined, min: number, max: number) {
  if (Array.isArray(value)) {
    const start = Math.min(Math.max(value[0] ?? min, min), max);
    const end = Math.min(Math.max(value[1] ?? max, min), max);
    return start <= end ? [start, end] : [end, start];
  }

  const single = Math.min(Math.max(value ?? min, min), max);
  return [single] as const;
}

export function Slider(userProps: SliderProps) {
  const props = mergeProps(
    {
      defaultValue: 36,
      invalid: false,
      max: 100,
      min: 0,
      marks: [] as number[],
      orientation: "horizontal" as const,
      size: "md" as const,
      step: 1,
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
    "marks",
    "max",
    "min",
    "onValueChange",
    "orientation",
    "size",
    "step",
    "value",
  ]);

  const [internalValue, setInternalValue] = createSignal<number | [number, number]>(local.defaultValue);
  const currentValue = createMemo(() => normalize(local.value ?? internalValue(), local.min, local.max));
  const isRange = createMemo(() => Array.isArray(local.value ?? internalValue()));
  const aria = createFieldAria({
    description: local.description,
    errorMessage: local.errorMessage,
    id: local.id,
    invalid: local.invalid,
  });

  const percent = (value: number) => ((value - local.min) / (local.max - local.min)) * 100;

  const commit = (next: number[]) => {
    const payload = isRange() ? ([next[0]!, next[1]!] as [number, number]) : next[0]!;

    if (local.value === undefined) {
      setInternalValue(payload);
    }

    local.onValueChange?.(payload);
  };

  return (
    <FieldCopy
      label={local.label}
      labelFor={aria.inputId}
      description={local.description && <span id={aria.descriptionId}>{local.description}</span>}
      invalid={local.invalid}
      errorMessage={local.errorMessage && <span id={aria.errorId}>{local.errorMessage}</span>}
      class={local.class}
    >
      <div class={cn("space-y-4", local.orientation === "vertical" && "flex items-start gap-5 space-y-0")}>
        <div class={cn("relative", local.orientation === "horizontal" ? "w-full py-3" : "h-64 px-3")}>
          <div
            class={cn(
              "absolute rounded-full bg-muted-soft",
              local.orientation === "horizontal" ? "inset-x-0 top-1/2 h-2 -translate-y-1/2" : "bottom-0 left-1/2 h-full w-2 -translate-x-1/2",
            )}
          />
          <div
            class="absolute rounded-full bg-foreground"
            style={
              local.orientation === "horizontal"
                ? {
                    left: `${percent(currentValue()[0]!)}%`,
                    right: `${100 - percent(isRange() ? currentValue()[1]! : currentValue()[0]!)}%`,
                    top: "50%",
                    height: "0.5rem",
                    transform: "translateY(-50%)",
                  }
                : {
                    bottom: `${percent(currentValue()[0]!)}%`,
                    top: `${100 - percent(isRange() ? currentValue()[1]! : currentValue()[0]!)}%`,
                    left: "50%",
                    width: "0.5rem",
                    transform: "translateX(-50%)",
                  }
            }
          />

          <input
            id={aria.inputId}
            type="range"
            min={local.min}
            max={local.max}
            step={local.step}
            value={currentValue()[0]}
            aria-describedby={aria.describedBy}
            aria-invalid={local.invalid ? true : undefined}
            class={cn(
              "absolute appearance-none bg-transparent accent-foreground",
              local.orientation === "horizontal" ? "inset-x-0 top-0 h-full" : "inset-y-0 left-0 h-full w-full rotate-180 [writing-mode:vertical-lr]",
            )}
            onInput={event => {
              const next = Number(event.currentTarget.value);
              const values = isRange() ? [Math.min(next, currentValue()[1]!), currentValue()[1]!] : [next];
              commit(values);
            }}
            {...others}
          />

          <Show when={isRange()}>
            <input
              type="range"
              min={local.min}
              max={local.max}
              step={local.step}
              value={currentValue()[1]}
              aria-label={`${local.label ?? "Range"} end`}
              class={cn(
                "pointer-events-none absolute appearance-none bg-transparent accent-foreground",
                local.orientation === "horizontal" ? "inset-x-0 top-0 h-full" : "inset-y-0 left-0 h-full w-full rotate-180 [writing-mode:vertical-lr]",
              )}
              onInput={event => {
                const next = Number(event.currentTarget.value);
                commit([currentValue()[0]!, Math.max(next, currentValue()[0]!)]);
              }}
            />
          </Show>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <For each={local.marks}>
            {mark => (
              <span class="rounded-full border border-border/70 bg-panel px-3 py-1 text-xs text-muted">
                {mark}
              </span>
            )}
          </For>
          <span class="rounded-full border border-border/70 bg-background px-3 py-1 text-xs font-semibold text-foreground">
            {isRange() ? `${currentValue()[0]} to ${currentValue()[1]}` : currentValue()[0]}
          </span>
        </div>
      </div>
    </FieldCopy>
  );
}
