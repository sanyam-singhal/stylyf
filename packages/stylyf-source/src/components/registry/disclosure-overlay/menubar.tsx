import { Portal } from "solid-js/web";
import { For, Show, createEffect, createSignal, createUniqueId, mergeProps, onCleanup, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { Check, ChevronDown } from "lucide-solid";
import { cn } from "~/lib/cn";

export type MenubarItem = {
  checked?: boolean;
  disabled?: boolean;
  label: JSX.Element;
  role?: "menuitem" | "menuitemcheckbox" | "menuitemradio";
  shortcut?: string;
  tone?: "default" | "danger";
};

export type MenubarMenu = {
  items: MenubarItem[];
  label: JSX.Element;
};

export type MenubarProps = Omit<JSX.HTMLAttributes<HTMLDivElement>, "children" | "ref"> & {
  class?: string;
  menus?: MenubarMenu[];
  onItemSelect?: (menuIndex: number, itemIndex: number) => void;
};

const defaultMenus: MenubarMenu[] = [
  {
    label: "File",
    items: [
      { label: "New workspace", shortcut: "⌘N" },
      { label: "Duplicate", shortcut: "⇧⌘D" },
      { label: "Archive", tone: "danger", shortcut: "⌘⌫" },
    ],
  },
  {
    label: "View",
    items: [
      { label: "Show sidebar", role: "menuitemcheckbox", checked: true, shortcut: "S" },
      { label: "Compact density", role: "menuitemcheckbox", checked: false, shortcut: "C" },
    ],
  },
  {
    label: "Help",
    items: [
      { label: "Keyboard shortcuts", shortcut: "?" },
      { label: "Open docs", shortcut: "D" },
    ],
  },
];

function getMenuItems(container: HTMLElement | undefined) {
  if (!container) return [];

  return Array.from(container.querySelectorAll<HTMLButtonElement>('[role="menuitem"],[role="menuitemcheckbox"],[role="menuitemradio"]')).filter(
    item => !item.disabled,
  );
}

function getMenuPosition(anchor: HTMLElement, menu: HTMLElement | undefined) {
  const rect = anchor.getBoundingClientRect();
  const menuWidth = menu?.offsetWidth ?? Math.min(288, window.innerWidth - 32);
  const menuHeight = menu?.offsetHeight ?? 260;
  const maxLeft = Math.max(16, window.innerWidth - menuWidth - 16);
  const maxTop = Math.max(16, window.innerHeight - menuHeight - 16);

  return {
    left: `${Math.min(Math.max(16, Math.round(rect.left)), maxLeft)}px`,
    position: "fixed",
    top: `${Math.min(Math.max(16, Math.round(rect.bottom + 10)), maxTop)}px`,
  };
}

export function Menubar(userProps: MenubarProps) {
  const props = mergeProps({ menus: defaultMenus }, userProps);
  const [local, others] = splitProps(props, ["class", "menus", "onItemSelect"]);
  const menuId = createUniqueId();
  const [activeMenu, setActiveMenu] = createSignal<number | undefined>();
  const [style, setStyle] = createSignal<Record<string, string>>({});
  const triggerRefs: HTMLButtonElement[] = [];
  let menuRef: HTMLDivElement | undefined;

  const openMenu = (index: number) => {
    const trigger = triggerRefs[index];
    if (!trigger) return;
    setStyle(getMenuPosition(trigger, menuRef));
    setActiveMenu(index);
  };

  createEffect(() => {
    if (activeMenu() === undefined) return;

    const handleWindowUpdate = () => {
      const index = activeMenu();
      if (index !== undefined) {
        openMenu(index);
      }
    };

    queueMicrotask(() => getMenuItems(menuRef)[0]?.focus());

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;

      if (menuRef?.contains(target) || triggerRefs.some(button => button.contains(target))) return;
      setActiveMenu(undefined);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const menuIndex = activeMenu();
      if (menuIndex === undefined) return;

      const items = getMenuItems(menuRef);

      if (!items.length) {
        return;
      }

      const current = document.activeElement as HTMLButtonElement | null;
      const index = items.findIndex(item => item === current);

      if (event.key === "Escape") {
        event.preventDefault();
        setActiveMenu(undefined);
        triggerRefs[menuIndex]?.focus();
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        items[(index + 1 + items.length) % items.length]?.focus();
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        items[(index - 1 + items.length) % items.length]?.focus();
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        const next = (menuIndex + 1) % local.menus.length;
        openMenu(next);
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        const next = (menuIndex - 1 + local.menus.length) % local.menus.length;
        openMenu(next);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleWindowUpdate);
    window.addEventListener("scroll", handleWindowUpdate, true);

    onCleanup(() => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleWindowUpdate);
      window.removeEventListener("scroll", handleWindowUpdate, true);
    });
  });

  return (
    <div
      role="menubar"
      class={cn("inline-flex flex-wrap gap-2 rounded-xl border border-border/70 bg-card p-2 shadow-soft", local.class)}
      {...others}
    >
      <For each={local.menus}>
        {(menu, menuIndex) => (
          <button
            ref={element => {
              triggerRefs.push(element);
            }}
            type="button"
            role="menuitem"
            aria-haspopup="menu"
            aria-expanded={activeMenu() === menuIndex()}
            class={cn(
              "inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35",
              activeMenu() === menuIndex()
                ? "border-primary/25 bg-primary text-primary-foreground"
                : "border-border/70 bg-background text-foreground hover:border-primary/30 hover:bg-accent",
            )}
            onClick={() => (activeMenu() === menuIndex() ? setActiveMenu(undefined) : openMenu(menuIndex()))}
            onKeyDown={event => {
              if (event.key === "ArrowRight") {
                event.preventDefault();
                const next = (menuIndex() + 1) % local.menus.length;
                triggerRefs[next]?.focus();
                return;
              }

              if (event.key === "ArrowLeft") {
                event.preventDefault();
                const next = (menuIndex() - 1 + local.menus.length) % local.menus.length;
                triggerRefs[next]?.focus();
                return;
              }

              if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openMenu(menuIndex());
              }
            }}
          >
            <span>{menu.label}</span>
            <ChevronDown class="size-4" />
          </button>
        )}
      </For>

      <Show when={activeMenu() !== undefined}>
        <Portal>
          <div
            ref={menuRef}
            id={menuId}
            role="menu"
            tabIndex={-1}
            style={style()}
            class="ui-popover z-50 w-72 max-w-[calc(100vw-2rem)] p-2 focus:outline-none"
          >
            <For each={local.menus[activeMenu() ?? 0]?.items ?? []}>
              {(item, itemIndex) => (
                <button
                  type="button"
                  role={item.role ?? "menuitem"}
                  aria-checked={item.role && item.role !== "menuitem" ? item.checked : undefined}
                  disabled={item.disabled}
                  class={cn(
                    "flex w-full items-center justify-between gap-4 rounded-lg px-3.5 py-3 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35",
                    item.tone === "danger" ? "text-destructive hover:bg-destructive/10" : "text-foreground hover:bg-accent",
                    item.disabled && "cursor-not-allowed opacity-50",
                  )}
                  onClick={() => {
                    local.onItemSelect?.(activeMenu() ?? 0, itemIndex());
                    setActiveMenu(undefined);
                  }}
                >
                  <span class="flex items-center gap-3">
                    <Show when={item.role && item.role !== "menuitem"}>
                      <span class="inline-flex size-4 items-center justify-center rounded-sm border border-border/70 bg-background">
                        <Show when={item.checked}>
                          <Check class="size-3 text-primary" />
                        </Show>
                      </span>
                    </Show>
                    <span>{item.label}</span>
                  </span>
                  <Show when={item.shortcut}>
                    <span class="text-xs uppercase tracking-[0.16em] text-muted-foreground">{item.shortcut}</span>
                  </Show>
                </button>
              )}
            </For>
          </div>
        </Portal>
      </Show>
    </div>
  );
}
