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
    <section
      class={cn(
        "ui-shell-muted overflow-hidden border border-border/80 px-[var(--space-5)] py-[var(--space-5)] shadow-soft",
        local.class,
      )}
      {...others}
    >
      <div class="flex flex-col gap-[var(--space-5)] xl:flex-row xl:items-start xl:justify-between">
        <div class="min-w-0 flex-1 space-y-4">
          <div class="flex flex-wrap items-center gap-2.5">
            <Show when={local.eyebrow}>
              <div class="ui-pillbar px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                {local.eyebrow}
              </div>
            </Show>
            <Show when={local.stale}>
              <Badge tone="accent" emphasis="soft">Stale data</Badge>
            </Show>
            <Show when={local.readonly}>
              <Badge tone="neutral" emphasis="soft">Read only</Badge>
            </Show>
          </div>

          <div class="space-y-3">
            <h2 class="text-[clamp(2rem,4vw,3rem)] font-semibold tracking-[-0.045em] text-foreground">{local.title}</h2>
            <Show when={local.description}>
              <p class="max-w-3xl text-[0.98rem] leading-7 text-muted-foreground">{local.description}</p>
            </Show>
          </div>

          <Show when={local.meta}>
            <div class="flex flex-wrap gap-2.5">{local.meta}</div>
          </Show>
        </div>

        <Show when={local.actions}>
          <div class="ui-shell flex shrink-0 flex-wrap items-center gap-2.5 self-start p-2">
            {local.actions}
          </div>
        </Show>
      </div>

      <div class="mt-[var(--space-5)] h-px bg-border/80" />
    </section>
  );
}
