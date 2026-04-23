import { Show, mergeProps, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { cn } from "~/lib/cn";

export type ProgressProps = Omit<JSX.HTMLAttributes<HTMLDivElement>, "children"> & {
  animated?: boolean;
  class?: string;
  indeterminate?: boolean;
  label?: JSX.Element;
  max?: number;
  striped?: boolean;
  tone?: "accent" | "danger" | "highlight";
  value?: number;
};

const toneClasses = {
  accent: "bg-[linear-gradient(90deg,color-mix(in_oklab,var(--primary)_86%,white_14%),var(--primary))] text-primary-foreground",
  danger: "bg-[linear-gradient(90deg,color-mix(in_oklab,var(--destructive)_82%,white_10%),var(--destructive))] text-destructive-foreground",
  highlight: "bg-[linear-gradient(90deg,color-mix(in_oklab,var(--secondary)_88%,white_12%),var(--secondary-foreground))] text-secondary-foreground",
} as const;

export function Progress(userProps: ProgressProps) {
  const props = mergeProps(
    {
      animated: false,
      indeterminate: false,
      label: "Progress",
      max: 100,
      striped: false,
      tone: "accent" as const,
      value: 64,
    },
    userProps,
  );

  const [local, others] = splitProps(props, ["animated", "class", "indeterminate", "label", "max", "striped", "tone", "value"]);
  const safeValue = () => Math.min(local.max, Math.max(0, local.value));
  const percent = () => `${(safeValue() / local.max) * 100}%`;
  const percentage = () => Math.round((safeValue() / local.max) * 100);

  return (
    <div class={cn("space-y-3", local.class)} {...others}>
      <div class="flex items-center justify-between gap-3 text-sm">
        <div class="min-w-0">
          <div class="font-medium text-foreground">{local.label}</div>
          <div class="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {local.indeterminate ? "In progress" : "Measured status"}
          </div>
        </div>
        <Show when={!local.indeterminate}>
          <div class="rounded-full border border-border/70 bg-background px-2.5 py-1 text-xs font-semibold tabular-nums text-muted-foreground">
            {percentage()}%
          </div>
        </Show>
      </div>
      <div
        role="progressbar"
        aria-label={typeof local.label === "string" ? local.label : undefined}
        aria-valuemax={local.indeterminate ? undefined : local.max}
        aria-valuemin={local.indeterminate ? undefined : 0}
        aria-valuenow={local.indeterminate ? undefined : safeValue()}
        aria-valuetext={local.indeterminate ? "Loading" : `${percentage()} percent`}
        class="overflow-hidden rounded-full border border-border/75 bg-[var(--muted-soft)] p-1 shadow-inset"
      >
        <div
          class={cn(
            "relative h-3.5 overflow-hidden rounded-full transition-[width,transform] duration-300",
            toneClasses[local.tone],
            local.indeterminate ? "w-[42%] animate-[ui-progress-indeterminate_1.5s_ease-in-out_infinite]" : "shadow-xs",
          )}
          style={local.indeterminate ? undefined : { width: percent() }}
        >
          <Show when={local.striped || (local.indeterminate && local.animated)}>
            <span
              aria-hidden="true"
              class={cn(
                "absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,transparent_34%,rgba(255,255,255,0.28)_34%,rgba(255,255,255,0.28)_50%,transparent_50%,transparent_84%,rgba(255,255,255,0.24)_84%,rgba(255,255,255,0.24)_100%)] bg-[length:1.45rem_100%]",
                local.animated && "animate-[ui-shimmer-sweep_1.6s_linear_infinite]",
              )}
            />
          </Show>
        </div>
      </div>
    </div>
  );
}
