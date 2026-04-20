import { Portal } from "solid-js/web";
import { For, Show, createEffect, createSignal, createUniqueId, mergeProps, onCleanup, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { Check } from "lucide-solid";
import { cn } from "~/lib/cn";

export type ContextMenuItem = {
  checked?: boolean;
  disabled?: boolean;
  label: JSX.Element;
  role?: "menuitem" | "menuitemcheckbox" | "menuitemradio";
  shortcut?: string;
  tone?: "default" | "danger";
};

export type ContextMenuProps = Omit<JSX.HTMLAttributes<HTMLDivElement>, "children" | "ref"> & {
  areaLabel?: JSX.Element;
  children?: JSX.Element;
  class?: string;
  items?: ContextMenuItem[];
  onItemSelect?: (item: ContextMenuItem, index: number) => void;
};

const defaultItems: ContextMenuItem[] = [
  { label: "Open detail panel", shortcut: "↵" },
  { label: "Mark as priority", role: "menuitemcheckbox", checked: true, shortcut: "P" },
  { label: "Copy record ID", shortcut: "C" },
  { label: "Delete record", tone: "danger", shortcut: "⌘⌫" },
];

function getMenuItems(container: HTMLElement | undefined) {
  if (!container) return [];

  return Array.from(container.querySelectorAll<HTMLButtonElement>('[role="menuitem"],[role="menuitemcheckbox"],[role="menuitemradio"]')).filter(
    item => !item.disabled,
  );
}

export function ContextMenu(userProps: ContextMenuProps) {
  const props = mergeProps(
    {
      areaLabel: "Right-click surface",
      items: defaultItems,
    },
    userProps,
  );

  const [local, others] = splitProps(props, ["areaLabel", "children", "class", "items", "onItemSelect"]);
  const menuId = createUniqueId();
  const [open, setOpen] = createSignal(false);
  const [style, setStyle] = createSignal<Record<string, string>>({});
  let menuRef: HTMLDivElement | undefined;

  createEffect(() => {
    if (!open()) return;

    queueMicrotask(() => getMenuItems(menuRef)[0]?.focus());

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (menuRef?.contains(target)) return;
      setOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const items = getMenuItems(menuRef);
      const current = document.activeElement as HTMLButtonElement | null;
      const index = items.findIndex(item => item === current);

      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
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

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    onCleanup(() => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    });
  });

  return (
    <div
      class="inline-flex w-full"
      onContextMenu={event => {
        event.preventDefault();
        setStyle({
          left: `${Math.round(event.clientX)}px`,
          position: "fixed",
          top: `${Math.round(event.clientY)}px`,
        });
        setOpen(true);
      }}
      {...others}
    >
      <div class="w-full rounded-[1.45rem] border border-dashed border-border/70 bg-panel p-5 text-sm text-muted">
        <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">{local.areaLabel}</div>
        <div class="mt-3">
          {local.children ?? (
            <p class="leading-6">
              Right-click or long-press this card to open contextual actions without moving to a separate toolbar.
            </p>
          )}
        </div>
      </div>

      <Show when={open()}>
        <Portal>
          <div
            ref={menuRef}
            id={menuId}
            role="menu"
            tabIndex={-1}
            style={style()}
            class={cn("z-50 min-w-64 rounded-[1.3rem] border border-border/70 bg-panel p-2 shadow-soft focus:outline-none", local.class)}
          >
            <For each={local.items}>
              {(item, index) => (
                <button
                  type="button"
                  role={item.role ?? "menuitem"}
                  aria-checked={item.role && item.role !== "menuitem" ? item.checked : undefined}
                  disabled={item.disabled}
                  class={cn(
                    "flex w-full items-center justify-between gap-4 rounded-[1rem] px-3.5 py-3 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35",
                    item.tone === "danger"
                      ? "text-rose-300 hover:bg-rose-500/10"
                      : "text-foreground hover:bg-background",
                    item.disabled && "cursor-not-allowed opacity-50",
                  )}
                  onClick={() => {
                    local.onItemSelect?.(item, index());
                    setOpen(false);
                  }}
                >
                  <span class="flex items-center gap-3">
                    <Show when={item.role && item.role !== "menuitem"}>
                      <span class="inline-flex size-4 items-center justify-center rounded-sm border border-border/70 bg-background">
                        <Show when={item.checked}>
                          <Check class="size-3 text-accent-strong" />
                        </Show>
                      </span>
                    </Show>
                    <span>{item.label}</span>
                  </span>
                  <Show when={item.shortcut}>
                    <span class="text-xs uppercase tracking-[0.16em] text-muted">{item.shortcut}</span>
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
