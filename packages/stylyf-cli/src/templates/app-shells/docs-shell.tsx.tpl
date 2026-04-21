import type { JSX } from "solid-js";
import { splitProps } from "solid-js";
import { TopNavBar } from "~/components/registry/navigation-workflow/top-nav-bar";
import { cn } from "~/lib/cn";

export type DocsShellProps = JSX.HTMLAttributes<HTMLDivElement> & {
  children?: JSX.Element;
  docsNav?: JSX.Element;
  tableOfContents?: JSX.Element;
};

export function DocsShell(userProps: DocsShellProps) {
  const [local, others] = splitProps(userProps, ["children", "class", "docsNav", "tableOfContents"]);

  return (
    <div class={cn("min-h-screen space-y-[var(--space-6)]", local.class)} {...others}>
      <TopNavBar brand="{{APP_NAME}}" />
      <div class="grid gap-[var(--space-6)] xl:grid-cols-[18rem_minmax(0,1fr)_16rem]">
        <aside class="ui-shell-muted h-fit p-[var(--space-5)]">
          {local.docsNav ?? <div class="text-sm text-muted-foreground">Docs navigation</div>}
        </aside>
        <main class="min-w-0">{local.children}</main>
        <aside class="ui-shell-muted hidden h-fit p-[var(--space-5)] xl:block">
          {local.tableOfContents ?? <div class="text-sm text-muted-foreground">On this page</div>}
        </aside>
      </div>
    </div>
  );
}

