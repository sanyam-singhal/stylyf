import { A, createAsync } from "@solidjs/router";
import { Meta, Title } from "@solidjs/meta";
import { ErrorBoundary, For, Show } from "solid-js";
import { SidebarAppShell } from "~/components/shells/app/sidebar-app";
import { GeneratedNavigation } from "~/components/generated-navigation";
import { ResourceIndexPageShell } from "~/components/shells/page/resource-index";
import { Stack } from "~/components/layout/stack";
import { DataTableShell } from "~/components/registry/data-views/data-table-shell";
import { DetailPanel } from "~/components/registry/data-views/detail-panel";
import { Button } from "~/components/registry/actions-navigation/button";
import { EmptyState } from "~/components/registry/information-states/empty-state";
import { ErrorState } from "~/components/registry/information-states/error-state";
import { LoadingState } from "~/components/registry/information-states/loading-state";
import { PageHeader } from "~/components/registry/information-states/page-header";
import { listProjects } from "~/lib/server/queries/projects-list";

export default function IndexRoute() {
  const projectsRows = createAsync(() => listProjects());
  return (
    <>
      <Title>Projects</Title>
      <Meta name="description" content="Projects private app surface for Stylyf Builder." />
      <Meta name="robots" content="noindex" />
      <Meta property="og:title" content="Projects" />
      <Meta property="og:description" content="Projects private app surface for Stylyf Builder." />
      <SidebarAppShell
        title="Stylyf Builder"
        description="Internal AI app factory for prompt-to-repo SolidStart drafts."
        navigation={<GeneratedNavigation shell="sidebar-app" />}
        headerActions={<A href="/projects/new"><Button>Create project</Button></A>}
      >
        <ResourceIndexPageShell title="Projects">
          <ErrorBoundary fallback={(error) => <ErrorState title="Unable to load records" detail={error instanceof Error ? error.message : String(error)} />}>
            <Show when={projectsRows() !== undefined} fallback={<LoadingState title="Loading projects" description="Fetching the latest generated resource data." />}>
              <Show when={(projectsRows()?.length ?? 0) > 0} fallback={<EmptyState eyebrow="No projects" title="Create your first app draft" description="Start with a brief. Stylyf will turn it into IR, Codex will iterate in the workspace, and Webknife will validate the preview." />}>
              <Stack>
                <PageHeader title="Project dashboard" description="Every accepted iteration becomes a commit and push to a Depths AI repository." />
                <DataTableShell
                  table={
                    <div class="grid gap-[var(--space-4)] lg:grid-cols-2">
                      <For each={projectsRows()}>
                        {project => (
                          <A href={`/projects/${project.id}`} class="ui-shell group block space-y-3 border border-border/80 p-[var(--space-5)] transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-soft">
                            <div class="flex items-start justify-between gap-4">
                              <div>
                                <h3 class="text-lg font-semibold tracking-[-0.02em] text-foreground">{project.name}</h3>
                                <p class="text-sm text-muted-foreground">{project.slug}</p>
                              </div>
                              <span class="ui-chip ui-chip-muted">{project.status}</span>
                            </div>
                            <p class="min-h-12 text-sm leading-6 text-muted-foreground">{project.summary || "No summary yet."}</p>
                            <div class="grid gap-2 text-xs text-muted-foreground">
                              <span>Workspace: {project.workspacePath || "pending"}</span>
                              <span>Repo: {project.githubRepoFullName || "not connected"}</span>
                              <span>Last push: {project.lastPushedSha || "none"}</span>
                            </div>
                          </A>
                        )}
                      </For>
                    </div>
                  }
                />
                <DetailPanel
                  title="Builder loop"
                  description="The v1.1 control plane is intentionally constrained: scaffold, preview, validate, commit, push, then hand off for dev review."
                  body={<div class="space-y-2 text-sm text-muted-foreground"><p>1. Capture brief and style intent.</p><p>2. Compose Stylyf IR and generate app source.</p><p>3. Run Codex and Webknife inside the workspace.</p><p>4. Commit and push accepted changes.</p></div>}
                />
              </Stack>
              </Show>
            </Show>
          </ErrorBoundary>
        </ResourceIndexPageShell>
      </SidebarAppShell>
    </>
  );
}
