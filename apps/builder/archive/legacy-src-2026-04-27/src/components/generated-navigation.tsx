import { For, Show } from "solid-js";
import { useLocation } from "@solidjs/router";
import { FolderKanban, Plus, Settings } from "lucide-solid";
import { SidebarNav } from "~/components/registry/navigation-workflow/sidebar-nav";
import { cn } from "~/lib/cn";

export const navigationConfig = {
  "primary": [
    {
      "label": "Projects",
      "href": "/",
      "auth": "user"
    },
    {
      "label": "New Project",
      "href": "/projects/new",
      "auth": "user"
    },
    {
      "label": "Settings",
      "href": "/settings",
      "auth": "user"
    }
  ],
  "secondary": [],
  "userMenu": [
    {
      "label": "Sign out",
      "href": "/api/auth/sign-out",
      "auth": "user"
    }
  ],
  "commandMenu": [
    {
      "label": "Projects",
      "href": "/",
      "group": "App",
      "auth": "user",
      "command": true
    },
    {
      "label": "Projects",
      "href": "/projects",
      "group": "App",
      "auth": "user",
      "command": true
    },
    {
      "label": "New project",
      "href": "/projects/new",
      "group": "App",
      "auth": "user",
      "command": true
    },
    {
      "label": "Settings",
      "href": "/settings",
      "group": "App",
      "auth": "user",
      "command": true
    }
  ]
} as const;

const sidebarGroups = [
  {
    "label": "Build",
    "items": [
      {
        "label": "Projects",
        "href": "/",
        "auth": "user",
        "icon": <FolderKanban class="size-4" />
      },
      {
        "label": "New Project",
        "href": "/projects/new",
        "auth": "user",
        "icon": <Plus class="size-4" />
      },
      {
        "label": "Settings",
        "href": "/settings",
        "auth": "user",
        "icon": <Settings class="size-4" />
      }
    ]
  }
] as const;

export function GeneratedNavigation(props: { class?: string; shell?: "sidebar-app" | "topbar-app" | "docs-shell" | "marketing-shell" }) {
  const location = useLocation();
  const groups = () => sidebarGroups.map(group => ({
    ...group,
    items: group.items.map(item => ({
      ...item,
      active: item.href === "/" ? location.pathname === "/" || location.pathname === "/projects" : location.pathname.startsWith(item.href),
    })),
  }));

  if (props.shell === "sidebar-app" || props.shell === "docs-shell") {
    return <SidebarNav title="Stylyf Builder" groups={groups()} class={props.class} />;
  }

  return (
    <div class={cn("flex flex-wrap items-center gap-2 text-sm", props.class)}>
      <For each={navigationConfig.primary}>
        {item => (
          <a
            href={item.href}
            class="rounded-[var(--radius-md)] px-3 py-2 text-muted-foreground transition hover:bg-muted-soft hover:text-foreground"
          >
            {item.label}
          </a>
        )}
      </For>
      <Show when={(navigationConfig.primary as readonly unknown[]).length === 0}>
        <span class="text-muted-foreground">No navigation items generated.</span>
      </Show>
    </div>
  );
}
