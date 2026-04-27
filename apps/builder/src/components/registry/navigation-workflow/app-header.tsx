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
    <section class={cn("builder-hero space-y-[var(--space-4)] px-[var(--space-6)] py-[var(--space-6)]", local.class)} {...others}>
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div class="min-w-0 space-y-3">
          <div class="text-muted-foreground">{local.breadcrumbs}</div>
          <div class="flex flex-wrap items-center gap-3">
            <span class="builder-orb size-10 font-mono text-xs font-black">AI</span>
            <h3 class="text-[clamp(2rem,4vw,3.7rem)] font-semibold tracking-[-0.065em] text-foreground">{local.title}</h3>
          </div>
          <div class="max-w-3xl text-base leading-7 text-muted-foreground">{local.description}</div>
        </div>
        <div class="flex flex-col items-stretch gap-3 lg:items-end">
          <Show when={local.meta}>
            <div class="builder-panel flex flex-wrap items-center gap-2 p-2">{local.meta}</div>
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
