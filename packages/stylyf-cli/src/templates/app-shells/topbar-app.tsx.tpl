import type { JSX } from "solid-js";
import { splitProps } from "solid-js";
import { TopNavBar } from "~/components/registry/navigation-workflow/top-nav-bar";
import { cn } from "~/lib/cn";

export type TopbarAppShellProps = JSX.HTMLAttributes<HTMLDivElement> & {
  actions?: JSX.Element;
  brand?: JSX.Element;
  children?: JSX.Element;
  nav?: JSX.Element;
  search?: JSX.Element;
};

export function TopbarAppShell(userProps: TopbarAppShellProps) {
  const [local, others] = splitProps(userProps, ["actions", "brand", "children", "class", "nav", "search"]);

  return (
    <div class={cn("min-h-screen space-y-[var(--space-6)]", local.class)} {...others}>
      <TopNavBar
        brand={local.brand ?? "{{APP_NAME}}"}
        nav={local.nav}
        search={local.search}
        actions={local.actions}
      />
      <main>{local.children}</main>
    </div>
  );
}

