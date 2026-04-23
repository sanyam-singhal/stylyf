import { BarChart3, BriefcaseBusiness, RefreshCw, Sparkles, Wallet } from "lucide-solid";
import type { JSX } from "solid-js";
import type { RegistryItem } from "~/lib/registry";
import { Badge } from "~/components/registry/feedback-display/badge";
import { Button } from "~/components/registry/actions-navigation/button";
import { EmptyState } from "~/components/registry/information-states/empty-state";
import { ErrorState } from "~/components/registry/information-states/error-state";
import { LoadingState } from "~/components/registry/information-states/loading-state";
import { PageHeader } from "~/components/registry/information-states/page-header";
import { SectionHeader } from "~/components/registry/information-states/section-header";
import { StatCard } from "~/components/registry/information-states/stat-card";
import { StatGrid } from "~/components/registry/information-states/stat-grid";

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

export function PageHeaderPreview(props: { item: RegistryItem }) {
  return (
    <DemoFrame item={props.item} title="Live block">
      <PageHeader
        eyebrow="Revenue workspace"
        title="Analytics overview"
        description="Primary route identity with room for critical actions, freshness cues, and the metadata operators need before they scroll into charts and tables."
        stale
        meta={
          <>
            <Badge tone="success">Healthy</Badge>
            <Badge>Updated 4m ago</Badge>
            <Badge tone="accent">US region</Badge>
          </>
        }
        actions={
          <div class="flex flex-wrap gap-2">
            <Button type="button" tone="outline" intent="neutral">Export</Button>
            <Button type="button">Create report</Button>
          </div>
        }
      />
    </DemoFrame>
  );
}

export function SectionHeaderPreview(props: { item: RegistryItem }) {
  return (
    <DemoFrame item={props.item} title="Live block">
      <div class="space-y-4">
        <SectionHeader
          title="Recent activity"
          description="Reusable subsection header for route internals, cards, and documentation sections."
          anchorHref="#information-states-activity"
          actions={<Button type="button" tone="ghost" intent="neutral" size="sm">View all</Button>}
        />
        <div id="information-states-activity" class="ui-shell-muted p-[var(--space-4)] text-sm text-muted-foreground">
          Activity timeline target inside the same demo block.
        </div>
      </div>
    </DemoFrame>
  );
}

export function StatCardPreview(props: { item: RegistryItem }) {
  return (
    <DemoFrame item={props.item} title="Live block">
      <div class="max-w-sm">
        <StatCard
          icon={<Wallet class="size-4.5" />}
          label="Net expansion"
          value="$148.2k"
          delta="+12.4%"
          footer="Compared with last week"
        />
      </div>
    </DemoFrame>
  );
}

export function StatGridPreview(props: { item: RegistryItem }) {
  return (
    <DemoFrame item={props.item} title="Live block">
      <StatGrid columns={3}>
        <StatCard label="MRR" value="$84.6k" delta="+8.2%" footer="vs previous month" icon={<Wallet class="size-4.5" />} />
        <StatCard label="Trial conversion" value="14.8%" delta="+2.1%" footer="26 qualified signups" accent="highlight" icon={<Sparkles class="size-4.5" />} />
        <StatCard label="Open opportunities" value="128" delta="-4" footer="Needs pipeline review" trend="negative" accent="neutral" icon={<BriefcaseBusiness class="size-4.5" />} />
      </StatGrid>
    </DemoFrame>
  );
}

export function EmptyStatePreview(props: { item: RegistryItem }) {
  return (
    <DemoFrame item={props.item} title="Live block">
      <EmptyState
        eyebrow="Empty workspace"
        title="No saved views yet"
        description="Offer the first meaningful action, explain what appears here once the user gets started, and keep the surface optimistic rather than apologetic."
        actions={
          <>
            <Button type="button">Create first view</Button>
            <Button type="button" tone="outline" intent="neutral">Browse templates</Button>
          </>
        }
      />
    </DemoFrame>
  );
}

export function ErrorStatePreview(props: { item: RegistryItem }) {
  return (
    <DemoFrame item={props.item} title="Live block">
      <ErrorState
        title="Failed to load analytics feed"
        detail="The reporting service returned an upstream timeout. Keep the surface actionable and specific so the operator can recover quickly without opening dev tools."
        actions={
          <>
            <Button type="button" leftIcon={<RefreshCw />}>Retry sync</Button>
            <Button type="button" tone="outline" intent="neutral">View logs</Button>
          </>
        }
      />
    </DemoFrame>
  );
}

export function LoadingStatePreview(props: { item: RegistryItem }) {
  return (
    <DemoFrame item={props.item} title="Live block">
      <LoadingState
        title="Generating forecast model"
        description="Focused loading treatment for longer-running work, with explicit progress, a short explanation of what is happening, and a clear escape hatch."
        progress={62}
        cancelAction={<Button type="button" tone="outline" intent="neutral">Cancel job</Button>}
      />
    </DemoFrame>
  );
}

export const previewBySlug = {
  "empty-state": EmptyStatePreview,
  "error-state": ErrorStatePreview,
  "loading-state": LoadingStatePreview,
  "page-header": PageHeaderPreview,
  "section-header": SectionHeaderPreview,
  "stat-card": StatCardPreview,
  "stat-grid": StatGridPreview,
};
