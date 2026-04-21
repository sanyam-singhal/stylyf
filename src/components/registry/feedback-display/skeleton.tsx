import { mergeProps, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { cn } from "~/lib/cn";

export type SkeletonProps = Omit<JSX.HTMLAttributes<HTMLDivElement>, "children" | "ref"> & {
  class?: string;
  height?: string;
  shimmer?: boolean;
  shape?: "circle" | "line" | "rect";
  width?: string;
};

export function Skeleton(userProps: SkeletonProps) {
  const props = mergeProps({ height: "1rem", shimmer: true, shape: "rect" as const, width: "100%" }, userProps);
  const [local, others] = splitProps(props, ["class", "height", "shimmer", "shape", "width"]);

  return (
    <div
      class={cn(
        "relative overflow-hidden border border-border/65 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--muted-soft)_86%,white_14%),var(--muted-soft))] shadow-inset",
        local.shape === "circle" ? "rounded-full" : local.shape === "line" ? "rounded-full" : "rounded-lg",
        local.shimmer &&
          "before:absolute before:inset-0 before:bg-[linear-gradient(110deg,transparent_0%,transparent_34%,rgba(255,255,255,0.48)_50%,transparent_66%,transparent_100%)] before:animate-[ui-shimmer-sweep_1.35s_linear_infinite]",
        local.class,
      )}
      style={{ height: local.height, width: local.width }}
      aria-hidden="true"
      {...others}
    />
  );
}
