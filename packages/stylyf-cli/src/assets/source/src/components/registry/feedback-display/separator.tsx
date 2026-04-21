import { Show, mergeProps, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { cn } from "~/lib/cn";

export type SeparatorProps = Omit<JSX.HTMLAttributes<HTMLDivElement>, "children" | "ref"> & {
  class?: string;
  label?: JSX.Element;
  orientation?: "horizontal" | "vertical";
  tone?: "accent" | "default";
};

export function Separator(userProps: SeparatorProps) {
  const props = mergeProps({ label: undefined, orientation: "horizontal" as const, tone: "default" as const }, userProps);
  const [local, others] = splitProps(props, ["class", "label", "orientation", "tone"]);

  return (
    <div
      role="separator"
      aria-orientation={local.orientation}
      class={cn(
        "flex items-center gap-3 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground",
        local.orientation === "vertical" ? "h-full min-h-12 flex-col justify-center" : "w-full",
        local.class,
      )}
      {...others}
    >
      <div
        class={cn(
          "shrink-0",
          local.orientation === "vertical" ? "h-full w-px bg-border/80" : "h-px flex-1 bg-border/80",
          local.tone === "accent" && (local.orientation === "vertical" ? "bg-primary/42" : "bg-primary/42"),
        )}
      />
      <Show when={local.label}>
        <span class="shrink-0 rounded-full bg-background px-1.5 text-[0.68rem] text-muted-foreground">{local.label}</span>
        <div
          class={cn(
            "shrink-0",
            local.orientation === "vertical" ? "h-full w-px bg-border/80" : "h-px flex-1 bg-border/80",
            local.tone === "accent" && (local.orientation === "vertical" ? "bg-primary/42" : "bg-primary/42"),
          )}
        />
      </Show>
    </div>
  );
}
