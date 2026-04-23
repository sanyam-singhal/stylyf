import { Show, mergeProps, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { Badge } from "~/components/registry/feedback-display/badge";
import { cn } from "~/lib/cn";

export type WizardShellProps = Omit<JSX.HTMLAttributes<HTMLElement>, "children"> & {
  body?: JSX.Element;
  class?: string;
  currentStep?: number;
  description?: JSX.Element;
  footer?: JSX.Element;
  steps?: number;
  summary?: JSX.Element;
  title?: JSX.Element;
};

export function WizardShell(userProps: WizardShellProps) {
  const props = mergeProps(
    {
      currentStep: 2,
      description: "A structured container for multi-step setup, onboarding, and transactional journeys.",
      steps: 4,
      title: "Create workspace",
    },
    userProps,
  );

  const [local, others] = splitProps(props, ["body", "class", "currentStep", "description", "footer", "steps", "summary", "title"]);

  return (
    <section class={cn("ui-shell-muted overflow-hidden border border-border/80 p-0 shadow-soft", local.class)} {...others}>
      <div class="border-b border-border/80 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--secondary)_10%,var(--card)_90%),var(--card))] px-[var(--space-6)] py-[var(--space-5)]">
        <div class="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div class="flex flex-wrap items-center gap-2">
            <Badge tone="accent">Step {local.currentStep} of {local.steps}</Badge>
            <Badge tone="neutral">Wizard shell</Badge>
          </div>
          <div class="max-w-2xl space-y-2">
            <h3 class="text-2xl font-semibold tracking-[-0.03em] text-foreground">{local.title}</h3>
            <div class="text-sm leading-6 text-muted-foreground">{local.description}</div>
          </div>
          <div class="ui-shell flex items-center gap-3 self-start px-3 py-2">
            <div class="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Progress</div>
            <div class="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
              <div class="h-full rounded-full bg-primary" style={{ width: `${(local.currentStep / local.steps) * 100}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div class={cn("grid gap-[var(--space-6)] px-[var(--space-6)] py-[var(--space-6)]", local.summary ? "lg:grid-cols-[1.18fr_0.82fr]" : "grid-cols-1")}>
        <div class="space-y-[var(--space-5)]">
          <div class="ui-shell border border-border/70 p-[var(--space-5)] shadow-inset">{local.body}</div>
        </div>
        <Show when={local.summary}>
          <aside class="ui-shell border border-border/70 p-[var(--space-5)] shadow-inset">{local.summary}</aside>
        </Show>
      </div>

      <Show when={local.footer}>
        <div class="border-t border-border/80 bg-background-subtle/70 px-[var(--space-6)] py-[var(--space-4)]">{local.footer}</div>
      </Show>
    </section>
  );
}
