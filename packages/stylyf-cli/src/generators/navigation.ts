import type { AppIR, NavItemIR } from "../compiler/generated-app.js";

function groupItems(items: NavItemIR[]) {
  const groups = new Map<string, NavItemIR[]>();
  for (const item of items) {
    const group = item.group ?? "Navigation";
    groups.set(group, [...(groups.get(group) ?? []), item]);
  }
  return [...groups.entries()].map(([label, groupItems]) => ({ label, items: groupItems }));
}

export function renderGeneratedNavigationModule(app: AppIR) {
  const navigation = app.navigation ?? { primary: [], secondary: [], userMenu: [], commandMenu: [] };
  return [
    'import { For, Show } from "solid-js";',
    'import { SidebarNav } from "~/components/registry/navigation-workflow/sidebar-nav";',
    'import { cn } from "~/lib/cn";',
    "",
    `export const navigationConfig = ${JSON.stringify(navigation, null, 2)} as const;`,
    "",
    `const sidebarGroups = ${JSON.stringify(groupItems(navigation.primary), null, 2)} as const;`,
    "",
    'export function GeneratedNavigation(props: { class?: string; shell?: "sidebar-app" | "topbar-app" | "docs-shell" | "marketing-shell" }) {',
    '  if (props.shell === "sidebar-app" || props.shell === "docs-shell") {',
    `    return <SidebarNav title=${JSON.stringify(app.name)} groups={sidebarGroups as any} class={props.class} />;`,
    "  }",
    "",
    "  return (",
    '    <div class={cn("flex flex-wrap items-center gap-2 text-sm", props.class)}>',
    "      <For each={navigationConfig.primary}>",
    "        {item => (",
    "          <a",
    "            href={item.href}",
    "            class=\"rounded-[var(--radius-md)] px-3 py-2 text-muted-foreground transition hover:bg-muted-soft hover:text-foreground\"",
    "          >",
    "            {item.label}",
    "          </a>",
    "        )}",
    "      </For>",
    "      <Show when={(navigationConfig.primary as readonly unknown[]).length === 0}>",
    "        <span class=\"text-muted-foreground\">No navigation items generated.</span>",
    "      </Show>",
    "    </div>",
    "  );",
    "}",
    "",
  ].join("\n");
}
