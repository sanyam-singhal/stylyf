import { Show, mergeProps, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { Badge } from "~/components/registry/feedback-display/badge";
import { cn } from "~/lib/cn";

export type WizardShellProps = Omit<JSX.HTMLAttributes<HTMLElement>, "children"> & {
  body?: JSX.Element;
  class?: string;
  currentStep?: number;
  footer?: JSX.Element;
  steps?: number;
  summary?: JSX.Element;
  title?: JSX.Element;
};

export function WizardShell(userProps: WizardShellProps) {
  const props = mergeProps(
    {
      currentStep: 2,
      steps: 4,
      title: "Create workspace",
    },
    userProps,
  );

  const [local, others] = splitProps(props, ["body", "class", "currentStep", "footer", "steps", "summary", "title"]);

  return (
    <section class={cn("ui-card overflow-hidden p-0", local.class)} {...others}>
      <div class="flex flex-col gap-6 border-b border-border/70 px-[var(--space-6)] py-[var(--space-5)] lg:flex-row lg:items-start lg:justify-between">
        <div class="space-y-3">
          <div class="flex flex-wrap items-center gap-2">
            <Badge tone="accent">Step {local.currentStep} of {local.steps}</Badge>
            <Badge>Wizard shell</Badge>
          </div>
          <h3 class="text-2xl font-semibold tracking-[-0.03em] text-foreground">{local.title}</h3>
        </div>
        <Show when={local.summary}>
          <div class="w-full lg:max-w-xs">{local.summary}</div>
        </Show>
      </div>

      <div class={cn("grid gap-[var(--space-6)] px-[var(--space-6)] py-[var(--space-6)]", local.summary ? "lg:grid-cols-[1.15fr_0.85fr]" : "grid-cols-1")}>
        <div>{local.body}</div>
        <Show when={local.summary}>
          <aside class="ui-demo-inset">{local.summary}</aside>
        </Show>
      </div>

      <Show when={local.footer}>
        <div class="border-t border-border/70 bg-background-subtle/60 px-[var(--space-6)] py-[var(--space-4)]">{local.footer}</div>
      </Show>
    </section>
  );
}
