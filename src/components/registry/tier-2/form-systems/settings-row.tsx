import { Show, mergeProps, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { Badge } from "~/components/registry/tier-1/feedback-display/badge";
import { cn } from "~/lib/cn";

export type SettingsRowProps = Omit<JSX.HTMLAttributes<HTMLDivElement>, "children"> & {
  children?: JSX.Element;
  class?: string;
  description?: JSX.Element;
  disabled?: boolean;
  invalid?: boolean;
  label?: JSX.Element;
  meta?: JSX.Element;
  pending?: boolean;
};

export function SettingsRow(userProps: SettingsRowProps) {
  const props = mergeProps(
    {
      disabled: false,
      invalid: false,
      pending: false,
    },
    userProps,
  );

  const [local, others] = splitProps(props, [
    "children",
    "class",
    "description",
    "disabled",
    "invalid",
    "label",
    "meta",
    "pending",
  ]);

  return (
    <div
      class={cn(
        "flex flex-col gap-4 rounded-[calc(var(--radius)*1.05)] border border-border/70 bg-card px-[var(--space-5)] py-[var(--space-4)] lg:flex-row lg:items-start lg:justify-between",
        local.disabled && "opacity-70",
        local.invalid && "border-destructive/28",
        local.class,
      )}
      {...others}
    >
      <div class="min-w-0 flex-1 space-y-2">
        <div class="flex flex-wrap items-center gap-2">
          <div class="text-sm font-semibold tracking-[-0.01em] text-foreground">{local.label}</div>
          <Show when={local.pending}>
            <Badge tone="accent">Pending</Badge>
          </Show>
          <Show when={local.invalid}>
            <Badge tone="danger">Needs attention</Badge>
          </Show>
        </div>
        <Show when={local.description}>
          <p class="max-w-2xl text-sm leading-6 text-muted-foreground">{local.description}</p>
        </Show>
        <Show when={local.meta}>
          <div class="text-sm text-muted-foreground">{local.meta}</div>
        </Show>
      </div>
      <div class="shrink-0">{local.children}</div>
    </div>
  );
}
