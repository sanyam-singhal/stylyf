import type { JSX } from "solid-js";
import { splitProps } from "solid-js";
import { cn } from "~/lib/cn";

const rowGapClasses = {
  tight: "gap-[var(--space-3)]",
  comfortable: "gap-[var(--space-5)]",
  loose: "gap-[var(--space-8)]",
} as const;

const rowAlignClasses = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
} as const;

const rowJustifyClasses = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
} as const;

export type RowProps = JSX.HTMLAttributes<HTMLDivElement> & {
  align?: keyof typeof rowAlignClasses;
  gap?: keyof typeof rowGapClasses;
  justify?: keyof typeof rowJustifyClasses;
  wrap?: boolean;
};

export function Row(userProps: RowProps) {
  const [local, others] = splitProps(userProps, ["align", "children", "class", "gap", "justify", "wrap"]);

  return (
    <div
      class={cn(
        "flex",
        rowGapClasses[local.gap ?? "comfortable"],
        rowAlignClasses[local.align ?? "center"],
        rowJustifyClasses[local.justify ?? "start"],
        local.wrap ? "flex-wrap" : "flex-nowrap",
        local.class,
      )}
      {...others}
    >
      {local.children}
    </div>
  );
}

