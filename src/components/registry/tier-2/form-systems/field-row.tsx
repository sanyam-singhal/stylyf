import { Show, mergeProps, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { cn } from "~/lib/cn";

export type FieldRowProps = Omit<JSX.HTMLAttributes<HTMLDivElement>, "children"> & {
  action?: JSX.Element;
  children?: JSX.Element;
  class?: string;
  description?: JSX.Element;
  disabled?: boolean;
  errorMessage?: JSX.Element;
  invalid?: boolean;
  label?: JSX.Element;
  layout?: "inline" | "stacked";
  labelWidth?: "narrow" | "regular" | "wide";
  required?: boolean;
};

const labelWidthClasses = {
  narrow: "xl:basis-40",
  regular: "xl:basis-52",
  wide: "xl:basis-64",
} as const;

export function FieldRow(userProps: FieldRowProps) {
  const props = mergeProps(
    {
      disabled: false,
      invalid: false,
      labelWidth: "regular" as const,
      layout: "inline" as const,
      required: false,
    },
    userProps,
  );

  const [local, others] = splitProps(props, [
    "action",
    "children",
    "class",
    "description",
    "disabled",
    "errorMessage",
    "invalid",
    "label",
    "labelWidth",
    "layout",
    "required",
  ]);

  return (
    <div
      class={cn(
        "rounded-[calc(var(--radius)*1.1)] border border-border/70 bg-card p-[var(--space-5)] shadow-xs",
        "data-[disabled=true]:bg-muted/50 data-[disabled=true]:opacity-75",
        "data-[invalid=true]:border-destructive/28 data-[invalid=true]:ring-2 data-[invalid=true]:ring-destructive/10",
        local.class,
      )}
      data-disabled={local.disabled ? "true" : "false"}
      data-invalid={local.invalid ? "true" : "false"}
      {...others}
    >
      <div class={cn("gap-[var(--space-5)]", local.layout === "inline" ? "xl:flex xl:items-start" : "space-y-[var(--space-4)]")}>
        <div class={cn("min-w-0 space-y-2", local.layout === "inline" && labelWidthClasses[local.labelWidth])}>
          <div class="flex items-center gap-2">
            <Show when={local.label}>
              <div class="text-sm font-semibold tracking-[-0.01em] text-foreground">{local.label}</div>
            </Show>
            <Show when={local.required}>
              <span class="ui-chip ui-chip-accent">Required</span>
            </Show>
          </div>
          <Show when={local.description}>
            <p class="text-sm leading-6 text-muted-foreground">{local.description}</p>
          </Show>
          <Show when={local.invalid && local.errorMessage}>
            <p class="text-sm font-medium leading-6 text-destructive">{local.errorMessage}</p>
          </Show>
        </div>

        <div class="min-w-0 flex-1 space-y-3">
          <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div class="min-w-0 flex-1">{local.children}</div>
            <Show when={local.action}>
              <div class="shrink-0">{local.action}</div>
            </Show>
          </div>
        </div>
      </div>
    </div>
  );
}
