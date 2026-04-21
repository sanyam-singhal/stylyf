import type { JSX } from "solid-js";
import { Show, splitProps } from "solid-js";
import { cn } from "~/lib/cn";

const gapClasses = {
  tight: "space-y-[var(--space-3)]",
  comfortable: "space-y-[var(--space-5)]",
  loose: "space-y-[var(--space-8)]",
} as const;

export type SectionProps = JSX.HTMLAttributes<HTMLElement> & {
  description?: JSX.Element;
  heading?: JSX.Element;
  gap?: keyof typeof gapClasses;
};

export function Section(userProps: SectionProps) {
  const [local, others] = splitProps(userProps, ["children", "class", "description", "gap", "heading"]);

  return (
    <section class={cn(gapClasses[local.gap ?? "comfortable"], local.class)} {...others}>
      <Show when={local.heading || local.description}>
        <div class="space-y-2">
          <Show when={local.heading}>
            <h2 class="text-xl font-semibold tracking-[-0.03em] text-foreground">{local.heading}</h2>
          </Show>
          <Show when={local.description}>
            <p class="text-sm leading-6 text-muted-foreground">{local.description}</p>
          </Show>
        </div>
      </Show>
      {local.children}
    </section>
  );
}

