import { Meta, Title } from "@solidjs/meta";
import { ErrorBoundary, Show } from "solid-js";
import { createAsync, useParams, useSubmission } from "@solidjs/router";
import { SidebarAppShell } from "~/components/shells/app/sidebar-app";
import { GeneratedNavigation } from "~/components/generated-navigation";
import { ResourceDetailPageShell } from "~/components/shells/page/resource-detail";
import { Stack } from "~/components/layout/stack";
import { DetailPanel } from "~/components/registry/data-views/detail-panel";
import { Button } from "~/components/registry/actions-navigation/button";
import { EmptyState } from "~/components/registry/information-states/empty-state";
import { ErrorState } from "~/components/registry/information-states/error-state";
import { LoadingState } from "~/components/registry/information-states/loading-state";
import { PageHeader } from "~/components/registry/information-states/page-header";
import { getProjects } from "~/lib/server/queries/projects-detail";
import { runStylyfProjectStep } from "~/lib/server/actions/stylyf-loop";

export default function ProjectsIdRoute() {
  const params = useParams();
  const projectData = createAsync(() => getProjects(params.id ?? ""));
  const stylyfSubmission = useSubmission(runStylyfProjectStep);
  const pending = () => stylyfSubmission.pending;
  return (
    <>
      <Title>Project workbench</Title>
      <Meta name="description" content="Project workbench private app surface for Stylyf Builder." />
      <Meta name="robots" content="noindex" />
      <Meta property="og:title" content="Project workbench" />
      <Meta property="og:description" content="Project workbench private app surface for Stylyf Builder." />
      <SidebarAppShell title="Stylyf Builder" navigation={<GeneratedNavigation shell="sidebar-app" />}>
        <ResourceDetailPageShell title="Project workbench">
          <ErrorBoundary fallback={(error) => <ErrorState title="Unable to load record" detail={error instanceof Error ? error.message : String(error)} />}>
            <Show when={projectData() !== undefined} fallback={<LoadingState title="Loading project" description="Fetching this generated resource record." />}>
              <Show when={projectData()} fallback={<EmptyState eyebrow="Not found" title="Project not found" description="The requested record was not returned by the generated detail query." />}>
              <Stack>
                <PageHeader
                  title={projectData()?.name ?? "Project workbench"}
                  description={projectData()?.summary || "Draft, validate, plan, and generate the standalone app source from this workspace."}
                />
                <div class="grid gap-[var(--space-5)] lg:grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.75fr)]">
                  <DetailPanel
                    title="Stylyf generation loop"
                    description="Run each step visibly. Logs are written into the project workspace and mirrored into the builder timeline."
                    body={
                      <div class="space-y-4">
                        <div class="grid gap-2 text-sm text-muted-foreground">
                          <span>Status: {projectData()?.status ?? "unknown"}</span>
                          <span>Workspace: {projectData()?.workspacePath ?? "created on first generation step"}</span>
                          <span>Preview: {projectData()?.previewUrl ?? "not running"}</span>
                          <span>Repo: {projectData()?.githubRepoFullName ?? "not connected"}</span>
                        </div>
                        <div class="flex flex-wrap gap-2">
                          <form action={runStylyfProjectStep.with(params.id ?? "", "validate")} method="post">
                            <Button type="submit" tone="outline" pending={pending()}>Validate spec</Button>
                          </form>
                          <form action={runStylyfProjectStep.with(params.id ?? "", "plan")} method="post">
                            <Button type="submit" tone="outline" pending={pending()}>Plan generation</Button>
                          </form>
                          <form action={runStylyfProjectStep.with(params.id ?? "", "generate")} method="post">
                            <Button type="submit" pending={pending()}>Generate app</Button>
                          </form>
                        </div>
                        <Show when={stylyfSubmission.result}>
                          {result => (
                            <div class="rounded-[var(--radius-lg)] border border-border/80 bg-muted-soft p-3 text-sm text-muted-foreground">
                              Step {result().step} {result().ok ? "completed" : "failed"} with exit code {String(result().exitCode)}.
                            </div>
                          )}
                        </Show>
                      </div>
                    }
                  />
                  <DetailPanel
                    title="Current handoff"
                    description="The builder does not deploy apps. It prepares a repo-backed source tree for dev review."
                    body={
                      <div class="space-y-2 text-sm text-muted-foreground">
                        <p>Generated app source lands under the project workspace.</p>
                        <p>Future steps wire preview, Codex, Webknife, commits, pushes, and handoff state.</p>
                      </div>
                    }
                  />
                </div>
              </Stack>
              </Show>
            </Show>
          </ErrorBoundary>
        </ResourceDetailPageShell>
      </SidebarAppShell>
    </>
  );
}
