import { Show, mergeProps, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { cn } from "~/lib/cn";

export type FeatureCardProps = Omit<JSX.HTMLAttributes<HTMLElement>, "children"> & {
  class?: string;
  cta?: JSX.Element;
  description?: JSX.Element;
  icon?: JSX.Element;
  media?: JSX.Element;
  title?: JSX.Element;
};

export function FeatureCard(userProps: FeatureCardProps) {
  const props = mergeProps(
    {
      description: "Purpose-built block for product and marketing grids, with room for media and a clear CTA.",
      title: "Registry exports stay source-owned",
    },
    userProps,
  );

  const [local, others] = splitProps(props, ["class", "cta", "description", "icon", "media", "title"]);

  return (
    <section class={cn("ui-card overflow-hidden p-0", local.class)} {...others}>
      <Show when={local.media}>
        <div class="border-b border-border/70 bg-background-subtle/70">{local.media}</div>
      </Show>
      <div class="space-y-[var(--space-4)] p-[var(--space-6)]">
        <Show when={local.icon}>
          <div class="inline-flex size-11 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-soft">{local.icon}</div>
        </Show>
        <div class="space-y-2">
          <h3 class="text-lg font-semibold tracking-[-0.02em] text-foreground">{local.title}</h3>
          <p class="text-sm leading-6 text-muted-foreground">{local.description}</p>
        </div>
        <Show when={local.cta}>
          <div>{local.cta}</div>
        </Show>
      </div>
    </section>
  );
}
