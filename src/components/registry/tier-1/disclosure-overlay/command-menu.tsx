import { Portal } from "solid-js/web";
import { For, Show, createEffect, createMemo, createSignal, mergeProps, onCleanup, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { Command, Search } from "lucide-solid";
import { Button } from "~/components/registry/tier-1/actions-navigation/button";
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
    if (!isOpen()) return;

    const previousOverflow = document.body.style.overflow;
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
            <div aria-hidden="true" class="absolute inset-0 bg-ink/60 backdrop-blur-[2px]" onClick={() => setOpen(false)} />
            <div class="relative mx-auto flex w-full max-w-2xl flex-col overflow-hidden rounded-[1.8rem] border border-border/70 bg-panel shadow-soft">
              <div class="border-b border-border/70 px-5 py-4">
                <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">Keyboard-first surface</div>
                <h3 class="mt-2 text-xl font-semibold tracking-tight text-foreground">{local.title}</h3>
              </div>

              <div class="border-b border-border/70 px-5 py-4">
                <label class="flex items-center gap-3 rounded-[1.2rem] border border-border/70 bg-background px-4 py-3">
                  <Search class="size-4.5 text-muted" />
                  <input
                    ref={inputRef}
                    value={query()}
                    onInput={event => setQuery(event.currentTarget.value)}
                    placeholder="Search pages, settings, and actions"
                    class="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
                  />
                </label>
              </div>

              <div class="max-h-[28rem] overflow-auto p-3">
                <Show
                  when={filteredGroups().length}
                  fallback={
                    <div class="rounded-[1.2rem] border border-dashed border-border/70 bg-background p-5 text-sm leading-6 text-muted">
                      No commands match the current query.
                    </div>
                  }
                >
                  <For each={filteredGroups()}>
                    {group => (
                      <section class="mb-3 rounded-[1.25rem] border border-border/70 bg-background p-2 last:mb-0">
                        <div class="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">{group.label}</div>
                        <div class="space-y-1">
                          <For each={group.items}>
                            {item => {
                              const flatIndex = () =>
                                flatItems().findIndex(candidate => candidate.label === item.label && candidate.groupLabel === group.label);

                              return (
                                <button
                                  type="button"
                                  class={cn(
                                    "flex w-full items-center justify-between gap-4 rounded-[1rem] px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35",
                                    activeIndex() === flatIndex() ? "bg-foreground text-background shadow-soft" : "hover:bg-panel",
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
                                          activeIndex() === flatIndex() ? "text-background/72" : "text-muted",
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
                                          ? "bg-background/16 text-background"
                                          : "bg-accent/10 text-accent-strong",
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
