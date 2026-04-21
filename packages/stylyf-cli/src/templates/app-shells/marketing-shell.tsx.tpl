import type { JSX } from "solid-js";
import { splitProps } from "solid-js";
import { TopNavBar } from "~/components/registry/navigation-workflow/top-nav-bar";
import { cn } from "~/lib/cn";

export type MarketingShellProps = JSX.HTMLAttributes<HTMLDivElement> & {
  children?: JSX.Element;
  footer?: JSX.Element;
  nav?: JSX.Element;
  search?: JSX.Element;
};

export function MarketingShell(userProps: MarketingShellProps) {
  const [local, others] = splitProps(userProps, ["children", "class", "footer", "nav", "search"]);

  return (
    <div class={cn("min-h-screen space-y-[var(--space-8)]", local.class)} {...others}>
      <TopNavBar brand="{{APP_NAME}}" nav={local.nav} search={local.search} />
      <main>{local.children}</main>
      <footer class="ui-shell-muted px-[var(--space-5)] py-[var(--space-6)]">
        {local.footer ?? <div class="text-sm text-muted-foreground">Generated marketing footer</div>}
      </footer>
    </div>
  );
}

