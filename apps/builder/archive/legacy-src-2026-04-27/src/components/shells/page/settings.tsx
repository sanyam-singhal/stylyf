import type { JSX } from "solid-js";
import { splitProps } from "solid-js";
import { PageHeader } from "~/components/registry/information-states/page-header";
import { ContentFrame } from "~/components/layout/content-frame";
import { Stack } from "~/components/layout/stack";

export type SettingsPageShellProps = JSX.HTMLAttributes<HTMLDivElement> & {
  actions?: JSX.Element;
  children?: JSX.Element;
  description?: JSX.Element;
  title?: JSX.Element;
};

export function SettingsPageShell(userProps: SettingsPageShellProps) {
  const [local, others] = splitProps(userProps, ["actions", "children", "class", "description", "title"]);

  return (
    <ContentFrame width="narrow" class={local.class} {...others}>
      <Stack gap="comfortable">
        <PageHeader
          eyebrow="Settings"
          title={local.title ?? "Stylyf Builder settings"}
          description={local.description ?? "Generated shell for grouped configuration panels and account preferences."}
          actions={local.actions}
        />
        {local.children}
      </Stack>
    </ContentFrame>
  );
}

