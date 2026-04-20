import { For, Show, createMemo, createSignal, createUniqueId, mergeProps, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { ChevronDown } from "lucide-solid";
import { cn } from "~/lib/cn";

export type AccordionItem = {
  content: JSX.Element;
  description?: JSX.Element;
  disabled?: boolean;
  title: JSX.Element;
  value: string;
};

export type AccordionProps = Omit<JSX.HTMLAttributes<HTMLDivElement>, "children" | "ref"> & {
  allowCollapse?: boolean;
  class?: string;
  defaultValue?: string | string[];
  items?: AccordionItem[];
  multiple?: boolean;
  onValueChange?: (value: string | string[] | undefined) => void;
  value?: string | string[];
};

const defaultItems: AccordionItem[] = [
  {
    value: "governance",
    title: "Publishing governance",
    description: "Who can approve and ship content.",
    content: (
      <p class="text-sm leading-6 text-muted">
        Approval logic is explicit, with reviewer roles, escalation rules, and a visible audit trail for every change.
      </p>
    ),
  },
  {
    value: "access",
    title: "Access policy",
    description: "Workspace and role boundaries.",
    content: (
      <p class="text-sm leading-6 text-muted">
        Access is partitioned by workspace and role. Sensitive workflows add an extra confirmation step and stronger
        logging.
      </p>
    ),
  },
  {
    value: "retention",
    title: "Retention defaults",
    description: "Record lifetime and archival policy.",
    content: (
      <p class="text-sm leading-6 text-muted">
        Retention windows stay configurable but visible, so operators understand what is auto-archived and when.
      </p>
    ),
  },
];

function normalizeValue(multiple: boolean, value: string | string[] | undefined) {
  if (multiple) {
    if (Array.isArray(value)) return value;
    return value ? [value] : [];
  }

  if (Array.isArray(value)) {
    return value.length ? [value[0]] : [];
  }

  return value ? [value] : [];
}

export function Accordion(userProps: AccordionProps) {
  const props = mergeProps(
    {
      allowCollapse: true,
      defaultValue: defaultItems[0]?.value,
      items: defaultItems,
      multiple: false,
    },
    userProps,
  );

  const [local, others] = splitProps(props, [
    "allowCollapse",
    "class",
    "defaultValue",
    "items",
    "multiple",
    "onValueChange",
    "value",
  ]);

  const rootId = createUniqueId();
  const [internalValue, setInternalValue] = createSignal<string | string[] | undefined>(local.defaultValue);
  const triggerRefs: HTMLButtonElement[] = [];
  const expandedValues = createMemo(() => normalizeValue(local.multiple, local.value ?? internalValue()));

  const commit = (next: string[]) => {
    const finalValue = local.multiple ? next : next[0];

    if (local.value === undefined) {
      setInternalValue(local.multiple ? next : finalValue);
    }

    local.onValueChange?.(local.multiple ? next : finalValue);
  };

  const toggle = (value: string) => {
    const current = expandedValues();

    if (local.multiple) {
      commit(current.includes(value) ? current.filter(item => item !== value) : [...current, value]);
      return;
    }

    if (current[0] === value) {
      commit(local.allowCollapse ? [] : current);
      return;
    }

    commit([value]);
  };

  const moveFocus = (currentValue: string, direction: 1 | -1 | "start" | "end") => {
    const enabled = local.items.filter(item => !item.disabled);

    if (!enabled.length) {
      return;
    }

    const index = enabled.findIndex(item => item.value === currentValue);
    let target = enabled[0];

    if (direction === "start") {
      target = enabled[0];
    } else if (direction === "end") {
      target = enabled.at(-1) ?? enabled[0];
    } else {
      const nextIndex = ((index === -1 ? 0 : index) + direction + enabled.length) % enabled.length;
      target = enabled[nextIndex] ?? enabled[0];
    }

    triggerRefs.find(button => button.dataset.value === target.value)?.focus();
  };

  return (
    <div class={cn("space-y-3", local.class)} {...others}>
      <For each={local.items}>
        {item => {
          const expanded = () => expandedValues().includes(item.value);
          const triggerId = `${rootId}-trigger-${item.value}`;
          const panelId = `${rootId}-panel-${item.value}`;

          return (
            <section class="overflow-hidden rounded-[1.45rem] border border-border/70 bg-panel shadow-soft">
              <h3>
                <button
                  ref={element => {
                    triggerRefs.push(element);
                  }}
                  id={triggerId}
                  type="button"
                  data-value={item.value}
                  aria-controls={panelId}
                  aria-expanded={expanded()}
                  disabled={item.disabled}
                  class={cn(
                    "flex w-full items-start justify-between gap-4 px-5 py-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35",
                    expanded() ? "bg-background" : "hover:bg-background/60",
                    item.disabled && "cursor-not-allowed opacity-50",
                  )}
                  onClick={() => {
                    if (!item.disabled) toggle(item.value);
                  }}
                  onKeyDown={event => {
                    if (event.key === "ArrowDown") {
                      event.preventDefault();
                      moveFocus(item.value, 1);
                      return;
                    }

                    if (event.key === "ArrowUp") {
                      event.preventDefault();
                      moveFocus(item.value, -1);
                      return;
                    }

                    if (event.key === "Home") {
                      event.preventDefault();
                      moveFocus(item.value, "start");
                      return;
                    }

                    if (event.key === "End") {
                      event.preventDefault();
                      moveFocus(item.value, "end");
                    }
                  }}
                >
                  <div class="min-w-0">
                    <div class="font-semibold tracking-[-0.01em] text-foreground">{item.title}</div>
                    <Show when={item.description}>
                      <div class="mt-1 text-sm leading-6 text-muted">{item.description}</div>
                    </Show>
                  </div>
                  <ChevronDown class={cn("mt-0.5 size-5 shrink-0 text-muted transition", expanded() && "rotate-180 text-foreground")} />
                </button>
              </h3>
              <Show when={expanded()}>
                <div id={panelId} role="region" aria-labelledby={triggerId} class="border-t border-border/70 bg-panel px-5 py-4">
                  {item.content}
                </div>
              </Show>
            </section>
          );
        }}
      </For>
    </div>
  );
}
