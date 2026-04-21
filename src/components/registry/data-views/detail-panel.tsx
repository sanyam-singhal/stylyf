import { Show, mergeProps, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { cn } from "~/lib/cn";

export type DetailPanelProps = Omit<JSX.HTMLAttributes<HTMLElement>, "children"> & {
  actions?: JSX.Element;
  body?: JSX.Element;
  class?: string;
  description?: JSX.Element;
  title?: JSX.Element;
};

export function DetailPanel(userProps: DetailPanelProps) {
  const props = mergeProps(
    {
      description: "Docked detail surface for the currently selected record.",
      title: "Selected record",
    },
    userProps,
  );

  const [local, others] = splitProps(props, ["actions", "body", "class", "description", "title"]);

  return (
    <aside class={cn("ui-card space-y-[var(--space-5)] p-[var(--space-6)]", local.class)} {...others}>
      <div class="space-y-2">
        <h3 class="text-lg font-semibold tracking-[-0.02em] text-foreground">{local.title}</h3>
        <p class="text-sm leading-6 text-muted-foreground">{local.description}</p>
      </div>
      <div>{local.body}</div>
      <Show when={local.actions}>
        <div class="border-t border-border/70 pt-[var(--space-4)]">{local.actions}</div>
      </Show>
    </aside>
  );
}
