import type { JSX } from "solid-js";
import { splitProps } from "solid-js";
import { cn } from "~/lib/cn";

const gridGapClasses = {
  tight: "gap-[var(--space-3)]",
  comfortable: "gap-[var(--space-5)]",
  loose: "gap-[var(--space-8)]",
} as const;

const gridColumnClasses = {
  1: "grid-cols-1",
  2: "grid-cols-1 md:grid-cols-2",
  3: "grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
  4: "grid-cols-1 md:grid-cols-2 xl:grid-cols-4",
} as const;

const minClasses = {
  none: "",
  panel: "[grid-template-columns:repeat(auto-fit,minmax(18rem,1fr))]",
  card: "[grid-template-columns:repeat(auto-fit,minmax(16rem,1fr))]",
  metric: "[grid-template-columns:repeat(auto-fit,minmax(14rem,1fr))]",
} as const;

export type GridProps = JSX.HTMLAttributes<HTMLDivElement> & {
  cols?: keyof typeof gridColumnClasses;
  gap?: keyof typeof gridGapClasses;
  min?: keyof typeof minClasses;
};

export function Grid(userProps: GridProps) {
  const [local, others] = splitProps(userProps, ["children", "class", "cols", "gap", "min"]);

  return (
    <div
      class={cn(
        "grid",
        local.min && local.min !== "none" ? minClasses[local.min] : gridColumnClasses[local.cols ?? 2],
        gridGapClasses[local.gap ?? "comfortable"],
        local.class,
      )}
      {...others}
    >
      {local.children}
    </div>
  );
}

