import type { JSX } from "solid-js";
import { splitProps } from "solid-js";
import { PageHeader } from "~/components/registry/information-states/page-header";
import { ContentFrame } from "~/components/layout/content-frame";
import { Stack } from "~/components/layout/stack";

export type ResourceDetailPageShellProps = JSX.HTMLAttributes<HTMLDivElement> & {
  actions?: JSX.Element;
  children?: JSX.Element;
  description?: JSX.Element;
  eyebrow?: JSX.Element;
  meta?: JSX.Element;
  title?: JSX.Element;
};

export function ResourceDetailPageShell(userProps: ResourceDetailPageShellProps) {
  const [local, others] = splitProps(userProps, ["actions", "children", "class", "description", "eyebrow", "meta", "title"]);

  return (
    <ContentFrame width="prose" class={local.class} {...others}>
      <Stack gap="comfortable">
        <PageHeader
          eyebrow={local.eyebrow ?? "Studio"}
          title={local.title ?? "Stylyf Builder detail"}
          description={local.description ?? "Open a draft, refine it, and review what changed."}
          meta={local.meta}
          actions={local.actions}
        />
        {local.children}
      </Stack>
    </ContentFrame>
  );
}
