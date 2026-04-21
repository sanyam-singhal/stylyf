import { Columns3, Eye, FileSpreadsheet, MessageSquareMore, PanelsTopLeft, Rows3, Sparkles, Ticket, TimerReset } from "lucide-solid";
import type { JSX } from "solid-js";
import type { RegistryItem } from "~/lib/registry";
import { Badge } from "~/components/registry/feedback-display/badge";
import { Button } from "~/components/registry/actions-navigation/button";
import { Pagination } from "~/components/registry/actions-navigation/pagination";
import { Table } from "~/components/registry/data-structure/table";
import { BulkActionBar } from "~/components/registry/data-views/bulk-action-bar";
import { ColumnVisibilityMenu } from "~/components/registry/data-views/column-visibility-menu";
import { CommentThread } from "~/components/registry/data-views/comment-thread";
import { DataList } from "~/components/registry/data-views/data-list";
import { DataTableShell } from "~/components/registry/data-views/data-table-shell";
import { DetailPanel } from "~/components/registry/data-views/detail-panel";
import { ActivityFeed } from "~/components/registry/data-views/activity-feed";
import { NotificationList } from "~/components/registry/data-views/notification-list";
import { Timeline } from "~/components/registry/data-views/timeline";
import { SearchField } from "~/components/registry/form-systems/search-field";

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

export function DataListPreview(props: { item: RegistryItem }) {
  return (
    <DemoFrame item={props.item} title="Live block">
      <DataList footer={<Button type="button" tone="ghost" intent="neutral">View all records</Button>} />
    </DemoFrame>
  );
}

export function DataTableShellPreview(props: { item: RegistryItem }) {
  return (
    <DemoFrame item={props.item} title="Live block">
      <DataTableShell
        toolbar={<SearchField />}
        selectionBar={
          <div class="flex flex-wrap items-center justify-between gap-3">
            <Badge tone="accent">8 selected</Badge>
            <Button type="button" tone="outline" intent="neutral" size="sm">Clear selection</Button>
          </div>
        }
        table={
          <Table stickyHeader zebra>
            <Table.Head>
              <Table.Row>
                <Table.HeaderCell>Customer</Table.HeaderCell>
                <Table.HeaderCell>Owner</Table.HeaderCell>
                <Table.HeaderCell sorted="desc">Updated</Table.HeaderCell>
                <Table.HeaderCell numeric>MRR</Table.HeaderCell>
              </Table.Row>
            </Table.Head>
            <Table.Body>
              <Table.Row selected>
                <Table.Cell>Acme Inc</Table.Cell>
                <Table.Cell>Sanyam</Table.Cell>
                <Table.Cell>4m ago</Table.Cell>
                <Table.Cell numeric>$2,400</Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell>Northwind</Table.Cell>
                <Table.Cell>Ops</Table.Cell>
                <Table.Cell>12m ago</Table.Cell>
                <Table.Cell numeric>$1,820</Table.Cell>
              </Table.Row>
            </Table.Body>
          </Table>
        }
        pagination={<Pagination page={3} pageCount={12} />}
      />
    </DemoFrame>
  );
}

export function ColumnVisibilityMenuPreview(props: { item: RegistryItem }) {
  return (
    <DemoFrame item={props.item} title="Live block">
      <ColumnVisibilityMenu />
    </DemoFrame>
  );
}

export function BulkActionBarPreview(props: { item: RegistryItem }) {
  return (
    <DemoFrame item={props.item} title="Live block">
      <BulkActionBar
        actions={
          <>
            <Button type="button" size="sm" leftIcon={<Sparkles />}>Apply tag</Button>
            <Button type="button" size="sm" tone="outline" intent="neutral">Export</Button>
            <Button type="button" size="sm" destructive>Archive</Button>
          </>
        }
      />
    </DemoFrame>
  );
}

export function DetailPanelPreview(props: { item: RegistryItem }) {
  return (
    <DemoFrame item={props.item} title="Live block">
      <div class="max-w-md">
        <DetailPanel
          title="Acme Inc"
          description="Dock this beside a table or list to keep record detail close to selection."
          body={
            <div class="space-y-3 text-sm text-muted-foreground">
              <div class="flex justify-between gap-4"><span>Status</span><span class="font-medium text-foreground">Renewing</span></div>
              <div class="flex justify-between gap-4"><span>Owner</span><span class="font-medium text-foreground">Sanyam</span></div>
              <div class="flex justify-between gap-4"><span>Pipeline</span><span class="font-medium text-foreground">Enterprise</span></div>
            </div>
          }
          actions={<div class="flex gap-2"><Button type="button">Open record</Button><Button type="button" tone="outline" intent="neutral">Dismiss</Button></div>}
        />
      </div>
    </DemoFrame>
  );
}

export function ActivityFeedPreview(props: { item: RegistryItem }) {
  return (
    <DemoFrame item={props.item} title="Live block">
      <ActivityFeed />
    </DemoFrame>
  );
}

export function TimelinePreview(props: { item: RegistryItem }) {
  return (
    <DemoFrame item={props.item} title="Live block">
      <div class="max-w-xl">
        <Timeline />
      </div>
    </DemoFrame>
  );
}

export function NotificationListPreview(props: { item: RegistryItem }) {
  return (
    <DemoFrame item={props.item} title="Live block">
      <NotificationList />
    </DemoFrame>
  );
}

export function CommentThreadPreview(props: { item: RegistryItem }) {
  return (
    <DemoFrame item={props.item} title="Live block">
      <CommentThread />
    </DemoFrame>
  );
}

export const previewBySlug = {
  "activity-feed": ActivityFeedPreview,
  "bulk-action-bar": BulkActionBarPreview,
  "column-visibility-menu": ColumnVisibilityMenuPreview,
  "comment-thread": CommentThreadPreview,
  "data-list": DataListPreview,
  "data-table-shell": DataTableShellPreview,
  "detail-panel": DetailPanelPreview,
  "notification-list": NotificationListPreview,
  timeline: TimelinePreview,
};
