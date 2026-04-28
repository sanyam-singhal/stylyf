import type { JSX } from "solid-js";
import { Show, splitProps } from "solid-js";
import { cn } from "~/lib/cn";

const ratioClasses = {
  "1:1": "xl:grid-cols-2",
  "2:1": "xl:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]",
  "3:1": "xl:grid-cols-[minmax(0,3fr)_minmax(18rem,1fr)]",
} as const;

const gapClasses = {
  tight: "gap-[var(--space-3)]",
  comfortable: "gap-[var(--space-5)]",
  loose: "gap-[var(--space-8)]",
} as const;

export type SplitProps = JSX.HTMLAttributes<HTMLDivElement> & {
  gap?: keyof typeof gapClasses;
  ratio?: keyof typeof ratioClasses;
  side?: JSX.Element;
};

export function Split(userProps: SplitProps) {
  const [local, others] = splitProps(userProps, ["children", "class", "gap", "ratio", "side"]);

  return (
    <div class={cn("grid", ratioClasses[local.ratio ?? "2:1"], gapClasses[local.gap ?? "comfortable"], local.class)} {...others}>
      <div class="min-w-0">{local.children}</div>
      <Show when={local.side}>
        <aside class="min-w-0">{local.side}</aside>
      </Show>
    </div>
  );
}

