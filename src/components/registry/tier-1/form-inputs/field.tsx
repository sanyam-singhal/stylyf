import { cva, type VariantProps } from "class-variance-authority";
import { Show, createUniqueId, mergeProps, splitProps } from "solid-js";
import type { JSX, ParentProps } from "solid-js";
import { cn } from "~/lib/cn";

export const fieldFrameVariants = cva(
  [
    "group relative flex w-full items-center border bg-background transition-[border-color,box-shadow,background-color]",
    "focus-within:border-accent/45 focus-within:ring-2 focus-within:ring-ring/18",
    "data-[invalid=true]:border-rose-500/45 data-[invalid=true]:ring-2 data-[invalid=true]:ring-rose-500/12",
    "data-[disabled=true]:bg-muted-soft/70 data-[disabled=true]:opacity-70",
    "data-[readonly=true]:bg-muted-soft/45",
  ].join(" "),
  {
    variants: {
      size: {
        sm: "min-h-10 gap-2 px-3",
        md: "min-h-11 gap-2.5 px-3.5",
        lg: "min-h-13 gap-3 px-4.5",
      },
      radius: {
        md: "rounded-[1rem]",
        lg: "rounded-[1.2rem]",
        pill: "rounded-[1.7rem]",
      },
    },
    defaultVariants: {
      size: "md",
      radius: "lg",
    },
  },
);

export const fieldControlVariants = cva(
  [
    "w-full min-w-0 bg-transparent text-foreground outline-none placeholder:text-muted",
    "disabled:cursor-not-allowed",
  ].join(" "),
  {
    variants: {
      size: {
        sm: "text-sm",
        md: "text-sm",
        lg: "text-base",
      },
      mono: {
        true: "font-mono tracking-[0.12em]",
        false: "",
      },
      align: {
        start: "text-left",
        center: "text-center",
        end: "text-right",
      },
    },
    defaultVariants: {
      size: "md",
      mono: false,
      align: "start",
    },
  },
);

export type FieldSize = NonNullable<VariantProps<typeof fieldFrameVariants>["size"]>;
export type FieldRadius = NonNullable<VariantProps<typeof fieldFrameVariants>["radius"]>;

type SharedFieldCopyProps = {
  description?: JSX.Element;
  errorMessage?: JSX.Element;
  invalid?: boolean;
  label?: JSX.Element;
  labelFor?: string;
  required?: boolean;
};

export type FieldAria = {
  describedBy?: string;
  descriptionId: string;
  errorId: string;
  inputId: string;
};

export function createFieldAria(props: {
  description?: JSX.Element;
  errorMessage?: JSX.Element;
  id?: string;
  invalid?: boolean;
}) {
  const baseId = props.id ?? createUniqueId();
  const descriptionId = `${baseId}-description`;
  const errorId = `${baseId}-error`;
  const describedBy = [props.description ? descriptionId : undefined, props.invalid && props.errorMessage ? errorId : undefined]
    .filter(Boolean)
    .join(" ");

  return {
    describedBy: describedBy || undefined,
    descriptionId,
    errorId,
    inputId: baseId,
  } satisfies FieldAria;
}

export function FieldCopy(
  props: ParentProps<
    SharedFieldCopyProps & {
      class?: string;
    }
  >,
) {
  const merged = mergeProps({ required: false, invalid: false }, props);
  const [local, others] = splitProps(merged, [
    "children",
    "class",
    "description",
    "errorMessage",
    "invalid",
    "label",
    "labelFor",
    "required",
  ]);

  return (
    <div class={cn("space-y-2.5", local.class)} {...others}>
      <Show when={local.label}>
        <div class="flex items-center gap-2">
          <label for={local.labelFor} class="text-sm font-semibold tracking-[-0.01em] text-foreground">
            {local.label}
          </label>
          <Show when={local.required}>
            <span class="text-xs font-medium uppercase tracking-[0.2em] text-accent-strong">Required</span>
          </Show>
        </div>
      </Show>
      {local.children}
      <Show when={local.description}>
        <div class="text-sm leading-6 text-muted">{local.description}</div>
      </Show>
      <Show when={local.invalid && local.errorMessage}>
        <div class="text-sm font-medium leading-6 text-rose-300">{local.errorMessage}</div>
      </Show>
    </div>
  );
}

export function FieldFrame(
  props: ParentProps<
    VariantProps<typeof fieldFrameVariants> & {
      class?: string;
      disabled?: boolean;
      invalid?: boolean;
      readOnly?: boolean;
    }
  >,
) {
  const merged = mergeProps({ invalid: false, readOnly: false, disabled: false, radius: "lg" as const, size: "md" as const }, props);
  const [local, others] = splitProps(merged, ["children", "class", "disabled", "invalid", "radius", "readOnly", "size"]);

  return (
    <div
      class={cn(fieldFrameVariants({ radius: local.radius, size: local.size }), local.class)}
      data-disabled={local.disabled ? "true" : "false"}
      data-invalid={local.invalid ? "true" : "false"}
      data-readonly={local.readOnly ? "true" : "false"}
      {...others}
    >
      {local.children}
    </div>
  );
}
