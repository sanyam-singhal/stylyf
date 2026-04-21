import { Portal } from "solid-js/web";
import { For, Show, createEffect, createSignal, createUniqueId, mergeProps, onCleanup, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { Check, ChevronDown } from "lucide-solid";
import { Button } from "~/components/registry/actions-navigation/button";
import { cn } from "~/lib/cn";

export type DropdownMenuItem = {
  checked?: boolean;
  disabled?: boolean;
  label: JSX.Element;
  role?: "menuitem" | "menuitemcheckbox" | "menuitemradio";
  shortcut?: string;
  tone?: "default" | "danger";
};

export type DropdownMenuProps = Omit<JSX.HTMLAttributes<HTMLDivElement>, "children" | "ref"> & {
  class?: string;
  items?: DropdownMenuItem[];
  label?: JSX.Element;
  onItemSelect?: (item: DropdownMenuItem, index: number) => void;
};

const defaultItems: DropdownMenuItem[] = [
  { label: "Edit details", shortcut: "E" },
  { label: "Duplicate view", shortcut: "D" },
  { label: "Pin to workspace", role: "menuitemcheckbox", checked: true, shortcut: "P" },
  { label: "Archive workspace", tone: "danger", shortcut: "⌘⌫" },
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
  const menuHeight = menu?.offsetHeight ?? 240;
  const maxLeft = Math.max(16, window.innerWidth - menuWidth - 16);
  const maxTop = Math.max(16, window.innerHeight - menuHeight - 16);

  return {
    left: `${Math.min(Math.max(16, Math.round(rect.left)), maxLeft)}px`,
    position: "fixed",
    top: `${Math.min(Math.max(16, Math.round(rect.bottom + 10)), maxTop)}px`,
  };
}

export function DropdownMenu(userProps: DropdownMenuProps) {
  const props = mergeProps({ items: defaultItems, label: "Workspace menu" }, userProps);
  const [local, others] = splitProps(props, ["class", "items", "label", "onItemSelect"]);
  const menuId = createUniqueId();
  const [open, setOpen] = createSignal(false);
  const [style, setStyle] = createSignal<Record<string, string>>({});
  let triggerRef: HTMLButtonElement | undefined;
  let menuRef: HTMLDivElement | undefined;

  createEffect(() => {
    if (!open() || !triggerRef) return;

    const update = () => {
      if (!triggerRef) return;
      setStyle(getMenuPosition(triggerRef, menuRef));
    };

    const focusFirst = () => getMenuItems(menuRef)[0]?.focus();

    update();
    queueMicrotask(focusFirst);

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (triggerRef?.contains(target) || menuRef?.contains(target)) return;
      setOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const items = getMenuItems(menuRef);

      if (!items.length) {
        return;
      }

      const current = document.activeElement as HTMLButtonElement | null;
      const index = items.findIndex(item => item === current);

      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        triggerRef?.focus();
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

      if (event.key === "Home") {
        event.preventDefault();
        items[0]?.focus();
        return;
      }

      if (event.key === "End") {
        event.preventDefault();
        items.at(-1)?.focus();
      }
    };

    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    onCleanup(() => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    });
  });

  return (
    <div class="inline-flex" {...others}>
      <Button
        ref={triggerRef}
        intent="neutral"
        tone={open() ? "solid" : "outline"}
        aria-controls={menuId}
        aria-expanded={open()}
        aria-haspopup="menu"
        rightIcon={<ChevronDown class={cn("transition", open() && "rotate-180")} />}
        onClick={() => setOpen(!open())}
      >
        {local.label}
      </Button>

      <Show when={open()}>
        <Portal>
          <div
            ref={menuRef}
            id={menuId}
            role="menu"
            tabIndex={-1}
            style={style()}
            class={cn("ui-popover z-50 w-72 max-w-[calc(100vw-2rem)] p-2 focus:outline-none", local.class)}
          >
            <For each={local.items}>
              {(item, index) => (
                <button
                  type="button"
                  role={item.role ?? "menuitem"}
                  aria-checked={item.role && item.role !== "menuitem" ? item.checked : undefined}
                  disabled={item.disabled}
                  class={cn(
                    "flex w-full items-center justify-between gap-4 rounded-lg px-3.5 py-3 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35",
                    item.tone === "danger"
                      ? "text-destructive hover:bg-destructive/10"
                      : "text-foreground hover:bg-accent",
                    item.disabled && "cursor-not-allowed opacity-50",
                  )}
                  onClick={() => {
                    local.onItemSelect?.(item, index());
                    setOpen(false);
                    triggerRef?.focus();
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
