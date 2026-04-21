import type { JSX } from "solid-js";
import { splitProps } from "solid-js";
import { cn } from "~/lib/cn";

const columnGapClasses = {
  tight: "gap-[var(--space-3)]",
  comfortable: "gap-[var(--space-5)]",
  loose: "gap-[var(--space-8)]",
} as const;

const columnAlignClasses = {
  start: "items-start",
  center: "items-center",
  stretch: "items-stretch",
} as const;

const widthClasses = {
  auto: "w-auto",
  full: "w-full",
  narrow: "max-w-xl",
  prose: "max-w-3xl",
} as const;

export type ColumnProps = JSX.HTMLAttributes<HTMLDivElement> & {
  align?: keyof typeof columnAlignClasses;
  gap?: keyof typeof columnGapClasses;
  width?: keyof typeof widthClasses;
};

export function Column(userProps: ColumnProps) {
  const [local, others] = splitProps(userProps, ["align", "children", "class", "gap", "width"]);

  return (
    <div
      class={cn(
        "flex flex-col",
        columnGapClasses[local.gap ?? "comfortable"],
        columnAlignClasses[local.align ?? "stretch"],
        widthClasses[local.width ?? "full"],
        local.class,
      )}
      {...others}
    >
      {local.children}
    </div>
  );
}

