import { Show, mergeProps, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { Badge } from "~/components/registry/feedback-display/badge";
import { cn } from "~/lib/cn";

export type PageHeaderProps = Omit<JSX.HTMLAttributes<HTMLElement>, "children"> & {
  actions?: JSX.Element;
  class?: string;
  description?: JSX.Element;
  eyebrow?: JSX.Element;
  meta?: JSX.Element;
  readonly?: boolean;
  stale?: boolean;
  title?: JSX.Element;
};

export function PageHeader(userProps: PageHeaderProps) {
  const props = mergeProps(
    {
      readonly: false,
      stale: false,
    },
    userProps,
  );

  const [local, others] = splitProps(props, ["actions", "class", "description", "eyebrow", "meta", "readonly", "stale", "title"]);

  return (
    <section class={cn("space-y-[var(--space-4)] border-b border-border/70 pb-[var(--space-5)]", local.class)} {...others}>
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div class="space-y-3">
          <Show when={local.eyebrow}>
            <div class="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">{local.eyebrow}</div>
          </Show>
          <div class="flex flex-wrap items-center gap-3">
            <h2 class="text-3xl font-semibold tracking-[-0.03em] text-foreground">{local.title}</h2>
            <Show when={local.stale}>
              <Badge tone="accent">Stale data</Badge>
            </Show>
            <Show when={local.readonly}>
              <Badge>Read only</Badge>
            </Show>
          </div>
          <Show when={local.description}>
            <p class="max-w-3xl text-sm leading-6 text-muted-foreground">{local.description}</p>
          </Show>
          <Show when={local.meta}>
            <div class="flex flex-wrap gap-2">{local.meta}</div>
          </Show>
        </div>
        <Show when={local.actions}>
          <div class="shrink-0">{local.actions}</div>
        </Show>
      </div>
    </section>
  );
}
