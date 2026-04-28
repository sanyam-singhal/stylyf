import { A, createAsync } from "@solidjs/router";
import { Meta, Title } from "@solidjs/meta";
import { ErrorBoundary, For, Show } from "solid-js";
import { ArrowRight, BadgeCheck, GalleryVerticalEnd, MessageSquareText, Sparkles, WandSparkles } from "lucide-solid";
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
        description="Create useful internal apps from a short plain-English idea."
        navigation={<GeneratedNavigation shell="sidebar-app" />}
        headerActions={<A href="/projects/new"><Button rightIcon={<ArrowRight class="size-4" />}>Create new app</Button></A>}
      >
        <ResourceIndexPageShell
          title="App studio"
          description="Start with a name, describe what the app should help people do, then review the draft visually as it takes shape."
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
                      description="Name the app, then use the studio to explain what it should do. You can preview, refine, and hand it to the dev team when it feels right."
                      actions={<A href="/projects/new"><Button rightIcon={<ArrowRight class="size-4" />}>Start a draft</Button></A>}
                    />
                    <div class="builder-panel-ink space-y-5 p-[var(--space-6)]">
                      <p class="text-xs font-semibold uppercase tracking-[0.22em] text-ink-foreground/50">How it works</p>
                      <div class="space-y-4">
                        <div><p class="font-semibold text-ink-foreground">1. Say what you want</p><p class="text-sm leading-6 text-ink-foreground/62">Describe the app like you would brief a teammate.</p></div>
                        <div><p class="font-semibold text-ink-foreground">2. Shape the draft</p><p class="text-sm leading-6 text-ink-foreground/62">Use chat and friendly controls to refine pages, data, style, and behavior.</p></div>
                        <div><p class="font-semibold text-ink-foreground">3. Review the result</p><p class="text-sm leading-6 text-ink-foreground/62">Open the live preview, inspect screenshots, then ask for the next change.</p></div>
                      </div>
                    </div>
                  </div>
                }
              >
              <Stack>
                <div class="grid gap-[var(--space-4)] md:grid-cols-3">
                  <div class="builder-action-card">
                    <MessageSquareText class="mb-3 size-5 text-primary" />
                    <h3>Describe the app</h3>
                    <p>Tell the builder what the app should help users accomplish.</p>
                  </div>
                  <div class="builder-action-card">
                    <GalleryVerticalEnd class="mb-3 size-5 text-info" />
                    <h3>Review screens</h3>
                    <p>Preview the draft in the browser and ask for visual changes.</p>
                  </div>
                  <div class="builder-action-card">
                    <BadgeCheck class="mb-3 size-5 text-success" />
                    <h3>Hand off cleanly</h3>
                    <p>When the draft is useful, the dev team can review and deploy it.</p>
                  </div>
                </div>
                <PageHeader title="Your app drafts" description="Continue a draft or start a new one. Each project keeps its own conversation, preview, and review history." />
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
                            <p class="min-h-12 text-sm leading-6 text-muted-foreground">{project.summary || "No brief yet. Open the studio and describe the first version."}</p>
                            <div class="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              <span class="ui-chip ui-chip-accent">Open studio</span>
                              <span>{project.previewUrl ? "Preview running" : "Preview not started"}</span>
                              <span>{project.githubRepoFullName ? "Ready for dev review" : "Local draft"}</span>
                            </div>
                          </A>
                        )}
                      </For>
                    </div>
                  }
                />
                <DetailPanel
                  title="Good first app ideas"
                  description="This studio is best for focused tools: a small workflow, a dashboard, a content queue, a rating site, or a lightweight internal system."
                  body={<div class="grid gap-3 text-sm text-muted-foreground md:grid-cols-3"><p class="builder-kpi"><WandSparkles class="mb-2 size-4 text-primary" />A public voting or rating page.</p><p class="builder-kpi"><GalleryVerticalEnd class="mb-2 size-4 text-primary" />A gallery, directory, or showcase.</p><p class="builder-kpi"><BadgeCheck class="mb-2 size-4 text-primary" />A private review or approval queue.</p></div>}
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
