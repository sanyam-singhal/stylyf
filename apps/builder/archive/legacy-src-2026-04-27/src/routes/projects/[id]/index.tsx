import { Meta, Title } from "@solidjs/meta";
import { ErrorBoundary, For, Show, createSignal, type JSX } from "solid-js";
import { createAsync, useParams, useSubmission } from "@solidjs/router";
import { Bot, Braces, Camera, CheckCircle2, Eye, GitBranch, MessageSquareText, MonitorPlay, Play, Save, ShieldCheck, SlidersHorizontal, WandSparkles } from "lucide-solid";
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
import { runWebknifeScreenshot, runWebknifeUiReview } from "~/lib/server/actions/webknife-loop";
import { saveIrDraft } from "~/lib/server/actions/ir-draft";
import { getActiveIrDraft } from "~/lib/server/queries/ir-draft";
import { commitAndPushProject } from "~/lib/server/actions/git-loop";

function StudioPanel(props: {
  children: JSX.Element;
  class?: string;
  icon: JSX.Element;
  open: boolean;
  subtitle: string;
  title: string;
  onToggle: () => void;
}) {
  return (
    <section class={`builder-collapsible ${props.class ?? ""}`}>
      <button type="button" class="builder-collapsible-trigger" onClick={props.onToggle} aria-expanded={props.open}>
        <span>{props.icon} {props.title}</span>
        <small>{props.subtitle}</small>
        <span class="builder-collapsible-mark" aria-hidden="true">{props.open ? "-" : "+"}</span>
      </button>
      <Show when={props.open}>
        <div class="builder-collapsible-body">{props.children}</div>
      </Show>
    </section>
  );
}

