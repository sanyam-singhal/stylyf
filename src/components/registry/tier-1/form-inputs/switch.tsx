import { Check, X } from "lucide-solid";
import { Show, createSignal, mergeProps, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { cn } from "~/lib/cn";
import { createFieldAria, type FieldSize } from "~/components/registry/tier-1/form-inputs/field";

type SwitchTone = "soft" | "solid" | "outline";
type SwitchLabelPlacement = "end" | "start";

const trackSizes = {
  sm: "h-7 w-12",
  md: "h-8 w-14",
  lg: "h-9 w-16",
} as const;

const thumbSizes = {
  sm: "size-5 data-[checked=true]:translate-x-5",
  md: "size-6 data-[checked=true]:translate-x-6",
  lg: "size-7 data-[checked=true]:translate-x-7",
} as const;

export type SwitchProps = Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, "onChange" | "size"> & {
  checked?: boolean;
  class?: string;
  defaultChecked?: boolean;
  description?: JSX.Element;
  errorMessage?: JSX.Element;
  invalid?: boolean;
  label?: JSX.Element;
  labelPlacement?: SwitchLabelPlacement;
  onCheckedChange?: (checked: boolean) => void;
  size?: FieldSize;
  tone?: SwitchTone;
};

export function Switch(userProps: SwitchProps) {
  const props = mergeProps(
    {
      defaultChecked: false,
      invalid: false,
      labelPlacement: "end" as const,
      size: "md" as const,
      tone: "soft" as const,
      type: "button" as const,
    },
    userProps,
  );

  const [local, others] = splitProps(props, [
    "checked",
    "class",
    "defaultChecked",
    "description",
    "errorMessage",
    "id",
    "invalid",
    "label",
    "labelPlacement",
    "onCheckedChange",
    "onClick",
    "size",
    "tone",
    "type",
  ]);

  const [internalChecked, setInternalChecked] = createSignal(local.defaultChecked);
  const checked = () => local.checked ?? internalChecked();
  const aria = createFieldAria({
    description: local.description,
    errorMessage: local.errorMessage,
    id: local.id,
    invalid: local.invalid,
  });

  const commit = (next: boolean) => {
    if (local.checked === undefined) {
      setInternalChecked(next);
    }

    local.onCheckedChange?.(next);
  };

  const handleClick: JSX.EventHandlerUnion<HTMLButtonElement, MouseEvent> = event => {
    const onClick = local.onClick as JSX.EventHandler<HTMLButtonElement, MouseEvent> | undefined;
    onClick?.(event);

    if (event.defaultPrevented || others.disabled) {
      return;
    }

    commit(!checked());
  };

  return (
    <div
      class={cn(
        "flex items-start gap-3",
        local.labelPlacement === "start" && "flex-row-reverse justify-end",
        others.disabled && "opacity-70",
        local.class,
      )}
    >
      <button
        id={aria.inputId}
        type={local.type}
        role="switch"
        aria-checked={checked()}
        aria-describedby={aria.describedBy}
        aria-invalid={local.invalid ? true : undefined}
        onClick={handleClick}
        class={cn(
          "relative inline-flex shrink-0 items-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/18",
          trackSizes[local.size],
          local.tone === "soft" &&
            "border-accent/25 bg-accent/12 data-[checked=true]:border-foreground/10 data-[checked=true]:bg-foreground",
          local.tone === "outline" &&
            "border-border/70 bg-background data-[checked=true]:border-accent/35 data-[checked=true]:bg-accent/12",
          local.tone === "solid" && "border-foreground/10 bg-foreground text-background",
          local.invalid && "border-rose-500/45 ring-2 ring-rose-500/12",
        )}
        data-checked={checked() ? "true" : "false"}
        disabled={others.disabled}
        {...others}
      >
        <span
          class={cn(
            "ml-1 inline-flex items-center justify-center rounded-full bg-background text-foreground shadow-soft transition-transform",
            thumbSizes[local.size],
          )}
          data-checked={checked() ? "true" : "false"}
        >
          <Show when={checked()} fallback={<X class="size-3 text-muted" />}>
            <Check class="size-3" />
          </Show>
        </span>
      </button>

      <div class="min-w-0">
        <Show when={local.label}>
          <label for={aria.inputId} class="block text-sm font-semibold tracking-[-0.01em] text-foreground">
            {local.label}
          </label>
        </Show>
        <Show when={local.description}>
          <div id={aria.descriptionId} class="mt-1 text-sm leading-6 text-muted">
            {local.description}
          </div>
        </Show>
        <Show when={local.invalid && local.errorMessage}>
          <div id={aria.errorId} class="mt-1 text-sm font-medium leading-6 text-rose-300">
            {local.errorMessage}
          </div>
        </Show>
      </div>
    </div>
  );
}
