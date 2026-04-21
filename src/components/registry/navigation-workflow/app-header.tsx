import { Show, mergeProps, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { Breadcrumb } from "~/components/registry/actions-navigation/breadcrumb";
import { cn } from "~/lib/cn";

export type AppHeaderProps = Omit<JSX.HTMLAttributes<HTMLElement>, "children"> & {
  actions?: JSX.Element;
  breadcrumbs?: JSX.Element;
  class?: string;
  tabs?: JSX.Element;
  title?: JSX.Element;
};

export function AppHeader(userProps: AppHeaderProps) {
  const props = mergeProps(
    {
      title: "Workspace",
      breadcrumbs: (
        <Breadcrumb>
          <Breadcrumb.List>
            <Breadcrumb.Item><Breadcrumb.Link href="#">Workspace</Breadcrumb.Link></Breadcrumb.Item>
            <Breadcrumb.Separator />
            <Breadcrumb.Item><Breadcrumb.Current>Overview</Breadcrumb.Current></Breadcrumb.Item>
          </Breadcrumb.List>
        </Breadcrumb>
      ),
    },
    userProps,
  );

  const [local, others] = splitProps(props, ["actions", "breadcrumbs", "class", "tabs", "title"]);

  return (
    <section class={cn("space-y-[var(--space-4)] border-b border-border/70 pb-[var(--space-4)]", local.class)} {...others}>
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div class="space-y-3">
          <div>{local.breadcrumbs}</div>
          <h3 class="text-2xl font-semibold tracking-[-0.03em] text-foreground">{local.title}</h3>
        </div>
        <Show when={local.actions}>
          <div>{local.actions}</div>
        </Show>
      </div>
      <Show when={local.tabs}>
        <div>{local.tabs}</div>
      </Show>
    </section>
  );
}
