import type { JSX } from "solid-js";
import { splitProps } from "solid-js";
import { PageHeader } from "~/components/registry/information-states/page-header";
import { ContentFrame } from "~/components/layout/content-frame";
import { Stack } from "~/components/layout/stack";
import { cn } from "~/lib/cn";

export type DashboardPageShellProps = JSX.HTMLAttributes<HTMLDivElement> & {
  actions?: JSX.Element;
  children?: JSX.Element;
  description?: JSX.Element;
  eyebrow?: JSX.Element;
  meta?: JSX.Element;
  title?: JSX.Element;
};

export function DashboardPageShell(userProps: DashboardPageShellProps) {
  const [local, others] = splitProps(userProps, ["actions", "children", "class", "description", "eyebrow", "meta", "title"]);

  return (
    <ContentFrame width="wide" class={local.class} {...others}>
      <Stack gap="comfortable">
        <PageHeader
          eyebrow={local.eyebrow ?? "Overview"}
          title={local.title ?? "{{APP_NAME}} dashboard"}
          description={local.description ?? "Generated dashboard page shell with strong overview rhythm."}
          meta={local.meta}
          actions={local.actions}
        />
        {local.children}
      </Stack>
    </ContentFrame>
  );
}

