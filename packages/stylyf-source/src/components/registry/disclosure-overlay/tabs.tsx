import { For, Show, createMemo, createSignal, createUniqueId, mergeProps, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { cn } from "~/lib/cn";

export type TabsItem = {
  badge?: string;
  content: JSX.Element;
  description?: JSX.Element;
  disabled?: boolean;
  label: JSX.Element;
  value: string;
};

export type TabsProps = Omit<JSX.HTMLAttributes<HTMLDivElement>, "children" | "ref"> & {
  activation?: "automatic" | "manual";
  ariaLabel?: string;
  class?: string;
  defaultValue?: string;
  items?: TabsItem[];
  onValueChange?: (value: string) => void;
  orientation?: "horizontal" | "vertical";
  value?: string;
};

const defaultItems: TabsItem[] = [
  {
    value: "overview",
    label: "Overview",
    description: "Highlights",
    content: (
      <div class="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div class="ui-demo-inset">
          <div class="text-xs uppercase tracking-[0.2em] text-muted-foreground">Workspace summary</div>
          <div class="mt-3 text-lg font-semibold text-foreground">Content operating system</div>
          <p class="mt-2 text-sm leading-6 text-muted-foreground">
            Tabs keep sections parallel and quick to scan, with a clear active state and keyboard movement along the
            list.
          </p>
        </div>
        <div class="ui-card-muted">
          <div class="text-xs uppercase tracking-[0.2em] text-muted-foreground">Response SLA</div>
          <div class="mt-3 text-3xl font-semibold tracking-tight text-foreground">2h</div>
          <div class="mt-2 text-sm text-primary">Within target</div>
        </div>
      </div>
    ),
  },
  {
    value: "members",
    label: "Members",
    description: "Active seats",
    badge: "14",
    content: (
      <div class="grid gap-3">
        <div class="ui-demo-inset flex items-center justify-between">
          <div>
            <div class="font-medium text-foreground">Product design</div>
            <div class="text-sm text-muted-foreground">5 editors, 1 approver</div>
          </div>
          <div class="ui-chip ui-chip-muted">Healthy</div>
        </div>
        <div class="ui-demo-inset flex items-center justify-between">
          <div>
            <div class="font-medium text-foreground">Operations</div>
            <div class="text-sm text-muted-foreground">4 responders, 2 admins</div>
          </div>
          <div class="ui-chip ui-chip-accent">Scaled</div>
        </div>
      </div>
    ),
  },
  {
    value: "activity",
    label: "Activity",
    description: "Recent changes",
    content: (
      <div class="space-y-3">
        <div class="ui-demo-inset">
          <div class="text-sm font-medium text-foreground">Policy updated</div>
          <div class="mt-1 text-sm text-muted-foreground">Security controls were revised and published fifteen minutes ago.</div>
        </div>
        <div class="ui-demo-inset">
          <div class="text-sm font-medium text-foreground">Invite accepted</div>
          <div class="mt-1 text-sm text-muted-foreground">One pending workspace invite was accepted and provisioned.</div>
        </div>
      </div>
    ),
  },
];

export function Tabs(userProps: TabsProps) {
  const props = mergeProps(
    {
      activation: "automatic" as const,
      ariaLabel: "Tabs",
      defaultValue: defaultItems[0]?.value,
      items: defaultItems,
      orientation: "horizontal" as const,
    },
    userProps,
  );

  const [local, others] = splitProps(props, [
    "activation",
    "ariaLabel",
    "class",
    "defaultValue",
    "items",
    "onValueChange",
    "orientation",
    "value",
  ]);

  const tabListId = createUniqueId();
  const [internalValue, setInternalValue] = createSignal(local.defaultValue);
  const [focusedValue, setFocusedValue] = createSignal(local.value ?? local.defaultValue);
  const tabRefs: HTMLButtonElement[] = [];
  const enabledItems = createMemo(() => local.items.filter(item => !item.disabled));
  const currentValue = createMemo(() => local.value ?? internalValue() ?? enabledItems()[0]?.value);
  const activeItem = createMemo(() => local.items.find(item => item.value === currentValue()) ?? local.items[0]);

  const commit = (next: string) => {
    if (local.value === undefined) {
      setInternalValue(next);
    }

    setFocusedValue(next);
    local.onValueChange?.(next);
  };

  const moveFocus = (direction: 1 | -1 | "start" | "end") => {
    const items = enabledItems();

    if (!items.length) {
      return;
    }

    const active = focusedValue() ?? currentValue() ?? items[0].value;
    const index = items.findIndex(item => item.value === active);
    let target = items[0];

    if (direction === "start") {
      target = items[0];
    } else if (direction === "end") {
      target = items.at(-1) ?? items[0];
    } else {
      const nextIndex = ((index === -1 ? 0 : index) + direction + items.length) % items.length;
      target = items[nextIndex] ?? items[0];
    }

    setFocusedValue(target.value);
    tabRefs.find(tab => tab.dataset.value === target.value)?.focus();

    if (local.activation === "automatic") {
      commit(target.value);
    }
  };

  const activeTabId = () => `${tabListId}-tab-${activeItem()?.value ?? "panel"}`;
  const activePanelId = () => `${tabListId}-panel-${activeItem()?.value ?? "panel"}`;

  return (
    <div class={cn("ui-card p-2 sm:p-3", local.class)} {...others}>
      <div class={cn("grid gap-3", local.orientation === "vertical" && "lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-start")}>
        <div
          role="tablist"
          aria-label={local.ariaLabel}
          aria-orientation={local.orientation}
          class={cn(
            "grid gap-2 rounded-[var(--radius-lg)] border border-border/78 bg-[var(--muted-soft)] p-2",
            local.orientation === "horizontal" ? "sm:grid-cols-3" : "grid-cols-1 lg:sticky lg:top-28",
          )}
        >
          <For each={local.items}>
            {item => {
              const tabId = `${tabListId}-tab-${item.value}`;
              const panelId = `${tabListId}-panel-${item.value}`;
              const selected = () => currentValue() === item.value;

              return (
                <button
                  ref={element => {
                    tabRefs.push(element);
                  }}
                  id={tabId}
                  type="button"
                  role="tab"
                  data-value={item.value}
                  aria-controls={panelId}
                  aria-selected={selected()}
                  disabled={item.disabled}
                  tabIndex={selected() ? 0 : -1}
                  class={cn(
                    "rounded-[var(--radius-md)] border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35",
                    selected()
                      ? "border-primary/24 bg-primary text-primary-foreground shadow-xs"
                      : "border-border/70 bg-card text-foreground hover:border-primary/22 hover:bg-background",
                    item.disabled && "cursor-not-allowed opacity-50",
                  )}
                  onClick={() => {
                    if (!item.disabled) commit(item.value);
                  }}
                  onFocus={() => {
                    setFocusedValue(item.value);
                    if (local.activation === "automatic" && !item.disabled) {
                      commit(item.value);
                    }
                  }}
                  onKeyDown={event => {
                    const previousKey = local.orientation === "vertical" ? "ArrowUp" : "ArrowLeft";
                    const nextKey = local.orientation === "vertical" ? "ArrowDown" : "ArrowRight";

                    if (event.key === previousKey) {
                      event.preventDefault();
                      moveFocus(-1);
                      return;
                    }

                    if (event.key === nextKey) {
                      event.preventDefault();
                      moveFocus(1);
                      return;
                    }

                    if (event.key === "Home") {
                      event.preventDefault();
                      moveFocus("start");
                      return;
                    }

                    if (event.key === "End") {
                      event.preventDefault();
                      moveFocus("end");
                      return;
                    }

                    if (local.activation === "manual" && (event.key === "Enter" || event.key === " ")) {
                      event.preventDefault();
                      commit(item.value);
                    }
                  }}
                >
                  <div class="flex items-center justify-between gap-3">
                    <span class="font-medium">{item.label}</span>
                    <Show when={item.badge}>
                      <span
                        class={cn(
                          "rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.16em]",
                          selected() ? "bg-primary-foreground/14 text-primary-foreground" : "bg-accent text-accent-foreground",
                        )}
                      >
                        {item.badge}
                      </span>
                    </Show>
                  </div>
                  <Show when={item.description}>
                    <div class={cn("mt-1 text-xs", selected() ? "text-primary-foreground/78" : "text-muted-foreground")}>{item.description}</div>
                  </Show>
                </button>
              );
            }}
          </For>
        </div>

        <div
          id={activePanelId()}
          role="tabpanel"
          aria-labelledby={activeTabId()}
          tabIndex={0}
          class="min-h-[16rem] rounded-[var(--radius-lg)] border border-border/78 bg-background p-5 focus:outline-none"
        >
          {activeItem()?.content}
        </div>
      </div>
    </div>
  );
}
