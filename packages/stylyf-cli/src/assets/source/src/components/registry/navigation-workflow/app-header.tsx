import { Show, mergeProps, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { Breadcrumb } from "~/components/registry/actions-navigation/breadcrumb";
import { cn } from "~/lib/cn";

export type AppHeaderProps = Omit<JSX.HTMLAttributes<HTMLElement>, "children"> & {
  actions?: JSX.Element;
  breadcrumbs?: JSX.Element;
  class?: string;
  description?: JSX.Element;
  meta?: JSX.Element;
  tabs?: JSX.Element;
  title?: JSX.Element;
};

export function AppHeader(userProps: AppHeaderProps) {
  const props = mergeProps(
    {
      title: "Workspace",
      description: "Contextual header shell for dashboards and deeper product workspaces.",
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

  const [local, others] = splitProps(props, ["actions", "breadcrumbs", "class", "description", "meta", "tabs", "title"]);

  return (
    <section
      class={cn(
        "ui-shell-muted space-y-[var(--space-4)] border border-border/80 px-[var(--space-5)] py-[var(--space-5)] shadow-soft",
        local.class,
      )}
      {...others}
    >
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div class="min-w-0 space-y-3">
          <div>{local.breadcrumbs}</div>
          <h3 class="text-2xl font-semibold tracking-[-0.03em] text-foreground">{local.title}</h3>
          <div class="max-w-2xl text-sm leading-6 text-muted-foreground">{local.description}</div>
        </div>
        <div class="flex flex-col items-stretch gap-3 lg:items-end">
          <Show when={local.meta}>
            <div class="ui-shell flex flex-wrap items-center gap-2 p-2">{local.meta}</div>
          </Show>
          <Show when={local.actions}>
            <div>{local.actions}</div>
          </Show>
        </div>
      </div>
      <Show when={local.tabs}>
        <div class="border-t border-border/70 pt-[var(--space-4)]">{local.tabs}</div>
      </Show>
    </section>
  );
}
