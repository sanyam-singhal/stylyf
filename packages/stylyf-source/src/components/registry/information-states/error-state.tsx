import { ShieldAlert } from "lucide-solid";
import { Show, mergeProps, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { cn } from "~/lib/cn";

export type ErrorStateProps = Omit<JSX.HTMLAttributes<HTMLElement>, "children"> & {
  actions?: JSX.Element;
  class?: string;
  detail?: JSX.Element;
  title?: JSX.Element;
};

export function ErrorState(userProps: ErrorStateProps) {
  const props = mergeProps(
    {
      detail: "The registry data could not be refreshed. Show recovery guidance, not just a failure banner.",
      title: "Something went wrong",
    },
    userProps,
  );

  const [local, others] = splitProps(props, ["actions", "class", "detail", "title"]);

  return (
    <section
      class={cn(
        "ui-shell-muted border-destructive/18 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--destructive)_9%,var(--card)_91%),var(--card))] px-[var(--space-6)] py-[var(--space-6)] shadow-soft",
        local.class,
      )}
      {...others}
    >
      <div class="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div class="inline-flex size-12 shrink-0 items-center justify-center rounded-[var(--radius-xl)] border border-destructive/18 bg-destructive text-destructive-foreground shadow-soft">
          <ShieldAlert class="size-5" />
        </div>
        <div class="min-w-0 flex-1 space-y-3">
          <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-destructive">Recoverable error</div>
          <h3 class="text-xl font-semibold tracking-[-0.02em] text-foreground">{local.title}</h3>
          <p class="max-w-2xl text-sm leading-6 text-muted-foreground">{local.detail}</p>
          <Show when={local.actions}>
            <div class="flex flex-wrap gap-3">{local.actions}</div>
          </Show>
        </div>
      </div>
    </section>
  );
}
