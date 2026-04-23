import { Sparkles } from "lucide-solid";
import type { JSX } from "solid-js";
import type { RegistryItem } from "~/lib/registry";
import { Badge } from "~/components/registry/feedback-display/badge";
import { Button } from "~/components/registry/actions-navigation/button";
import { Pagination } from "~/components/registry/actions-navigation/pagination";
import { BulkActionBar } from "~/components/registry/data-views/bulk-action-bar";
import { ColumnVisibilityMenu } from "~/components/registry/data-views/column-visibility-menu";
import { CommentThread } from "~/components/registry/data-views/comment-thread";
import { DataList } from "~/components/registry/data-views/data-list";
import { DataTableShell } from "~/components/registry/data-views/data-table-shell";
import { DetailPanel } from "~/components/registry/data-views/detail-panel";
import { ActivityFeed } from "~/components/registry/data-views/activity-feed";
import { NotificationList } from "~/components/registry/data-views/notification-list";
import { Table } from "~/components/registry/data-views/table";
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

export function TablePreview(props: { item: RegistryItem }) {
  return (
    <DemoFrame item={props.item} title="Live block">
      <Table zebra stickyHeader>
        <Table.Head>
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
          <Table.Row selected>
            <Table.Cell class="font-medium">Operations</Table.Cell>
            <Table.Cell>Scale</Table.Cell>
            <Table.Cell numeric>$12,480</Table.Cell>
            <Table.Cell>
              <Badge tone="success" size="sm">Healthy</Badge>
            </Table.Cell>
            <Table.Cell class="text-muted-foreground">2 min ago</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell class="font-medium">Growth</Table.Cell>
            <Table.Cell>Starter</Table.Cell>
            <Table.Cell numeric>$2,360</Table.Cell>
            <Table.Cell>
              <Badge tone="accent" size="sm">Review</Badge>
            </Table.Cell>
            <Table.Cell class="text-muted-foreground">8 min ago</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell class="font-medium">Finance</Table.Cell>
            <Table.Cell>Enterprise</Table.Cell>
            <Table.Cell numeric>$38,920</Table.Cell>
            <Table.Cell>
              <Badge tone="danger" size="sm">Action</Badge>
            </Table.Cell>
            <Table.Cell class="text-muted-foreground">Just now</Table.Cell>
          </Table.Row>
        </Table.Body>
        <Table.Caption>Semantic table scaffold only. Sorting, filtering, and bulk actions belong in higher-level data views.</Table.Caption>
      </Table>
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
      <div class="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_360px]">
        <div class="ui-shell-muted border border-dashed border-border/70 p-5 shadow-inset">
          <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Adjacent workspace list</div>
          <div class="mt-4 space-y-3">
            <div class="rounded-[calc(var(--radius)+2px)] border border-primary/20 bg-[color:color-mix(in_oklab,var(--info)_10%,var(--card)_90%)] px-4 py-3">
              <div class="text-sm font-semibold text-foreground">Acme Inc</div>
              <div class="mt-1 text-sm text-muted-foreground">Renewing account selected from the revenue pipeline.</div>
            </div>
            <div class="rounded-[calc(var(--radius)+2px)] border border-border/70 px-4 py-3">
              <div class="text-sm font-semibold text-foreground">Northwind</div>
              <div class="mt-1 text-sm text-muted-foreground">Expansion review pending procurement.</div>
            </div>
          </div>
        </div>
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
  table: TablePreview,
  timeline: TimelinePreview,
};
