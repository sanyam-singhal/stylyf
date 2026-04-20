import { Show, mergeProps, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { Badge } from "~/components/registry/tier-1/feedback-display/badge";
import { cn } from "~/lib/cn";

export type FieldsetCardProps = Omit<JSX.HTMLAttributes<HTMLFieldSetElement>, "children"> & {
  actions?: JSX.Element;
  children?: JSX.Element;
  class?: string;
  description?: JSX.Element;
  dirty?: boolean;
  disabledSubtree?: boolean;
  footer?: JSX.Element;
  title?: JSX.Element;
  tone?: "default" | "muted" | "accent";
};

export function FieldsetCard(userProps: FieldsetCardProps) {
  const props = mergeProps(
    {
      dirty: false,
      disabledSubtree: false,
      tone: "default" as const,
    },
    userProps,
  );

  const [local, others] = splitProps(props, [
    "actions",
    "children",
    "class",
    "description",
    "dirty",
    "disabledSubtree",
    "footer",
    "title",
    "tone",
  ]);

  return (
    <fieldset
      class={cn(
        "ui-card overflow-hidden p-0",
        local.tone === "muted" && "bg-muted-soft/60",
        local.tone === "accent" && "border-primary/18 bg-accent/35",
        local.disabledSubtree && "opacity-70",
        local.class,
      )}
      disabled={local.disabledSubtree}
      {...others}
    >
      <div class="flex flex-col gap-4 border-b border-border/70 px-[var(--space-6)] py-[var(--space-5)] lg:flex-row lg:items-start lg:justify-between">
        <div class="space-y-2">
          <div class="flex items-center gap-3">
            <Show when={local.title}>
              <legend class="text-base font-semibold tracking-[-0.02em] text-foreground">{local.title}</legend>
            </Show>
            <Show when={local.dirty}>
              <Badge tone="accent">Unsaved</Badge>
            </Show>
          </div>
          <Show when={local.description}>
            <p class="max-w-2xl text-sm leading-6 text-muted-foreground">{local.description}</p>
          </Show>
        </div>
        <Show when={local.actions}>
          <div class="shrink-0">{local.actions}</div>
        </Show>
      </div>

      <div class="space-y-[var(--space-5)] px-[var(--space-6)] py-[var(--space-6)]">{local.children}</div>

      <Show when={local.footer}>
        <div class="border-t border-border/70 bg-background-subtle/65 px-[var(--space-6)] py-[var(--space-4)]">
          {local.footer}
        </div>
      </Show>
    </fieldset>
  );
}
