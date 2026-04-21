import { LoaderCircle } from "lucide-solid";
import { Show, mergeProps, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { Progress } from "~/components/registry/feedback-display/progress";
import { cn } from "~/lib/cn";

export type LoadingStateProps = Omit<JSX.HTMLAttributes<HTMLElement>, "children"> & {
  cancelAction?: JSX.Element;
  class?: string;
  compact?: boolean;
  description?: JSX.Element;
  progress?: number;
  title?: JSX.Element;
};

export function LoadingState(userProps: LoadingStateProps) {
  const props = mergeProps(
    {
      compact: false,
      description: "Use this when layout-faithful skeletons are unnecessary and you need a focused progress message.",
      progress: undefined,
      title: "Syncing workspace data",
    },
    userProps,
  );

  const [local, others] = splitProps(props, ["cancelAction", "class", "compact", "description", "progress", "title"]);

  return (
    <section
      class={cn(
        "ui-shell-muted flex flex-col items-start gap-[var(--space-5)] shadow-soft",
        local.compact ? "p-[var(--space-5)]" : "px-[var(--space-6)] py-[var(--space-7)]",
        local.class,
      )}
      {...others}
    >
      <div class="inline-flex size-12 items-center justify-center rounded-[var(--radius-xl)] border border-accent/24 bg-accent text-accent-foreground shadow-soft">
        <LoaderCircle class="size-5 animate-spin" />
      </div>
      <div class="space-y-2">
        <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Processing</div>
        <h3 class="text-xl font-semibold tracking-[-0.02em] text-foreground">{local.title}</h3>
        <p class="max-w-xl text-sm leading-6 text-muted-foreground">{local.description}</p>
      </div>
      <Show when={local.progress !== undefined}>
        <div class="w-full max-w-xl">
          <Progress value={local.progress} label="Progress" />
        </div>
      </Show>
      <Show when={local.cancelAction}>
        <div>{local.cancelAction}</div>
      </Show>
    </section>
  );
}
