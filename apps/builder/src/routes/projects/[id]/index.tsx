import { Meta, Title } from "@solidjs/meta";
import { ErrorBoundary, For, Show } from "solid-js";
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
import { startProjectPreview, stopProjectPreview } from "~/lib/server/actions/preview-loop";
import { decideApproval, sendAgentPrompt } from "~/lib/server/actions/agent-loop";
import { getWorkbenchTimeline } from "~/lib/server/queries/workbench-timeline";

export default function ProjectsIdRoute() {
  const params = useParams();
  const projectData = createAsync(() => getProjects(params.id ?? ""));
  const timeline = createAsync(() => getWorkbenchTimeline(params.id ?? ""));
  const stylyfSubmission = useSubmission(runStylyfProjectStep);
  const startPreviewSubmission = useSubmission(startProjectPreview);
  const stopPreviewSubmission = useSubmission(stopProjectPreview);
  const agentSubmission = useSubmission(sendAgentPrompt);
  const approvalSubmission = useSubmission(decideApproval);
  const pending = () => stylyfSubmission.pending || startPreviewSubmission.pending || stopPreviewSubmission.pending || agentSubmission.pending || approvalSubmission.pending;
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
                    title="Agent chat"
                    description="Prompts are recorded first. Risky operations queue explicit approval before execution."
                    body={
                      <form action={sendAgentPrompt.with(params.id ?? "")} method="post" class="space-y-3">
                        <textarea
                          name="prompt"
                          required
                          rows="5"
                          class="min-h-32 w-full rounded-[var(--radius-lg)] border border-border bg-background px-3 py-2 text-sm text-foreground shadow-inner outline-none transition focus:border-primary"
                          placeholder="Describe the next iteration. Example: make the rating app homepage feel more editorial and add moderation queue affordances."
                        />
                        <div class="flex items-center justify-between gap-3">
                          <p class="text-xs text-muted-foreground">The current adapter records the loop; Codex App Server plugs into the same event stream.</p>
                          <Button type="submit" pending={pending()}>Send prompt</Button>
                        </div>
                        <Show when={agentSubmission.result}>
                          {result => <p class="text-sm text-muted-foreground">{result().message}</p>}
                        </Show>
                      </form>
                    }
                  />
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
                          <form action={startProjectPreview.with(params.id ?? "")} method="post">
                            <Button type="submit" tone="outline" pending={pending()}>Start preview</Button>
                          </form>
                          <form action={stopProjectPreview.with(params.id ?? "")} method="post">
                            <Button type="submit" tone="ghost" pending={pending()}>Stop preview</Button>
                          </form>
                        </div>
                        <Show when={stylyfSubmission.result}>
                          {result => (
                            <div class="rounded-[var(--radius-lg)] border border-border/80 bg-muted-soft p-3 text-sm text-muted-foreground">
                              Step {result().step} {result().ok ? "completed" : "failed"} with exit code {String(result().exitCode)}.
                            </div>
                          )}
                        </Show>
                        <Show when={startPreviewSubmission.result}>
                          {result => (
                            <div class="rounded-[var(--radius-lg)] border border-border/80 bg-muted-soft p-3 text-sm text-muted-foreground">
                              Preview started on <a class="font-medium text-foreground underline" href={result().previewUrl} target="_blank">{result().previewUrl}</a>.
                            </div>
                          )}
                        </Show>
                      </div>
                    }
                  />
                  <DetailPanel
                    title="Approvals"
                    description="Sensitive changes stay visible and require a deliberate operator decision."
                    body={
                      <div class="space-y-3 text-sm text-muted-foreground">
                        <Show when={(timeline()?.approvals.length ?? 0) > 0} fallback={<p>No approval requests yet.</p>}>
                          <For each={timeline()?.approvals ?? []}>
                            {approval => (
                              <div class="rounded-[var(--radius-lg)] border border-border/80 bg-background p-3">
                                <div class="flex items-start justify-between gap-3">
                                  <div>
                                    <p class="font-medium text-foreground">{approval.type}</p>
                                    <p>{approval.summary}</p>
                                    <p class="mt-1 text-xs uppercase tracking-[0.16em]">{approval.status}</p>
                                  </div>
                                  <Show when={approval.status === "pending"}>
                                    <div class="flex shrink-0 gap-2">
                                      <form action={decideApproval.with(approval.id, "approved")} method="post">
                                        <Button type="submit" tone="outline" pending={pending()}>Approve</Button>
                                      </form>
                                      <form action={decideApproval.with(approval.id, "denied")} method="post">
                                        <Button type="submit" tone="ghost" pending={pending()}>Deny</Button>
                                      </form>
                                    </div>
                                  </Show>
                                </div>
                              </div>
                            )}
                          </For>
                        </Show>
                      </div>
                    }
                  />
                </div>
                <div class="grid gap-[var(--space-5)] lg:grid-cols-2">
                  <DetailPanel
                    title="Timeline"
                    description="Recent agent events and command outcomes for this project."
                    body={
                      <div class="space-y-3 text-sm text-muted-foreground">
                        <Show when={(timeline()?.events.length ?? 0) > 0} fallback={<p>No timeline events yet.</p>}>
                          <For each={timeline()?.events ?? []}>
                            {event => (
                              <div class="rounded-[var(--radius-lg)] border border-border/80 bg-background p-3">
                                <p class="font-medium text-foreground">{event.type}</p>
                                <p>{event.summary}</p>
                              </div>
                            )}
                          </For>
                        </Show>
                      </div>
                    }
                  />
                  <DetailPanel
                    title="Commands"
                    description="Every CLI, install, check, and preview command is logged with redacted output paths."
                    body={
                      <div class="space-y-3 text-sm text-muted-foreground">
                        <Show when={(timeline()?.commands.length ?? 0) > 0} fallback={<p>No commands have run yet.</p>}>
                          <For each={timeline()?.commands ?? []}>
                            {command => (
                              <div class="rounded-[var(--radius-lg)] border border-border/80 bg-background p-3">
                                <p class="font-medium text-foreground">{command.command}</p>
                                <p>Status: {command.status} · Exit: {String(command.exit_code ?? "n/a")}</p>
                              </div>
                            )}
                          </For>
                        </Show>
                      </div>
                    }
                  />
                </div>
                <Show when={projectData()?.previewUrl || startPreviewSubmission.result?.previewUrl}>
                  {previewUrl => (
                    <DetailPanel
                      title="Live preview"
                      description="The iframe points at the managed local dev process for this generated app."
                      body={
                        <div class="overflow-hidden rounded-[var(--radius-xl)] border border-border bg-background shadow-soft">
                          <iframe
                            src={previewUrl()}
                            title="Generated app preview"
                            class="h-[42rem] w-full bg-background"
                            sandbox="allow-forms allow-scripts allow-same-origin allow-popups"
                          />
                        </div>
                      }
                    />
                  )}
                </Show>
              </Stack>
              </Show>
            </Show>
          </ErrorBoundary>
        </ResourceDetailPageShell>
      </SidebarAppShell>
    </>
  );
}
