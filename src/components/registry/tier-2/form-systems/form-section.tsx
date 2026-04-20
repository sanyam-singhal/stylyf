import { Show, mergeProps, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { Badge } from "~/components/registry/tier-1/feedback-display/badge";
import { cn } from "~/lib/cn";

export type FormSectionProps = Omit<JSX.HTMLAttributes<HTMLElement>, "children"> & {
  actions?: JSX.Element;
  children?: JSX.Element;
  class?: string;
  columns?: 1 | 2;
  description?: JSX.Element;
  dirty?: boolean;
  footer?: JSX.Element;
  invalid?: boolean;
  submitting?: boolean;
  title?: JSX.Element;
  valid?: boolean;
};

export function FormSection(userProps: FormSectionProps) {
  const props = mergeProps(
    {
      columns: 1 as const,
      dirty: false,
      invalid: false,
      submitting: false,
      valid: false,
    },
    userProps,
  );

  const [local, others] = splitProps(props, [
    "actions",
    "children",
    "class",
    "columns",
    "description",
    "dirty",
    "footer",
    "invalid",
    "submitting",
    "title",
    "valid",
  ]);

  return (
    <section class={cn("space-y-[var(--space-5)]", local.class)} {...others}>
      <div class="flex flex-col gap-4 border-b border-border/70 pb-[var(--space-4)] lg:flex-row lg:items-start lg:justify-between">
        <div class="space-y-2">
          <div class="flex flex-wrap items-center gap-2">
            <Show when={local.title}>
              <h3 class="text-lg font-semibold tracking-[-0.02em] text-foreground">{local.title}</h3>
            </Show>
            <Show when={local.submitting}>
              <Badge tone="accent">Submitting</Badge>
            </Show>
            <Show when={local.invalid}>
              <Badge tone="danger">Invalid</Badge>
            </Show>
            <Show when={!local.invalid && local.valid}>
              <Badge tone="success">Valid</Badge>
            </Show>
            <Show when={local.dirty}>
              <Badge>Dirty</Badge>
            </Show>
          </div>
          <Show when={local.description}>
            <p class="max-w-3xl text-sm leading-6 text-muted-foreground">{local.description}</p>
          </Show>
        </div>
        <Show when={local.actions}>
          <div class="shrink-0">{local.actions}</div>
        </Show>
      </div>

      <div class={cn("grid gap-[var(--space-5)]", local.columns === 2 ? "xl:grid-cols-2" : "grid-cols-1")}>{local.children}</div>

      <Show when={local.footer}>
        <div class="border-t border-border/70 pt-[var(--space-4)]">{local.footer}</div>
      </Show>
    </section>
  );
}