export default function ProjectsIdRoute() {
  const params = useParams();
  const [chatOpen, setChatOpen] = createSignal(true);
  const [outlineOpen, setOutlineOpen] = createSignal(true);
  const [previewOpen, setPreviewOpen] = createSignal(true);
  const [handoffOpen, setHandoffOpen] = createSignal(false);
  const projectData = createAsync(() => getProjects(params.id ?? ""));
  const timeline = createAsync(() => getWorkbenchTimeline(params.id ?? ""));
  const activeIr = createAsync(() => getActiveIrDraft(params.id ?? ""));
  const stylyfSubmission = useSubmission(runStylyfProjectStep);
  const startPreviewSubmission = useSubmission(startProjectPreview);
  const stopPreviewSubmission = useSubmission(stopProjectPreview);
  const agentSubmission = useSubmission(sendAgentPrompt);
  const approvalSubmission = useSubmission(decideApproval);
  const webknifeSubmission = useSubmission(runWebknifeScreenshot);
  const webknifeReviewSubmission = useSubmission(runWebknifeUiReview);
  const irSubmission = useSubmission(saveIrDraft);
  const gitSubmission = useSubmission(commitAndPushProject);
  const pending = () => stylyfSubmission.pending || startPreviewSubmission.pending || stopPreviewSubmission.pending || agentSubmission.pending || approvalSubmission.pending || webknifeSubmission.pending || webknifeReviewSubmission.pending || irSubmission.pending || gitSubmission.pending;
  return (
    <>
      <Title>Project workbench</Title>
      <Meta name="description" content="Project workbench private app surface for Stylyf Builder." />
      <Meta name="robots" content="noindex" />
      <Meta property="og:title" content="Project workbench" />
      <Meta property="og:description" content="Project workbench private app surface for Stylyf Builder." />
      <SidebarAppShell
        title="Stylyf Builder"
        description="Build and refine this app draft with chat, controls, preview, and review history."
        navigation={<GeneratedNavigation shell="sidebar-app" />}
      >
        <ResourceDetailPageShell
          title="App studio"
          description="Chat with the builder, adjust the app outline, preview the result, and keep a clean handoff trail for the dev team."
        >
          <ErrorBoundary fallback={(error) => <ErrorState title="Unable to load record" detail={error instanceof Error ? error.message : String(error)} />}>
            <Show when={projectData() !== undefined} fallback={<LoadingState title="Loading project" description="Fetching this generated resource record." />}>
              <Show when={projectData()} fallback={<EmptyState eyebrow="Not found" title="Project not found" description="The requested record was not returned by the generated detail query." />}>
              <Stack>
                <PageHeader
                  eyebrow="Draft"
                  title={projectData()?.name ?? "Project workbench"}
                  description={projectData()?.summary || "Use chat to describe the first version. The app outline below gives you a few friendly controls when chat feels too broad."}
                  meta={
                    <>
                      <span class="ui-chip ui-chip-accent">{projectData()?.status ?? "draft"}</span>
                      <span class="ui-chip ui-chip-muted">{projectData()?.previewUrl ? "Preview running" : "Preview not started"}</span>
                      <span class="ui-chip ui-chip-muted">{projectData()?.githubRepoFullName ? "Dev handoff ready" : "Private draft"}</span>
                    </>
                  }
                />
                <div class="grid gap-[var(--space-4)] md:grid-cols-4">
                  <div class="builder-kpi"><MessageSquareText class="mb-3 size-5 text-primary" /><div class="font-semibold">Next request</div><p class="text-sm text-muted-foreground">Tell the builder what to change.</p></div>
                  <div class="builder-kpi"><SlidersHorizontal class="mb-3 size-5 text-secondary-foreground" /><div class="font-semibold">App outline</div><p class="text-sm text-muted-foreground">{activeIr() ? `Saved draft v${activeIr()?.version}` : "Not saved yet"}</p></div>
                  <div class="builder-kpi"><Eye class="mb-3 size-5 text-info" /><div class="font-semibold">Preview</div><p class="text-sm text-muted-foreground">{projectData()?.previewUrl ? "Ready to inspect" : "Start when a draft exists"}</p></div>
                  <div class="builder-kpi"><CheckCircle2 class="mb-3 size-5 text-success" /><div class="font-semibold">Review trail</div><p class="text-sm text-muted-foreground">{timeline()?.events.length ?? 0} updates recorded</p></div>
                </div>
                <div class="builder-studio-grid">
                  <StudioPanel
                    icon={<MessageSquareText class="size-4" />}
                    title="Chat with the builder"
                    subtitle="Describe the next change in plain English"
                    open={chatOpen()}
                    onToggle={() => setChatOpen(open => !open)}
                  >
                      <form action={sendAgentPrompt.with(params.id ?? "")} method="post" class="space-y-3">
                        <textarea
                          name="prompt"
                          required
                          rows="7"
                          class="builder-input min-h-44 text-sm"
                          placeholder="Example: Make this a polished rating site for user-submitted TikToks and Instagram posts. Add a clean homepage, submission flow, leaderboard, and moderation queue."
                        />
                        <div class="flex items-center justify-between gap-3">
                          <p class="text-xs text-muted-foreground">The builder records the request, works inside this project, and keeps the result reviewable.</p>
                          <Button type="submit" leftIcon={<Bot class="size-4" />} pending={pending()}>Send request</Button>
                        </div>
                        <Show when={agentSubmission.result}>
                          {result => <p class="text-sm text-muted-foreground">{result().message}</p>}
                        </Show>
                      </form>
                  </StudioPanel>

                  <StudioPanel
                    icon={<SlidersHorizontal class="size-4" />}
                    title="App outline"
                    subtitle="Use this when you want more direct control than chat"
                    open={outlineOpen()}
                    onToggle={() => setOutlineOpen(open => !open)}
                  >
                    <form action={saveIrDraft.with(params.id ?? "")} method="post" class="space-y-4">
                      <div class="grid gap-3 md:grid-cols-2">
                        <label class="space-y-1 text-sm">
                          <span class="font-medium text-foreground">App name</span>
                          <input name="appName" class="builder-input" value={projectData()?.name ?? ""} />
                        </label>
                        <label class="space-y-1 text-sm">
                          <span class="font-medium text-foreground">App kind</span>
                          <select name="appKind" class="builder-input">
                            <option value="generic">Generic</option>
                            <option value="internal-tool" selected>Internal tool</option>
                            <option value="cms-site">CMS</option>
                            <option value="free-saas-tool">Free SaaS tool</option>
                          </select>
                        </label>
                        <label class="space-y-1 text-sm">
                          <span class="font-medium text-foreground">Theme</span>
                          <select name="theme" class="builder-input">
                            <option value="opal" selected>Opal</option>
                            <option value="amber">Amber</option>
                            <option value="emerald">Emerald</option>
                            <option value="pearl">Pearl</option>
                          </select>
                        </label>
                        <label class="space-y-1 text-sm">
                          <span class="font-medium text-foreground">Primary object</span>
                          <input name="objectName" class="builder-input" value="records" />
                        </label>
                      </div>
                      <label class="space-y-1 text-sm">
                        <span class="font-medium text-foreground">Brief</span>
                        <textarea name="brief" rows="4" class="builder-input" placeholder="Who is this for, what should they do, and what should the first version include?">{projectData()?.summary ?? ""}</textarea>
                      </label>
                      <div class="grid gap-3 md:grid-cols-2">
                        <label class="space-y-1 text-sm">
                          <span class="font-medium text-foreground">Important details to track</span>
                          <input name="fields" class="builder-input" value="title,status,summary" />
                        </label>
                        <label class="space-y-1 text-sm">
                          <span class="font-medium text-foreground">Main screens</span>
                          <input name="routes" class="builder-input" value="Dashboard,Records,New Record,Settings" />
                        </label>
                      </div>
                      <div class="rounded-[var(--radius-xl)] border border-border/80 bg-muted-soft p-3">
                        <p class="text-sm font-semibold text-foreground">Advanced JSON override</p>
                        <label class="mt-3 block space-y-1 text-sm">
                          <span class="font-medium text-foreground">Only use this if the visual controls are too limited.</span>
                          <textarea name="rawSpec" rows="8" class="builder-input font-mono text-xs" placeholder="Optional: paste a complete Stylyf JSON spec to use instead of the pane values.">{activeIr()?.spec ?? ""}</textarea>
                        </label>
                      </div>
                      <div class="flex items-center justify-between gap-3">
                        <p class="text-xs text-muted-foreground">
                          Saved outline: {activeIr() ? `v${activeIr()?.version}` : "none yet"}. The builder uses the latest saved outline.
                        </p>
                        <Button type="submit" leftIcon={<Save class="size-4" />} pending={pending()}>Save outline</Button>
                      </div>
                      <Show when={irSubmission.result}>
                        {result => <p class="text-sm text-muted-foreground">Saved app outline v{result().version}.</p>}
                      </Show>
                    </form>
                  </StudioPanel>

                  <StudioPanel
                    class="builder-preview-panel"
                    icon={<Eye class="size-4" />}
                    title="Live preview"
                    subtitle="Generate, open, and screenshot the current app"
                    open={previewOpen()}
                    onToggle={() => setPreviewOpen(open => !open)}
                  >
                      <div class="space-y-4">
                        <div class="flex flex-wrap gap-2">
                          <form action={runStylyfProjectStep.with(params.id ?? "", "validate")} method="post">
                            <Button type="submit" tone="outline" leftIcon={<ShieldCheck class="size-4" />} pending={pending()}>Check outline</Button>
                          </form>
                          <form action={runStylyfProjectStep.with(params.id ?? "", "plan")} method="post">
                            <Button type="submit" tone="outline" leftIcon={<Braces class="size-4" />} pending={pending()}>Preview plan</Button>
                          </form>
                          <form action={runStylyfProjectStep.with(params.id ?? "", "generate")} method="post">
                            <Button type="submit" leftIcon={<WandSparkles class="size-4" />} pending={pending()}>Build app draft</Button>
                          </form>
                          <form action={startProjectPreview.with(params.id ?? "")} method="post">
                            <Button type="submit" tone="outline" leftIcon={<Play class="size-4" />} pending={pending()}>Open preview</Button>
                          </form>
                          <form action={stopProjectPreview.with(params.id ?? "")} method="post">
                            <Button type="submit" tone="ghost" pending={pending()}>Stop preview</Button>
                          </form>
                          <form action={runWebknifeScreenshot.with(params.id ?? "")} method="post">
                            <Button type="submit" tone="outline" leftIcon={<Camera class="size-4" />} pending={pending()}>Take screenshot</Button>
                          </form>
                          <form action={runWebknifeUiReview.with(params.id ?? "")} method="post">
                            <Button type="submit" tone="outline" leftIcon={<ShieldCheck class="size-4" />} pending={pending()}>Review polish</Button>
                          </form>
                        </div>
                        <Show when={stylyfSubmission.result}>
                          {result => (
                            <div class="rounded-[var(--radius-lg)] border border-border/80 bg-muted-soft p-3 text-sm text-muted-foreground">
                              {result().step === "validate" ? "Outline check" : result().step === "plan" ? "Preview plan" : "App draft"} {result().ok ? "completed" : "failed"}.
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
                        <Show when={webknifeSubmission.result}>
                          {result => (
                            <div class="rounded-[var(--radius-lg)] border border-border/80 bg-muted-soft p-3 text-sm text-muted-foreground">
                              Screenshot check {result().ok ? "completed" : "failed"}.
                            </div>
                          )}
                        </Show>
                        <Show when={webknifeReviewSubmission.result}>
                          {result => (
                            <div class="rounded-[var(--radius-lg)] border border-border/80 bg-muted-soft p-3 text-sm text-muted-foreground">
                              Polish review {result().ok ? "completed" : "failed"}.
                            </div>
                          )}
                        </Show>
                        <Show when={projectData()?.previewUrl || startPreviewSubmission.result?.previewUrl} fallback={
                          <div class="builder-preview-empty">
                            <MonitorPlay class="size-7" />
                            <p class="font-semibold text-foreground">No preview yet</p>
                            <p>Build an app draft, then open the preview here.</p>
                          </div>
                        }>
                          {previewUrl => (
                            <div class="builder-preview-frame">
                              <iframe
                                src={previewUrl()}
                                title="Generated app preview"
                                class="h-[42rem] w-full bg-background"
                                sandbox="allow-forms allow-scripts allow-same-origin allow-popups"
                              />
                            </div>
                          )}
                        </Show>
                      </div>
                  </StudioPanel>

                  <StudioPanel
                    icon={<CheckCircle2 class="size-4" />}
                    title="Review trail and handoff"
                    subtitle="For dev review, screenshots, and accepted progress"
                    open={handoffOpen()}
                    onToggle={() => setHandoffOpen(open => !open)}
                  >
                    <div class="space-y-5">
                      <form action={commitAndPushProject.with(params.id ?? "")} method="post" class="space-y-2 rounded-[var(--radius-lg)] border border-border/80 bg-background p-3">
                        <label class="space-y-1 text-sm">
                          <span class="font-medium text-foreground">Handoff note</span>
                          <input
                            name="message"
                            class="builder-input"
                            value="Accept app draft update"
                          />
                        </label>
                        <Button type="submit" tone="outline" leftIcon={<GitBranch class="size-4" />} pending={pending()}>Save handoff checkpoint</Button>
                        <Show when={gitSubmission.result}>
                          {result => <p class="text-sm text-muted-foreground">Handoff recorded{result().repoFullName ? ` for ${result().repoFullName}` : " locally"}.</p>}
                        </Show>
                      </form>

                  <DetailPanel
                    title="Approvals"
                    description="Requests that need a deliberate yes/no decision appear here."
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
                <div class="grid gap-[var(--space-5)] lg:grid-cols-2">
                  <DetailPanel
                    title="Activity"
                    description="A plain record of what happened in this draft."
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
                    title="Behind-the-scenes checks"
                    description="Useful when a teammate asks why something did or did not work."
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
                <DetailPanel
                  title="Screenshots"
                  description="Visual review artifacts for the current draft."
                  body={
                    <div class="space-y-3 text-sm text-muted-foreground">
                      <Show when={(timeline()?.webknifeRuns.length ?? 0) > 0} fallback={<p>No screenshots yet. Open a preview, then take a screenshot.</p>}>
                        <For each={timeline()?.webknifeRuns ?? []}>
                          {run => (
                            <div class="rounded-[var(--radius-lg)] border border-border/80 bg-background p-3">
                              <p class="font-medium text-foreground">{run.kind}</p>
                              <p>{run.summary}</p>
                              <p class="mt-1 text-xs">Artifacts: {run.artifact_path}</p>
                            </div>
                          )}
                        </For>
                      </Show>
                    </div>
                    }
                  />
                <DetailPanel
                  title="Developer handoff"
                  description="Checkpoints the dev team can review later."
                  body={
                    <div class="space-y-3 text-sm text-muted-foreground">
                      <Show when={(timeline()?.gitEvents.length ?? 0) > 0} fallback={<p>No handoff checkpoints yet.</p>}>
                        <For each={timeline()?.gitEvents ?? []}>
                          {event => (
                            <div class="rounded-[var(--radius-lg)] border border-border/80 bg-background p-3">
                              <p class="font-medium text-foreground">{event.kind}</p>
                              <p>{event.summary}</p>
                              <Show when={event.repo_full_name}>
                                <p class="mt-1 text-xs">Repo: {event.repo_full_name}</p>
                              </Show>
                            </div>
                          )}
                        </For>
                      </Show>
                    </div>
                  }
                />
                    </div>
                  </StudioPanel>
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
