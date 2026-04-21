import type { JSX } from "solid-js";
import { splitProps } from "solid-js";
import { cn } from "~/lib/cn";

const stackGapClasses = {
  tight: "gap-[var(--space-3)]",
  comfortable: "gap-[var(--space-5)]",
  loose: "gap-[var(--space-8)]",
} as const;

const stackAlignClasses = {
  start: "items-start",
  center: "items-center",
  stretch: "items-stretch",
} as const;

export type StackProps = JSX.HTMLAttributes<HTMLDivElement> & {
  align?: keyof typeof stackAlignClasses;
  gap?: keyof typeof stackGapClasses;
};

export function Stack(userProps: StackProps) {
  const [local, others] = splitProps(userProps, ["align", "children", "class", "gap"]);

  return (
    <div
      class={cn(
        "flex flex-col",
        stackGapClasses[local.gap ?? "comfortable"],
        stackAlignClasses[local.align ?? "stretch"],
        local.class,
      )}
      {...others}
    >
      {local.children}
    </div>
  );
}

