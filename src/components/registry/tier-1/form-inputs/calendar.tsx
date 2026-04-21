import { ChevronLeft, ChevronRight } from "lucide-solid";
import { For, Show, createMemo, createSignal, createUniqueId, mergeProps, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { cn } from "~/lib/cn";
import { addMonths, formatDate, monthMatrix, sameDay, sameMonth, startOfDay, type CalendarValue } from "~/components/registry/tier-1/form-inputs/calendar-utils";

type SelectionMode = "single" | "range";

export type CalendarProps = Omit<JSX.HTMLAttributes<HTMLDivElement>, "onChange"> & {
  compact?: boolean;
  description?: JSX.Element;
  disabledDates?: Date[];
  errorMessage?: JSX.Element;
  invalid?: boolean;
  label?: JSX.Element;
  mode?: SelectionMode;
  onValueChange?: (value: CalendarValue) => void;
  showWeekNumbers?: boolean;
  value?: CalendarValue;
  defaultValue?: CalendarValue;
  defaultMonth?: Date;
};

function isDisabled(date: Date, disabledDates: Date[]) {
  return disabledDates.some(entry => sameDay(entry, date));
}

function containsRange(date: Date, value: CalendarValue) {
  if (!Array.isArray(value) || !value[0] || !value[1]) {
    return false;
  }

  const target = startOfDay(date).getTime();
  const start = startOfDay(value[0]).getTime();
  const end = startOfDay(value[1]).getTime();
  return target >= start && target <= end;
}

export function Calendar(userProps: CalendarProps) {
  const props = mergeProps(
    {
      compact: false,
      defaultMonth: new Date(),
      defaultValue: undefined,
      disabledDates: [] as Date[],
      invalid: false,
      mode: "single" as const,
      showWeekNumbers: false,
    },
    userProps,
  );

  const [local, others] = splitProps(props, [
    "class",
    "compact",
    "defaultMonth",
    "defaultValue",
    "description",
    "disabledDates",
    "errorMessage",
    "id",
    "invalid",
    "label",
    "mode",
    "onValueChange",
    "showWeekNumbers",
    "value",
  ]);

  const [internalValue, setInternalValue] = createSignal<CalendarValue>(local.defaultValue);
  const [month, setMonth] = createSignal(startOfDay(local.defaultMonth));
  const currentValue = createMemo(() => local.value ?? internalValue());
  const currentRange = createMemo<[Date | undefined, Date | undefined] | undefined>(() => {
    const value = currentValue();
    return Array.isArray(value) ? value : undefined;
  });
  const weeks = createMemo(() => monthMatrix(month()));
  const baseId = local.id ?? createUniqueId();
  const descriptionId = `${baseId}-description`;
  const errorId = `${baseId}-error`;
  const describedBy = [local.description ? descriptionId : undefined, local.invalid && local.errorMessage ? errorId : undefined]
    .filter(Boolean)
    .join(" ") || undefined;

  const commit = (next: CalendarValue) => {
    if (local.value === undefined) {
      setInternalValue(next);
    }

    local.onValueChange?.(next);
  };

  const selectDate = (date: Date) => {
    if (isDisabled(date, local.disabledDates)) {
      return;
    }

    if (local.mode === "single") {
      commit(date);
      return;
    }

    const current = currentValue();
    if (!Array.isArray(current) || !current[0] || current[1]) {
      commit([date, undefined]);
      return;
    }

    commit(startOfDay(current[0]).getTime() <= startOfDay(date).getTime() ? [current[0], date] : [date, current[0]]);
  };

  return (
    <div class={cn("space-y-3", local.class)} {...others}>
      <Show when={local.label}>
        <div class="text-sm font-semibold tracking-[-0.01em] text-foreground">{local.label}</div>
      </Show>
      <Show when={local.description}>
        <p id={descriptionId} class="text-sm leading-6 text-muted-foreground">
          {local.description}
        </p>
      </Show>

      <div class="ui-card p-4" aria-describedby={describedBy}>
        <div class="flex items-center justify-between gap-3">
          <button
            type="button"
            class="ui-control-button size-9"
            onClick={() => setMonth(current => addMonths(current, -1))}
            aria-label="Previous month"
          >
            <ChevronLeft class="size-4" />
          </button>
          <div class="text-sm font-semibold text-foreground">
            {new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(month())}
          </div>
          <button
            type="button"
            class="ui-control-button size-9"
            onClick={() => setMonth(current => addMonths(current, 1))}
            aria-label="Next month"
          >
            <ChevronRight class="size-4" />
          </button>
        </div>

        <div class="mt-4 grid grid-cols-7 gap-2 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          <For each={["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]}>{day => <div>{day}</div>}</For>
        </div>

        <div class="mt-3 grid gap-2">
          <For each={weeks()}>
            {week => (
              <div class="grid grid-cols-7 gap-2">
                <For each={week}>
                  {date => {
                    const selected = () =>
                      local.mode === "single"
                        ? sameDay(currentValue() as Date | undefined, date)
                        : Boolean(currentRange() && (sameDay(currentRange()![0], date) || sameDay(currentRange()![1], date)));

                    return (
                      <button
                        type="button"
                        class={cn(
                          "inline-flex aspect-square items-center justify-center rounded-[var(--radius-lg)] border border-transparent text-sm transition",
                          local.compact ? "size-9" : "size-10",
                          selected()
                            ? "border-primary/24 bg-primary font-semibold text-primary-foreground"
                            : containsRange(date, currentValue())
                              ? "bg-accent text-accent-foreground"
                              : "bg-background text-foreground hover:bg-background-subtle",
                          !sameMonth(date, month()) && "text-muted-foreground",
                          isDisabled(date, local.disabledDates) && "cursor-not-allowed opacity-35",
                        )}
                        aria-pressed={selected()}
                        aria-current={sameDay(date, new Date()) ? "date" : undefined}
                        data-date={date.toISOString().slice(0, 10)}
                        disabled={isDisabled(date, local.disabledDates)}
                        onClick={() => selectDate(date)}
                      >
                        {date.getDate()}
                      </button>
                    );
                  }}
                </For>
              </div>
            )}
          </For>
        </div>

        <div class="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span class="ui-chip ui-chip-muted">
            {Array.isArray(currentValue())
              ? `${formatDate(currentRange()?.[0]) || "Start"} - ${formatDate(currentRange()?.[1]) || "End"}`
              : formatDate(currentValue() as Date | undefined) || "No date selected"}
          </span>
        </div>
      </div>

      <Show when={local.invalid && local.errorMessage}>
        <p id={errorId} class="text-sm font-medium leading-6 text-destructive">
          {local.errorMessage}
        </p>
      </Show>
    </div>
  );
}
