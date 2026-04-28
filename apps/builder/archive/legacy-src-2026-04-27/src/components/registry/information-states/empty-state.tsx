import { Inbox } from "lucide-solid";
import { Show, mergeProps, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { cn } from "~/lib/cn";

export type EmptyStateProps = Omit<JSX.HTMLAttributes<HTMLElement>, "children"> & {
  actions?: JSX.Element;
  class?: string;
  description?: JSX.Element;
  eyebrow?: JSX.Element;
  icon?: JSX.Element;
  title?: JSX.Element;
};

export function EmptyState(userProps: EmptyStateProps) {
  const props = mergeProps(
    {
      description: "Use a single reusable empty state for no-data, first-run, and filtered-empty cases.",
      eyebrow: "No records yet",
      icon: <Inbox class="size-5" />,
      title: "Nothing to show",
    },
    userProps,
  );

  const [local, others] = splitProps(props, ["actions", "class", "description", "eyebrow", "icon", "title"]);

  return (
    <section class={cn("ui-shell-muted px-[var(--space-6)] py-[var(--space-8)] text-center shadow-soft", local.class)} {...others}>
      <div class="mx-auto inline-flex size-16 items-center justify-center rounded-[var(--radius-2xl)] border border-accent/36 bg-accent text-accent-foreground shadow-soft">
        {local.icon}
      </div>
      <Show when={local.eyebrow}>
        <div class="mt-[var(--space-5)] text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">{local.eyebrow}</div>
      </Show>
      <h3 class="mt-3 text-2xl font-semibold tracking-[-0.03em] text-foreground">{local.title}</h3>
      <p class="mx-auto mt-3 max-w-xl text-[0.96rem] leading-7 text-muted-foreground">{local.description}</p>
      <Show when={local.actions}>
        <div class="mt-[var(--space-5)] flex flex-wrap justify-center gap-3">{local.actions}</div>
      </Show>
    </section>
  );
}
