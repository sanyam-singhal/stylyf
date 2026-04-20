import { mergeProps, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { cn } from "~/lib/cn";

export type StatGridProps = Omit<JSX.HTMLAttributes<HTMLDivElement>, "children"> & {
  children?: JSX.Element;
  class?: string;
  columns?: 2 | 3 | 4;
  loading?: boolean;
};

export function StatGrid(userProps: StatGridProps) {
  const props = mergeProps(
    {
      columns: 3 as const,
      loading: false,
    },
    userProps,
  );

  const [local, others] = splitProps(props, ["children", "class", "columns", "loading"]);

  return (
    <div
      class={cn(
        "grid gap-[var(--space-4)]",
        local.columns === 2 && "md:grid-cols-2",
        local.columns === 3 && "md:grid-cols-2 xl:grid-cols-3",
        local.columns === 4 && "md:grid-cols-2 xl:grid-cols-4",
        local.class,
      )}
      data-loading={local.loading ? "true" : "false"}
      {...others}
    >
      {local.children}
    </div>
  );
}
