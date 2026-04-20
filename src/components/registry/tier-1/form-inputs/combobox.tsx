import { Check, ChevronDown, CircleX, LoaderCircle } from "lucide-solid";
import { For, Show, createMemo, createSignal, mergeProps, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { cn } from "~/lib/cn";
import { FieldCopy, FieldFrame, createFieldAria, fieldControlVariants, type FieldRadius, type FieldSize } from "~/components/registry/tier-1/form-inputs/field";

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
  const aria = createFieldAria({
    description: local.description,
    errorMessage: local.errorMessage,
    id: local.id,
    invalid: local.invalid,
  });

  const inputValue = createMemo(() => local.inputValue ?? internalInputValue());
  const selectedValue = createMemo(() => local.selectedValue ?? internalSelectedValue());
  const listboxId = `${aria.inputId}-listbox`;

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

  return (
    <FieldCopy
      label={local.label}
      labelFor={aria.inputId}
      description={local.description && <span id={aria.descriptionId}>{local.description}</span>}
      invalid={local.invalid}
      errorMessage={local.errorMessage && <span id={aria.errorId}>{local.errorMessage}</span>}
      required={local.required}
      class={local.class}
    >
      <div class="relative">
        <FieldFrame
          size={local.size}
          radius={local.radius}
          invalid={local.invalid}
          disabled={others.disabled}
          readOnly={others.readOnly}
          class="pr-2"
        >
          <input
            id={aria.inputId}
            role="combobox"
            aria-autocomplete="list"
            aria-controls={open() ? listboxId : undefined}
            aria-expanded={open()}
            aria-describedby={aria.describedBy}
            aria-activedescendant={open() ? `${listboxId}-option-${highlightedIndex()}` : undefined}
            aria-invalid={local.invalid ? true : undefined}
            class={fieldControlVariants({ size: local.size })}
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
              class="inline-flex size-8 items-center justify-center rounded-full text-muted transition hover:bg-panel hover:text-foreground"
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

          <Show when={local.loading} fallback={<ChevronDown class="mr-1 size-4 shrink-0 text-muted" />}>
            <LoaderCircle class="mr-1 size-4 shrink-0 animate-spin text-muted" />
          </Show>
        </FieldFrame>

        <Show when={open()}>
          <div class="absolute inset-x-0 top-[calc(100%+0.6rem)] z-20 overflow-hidden rounded-[1.3rem] border border-border/70 bg-panel shadow-soft">
            <div role="listbox" id={listboxId} class="max-h-72 overflow-auto p-2">
              <Show
                when={filteredOptions().length}
                fallback={<div class="rounded-[1rem] px-3 py-3 text-sm text-muted">{local.emptyMessage}</div>}
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
                        "flex w-full items-start justify-between gap-3 rounded-[1rem] px-3 py-3 text-left transition",
                        highlightedIndex() === index()
                          ? "bg-background text-foreground"
                          : "text-muted hover:bg-background hover:text-foreground",
                      )}
                      onMouseEnter={() => setHighlightedIndex(index())}
                      onMouseDown={event => event.preventDefault()}
                      onClick={() => choose(option.value)}
                    >
                      <span class="min-w-0">
                        <span class="block text-sm font-semibold text-current">{option.label}</span>
                        <Show when={option.description}>
                          <span class="mt-1 block text-sm leading-6 text-muted">{option.description}</span>
                        </Show>
                      </span>
                      <Check class={cn("size-4 shrink-0 text-accent-strong", selectedValue() === option.value ? "opacity-100" : "opacity-0")} />
                    </button>
                  )}
                </For>
              </Show>
            </div>
          </div>
        </Show>
      </div>
    </FieldCopy>
  );
}
