import { For, Show, createMemo, createSignal, createUniqueId, mergeProps, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { cn } from "~/lib/cn";

type FieldSize = "sm" | "md" | "lg";

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
  const baseId = local.id ?? createUniqueId();
  const descriptionId = `${baseId}-description`;
  const errorId = `${baseId}-error`;
  const describedBy = [local.description ? descriptionId : undefined, local.invalid && local.errorMessage ? errorId : undefined]
    .filter(Boolean)
    .join(" ") || undefined;

  const percent = (value: number) => ((value - local.min) / (local.max - local.min)) * 100;

  const commit = (next: number[]) => {
    const payload = isRange() ? ([next[0]!, next[1]!] as [number, number]) : next[0]!;

    if (local.value === undefined) {
      setInternalValue(payload);
    }

    local.onValueChange?.(payload);
  };

  return (
    <div class={cn("space-y-2.5", local.class)}>
      <Show when={local.label}>
        <label for={baseId} class="block text-sm font-semibold tracking-[-0.01em] text-foreground">
          {local.label}
        </label>
      </Show>
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
            id={baseId}
            type="range"
            min={local.min}
            max={local.max}
            step={local.step}
            value={currentValue()[0]}
            aria-describedby={describedBy}
            aria-invalid={local.invalid ? true : undefined}
            class={cn(
              "ui-slider-input absolute bg-transparent accent-foreground",
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
                "ui-slider-input pointer-events-none absolute bg-transparent accent-foreground",
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
              <span class="ui-chip ui-chip-muted">
                {mark}
              </span>
            )}
          </For>
          <span class="ui-chip bg-background font-semibold text-foreground">
            {isRange() ? `${currentValue()[0]} to ${currentValue()[1]}` : currentValue()[0]}
          </span>
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
