import { cva, type VariantProps } from "class-variance-authority";
import { LoaderCircle } from "lucide-solid";
import { Show, mergeProps, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { cn } from "~/lib/cn";

export const buttonFrameVariants = cva(
  [
    "inline-flex shrink-0 items-center justify-center whitespace-nowrap border font-semibold tracking-[-0.01em]",
    "select-none transition-[transform,background-color,border-color,color,box-shadow,opacity] duration-200 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
    "data-[loading=true]:cursor-progress data-[pending=true]:cursor-progress data-[pressed=true]:translate-y-px data-[current=true]:ring-2 data-[current=true]:ring-primary/18",
  ].join(" "),
  {
    variants: {
      size: {
        sm: "h-[calc(var(--control-height)-0.55rem)] gap-1.75 px-[calc(var(--control-padding-x)-0.35rem)] text-[0.84rem] [&_svg]:size-3.5",
        md: "h-[var(--control-height)] gap-2 px-[var(--control-padding-x)] text-[0.92rem] [&_svg]:size-4",
        lg: "h-[calc(var(--control-height)+0.55rem)] gap-2.5 px-[calc(var(--control-padding-x)+0.35rem)] text-[0.98rem] [&_svg]:size-4.5",
      },
      density: {
        comfortable: "",
        compact: "gap-1.5 px-[calc(var(--control-padding-x)-0.45rem)] text-[0.79rem] font-bold tracking-[0.08em]",
      },
      radius: {
        md: "rounded-[max(calc(var(--radius)-10px),0.45rem)]",
        lg: "rounded-[max(calc(var(--radius)-6px),0.8rem)]",
        pill: "rounded-full",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      size: "md",
      density: "comfortable",
      radius: "lg",
      fullWidth: false,
    },
  },
);

const toneMatrix = {
  destructive: {
    solid:
      "border-destructive/28 bg-destructive text-destructive-foreground shadow-xs hover:-translate-y-px hover:border-destructive/42 hover:bg-destructive/92",
    soft: "border-destructive/26 bg-destructive/10 text-destructive hover:border-destructive/34 hover:bg-destructive/14",
    outline: "border-destructive/30 bg-background text-destructive hover:border-destructive/40 hover:bg-destructive/8",
    ghost: "border-transparent bg-transparent text-destructive hover:bg-destructive/10 hover:text-destructive",
  },
  primary: {
    solid:
      "border-primary/24 bg-primary text-primary-foreground shadow-xs hover:-translate-y-px hover:border-primary/38 hover:bg-primary/92",
    soft: "border-accent/48 bg-accent text-accent-foreground hover:border-accent/58 hover:bg-accent/84",
    outline: "border-input/90 bg-background text-foreground hover:border-primary/26 hover:bg-accent/55",
    ghost: "border-transparent bg-transparent text-foreground hover:bg-accent/55 hover:text-foreground",
  },
  neutral: {
    solid: "border-input/85 bg-card text-card-foreground shadow-xs hover:-translate-y-px hover:border-border hover:bg-background",
    soft: "border-border/72 bg-[var(--muted-soft)] text-foreground hover:border-border/84 hover:bg-muted",
    outline: "border-input/90 bg-background text-foreground hover:border-border hover:bg-accent/45",
    ghost: "border-transparent bg-transparent text-muted-foreground hover:bg-accent/55 hover:text-foreground",
  },
  highlight: {
    solid: "border-secondary/30 bg-secondary text-secondary-foreground shadow-xs hover:-translate-y-px hover:border-secondary/44 hover:bg-secondary/92",
    soft: "border-secondary/28 bg-secondary/16 text-secondary-foreground hover:border-secondary/38 hover:bg-secondary/20",
    outline: "border-secondary/32 bg-background text-secondary-foreground hover:bg-secondary/10",
    ghost: "border-transparent bg-transparent text-secondary-foreground hover:bg-secondary/10",
  },
} as const;

const pressedMatrix = {
  destructive:
    "data-[pressed=true]:border-destructive/42 data-[pressed=true]:bg-destructive data-[pressed=true]:text-destructive-foreground data-[pressed=true]:shadow-xs",
  default:
    "data-[pressed=true]:border-primary/32 data-[pressed=true]:bg-primary data-[pressed=true]:text-primary-foreground data-[pressed=true]:shadow-xs",
} as const;

export type ActionIntent = "primary" | "neutral" | "highlight";
export type ActionTone = "solid" | "soft" | "outline" | "ghost";
export type ActionSize = NonNullable<VariantProps<typeof buttonFrameVariants>["size"]>;
export type ActionDensity = NonNullable<VariantProps<typeof buttonFrameVariants>["density"]>;
export type ActionRadius = NonNullable<VariantProps<typeof buttonFrameVariants>["radius"]>;

export type ButtonStyleProps = VariantProps<typeof buttonFrameVariants> & {
  destructive?: boolean;
  intent?: ActionIntent;
  tone?: ActionTone;
};

export function buttonToneClasses(options: {
  destructive?: boolean;
  intent?: ActionIntent;
  tone?: ActionTone;
  pressedTone?: boolean;
}) {
  const palette = options.destructive
    ? toneMatrix.destructive[options.tone ?? "solid"]
    : toneMatrix[options.intent ?? "primary"][options.tone ?? "solid"];

  return cn(
    palette,
    options.pressedTone ? (options.destructive ? pressedMatrix.destructive : pressedMatrix.default) : undefined,
    "data-[pending=true]:opacity-85",
  );
}

export function buttonDisabledState(props: {
  disabled?: boolean;
  loading?: boolean;
  pending?: boolean;
}) {
  return Boolean(props.disabled || props.loading || props.pending);
}

type ActionVisualProps = {
  leftIcon?: JSX.Element;
  rightIcon?: JSX.Element;
  children?: JSX.Element;
  loading?: boolean;
  pending?: boolean;
  loadingLabel?: string;
};

export function ActionContent(props: ActionVisualProps) {
  const busyLabel = () => {
    if (props.loading) return props.loadingLabel ?? "Working";
    if (props.pending) return "Pending";
    return props.children;
  };

  return (
    <>
      <Show when={props.loading || props.pending} fallback={props.leftIcon}>
        <LoaderCircle class="animate-spin" />
      </Show>
      <span>{busyLabel()}</span>
      <Show when={!props.loading && !props.pending}>{props.rightIcon}</Show>
    </>
  );
}

export type ButtonProps = Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, "children"> &
  ButtonStyleProps & {
    children?: JSX.Element;
    class?: string;
    leftIcon?: JSX.Element;
    rightIcon?: JSX.Element;
    loading?: boolean;
    pending?: boolean;
    loadingLabel?: string;
  };

export function Button(userProps: ButtonProps) {
  const props = mergeProps(
    {
      type: "button" as const,
      children: "Button",
      intent: "primary" as const,
      tone: "solid" as const,
      size: "md" as const,
      density: "comfortable" as const,
      radius: "pill" as const,
      fullWidth: false,
    },
    userProps,
  );

  const [local, others] = splitProps(props, [
    "children",
    "class",
    "leftIcon",
    "rightIcon",
    "loading",
    "pending",
    "loadingLabel",
    "intent",
    "tone",
    "destructive",
    "size",
    "density",
    "radius",
    "fullWidth",
  ]);

  const unavailable = () => buttonDisabledState(local);

  return (
    <button
      class={cn(
        buttonFrameVariants({
          size: local.size,
          density: local.density,
          radius: local.radius,
          fullWidth: local.fullWidth,
        }),
        buttonToneClasses({
          intent: local.intent,
          tone: local.tone,
          destructive: local.destructive,
        }),
        local.class,
      )}
      disabled={unavailable()}
      aria-busy={local.loading || local.pending ? true : undefined}
      data-current="false"
      data-loading={local.loading ? "true" : "false"}
      data-pending={local.pending ? "true" : "false"}
      data-pressed="false"
      {...others}
    >
      <ActionContent
        leftIcon={local.leftIcon}
        rightIcon={local.rightIcon}
        loading={local.loading}
        pending={local.pending}
        loadingLabel={local.loadingLabel}
      >
        {local.children}
      </ActionContent>
    </button>
  );
}
