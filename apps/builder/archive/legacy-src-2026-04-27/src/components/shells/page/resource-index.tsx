import type { JSX } from "solid-js";
import { Show, splitProps } from "solid-js";
import { PageHeader } from "~/components/registry/information-states/page-header";
import { ContentFrame } from "~/components/layout/content-frame";
import { Split } from "~/components/layout/split";
import { Stack } from "~/components/layout/stack";
import { cn } from "~/lib/cn";

export type ResourceIndexPageShellProps = JSX.HTMLAttributes<HTMLDivElement> & {
  actions?: JSX.Element;
  children?: JSX.Element;
  description?: JSX.Element;
  detail?: JSX.Element;
  eyebrow?: JSX.Element;
  title?: JSX.Element;
  toolbar?: JSX.Element;
};

export function ResourceIndexPageShell(userProps: ResourceIndexPageShellProps) {
  const [local, others] = splitProps(userProps, ["actions", "children", "class", "description", "detail", "eyebrow", "title", "toolbar"]);

  return (
    <ContentFrame width="wide" class={cn("space-y-[var(--space-6)]", local.class)} {...others}>
      <PageHeader
        eyebrow={local.eyebrow ?? "Studio"}
        title={local.title ?? "Stylyf Builder resources"}
        description={local.description ?? "Browse and continue app drafts."}
        actions={local.actions}
      />
      <Stack gap="comfortable">
        <Show when={local.toolbar}>{local.toolbar}</Show>
        <Split ratio="2:1" side={local.detail}>
          {local.children}
        </Split>
      </Stack>
    </ContentFrame>
  );
}
