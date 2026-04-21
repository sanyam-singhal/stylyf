import { Check, ChevronDown, CircleX, LoaderCircle } from "lucide-solid";
import { For, Show, createEffect, createMemo, createSignal, createUniqueId, mergeProps, onCleanup, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { Portal } from "solid-js/web";
import { cn } from "~/lib/cn";

type FieldRadius = "md" | "lg" | "pill";
type FieldSize = "sm" | "md" | "lg";

const frameSizeClasses = {
  sm: "min-h-10 gap-2.5 px-3",
  md: "min-h-11 gap-3 px-3.5",
  lg: "min-h-13 gap-3.5 px-4.5",
} as const;

const frameRadiusClasses = {
  md: "rounded-lg",
  lg: "rounded-xl",
  pill: "rounded-full",
} as const;

const controlSizeClasses = {
  sm: "text-sm",
  md: "text-sm",
  lg: "text-base",
} as const;

export type ComboboxOption = {
  description?: string;
  disabled?: boolean;
  label: string;
  value: string;
};

export type ComboboxProps = Omit<JSX.InputHTMLAttributes<HTMLInputElement>, "size" | "value" | "defaultValue" | "onInput"> & {
  class?: string;
  defaultInputValue?: string;
  defaultSelectedValue?: string;
  description?: JSX.Element;
  emptyMessage?: JSX.Element;
  errorMessage?: JSX.Element;
  inputValue?: string;
  invalid?: boolean;
  label?: JSX.Element;
  loading?: boolean;
  onInputValueChange?: (value: string) => void;
  onSelectedValueChange?: (value: string | undefined) => void;
  options?: ComboboxOption[];
  radius?: FieldRadius;
  size?: FieldSize;
  selectedValue?: string;
};

const defaultOptions: ComboboxOption[] = [
  { value: "syd", label: "Stylyf Design System", description: "Shared primitives and tokens" },
  { value: "ops", label: "Operations Hub", description: "Queues, inboxes, and escalations" },
  { value: "docs", label: "Docs Workspace", description: "Knowledge base authoring" },
  { value: "growth", label: "Growth Campaigns", description: "Experiments and landing pages" },
];

export function Combobox(userProps: ComboboxProps) {
  const props = mergeProps(
    {
      autoComplete: "off",
      defaultInputValue: "",
      defaultSelectedValue: undefined,
      emptyMessage: "No matching options.",
      invalid: false,
      loading: false,
      options: defaultOptions,
      radius: "lg" as const,
      size: "md" as const,
    },
    userProps,
  );

  const [local, others] = splitProps(props, [
    "class",
    "defaultInputValue",
    "defaultSelectedValue",
    "description",
    "emptyMessage",
    "errorMessage",
    "id",
    "inputValue",
    "invalid",
    "label",
    "loading",
    "onFocus",
    "onInputValueChange",
    "onSelectedValueChange",
    "options",
    "radius",
    "required",
    "size",
    "selectedValue",
  ]);

  const [internalInputValue, setInternalInputValue] = createSignal(local.defaultInputValue);
  const [internalSelectedValue, setInternalSelectedValue] = createSignal<string | undefined>(local.defaultSelectedValue);
  const [open, setOpen] = createSignal(false);
  const [highlightedIndex, setHighlightedIndex] = createSignal(0);
  const [panelStyle, setPanelStyle] = createSignal<Record<string, string>>({});
  const baseId = local.id ?? createUniqueId();
  const descriptionId = `${baseId}-description`;
  const errorId = `${baseId}-error`;
  const describedBy = [local.description ? descriptionId : undefined, local.invalid && local.errorMessage ? errorId : undefined]
    .filter(Boolean)
    .join(" ") || undefined;
  const inputValue = createMemo(() => local.inputValue ?? internalInputValue());
  const selectedValue = createMemo(() => local.selectedValue ?? internalSelectedValue());
  const listboxId = `${baseId}-listbox`;
  let rootRef: HTMLDivElement | undefined;
  let panelRef: HTMLDivElement | undefined;

  const filteredOptions = createMemo(() => {
    const query = inputValue().trim().toLowerCase();

    if (!query) {
      return local.options;
    }

    return local.options.filter(option => [option.label, option.description ?? ""].join(" ").toLowerCase().includes(query));
  });

  const commitInput = (next: string) => {
    if (local.inputValue === undefined) {
      setInternalInputValue(next);
    }

    local.onInputValueChange?.(next);
  };

  const commitSelection = (value: string | undefined) => {
    if (local.selectedValue === undefined) {
      setInternalSelectedValue(value);
    }

    local.onSelectedValueChange?.(value);
  };

  const choose = (value: string) => {
    const option = local.options.find(entry => entry.value === value);
    if (!option) return;
    commitSelection(value);
    commitInput(option.label);
    setOpen(false);
  };

  if (typeof document !== "undefined") {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      const insideRoot = rootRef?.contains(target) ?? false;
      const insidePanel = panelRef?.contains(target) ?? false;
      if (!insideRoot && !insidePanel) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    onCleanup(() => document.removeEventListener("pointerdown", handlePointerDown));
  }

  const updatePanelPosition = () => {
    if (typeof window === "undefined" || !rootRef) {
      return;
    }

    const rect = rootRef.getBoundingClientRect();
    const width = Math.max(rect.width, 340);
    const resolvedWidth = Math.min(width, window.innerWidth - 24);
    const left = Math.max(12, Math.min(rect.left, window.innerWidth - resolvedWidth - 12));
    const maxHeight = Math.max(180, window.innerHeight - rect.bottom - 16);

    setPanelStyle({
      left: `${left}px`,
      top: `${rect.bottom + 8}px`,
      width: `${resolvedWidth}px`,
      "max-height": `${maxHeight}px`,
      position: "fixed",
      "z-index": "80",
    });
  };

  createEffect(() => {
    if (!open()) {
      return;
    }

    updatePanelPosition();

    if (typeof window === "undefined") {
      return;
    }

    const handleLayout = () => updatePanelPosition();
    window.addEventListener("resize", handleLayout);
    window.addEventListener("scroll", handleLayout, true);
    onCleanup(() => {
      window.removeEventListener("resize", handleLayout);
      window.removeEventListener("scroll", handleLayout, true);
    });
  });

  return (
    <div class={cn("space-y-2.5", local.class)}>
      <Show when={local.label}>
        <div class="ui-field-label-row">
          <label for={baseId} class="ui-field-label">
            {local.label}
          </label>
          <Show when={local.required}>
            <span class="ui-field-required">Required</span>
          </Show>
        </div>
      </Show>
      <div class="relative" ref={rootRef}>
        <div
          class={cn(
            "ui-field-shell",
            frameSizeClasses[local.size],
            frameRadiusClasses[local.radius],
            "pr-2",
          )}
          data-invalid={local.invalid ? "true" : undefined}
          data-disabled={others.disabled ? "true" : undefined}
          data-readonly={others.readOnly ? "true" : undefined}
        >
          <input
            id={baseId}
            role="combobox"
            aria-autocomplete="list"
            aria-controls={open() ? listboxId : undefined}
            aria-expanded={open()}
            aria-describedby={describedBy}
            aria-activedescendant={open() ? `${listboxId}-option-${highlightedIndex()}` : undefined}
            aria-invalid={local.invalid ? true : undefined}
            class={cn(
              "ui-field-input disabled:cursor-not-allowed",
              controlSizeClasses[local.size],
            )}
            value={inputValue()}
            onFocus={event => {
              const onFocus = local.onFocus as JSX.EventHandler<HTMLInputElement, FocusEvent> | undefined;
              onFocus?.(event);
              setOpen(true);
            }}
            onInput={event => {
              commitInput(event.currentTarget.value);
              setOpen(true);
              setHighlightedIndex(0);
            }}
            onKeyDown={event => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setOpen(true);
                setHighlightedIndex(index => Math.min(index + 1, Math.max(filteredOptions().length - 1, 0)));
              }

              if (event.key === "ArrowUp") {
                event.preventDefault();
                setOpen(true);
                setHighlightedIndex(index => Math.max(index - 1, 0));
              }

              if (event.key === "Enter" && open() && filteredOptions()[highlightedIndex()]) {
                event.preventDefault();
                choose(filteredOptions()[highlightedIndex()]!.value);
              }

              if (event.key === "Escape") {
                setOpen(false);
              }
            }}
            {...others}
          />

          <Show when={inputValue().length > 0}>
            <button
              type="button"
              class="ui-control-button size-8 shrink-0"
              onClick={() => {
                commitInput("");
                commitSelection(undefined);
                setOpen(false);
              }}
              aria-label="Clear combobox"
            >
              <CircleX class="size-4" />
            </button>
          </Show>

          <Show when={local.loading} fallback={<ChevronDown class="mr-1 size-4 shrink-0 text-muted-foreground" />}>
            <LoaderCircle class="mr-1 size-4 shrink-0 animate-spin text-muted-foreground" />
          </Show>
        </div>

        <Show when={open()}>
          <Portal>
            <div ref={panelRef} class="ui-popover overflow-hidden p-2" style={panelStyle()}>
              <div role="listbox" id={listboxId} class="max-h-72 overflow-auto">
                <Show
                  when={filteredOptions().length}
                  fallback={<div class="rounded-[var(--radius-lg)] px-3 py-3 text-sm text-muted-foreground">{local.emptyMessage}</div>}
                >
                  <For each={filteredOptions()}>
                    {(option, index) => (
                      <button
                        id={`${listboxId}-option-${index()}`}
                        type="button"
                        role="option"
                        aria-selected={selectedValue() === option.value}
                        disabled={option.disabled}
                        class={cn(
                          "flex w-full items-start justify-between gap-3 rounded-[var(--radius-lg)] px-3 py-3 text-left transition",
                          highlightedIndex() === index()
                            ? "bg-accent text-foreground"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground",
                        )}
                        onMouseEnter={() => setHighlightedIndex(index())}
                        onMouseDown={event => event.preventDefault()}
                        onClick={() => choose(option.value)}
                      >
                        <span class="min-w-0">
                          <span class="block text-sm font-semibold text-current">{option.label}</span>
                          <Show when={option.description}>
                            <span class="ui-field-description mt-1 block">{option.description}</span>
                          </Show>
                        </span>
                        <Check class={cn("size-4 shrink-0 text-primary", selectedValue() === option.value ? "opacity-100" : "opacity-0")} />
                      </button>
                    )}
                  </For>
                </Show>
              </div>
            </div>
          </Portal>
        </Show>
      </div>
      <Show when={local.description}>
        <div id={descriptionId} class="ui-field-description">
          {local.description}
        </div>
      </Show>
      <Show when={local.invalid && local.errorMessage}>
        <div id={errorId} class="ui-field-error">
          {local.errorMessage}
        </div>
      </Show>
    </div>
  );
}
