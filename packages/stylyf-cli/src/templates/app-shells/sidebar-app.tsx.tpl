import type { JSX } from "solid-js";
import { Show, splitProps } from "solid-js";
import { AppHeader } from "~/components/registry/navigation-workflow/app-header";
import { SidebarNav } from "~/components/registry/navigation-workflow/sidebar-nav";
import { cn } from "~/lib/cn";

export type SidebarAppShellProps = JSX.HTMLAttributes<HTMLDivElement> & {
  children?: JSX.Element;
  description?: JSX.Element;
  headerActions?: JSX.Element;
  headerMeta?: JSX.Element;
  navigation?: JSX.Element;
  title?: JSX.Element;
};

export function SidebarAppShell(userProps: SidebarAppShellProps) {
  const [local, others] = splitProps(userProps, [
    "children",
    "class",
    "description",
    "headerActions",
    "headerMeta",
    "navigation",
    "title",
  ]);

  return (
    <div class={cn("grid min-h-screen gap-[var(--space-6)] lg:grid-cols-[18rem_minmax(0,1fr)]", local.class)} {...others}>
      <div class="lg:sticky lg:top-[var(--space-6)] lg:self-start">
        {local.navigation ?? <SidebarNav title="{{APP_NAME}}" />}
      </div>

      <div class="min-w-0 space-y-[var(--space-6)]">
        <AppHeader
          title={local.title ?? "{{APP_NAME}}"}
          description={local.description ?? "Generated workspace shell for internal app surfaces."}
          actions={local.headerActions}
          meta={local.headerMeta}
        />
        <main class="min-w-0">{local.children}</main>
      </div>
    </div>
  );
}

