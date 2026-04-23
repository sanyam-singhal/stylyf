import { Show, mergeProps, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { Avatar } from "~/components/registry/feedback-display/avatar";
import { cn } from "~/lib/cn";

export type TopNavBarProps = Omit<JSX.HTMLAttributes<HTMLElement>, "children"> & {
  actions?: JSX.Element;
  brand?: JSX.Element;
  class?: string;
  nav?: JSX.Element;
  search?: JSX.Element;
};

export function TopNavBar(userProps: TopNavBarProps) {
  const props = mergeProps(
    {
      brand: "Stylyf",
    },
    userProps,
  );

  const [local, others] = splitProps(props, ["actions", "brand", "class", "nav", "search"]);

  return (
    <header
      class={cn(
        "ui-shell-muted flex flex-col gap-4 border border-border/80 px-[var(--space-5)] py-[var(--space-4)] shadow-soft lg:flex-row lg:items-center lg:justify-between",
        local.class,
      )}
      {...others}
    >
      <div class="flex flex-wrap items-center gap-4 lg:gap-6">
        <div class="ui-shell flex items-center gap-3 px-3 py-2">
          <div class="flex size-8 items-center justify-center rounded-[var(--radius-md)] bg-primary/12 text-primary">
            <span class="text-sm font-semibold">S</span>
          </div>
          <div>
            <div class="text-lg font-semibold tracking-[-0.02em] text-foreground">{local.brand}</div>
            <div class="text-[0.68rem] uppercase tracking-[0.2em] text-muted-foreground">Product navigation</div>
          </div>
        </div>
        <Show when={local.nav}>
          <nav class="flex-1">{local.nav}</nav>
        </Show>
      </div>
      <div class="flex flex-col gap-3 lg:flex-row lg:items-center">
        <Show when={local.search}>
          <div class="min-w-0 lg:w-80">{local.search}</div>
        </Show>
        <Show when={local.actions}>
          <div class="ui-shell flex items-center gap-3 p-2">
            {local.actions}
            <Avatar alt="Stylyf teammate" size="sm" status="online" />
          </div>
        </Show>
      </div>
    </header>
  );
}
