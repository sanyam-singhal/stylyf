import type { JSX } from "solid-js";
import { splitProps } from "solid-js";
import { cn } from "~/lib/cn";

const alignClasses = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
} as const;

export type ToolbarProps = JSX.HTMLAttributes<HTMLDivElement> & {
  align?: keyof typeof alignClasses;
  sticky?: boolean;
  wrap?: boolean;
};

export function Toolbar(userProps: ToolbarProps) {
  const [local, others] = splitProps(userProps, ["align", "children", "class", "sticky", "wrap"]);

  return (
    <div
      class={cn(
        "ui-shell-muted flex gap-[var(--space-3)] p-[var(--space-4)]",
        alignClasses[local.align ?? "center"],
        local.wrap === false ? "flex-nowrap" : "flex-wrap",
        local.sticky && "sticky top-[calc(var(--header-height)+var(--space-4))] z-20",
        local.class,
      )}
      {...others}
    >
      {local.children}
    </div>
  );
}

