import { CalendarDays } from "lucide-solid";
import { Show, createEffect, createMemo, createSignal, createUniqueId, mergeProps, onCleanup, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { Portal } from "solid-js/web";
import { cn } from "~/lib/cn";
import { Calendar } from "~/components/registry/form-inputs/calendar";
import { formatDate, type CalendarValue } from "~/components/registry/form-inputs/calendar-utils";

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

type DatePickerMode = "single" | "range";

export type DatePickerProps = Omit<JSX.InputHTMLAttributes<HTMLInputElement>, "value" | "defaultValue" | "size"> & {
  class?: string;
  defaultOpen?: boolean;
  defaultValue?: CalendarValue;
  description?: JSX.Element;
  errorMessage?: JSX.Element;
  invalid?: boolean;
  label?: JSX.Element;
  mode?: DatePickerMode;
  onOpenChange?: (open: boolean) => void;
  onValueChange?: (value: CalendarValue) => void;
  radius?: FieldRadius;
  size?: FieldSize;
  value?: CalendarValue;
};

function formatDisplay(value: CalendarValue) {
  if (Array.isArray(value)) {
    return `${formatDate(value[0]) || "Start"} - ${formatDate(value[1]) || "End"}`;
  }

  return formatDate(value as Date | undefined);
}

export function DatePicker(userProps: DatePickerProps) {
  const props = mergeProps(
    {
      defaultOpen: false,
      defaultValue: undefined,
      invalid: false,
      mode: "single" as const,
      radius: "lg" as const,
      size: "md" as const,
    },
    userProps,
  );

  const [local, others] = splitProps(props, [
    "class",
    "defaultOpen",
    "defaultValue",
    "description",
    "errorMessage",
    "id",
    "invalid",
    "label",
    "mode",
    "onOpenChange",
    "onValueChange",
    "radius",
    "required",
    "size",
    "value",
  ]);

  const [internalValue, setInternalValue] = createSignal<CalendarValue>(local.defaultValue);
  const [open, setOpen] = createSignal(local.defaultOpen);
  const [panelStyle, setPanelStyle] = createSignal<Record<string, string>>({});
  const currentValue = createMemo(() => local.value ?? internalValue());
  const baseId = local.id ?? createUniqueId();
  const descriptionId = `${baseId}-description`;
  const errorId = `${baseId}-error`;
  const describedBy = [local.description ? descriptionId : undefined, local.invalid && local.errorMessage ? errorId : undefined]
    .filter(Boolean)
    .join(" ") || undefined;
  let rootRef: HTMLDivElement | undefined;
  let panelRef: HTMLDivElement | undefined;

  const setOpenState = (next: boolean) => {
    setOpen(next);
    local.onOpenChange?.(next);
  };

  const commit = (next: CalendarValue) => {
    if (local.value === undefined) {
      setInternalValue(next);
    }

    local.onValueChange?.(next);

    if (local.mode === "single" || (Array.isArray(next) && next[0] && next[1])) {
      setOpenState(false);
    }
  };

  if (typeof document !== "undefined") {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      const insideRoot = rootRef?.contains(target) ?? false;
      const insidePanel = panelRef?.contains(target) ?? false;
      if (!insideRoot && !insidePanel) {
        setOpenState(false);
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
    const width = Math.max(rect.width, 320);
    const resolvedWidth = Math.min(width, 420);
    const left = Math.max(12, Math.min(rect.left, window.innerWidth - resolvedWidth - 12));
    const maxHeight = Math.max(240, window.innerHeight - rect.bottom - 16);

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
        >
          <input
            id={baseId}
            readOnly
            value={formatDisplay(currentValue())}
            placeholder={local.mode === "range" ? "Choose a date range" : "Choose a date"}
            class={cn(
              "ui-field-input disabled:cursor-not-allowed",
              controlSizeClasses[local.size],
            )}
            aria-describedby={describedBy}
            aria-invalid={local.invalid ? true : undefined}
            {...others}
          />
          <button
            type="button"
            class="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground"
            aria-label="Toggle date picker"
            onClick={() => setOpenState(!open())}
          >
            <CalendarDays class="size-4" />
          </button>
        </div>

        <Show when={open()}>
          <Portal>
            <div ref={panelRef} style={panelStyle()}>
              <Calendar
                label={local.mode === "range" ? "Date range" : "Date"}
                mode={local.mode}
                value={currentValue()}
                onValueChange={commit}
                class={cn("ui-popover p-4")}
              />
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
