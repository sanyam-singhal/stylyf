import { For } from "solid-js";
import type { JSX } from "solid-js";
import type { RegistryItem } from "~/lib/registry";
import { Badge } from "~/components/registry/feedback-display/badge";
import { Table } from "~/components/registry/data-structure/table";

function DemoFrame(props: { children: JSX.Element; item: RegistryItem; title: string }) {
  return (
    <div class="space-y-4" data-demo={props.item.slug}>
      <div class="ui-demo-chip">
        <span>{props.title}</span>
        <span class="text-border">/</span>
        <span>{props.item.name}</span>
      </div>
      <div class="ui-demo-frame">{props.children}</div>
    </div>
  );
}

const rows = [
  { owner: "Operations", plan: "Scale", revenue: "$12,480", status: "Healthy", sync: "2 min ago" },
  { owner: "Growth", plan: "Starter", revenue: "$2,360", status: "Review", sync: "8 min ago" },
  { owner: "Finance", plan: "Enterprise", revenue: "$38,920", status: "Healthy", sync: "Just now" },
  { owner: "Security", plan: "Scale", revenue: "$9,540", status: "Action", sync: "14 min ago" },
];

export function TablePreview(props: { item: RegistryItem }) {
  return (
    <DemoFrame item={props.item} title="Live primitive">
      <Table zebra stickyHeader>
        <Table.Head class="group">
          <Table.Row>
            <Table.HeaderCell>Workspace</Table.HeaderCell>
            <Table.HeaderCell>Plan</Table.HeaderCell>
            <Table.HeaderCell sorted="desc" numeric>
              Revenue
            </Table.HeaderCell>
            <Table.HeaderCell>Status</Table.HeaderCell>
            <Table.HeaderCell>Synced</Table.HeaderCell>
          </Table.Row>
        </Table.Head>
        <Table.Body>
          <For each={rows}>
            {(row, index) => (
              <Table.Row selected={index() === 2}>
                <Table.Cell class="font-medium">{row.owner}</Table.Cell>
                <Table.Cell>{row.plan}</Table.Cell>
                <Table.Cell numeric>{row.revenue}</Table.Cell>
                <Table.Cell>
                  <Badge tone={row.status === "Healthy" ? "success" : row.status === "Review" ? "accent" : "danger"} size="sm">
                    {row.status}
                  </Badge>
                </Table.Cell>
                <Table.Cell class="text-muted-foreground">{row.sync}</Table.Cell>
              </Table.Row>
            )}
          </For>
        </Table.Body>
        <Table.Caption>Semantic table scaffold only. Sorting, filtering, and bulk actions belong in higher-level data views.</Table.Caption>
      </Table>
    </DemoFrame>
  );
}

export const previewBySlug = {
  table: TablePreview,
};
