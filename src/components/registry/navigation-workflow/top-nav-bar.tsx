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
    <header class={cn("ui-card flex flex-col gap-4 px-[var(--space-5)] py-[var(--space-4)] lg:flex-row lg:items-center lg:justify-between", local.class)} {...others}>
      <div class="flex items-center gap-6">
        <div class="text-lg font-semibold tracking-[-0.02em] text-foreground">{local.brand}</div>
        <Show when={local.nav}>
          <nav>{local.nav}</nav>
        </Show>
      </div>
      <div class="flex flex-col gap-3 lg:flex-row lg:items-center">
        <Show when={local.search}>
          <div class="min-w-0 lg:w-80">{local.search}</div>
        </Show>
        <Show when={local.actions}>
          <div class="flex items-center gap-3">
            {local.actions}
            <Avatar alt="Stylyf teammate" size="sm" status="online" />
          </div>
        </Show>
      </div>
    </header>
  );
}
