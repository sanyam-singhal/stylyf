import { Link, Meta, Title } from "@solidjs/meta";
import { ErrorBoundary, Show } from "solid-js";
import { createAsync } from "@solidjs/router";
import { SidebarAppShell } from "~/components/shells/app/sidebar-app";
import { GeneratedNavigation } from "~/components/generated-navigation";
import { ResourceIndexPageShell } from "~/components/shells/page/resource-index";
import { Stack } from "~/components/layout/stack";
import { DataTableShell } from "~/components/registry/data-views/data-table-shell";
import { DetailPanel } from "~/components/registry/data-views/detail-panel";
import { FilterToolbar } from "~/components/registry/form-systems/filter-toolbar";
import { EmptyState } from "~/components/registry/information-states/empty-state";
import { ErrorState } from "~/components/registry/information-states/error-state";
import { LoadingState } from "~/components/registry/information-states/loading-state";
import { PageHeader } from "~/components/registry/information-states/page-header";
import { listAgentEvents } from "~/lib/server/queries/agent-events-list";

export default function AgentEventsRoute() {
  const agentEventsRows = createAsync(() => listAgentEvents());
  return (
    <>
      <Title>Agent events</Title>
      <Meta name="description" content="Agent events private app surface for Stylyf Builder." />
      <Meta name="robots" content="noindex" />
      <Meta property="og:title" content="Agent events" />
      <Meta property="og:description" content="Agent events private app surface for Stylyf Builder." />
      <SidebarAppShell title="Stylyf Builder" navigation={<GeneratedNavigation shell="sidebar-app" />}>
        <ResourceIndexPageShell title="Agent events">
          <ErrorBoundary fallback={(error) => <ErrorState title="Unable to load records" detail={error instanceof Error ? error.message : String(error)} />}>
            <Show when={agentEventsRows() !== undefined} fallback={<LoadingState title="Loading agent events" description="Fetching the latest generated resource data." />}>
              <Show when={(agentEventsRows()?.length ?? 0) > 0} fallback={<EmptyState eyebrow="No records" title="No agent events yet" description="Create your first record or adjust the generated query filters." />}>
              <Stack>
                <PageHeader title="Agent events" description="Manage agent events records." />
                <FilterToolbar />
                <DataTableShell />
                <DetailPanel />
              </Stack>
              </Show>
            </Show>
          </ErrorBoundary>
        </ResourceIndexPageShell>
      </SidebarAppShell>
    </>
  );
}
