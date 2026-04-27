import { A, createAsync } from "@solidjs/router";
import { Meta, Title } from "@solidjs/meta";
import { ErrorBoundary, For, Show } from "solid-js";
import { ArrowRight, Bot, Boxes, GitBranch, MonitorPlay, Sparkles } from "lucide-solid";
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
        headerActions={<A href="/projects/new"><Button rightIcon={<ArrowRight class="size-4" />}>Create project</Button></A>}
      >
        <ResourceIndexPageShell
          title="App factory"
          description="Start from a short brief, tighten the IR visually, generate the repo, and keep the whole loop inspectable."
        >
          <ErrorBoundary fallback={(error) => <ErrorState title="Unable to load records" detail={error instanceof Error ? error.message : String(error)} />}>
            <Show when={projectsRows() !== undefined} fallback={<LoadingState title="Loading projects" description="Fetching the latest generated resource data." />}>
              <Show
                when={(projectsRows()?.length ?? 0) > 0}
                fallback={
                  <div class="grid gap-[var(--space-5)] xl:grid-cols-[minmax(0,1fr)_22rem]">
                    <EmptyState
                      class="min-h-[26rem]"
                      icon={<Sparkles class="size-6" />}
                      eyebrow="No projects"
                      title="Create your first app draft"
                      description="Give the builder a product idea. The first draft becomes a real SolidStart repo with IR, preview, visual QA, and git handoff already wired."
                      actions={<A href="/projects/new"><Button rightIcon={<ArrowRight class="size-4" />}>Open project composer</Button></A>}
                    />
                    <div class="builder-panel-ink space-y-5 p-[var(--space-6)]">
                      <p class="text-xs font-semibold uppercase tracking-[0.22em] text-ink-foreground/50">What happens next</p>
                      <div class="space-y-4">
                        <div><p class="font-semibold text-ink-foreground">1. Shape the app brief</p><p class="text-sm leading-6 text-ink-foreground/62">Capture audience, surface, data object, and desired polish.</p></div>
                        <div><p class="font-semibold text-ink-foreground">2. Generate source</p><p class="text-sm leading-6 text-ink-foreground/62">Stylyf emits standalone code that can leave this repo.</p></div>
                        <div><p class="font-semibold text-ink-foreground">3. Review visually</p><p class="text-sm leading-6 text-ink-foreground/62">Webknife screenshots keep the iteration grounded in what users see.</p></div>
                      </div>
                    </div>
                  </div>
                }
              >
              <Stack>
                <div class="grid gap-[var(--space-4)] md:grid-cols-4">
                  <div class="builder-kpi">
                    <Sparkles class="mb-3 size-5 text-primary" />
                    <div class="text-2xl font-semibold tracking-[-0.04em]">{projectsRows()?.length ?? 0}</div>
                    <p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">Projects</p>
                  </div>
                  <div class="builder-kpi">
                    <Boxes class="mb-3 size-5 text-secondary-foreground" />
                    <div class="text-2xl font-semibold tracking-[-0.04em]">IR</div>
                    <p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">Composable specs</p>
                  </div>
                  <div class="builder-kpi">
                    <MonitorPlay class="mb-3 size-5 text-info" />
                    <div class="text-2xl font-semibold tracking-[-0.04em]">QA</div>
                    <p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">Webknife loop</p>
                  </div>
                  <div class="builder-kpi">
                    <GitBranch class="mb-3 size-5 text-success" />
                    <div class="text-2xl font-semibold tracking-[-0.04em]">Git</div>
                    <p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">Auto push</p>
                  </div>
                </div>
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
                  body={<div class="grid gap-3 text-sm text-muted-foreground md:grid-cols-4"><p class="builder-kpi"><Bot class="mb-2 size-4 text-primary" />Capture brief and style intent.</p><p class="builder-kpi"><Boxes class="mb-2 size-4 text-primary" />Compose Stylyf IR and generate app source.</p><p class="builder-kpi"><MonitorPlay class="mb-2 size-4 text-primary" />Run Codex and Webknife inside the workspace.</p><p class="builder-kpi"><GitBranch class="mb-2 size-4 text-primary" />Commit and push accepted changes.</p></div>}
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
