import { Show, mergeProps, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { cn } from "~/lib/cn";

export type SectionHeaderProps = Omit<JSX.HTMLAttributes<HTMLElement>, "children"> & {
  actions?: JSX.Element;
  anchorHref?: string;
  class?: string;
  description?: JSX.Element;
  strong?: boolean;
  title?: JSX.Element;
};

export function SectionHeader(userProps: SectionHeaderProps) {
  const props = mergeProps(
    {
      strong: false,
    },
    userProps,
  );

  const [local, others] = splitProps(props, ["actions", "anchorHref", "class", "description", "strong", "title"]);

  return (
    <section
      class={cn(
        "flex flex-col gap-4 border-b border-border/70 pb-[var(--space-4)] sm:flex-row sm:items-end sm:justify-between",
        local.class,
      )}
      {...others}
    >
      <div class="space-y-2">
        <div class="flex flex-wrap items-center gap-3">
          <h3 class={cn("text-xl tracking-[-0.02em]", local.strong ? "font-semibold text-foreground" : "font-medium text-foreground")}>{local.title}</h3>
          <Show when={local.anchorHref}>
            <a
              href={local.anchorHref}
              class="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground transition hover:text-foreground"
            >
              Jump link
            </a>
          </Show>
        </div>
        <Show when={local.description}>
          <p class="max-w-2xl text-sm leading-6 text-muted-foreground">{local.description}</p>
        </Show>
      </div>
      <Show when={local.actions}>
        <div class="shrink-0">{local.actions}</div>
      </Show>
    </section>
  );
}
