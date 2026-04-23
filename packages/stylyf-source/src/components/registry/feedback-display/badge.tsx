import { mergeProps, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { X } from "lucide-solid";
import { cn } from "~/lib/cn";

export type BadgeProps = Omit<JSX.HTMLAttributes<HTMLSpanElement>, "children" | "ref"> & {
  children?: JSX.Element;
  class?: string;
  emphasis?: "soft" | "solid";
  icon?: JSX.Element;
  onRemove?: () => void;
  removable?: boolean;
  selected?: boolean;
  size?: "md" | "sm";
  tone?: "accent" | "danger" | "neutral" | "success";
};

const toneStyles = {
  accent: {
    soft: "border-accent/42 bg-accent/90 text-accent-foreground",
    solid: "border-primary/28 bg-primary text-primary-foreground shadow-xs",
  },
  danger: {
    soft: "border-destructive/26 bg-destructive/10 text-destructive",
    solid: "border-destructive/34 bg-destructive text-destructive-foreground shadow-xs",
  },
  neutral: {
    soft: "border-border/78 bg-[var(--muted-soft)] text-foreground",
    solid: "border-border/80 bg-foreground text-background shadow-xs",
  },
  success: {
    soft: "border-success/26 bg-success/10 text-success",
    solid: "border-success/32 bg-success text-success-foreground shadow-xs",
  },
} as const;

export function Badge(userProps: BadgeProps) {
  const props = mergeProps(
    { emphasis: "soft" as const, removable: false, selected: false, size: "sm" as const, tone: "neutral" as const },
    userProps,
  );
  const [local, others] = splitProps(props, ["children", "class", "emphasis", "icon", "onRemove", "removable", "selected", "size", "tone"]);

  return (
    <span
      class={cn(
        "inline-flex items-center gap-2 rounded-full border font-medium tracking-[-0.01em] shadow-[inset_0_1px_0_rgba(255,255,255,0.24)]",
        local.size === "sm" ? "min-h-7 px-2.5 text-[0.72rem]" : "min-h-8 px-3.5 text-sm",
        toneStyles[local.tone][local.emphasis],
        local.selected && "border-primary/28 ring-2 ring-primary/14",
        local.class,
      )}
      data-selected={local.selected ? "true" : "false"}
      {...others}
    >
      {local.icon ? <span class="inline-flex shrink-0">{local.icon}</span> : null}
      <span class="truncate">{local.children ?? "Badge"}</span>
      {local.removable ? (
        <button
          type="button"
          aria-label="Remove badge"
          class={cn(
            "inline-flex size-4 shrink-0 items-center justify-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35",
            local.emphasis === "solid"
              ? "bg-background/16 hover:bg-background/26"
              : "bg-foreground/6 hover:bg-foreground/12",
          )}
          onClick={() => local.onRemove?.()}
        >
          <X class="size-3" />
        </button>
      ) : null}
    </span>
  );
}
