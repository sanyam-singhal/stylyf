import { splitProps } from "solid-js";
import type { JSX, ParentProps } from "solid-js";
import { cn } from "~/lib/cn";

export type TableRootProps = Omit<JSX.HTMLAttributes<HTMLTableElement>, "ref"> & {
  class?: string;
  density?: "comfortable" | "compact";
  stickyHeader?: boolean;
  zebra?: boolean;
};

export type TableSectionProps = Omit<JSX.HTMLAttributes<HTMLTableSectionElement>, "ref"> & {
  class?: string;
};

export type TableRowProps = Omit<JSX.HTMLAttributes<HTMLTableRowElement>, "ref"> & {
  class?: string;
  selected?: boolean;
};

export type TableCellProps = Omit<JSX.HTMLAttributes<HTMLTableCellElement>, "ref"> & {
  class?: string;
  numeric?: boolean;
};

export type TableHeaderCellProps = Omit<JSX.HTMLAttributes<HTMLTableCellElement>, "ref"> & {
  class?: string;
  numeric?: boolean;
  sorted?: "asc" | "desc";
};

export type TableCaptionProps = Omit<JSX.HTMLAttributes<HTMLTableCaptionElement>, "ref"> & {
  class?: string;
};

function TableRoot(props: ParentProps<TableRootProps>) {
  const [local, others] = splitProps(props, ["children", "class", "density", "stickyHeader", "zebra"]);

  return (
    <div class="overflow-hidden rounded-[1.6rem] border border-border/70 bg-panel shadow-soft">
      <div class="overflow-auto">
        <table
          class={cn(
            "group min-w-full border-separate border-spacing-0 text-left text-sm",
            local.density === "compact" ? "[&_td]:px-4 [&_td]:py-3 [&_th]:px-4 [&_th]:py-3" : "[&_td]:px-5 [&_td]:py-4 [&_th]:px-5 [&_th]:py-4",
            local.zebra && "[&_tbody_tr:nth-child(even)]:bg-background",
            local.class,
          )}
          data-sticky-header={local.stickyHeader ? "true" : "false"}
          {...others}
        >
          {local.children}
        </table>
      </div>
    </div>
  );
}

function TableHead(props: ParentProps<TableSectionProps>) {
  const [local, others] = splitProps(props, ["children", "class"]);
  return (
    <thead class={cn("[&_tr]:bg-background-subtle", local.class)} {...others}>
      {local.children}
    </thead>
  );
}

function TableBody(props: ParentProps<TableSectionProps>) {
  const [local, others] = splitProps(props, ["children", "class"]);
  return (
    <tbody class={cn("[&_tr:last-child_td]:border-b-0", local.class)} {...others}>
      {local.children}
    </tbody>
  );
}

function TableRow(props: ParentProps<TableRowProps>) {
  const [local, others] = splitProps(props, ["children", "class", "selected"]);
  return (
    <tr
      class={cn(
        "transition hover:bg-background-subtle data-[selected=true]:bg-accent/8 [&_td]:border-b [&_td]:border-border/70 [&_th]:border-b [&_th]:border-border/70",
        local.class,
      )}
      data-selected={local.selected ? "true" : "false"}
      {...others}
    >
      {local.children}
    </tr>
  );
}

function TableHeaderCell(props: ParentProps<TableHeaderCellProps>) {
  const [local, others] = splitProps(props, ["children", "class", "numeric", "sorted"]);
  return (
    <th
      scope="col"
      aria-sort={local.sorted === "asc" ? "ascending" : local.sorted === "desc" ? "descending" : "none"}
      class={cn(
        "bg-background-subtle text-xs font-semibold uppercase tracking-[0.2em] text-muted first:rounded-tl-[1.2rem] last:rounded-tr-[1.2rem]",
        "group-data-[sticky-header=true]:sticky group-data-[sticky-header=true]:top-0",
        local.numeric && "text-right",
        local.class,
      )}
      {...others}
    >
      {local.children}
    </th>
  );
}

function TableCell(props: ParentProps<TableCellProps>) {
  const [local, others] = splitProps(props, ["children", "class", "numeric"]);
  return (
    <td class={cn("text-foreground", local.numeric && "text-right tabular-nums", local.class)} {...others}>
      {local.children}
    </td>
  );
}

function TableCaption(props: ParentProps<TableCaptionProps>) {
  const [local, others] = splitProps(props, ["children", "class"]);
  return (
    <caption class={cn("caption-bottom border-t border-border/70 px-5 py-4 text-left text-sm text-muted", local.class)} {...others}>
      {local.children}
    </caption>
  );
}

export const Table = Object.assign(TableRoot, {
  Body: TableBody,
  Caption: TableCaption,
  Cell: TableCell,
  Head: TableHead,
  HeaderCell: TableHeaderCell,
  Row: TableRow,
});
