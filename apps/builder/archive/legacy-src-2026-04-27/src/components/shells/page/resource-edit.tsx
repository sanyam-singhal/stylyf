import type { JSX } from "solid-js";
import { splitProps } from "solid-js";
import { PageHeader } from "~/components/registry/information-states/page-header";
import { ContentFrame } from "~/components/layout/content-frame";
import { Stack } from "~/components/layout/stack";

export type ResourceEditPageShellProps = JSX.HTMLAttributes<HTMLDivElement> & {
  actions?: JSX.Element;
  children?: JSX.Element;
  description?: JSX.Element;
  meta?: JSX.Element;
  title?: JSX.Element;
};

export function ResourceEditPageShell(userProps: ResourceEditPageShellProps) {
  const [local, others] = splitProps(userProps, ["actions", "children", "class", "description", "meta", "title"]);

  return (
    <ContentFrame width="narrow" class={local.class} {...others}>
      <Stack gap="comfortable">
        <PageHeader
          eyebrow="Edit"
          title={local.title ?? "Edit Stylyf Builder resource"}
          description={local.description ?? "Generated edit shell for mutable records with server-backed form submission and inline validation."}
          meta={local.meta}
          actions={local.actions}
        />
        {local.children}
      </Stack>
    </ContentFrame>
  );
}

