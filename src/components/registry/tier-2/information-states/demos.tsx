import { BarChart3, BriefcaseBusiness, RefreshCw, Sparkles, Wallet } from "lucide-solid";
import type { JSX } from "solid-js";
import type { RegistryItem } from "~/lib/registry";
import { Badge } from "~/components/registry/tier-1/feedback-display/badge";
import { Button } from "~/components/registry/tier-1/actions-navigation/button";
import { EmptyState } from "~/components/registry/tier-2/information-states/empty-state";
import { ErrorState } from "~/components/registry/tier-2/information-states/error-state";
import { LoadingState } from "~/components/registry/tier-2/information-states/loading-state";
import { PageHeader } from "~/components/registry/tier-2/information-states/page-header";
import { SectionHeader } from "~/components/registry/tier-2/information-states/section-header";
import { StatCard } from "~/components/registry/tier-2/information-states/stat-card";
import { StatGrid } from "~/components/registry/tier-2/information-states/stat-grid";

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
        description="Primary route identity with space for actions, data freshness, and contextual metadata."
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
      <SectionHeader
        title="Recent activity"
        description="Reusable subsection header for route internals, cards, and documentation sections."
        anchorHref="#activity"
        actions={<Button type="button" tone="ghost" intent="neutral" size="sm">View all</Button>}
      />
    </DemoFrame>
  );
}

export function StatCardPreview(props: { item: RegistryItem }) {
  return (
    <DemoFrame item={props.item} title="Live block">
      <div class="max-w-sm">
        <StatCard icon={<Wallet class="size-4.5" />} />
      </div>
    </DemoFrame>
  );
}

export function StatGridPreview(props: { item: RegistryItem }) {
  return (
    <DemoFrame item={props.item} title="Live block">
      <StatGrid columns={3}>
        <StatCard label="MRR" value="$84.6k" delta="+8.2%" icon={<Wallet class="size-4.5" />} />
        <StatCard label="Trial conversion" value="14.8%" delta="+2.1%" accent="highlight" icon={<Sparkles class="size-4.5" />} />
        <StatCard label="Open opportunities" value="128" delta="-4" trend="negative" accent="neutral" icon={<BriefcaseBusiness class="size-4.5" />} />
      </StatGrid>
    </DemoFrame>
  );
}

export function EmptyStatePreview(props: { item: RegistryItem }) {
  return (
    <DemoFrame item={props.item} title="Live block">
      <EmptyState
        title="No saved views yet"
        description="Offer the first meaningful action and explain what appears here once the user gets started."
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
        detail="The reporting service returned an upstream timeout. Keep the surface actionable and specific so the operator can recover quickly."
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
        description="Focused loading treatment for longer-running work, with optional progress and a clear escape hatch."
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
