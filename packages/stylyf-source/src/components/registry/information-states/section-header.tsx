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
        "ui-shell-muted flex flex-col gap-4 border border-border/80 px-[var(--space-5)] py-[var(--space-4)] sm:flex-row sm:items-end sm:justify-between",
        local.class,
      )}
      {...others}
    >
      <div class="space-y-2.5">
        <h3 class={cn("text-[1.45rem] tracking-[-0.03em]", local.strong ? "font-semibold text-foreground" : "font-medium text-foreground")}>{local.title}</h3>
        <Show when={local.description}>
          <p class="max-w-2xl text-sm leading-6 text-muted-foreground">{local.description}</p>
        </Show>
      </div>
      <div class="flex shrink-0 flex-wrap items-center gap-2.5">
        <Show when={local.anchorHref}>
          <a
            href={local.anchorHref}
            class="ui-pillbar px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground transition hover:bg-foreground hover:text-background"
          >
            Jump link
          </a>
        </Show>
        <Show when={local.actions}>
          <div>{local.actions}</div>
        </Show>
      </div>
    </section>
  );
}
