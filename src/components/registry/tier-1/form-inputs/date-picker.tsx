import { CalendarDays } from "lucide-solid";
import { Show, createMemo, createSignal, mergeProps, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { cn } from "~/lib/cn";
import { Calendar } from "~/components/registry/tier-1/form-inputs/calendar";
import { formatDate, type CalendarValue } from "~/components/registry/tier-1/form-inputs/calendar-utils";
import { FieldCopy, FieldFrame, createFieldAria, fieldControlVariants, type FieldRadius, type FieldSize } from "~/components/registry/tier-1/form-inputs/field";

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
  const currentValue = createMemo(() => local.value ?? internalValue());
  const aria = createFieldAria({
    description: local.description,
    errorMessage: local.errorMessage,
    id: local.id,
    invalid: local.invalid,
  });

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
          readOnly
          class="pr-2"
        >
          <input
            id={aria.inputId}
            readOnly
            value={formatDisplay(currentValue())}
            placeholder={local.mode === "range" ? "Choose a date range" : "Choose a date"}
            class={fieldControlVariants({ size: local.size })}
            aria-describedby={aria.describedBy}
            aria-invalid={local.invalid ? true : undefined}
            {...others}
          />
          <button
            type="button"
            class="inline-flex size-8 items-center justify-center rounded-full text-muted transition hover:bg-panel hover:text-foreground"
            aria-label="Toggle date picker"
            onClick={() => setOpenState(!open())}
          >
            <CalendarDays class="size-4" />
          </button>
        </FieldFrame>

        <Show when={open()}>
          <div class="absolute left-0 top-[calc(100%+0.65rem)] z-20 w-full min-w-[20rem] max-w-[26rem]">
            <Calendar
              label={local.mode === "range" ? "Date range" : "Date"}
              mode={local.mode}
              value={currentValue()}
              onValueChange={commit}
              class={cn("rounded-[1.5rem] border border-border/70 bg-panel/96 p-4 shadow-soft backdrop-blur-sm")}
            />
          </div>
        </Show>
      </div>
    </FieldCopy>
  );
}
