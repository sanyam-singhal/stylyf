import type { JSX } from "solid-js";
import { splitProps } from "solid-js";
import { PageHeader } from "~/components/registry/information-states/page-header";
import { ContentFrame } from "~/components/layout/content-frame";
import { Stack } from "~/components/layout/stack";

export type ResourceCreatePageShellProps = JSX.HTMLAttributes<HTMLDivElement> & {
  actions?: JSX.Element;
  children?: JSX.Element;
  description?: JSX.Element;
  meta?: JSX.Element;
  title?: JSX.Element;
};

export function ResourceCreatePageShell(userProps: ResourceCreatePageShellProps) {
  const [local, others] = splitProps(userProps, ["actions", "children", "class", "description", "meta", "title"]);

  return (
    <ContentFrame width="narrow" class={local.class} {...others}>
      <Stack gap="comfortable">
        <PageHeader
          eyebrow="Create"
          title={local.title ?? "Create Stylyf Builder resource"}
          description={local.description ?? "Generated create shell with a restrained form width and support copy for resource entry flows."}
          meta={local.meta}
          actions={local.actions}
        />
        {local.children}
      </Stack>
    </ContentFrame>
  );
}

