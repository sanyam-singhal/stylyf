import { Portal } from "solid-js/web";
import { For, Show, createEffect, createMemo, createSignal, mergeProps, onCleanup, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { Command, Search } from "lucide-solid";
import { Button } from "~/components/registry/actions-navigation/button";
import { cn } from "~/lib/cn";

export type CommandItem = {
  description?: string;
  keywords?: string[];
  label: string;
  shortcut?: string;
};

export type CommandGroup = {
  items: CommandItem[];
  label: string;
};

export type CommandMenuProps = Omit<JSX.HTMLAttributes<HTMLDivElement>, "children" | "ref"> & {
  class?: string;
  defaultOpen?: boolean;
  groups?: CommandGroup[];
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  title?: JSX.Element;
  triggerLabel?: JSX.Element;
};

const defaultGroups: CommandGroup[] = [
  {
    label: "Navigation",
    items: [
      { label: "Open billing settings", description: "Jump to plans, invoices, and cards", shortcut: "B", keywords: ["billing", "plan"] },
      { label: "Go to members directory", description: "Manage roles and seat allocation", shortcut: "M", keywords: ["members", "team"] },
    ],
  },
  {
    label: "Actions",
    items: [
      { label: "Create project", description: "Start a new workspace flow", shortcut: "P", keywords: ["project", "create"] },
      { label: "Invite teammate", description: "Open the team invite dialog", shortcut: "I", keywords: ["invite", "member"] },
    ],
  },
];

type FlatItem = CommandItem & { groupLabel: string };

export function CommandMenu(userProps: CommandMenuProps) {
  const props = mergeProps(
    {
      defaultOpen: false,
      groups: defaultGroups,
      title: "Command palette",
      triggerLabel: "Open command menu",
    },
    userProps,
  );

  const [local, others] = splitProps(props, ["class", "defaultOpen", "groups", "onOpenChange", "open", "title", "triggerLabel"]);
  const [internalOpen, setInternalOpen] = createSignal(Boolean(local.defaultOpen));
  const [query, setQuery] = createSignal("");
  const [activeIndex, setActiveIndex] = createSignal(0);
  let inputRef: HTMLInputElement | undefined;
  let panelRef: HTMLDivElement | undefined;

  const isOpen = () => (local.open !== undefined ? local.open : internalOpen());
  const setOpen = (next: boolean) => {
    if (local.open === undefined) {
      setInternalOpen(next);
    }

    local.onOpenChange?.(next);
  };

  const filteredGroups = createMemo(() => {
    const normalized = query().trim().toLowerCase();

    if (!normalized) {
      return local.groups;
    }

    return local.groups
      .map(group => ({
        ...group,
        items: group.items.filter(item =>
          [item.label, item.description ?? "", ...(item.keywords ?? [])].join(" ").toLowerCase().includes(normalized),
        ),
      }))
      .filter(group => group.items.length);
  });

  const flatItems = createMemo<FlatItem[]>(() =>
    filteredGroups().flatMap(group => group.items.map(item => ({ ...item, groupLabel: group.label }))),
  );

  createEffect(() => {
    if (activeIndex() >= flatItems().length) {
      setActiveIndex(0);
    }
  });

  createEffect(() => {
    if (!isOpen()) return;

    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
    document.body.style.overflow = "hidden";
    setActiveIndex(0);
    queueMicrotask(() => inputRef?.focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }

      if (!flatItems().length) return;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex(index => (index + 1) % flatItems().length);
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex(index => (index - 1 + flatItems().length) % flatItems().length);
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    onCleanup(() => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    });
  });

  return (
    <div class="inline-flex" {...others}>
      <Button intent="neutral" tone="outline" leftIcon={<Command />} onClick={() => setOpen(true)}>
        {local.triggerLabel}
      </Button>

      <Show when={isOpen()}>
        <Portal>
          <div class="fixed inset-0 z-50 px-4 py-6 sm:px-6 sm:py-10">
            <div aria-hidden="true" class="ui-overlay absolute inset-0" onClick={() => setOpen(false)} />
            <div ref={panelRef} role="dialog" aria-modal="true" class="ui-popover relative z-10 mx-auto flex w-full max-w-2xl flex-col overflow-hidden">
              <div class="border-b border-border/70 px-5 py-4">
                <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Keyboard-first surface</div>
                <h3 class="mt-2 text-xl font-semibold tracking-tight text-foreground">{local.title}</h3>
              </div>

              <div class="border-b border-border/70 px-5 py-4">
                <label class="ui-demo-inset flex items-center gap-3">
                  <Search class="size-4.5 text-muted-foreground" />
                  <input
                    ref={inputRef}
                    value={query()}
                    onInput={event => setQuery(event.currentTarget.value)}
                    placeholder="Search pages, settings, and actions"
                    class="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                  />
                </label>
              </div>

              <div class="max-h-[28rem] overflow-auto p-3">
                <Show
                  when={filteredGroups().length}
                  fallback={
                    <div class="ui-demo-inset border-dashed text-sm leading-6 text-muted-foreground">
                      No commands match the current query.
                    </div>
                  }
                >
                  <For each={filteredGroups()}>
                    {group => (
                      <section class="ui-demo-inset mb-3 p-2 last:mb-0">
                        <div class="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">{group.label}</div>
                        <div class="space-y-1">
                          <For each={group.items}>
                            {item => {
                              const flatIndex = () =>
                                flatItems().findIndex(candidate => candidate.label === item.label && candidate.groupLabel === group.label);

                              return (
                                <button
                                  type="button"
                                  class={cn(
                                    "flex w-full items-center justify-between gap-4 rounded-lg px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35",
                                    activeIndex() === flatIndex() ? "bg-primary text-primary-foreground shadow-soft" : "hover:bg-accent",
                                  )}
                                  onMouseEnter={() => setActiveIndex(flatIndex())}
                                  onClick={() => setOpen(false)}
                                >
                                  <span class="min-w-0">
                                    <span class="block font-medium">{item.label}</span>
                                    <Show when={item.description}>
                                      <span
                                        class={cn(
                                          "mt-1 block text-sm",
                                          activeIndex() === flatIndex() ? "text-primary-foreground/78" : "text-muted-foreground",
                                        )}
                                      >
                                        {item.description}
                                      </span>
                                    </Show>
                                  </span>
                                  <Show when={item.shortcut}>
                                    <span
                                      class={cn(
                                        "shrink-0 rounded-full px-2 py-1 text-[11px] uppercase tracking-[0.16em]",
                                        activeIndex() === flatIndex()
                                          ? "bg-primary-foreground/14 text-primary-foreground"
                                          : "bg-accent text-accent-foreground",
                                      )}
                                    >
                                      {item.shortcut}
                                    </span>
                                  </Show>
                                </button>
                              );
                            }}
                          </For>
                        </div>
                      </section>
                    )}
                  </For>
                </Show>
              </div>
            </div>
          </div>
        </Portal>
      </Show>
    </div>
  );
}
