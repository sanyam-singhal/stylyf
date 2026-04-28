import { A, createAsync, revalidate, useParams, useSubmission } from "@solidjs/router";
import { Meta, Title } from "@solidjs/meta";
import {
  ArrowLeft,
  Bot,
  Code2,
  Download,
  Folder,
  GitBranch,
  HelpCircle,
  Home,
  Image,
  LayoutGrid,
  MessageCircle,
  MonitorPlay,
  PanelRightClose,
  Plus,
  Send,
  Sparkles,
  Trash2,
} from "lucide-solid";
import { For, Show, createEffect, createSignal, type JSX } from "solid-js";
import { demoProject, getProject } from "~/lib/server/projects";
import {
  buildGeneratedApp,
  checkGeneratedApp,
  composeSpec,
  generateDraft,
  getSpecChunks,
  installGeneratedApp,
  planSpec,
  saveSpecChunk,
  validateSpec,
  type SpecChunkKind,
} from "~/lib/server/specs";
import { getTimeline, runScreenshotReview, sendAgentPrompt, startPreview, stopPreview, type TimelineEvent } from "~/lib/server/studio";

type UploadIntentResponse =
  | {
      ok: true;
      assetId: string;
      upload: {
        url: string;
        method: "PUT";
        headers: Record<string, string>;
      };
    }
  | { ok: false; error: string };

type UploadConfirmResponse = { ok: true; fileName: string | null } | { ok: false; error: string };
type ReferenceAsset = {
  id: string;
  fileName: string | null;
  contentType: string | null;
  fileSize: number | null;
  status: string;
  createdAt: string;
};
type ListReferencesResponse = { ok: true; assets: ReferenceAsset[] } | { ok: false; error: string };
type DownloadResponse =
  | { ok: true; fileName: string | null; download: { url: string; method: "GET" } }
  | { ok: false; error: string };
type DeleteResponse = { ok: true; assetId: string } | { ok: false; error: string };

const specPaneKinds: { kind: SpecChunkKind; label: string }[] = [
  { kind: "brief", label: "Brief" },
  { kind: "style", label: "Style" },
  { kind: "routes", label: "Screens" },
  { kind: "data", label: "Data" },
  { kind: "api", label: "API" },
  { kind: "media", label: "Media" },
  { kind: "raw", label: "Raw" },
];

const specPaneDefaultText: Record<SpecChunkKind, string> = {
  brief: `{
  "app": {
    "description": "A focused app draft shaped through Stylyf Builder."
  }
}`,
  style: `{
  "experience": {
    "theme": "opal",
    "mode": "light",
    "radius": "trim",
    "density": "comfortable",
    "spacing": "balanced"
  }
}`,
  routes: `{
  "surfaces": [
    {
      "name": "Home",
      "kind": "dashboard",
      "path": "/",
      "audience": "user"
    }
  ]
}`,
  data: `{
  "objects": []
}`,
  api: `{
  "apis": [],
  "server": []
}`,
  media: `{
  "media": {
    "mode": "rich"
  }
}`,
  raw: "{}",
};

export default function ProjectStudioRoute() {
  const params = useParams();
  const [referenceStatus, setReferenceStatus] = createSignal("");
  const [referencePending, setReferencePending] = createSignal(false);
  const [referenceAssets, setReferenceAssets] = createSignal<ReferenceAsset[]>([]);
  const [activeSpecKind, setActiveSpecKind] = createSignal<SpecChunkKind>("brief");
  let referenceInput!: HTMLInputElement;
  const project = createAsync(() => getProject(params.id ?? "demo"));
  const timeline = createAsync(() => getTimeline(params.id ?? "demo"));
  const specChunks = createAsync(() => getSpecChunks(params.id ?? "demo"));
  const promptSubmission = useSubmission(sendAgentPrompt);
  const startPreviewSubmission = useSubmission(startPreview);
  const stopPreviewSubmission = useSubmission(stopPreview);
  const screenshotSubmission = useSubmission(runScreenshotReview);
  const saveSpecSubmission = useSubmission(saveSpecChunk);
  const composeSpecSubmission = useSubmission(composeSpec);
  const validateSpecSubmission = useSubmission(validateSpec);
  const planSpecSubmission = useSubmission(planSpec);
  const generateDraftSubmission = useSubmission(generateDraft);
  const installGeneratedAppSubmission = useSubmission(installGeneratedApp);
  const checkGeneratedAppSubmission = useSubmission(checkGeneratedApp);
  const buildGeneratedAppSubmission = useSubmission(buildGeneratedApp);
  const activeProject = () => project() ?? demoProject;
  const projectName = () => activeProject().name;
  const pending = () =>
    promptSubmission.pending ||
    startPreviewSubmission.pending ||
    stopPreviewSubmission.pending ||
    screenshotSubmission.pending ||
    saveSpecSubmission.pending ||
    composeSpecSubmission.pending ||
    validateSpecSubmission.pending ||
    planSpecSubmission.pending ||
    generateDraftSubmission.pending ||
    installGeneratedAppSubmission.pending ||
    checkGeneratedAppSubmission.pending ||
    buildGeneratedAppSubmission.pending ||
    referencePending();
  const activeSpecChunk = () => specChunks()?.find(chunk => chunk.kind === activeSpecKind());
  const activeSpecText = () => activeSpecChunk()?.spec_text ?? specPaneDefaultText[activeSpecKind()];
  const orderedTimeline = () => [...(timeline() ?? [])].reverse();
  const chatTimeline = () =>
    orderedTimeline().filter(event =>
      ["user.prompt", "message", "turn.started", "turn.completed", "session.error"].includes(event.type),
    );
  const eventSpeaker = (event: TimelineEvent) => {
    if (event.role === "user" || event.type === "user.prompt") return "You";
    if (event.role === "tool") return "Tool";
    if (event.status === "failed" || event.type === "session.error") return "Builder issue";
    if (event.role === "system") return "System";
    return "Stylyf agent";
  };
  const eventText = (event: TimelineEvent) => event.content ?? event.summary ?? event.type;

  const refreshReferenceAssets = async (projectId = params.id ?? "demo") => {
    if (projectId === "demo") {
      setReferenceAssets([]);
      return;
    }
    const response = await fetch(`/api/attachments/list?projectId=${encodeURIComponent(projectId)}`);
    const result = (await response.json()) as ListReferencesResponse;
    if (!result.ok) throw new Error(result.error);
    setReferenceAssets(result.assets);
  };

  createEffect(() => {
    void refreshReferenceAssets(params.id ?? "demo").catch(error => {
      setReferenceStatus(error instanceof Error ? error.message : "Could not load references.");
    });
  });

  const handleReferenceSelected: JSX.EventHandler<HTMLInputElement, Event> = async event => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    if ((params.id ?? "demo") === "demo") {
      setReferenceStatus("Open a real project before attaching references.");
      return;
    }

    setReferencePending(true);
    setReferenceStatus(`Uploading ${file.name}...`);
    try {
      const intentResponse = await fetch("/api/attachments/intent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          projectId: params.id,
          fileName: file.name,
          contentType: file.type || "application/octet-stream",
          fileSize: file.size,
        }),
      });
      const intent = (await intentResponse.json()) as UploadIntentResponse;
      if (!intent.ok) throw new Error(intent.error);

      const uploadResponse = await fetch(intent.upload.url, {
        method: intent.upload.method,
        headers: intent.upload.headers,
        body: file,
      });
      if (!uploadResponse.ok) throw new Error(`Reference upload failed at storage (${uploadResponse.status}).`);

      const confirmResponse = await fetch("/api/attachments/confirm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ projectId: params.id, assetId: intent.assetId }),
      });
      const confirmed = (await confirmResponse.json()) as UploadConfirmResponse;
      if (!confirmed.ok) throw new Error(confirmed.error);

      setReferenceStatus(confirmed.fileName ? `Attached ${confirmed.fileName}.` : "Reference attached.");
      await revalidate(getTimeline.keyFor(params.id ?? "demo"));
      await refreshReferenceAssets();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Reference upload failed.";
      setReferenceStatus(message === "Failed to fetch" ? "Upload is blocked by storage permissions. Ask dev team to allow this builder origin." : message);
    } finally {
      setReferencePending(false);
    }
  };

  const handleOpenReference = async (assetId: string) => {
    setReferenceStatus("Opening reference...");
    try {
      const response = await fetch("/api/attachments/download", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ projectId: params.id, assetId }),
      });
      const result = (await response.json()) as DownloadResponse;
      if (!result.ok) throw new Error(result.error);
      window.open(result.download.url, "_blank", "noopener,noreferrer");
      setReferenceStatus(result.fileName ? `Opened ${result.fileName}.` : "Opened reference.");
    } catch (error) {
      setReferenceStatus(error instanceof Error ? error.message : "Could not open reference.");
    }
  };

  const handleDeleteReference = async (assetId: string) => {
    setReferenceStatus("Deleting reference...");
    try {
      const response = await fetch("/api/attachments/delete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ projectId: params.id, assetId }),
      });
      const result = (await response.json()) as DeleteResponse;
      if (!result.ok) throw new Error(result.error);
      setReferenceStatus("Reference deleted.");
      await revalidate(getTimeline.keyFor(params.id ?? "demo"));
      await refreshReferenceAssets();
    } catch (error) {
      setReferenceStatus(error instanceof Error ? error.message : "Could not delete reference.");
    }
  };

  return (
    <main class="app-frame app-frame--studio">
      <Title>{projectName()} Studio</Title>
      <Meta name="robots" content="noindex" />
      <section class="studio-shell">
        <aside class="mini-rail" aria-label="Studio navigation">
          <span class="mini-rail__logo">s</span>
          <A href="/" class="mini-rail__button" aria-label="Home"><Home size={21} /></A>
          <A href="/projects/new" class="mini-rail__button" aria-label="New app"><Plus size={22} /></A>
          <A href="/projects/demo" class="mini-rail__button mini-rail__button--active" aria-label="Studio"><MessageCircle size={21} /></A>
          <span class="mini-rail__button" aria-label="Files"><Folder size={21} /></span>
          <span class="mini-rail__button" aria-label="Screens"><LayoutGrid size={21} /></span>
          <span class="mini-rail__spacer" />
          <span class="mini-rail__button" aria-label="Help"><HelpCircle size={21} /></span>
        </aside>

        <aside class="studio-pane chat-pane surface">
          <header class="pane-header">
            <div>
              <p class="eyebrow">Chat</p>
              <h1>{projectName()}</h1>
              <p>Tell the builder what to change next.</p>
            </div>
            <A href="/" class="pill" aria-label="Back to dashboard"><ArrowLeft size={15} /> Dashboard</A>
          </header>

          <div class="message-stream">
            <Show
              when={chatTimeline().length > 0}
              fallback={
                <article class="message message--builder">
                  <strong><Bot size={15} /> Stylyf agent</strong>
                  <p>Describe the first useful draft. I’ll keep the work tracked and reviewable.</p>
                </article>
              }
            >
              <For each={chatTimeline()}>
                {event => (
                  <article
                    class="message"
                    classList={{
                      "message--user": event.role === "user" || event.type === "user.prompt",
                      "message--builder": event.role !== "user" && event.type !== "user.prompt",
                    }}
                  >
                    <strong>{eventSpeaker(event)}</strong>
                    <p>{eventText(event)}</p>
                    <Show when={event.status === "failed"}>
                      <span class="pill pill--coral">Needs review</span>
                    </Show>
                  </article>
                )}
              </For>
            </Show>
            <Show when={promptSubmission.pending}>
              <article class="message message--builder">
                <strong><Bot size={15} /> Stylyf agent</strong>
                <p>Working through the project workspace now...</p>
              </article>
            </Show>
          </div>

          <form class="composer" action={sendAgentPrompt.with(params.id ?? "demo")} method="post">
            <label class="field-label">
              Next instruction
              <textarea
                class="input-field input-field--textarea"
                name="prompt"
                placeholder="Example: Make the opening screen warmer, add a clear main action, and simplify the next step."
                required
              />
            </label>
            <Show when={promptSubmission.error}>
              {error => <p class="prompt-example" role="alert">{error().message}</p>}
            </Show>
            <div class="button-row">
              <button class="button" type="submit" disabled={pending()}>
                {promptSubmission.pending ? "Sending..." : "Send to builder"} <Send size={17} />
              </button>
              <button class="button button--quiet" type="button" disabled={pending()} onClick={() => referenceInput.click()}>
                {referencePending() ? "Uploading..." : "Attach reference"} <Image size={17} />
              </button>
            </div>
            <input
              ref={referenceInput}
              class="visually-hidden"
              type="file"
              onChange={handleReferenceSelected}
              aria-label="Attach design reference"
            />
            <Show when={referenceStatus()}>
              {status => <p class="prompt-example" role="status">{status()}</p>}
            </Show>
            <Show when={(referenceAssets()?.length ?? 0) > 0}>
              <div class="reference-list" aria-label="Attached references">
                <For each={referenceAssets()}>
                  {asset => (
                    <article class="reference-item">
                      <div>
                        <strong>{asset.fileName ?? "Reference file"}</strong>
                        <span>{asset.contentType ?? "file"} · {asset.status}</span>
                      </div>
                      <div class="reference-item__actions">
                        <button class="icon-button" type="button" onClick={() => handleOpenReference(asset.id)} aria-label={`Open ${asset.fileName ?? "reference"}`}>
                          <Download size={16} />
                        </button>
                        <button class="icon-button icon-button--danger" type="button" onClick={() => handleDeleteReference(asset.id)} aria-label={`Delete ${asset.fileName ?? "reference"}`}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </article>
                  )}
                </For>
              </div>
            </Show>
          </form>
        </aside>

        <section class="studio-pane preview-pane surface">
          <header class="pane-header">
            <div>
              <p class="eyebrow">Preview</p>
              <h2>{projectName()}</h2>
              <p>Inspect the app while you chat.</p>
            </div>
            <div class="button-row">
              <form action={startPreview.with(params.id ?? "demo")} method="post">
                <button class="button button--quiet" type="submit" disabled={pending()}><MonitorPlay size={17} /> Open</button>
              </form>
              <form action={stopPreview.with(params.id ?? "demo")} method="post">
                <button class="button button--quiet" type="submit" disabled={pending()}>Stop</button>
              </form>
              <form action={runScreenshotReview.with(params.id ?? "demo")} method="post">
                <button class="button" type="submit" disabled={pending()}>
                  <Sparkles size={17} /> {screenshotSubmission.pending ? "Reviewing..." : "Screenshot review"}
                </button>
              </form>
            </div>
          </header>

          <div class="preview-stage">
            <div class="browser-chrome" aria-label="Generated app preview mock">
              <div class="browser-bar">
                <span class="browser-dot" />
                <span class="browser-dot" />
                <span class="browser-dot" />
                <span class="browser-url">localhost:5173/app-draft</span>
              </div>
              <Show
                when={activeProject().previewUrl}
                fallback={
                  <div class="preview-artboard">
                    <div class="mock-hero">
                      <span class="pill pill--coral">Draft preview</span>
                      <h3>Your working app will appear here.</h3>
                      <p class="body-copy">
                        Build the draft, install it, then open preview. The builder will keep each step visible in the
                        review trail.
                      </p>
                      <div class="button-row">
                        <span class="button">Build draft</span>
                        <span class="button button--quiet">Open preview</span>
                      </div>
                    </div>
                    <div class="mock-grid">
                      <div class="mock-card"><span class="pill">Home</span></div>
                      <div class="mock-card"><span class="pill">Create</span></div>
                      <div class="mock-card"><span class="pill">Review</span></div>
                    </div>
                  </div>
                }
              >
                {previewUrl => <iframe class="preview-frame" src={previewUrl()} title={`${projectName()} preview`} />}
              </Show>
            </div>
          </div>

          <footer class="preview-footer">
            <span class="pill"><GitBranch size={15} /> Last commit pushed</span>
            <span class="pill pill--coral">{activeProject().previewUrl ? "Preview open" : "Ready for another instruction"}</span>
          </footer>
        </section>

        <aside class="studio-pane control-rail surface" aria-label="Project controls">
          <details class="control-details">
            <summary class="pane-header control-summary" aria-label="Toggle advanced controls">
              <div>
                <p class="eyebrow">Controls</p>
                <h2>Shape</h2>
                <p>Optional details.</p>
              </div>
              <span class="button button--quiet control-summary-icon" aria-hidden="true">
                <PanelRightClose size={17} />
              </span>
            </summary>

            <div class="control-list">
            <section class="control-card">
              <h3>Spec panes</h3>
              <div class="spec-tabs" role="tablist" aria-label="Stylyf spec panes">
                <For each={specPaneKinds}>
                  {pane => (
                    <button
                      class="spec-tab"
                      classList={{ "spec-tab--active": activeSpecKind() === pane.kind }}
                      type="button"
                      role="tab"
                      aria-selected={activeSpecKind() === pane.kind}
                      onClick={() => setActiveSpecKind(pane.kind)}
                    >
                      {pane.label}
                    </button>
                  )}
                </For>
              </div>
              <form class="spec-editor" action={saveSpecChunk.with(params.id ?? "demo")} method="post">
                <input type="hidden" name="kind" value={activeSpecKind()} />
                <label class="field-label">
                  {specPaneKinds.find(pane => pane.kind === activeSpecKind())?.label ?? "Spec"} JSON
                  <textarea class="input-field input-field--code" name="specText" spellcheck={false} wrap="soft">
                    {activeSpecText()}
                  </textarea>
                </label>
                <button class="button button--ink" type="submit" disabled={pending()}>
                  {saveSpecSubmission.pending ? "Saving..." : "Save pane"}
                </button>
              </form>
              <Show when={saveSpecSubmission.error}>
                {error => <p class="prompt-example" role="alert">{error().message}</p>}
              </Show>
            </section>

            <section class="control-card">
              <h3>Stylyf loop</h3>
              <p>Turn saved panes into a working app draft, then run the generated app checks.</p>
              <div class="spec-action-grid">
                <form action={composeSpec.with(params.id ?? "demo")} method="post">
                  <button class="button button--quiet" type="submit" disabled={pending()}><Code2 size={17} /> Prepare outline</button>
                </form>
                <form action={validateSpec.with(params.id ?? "demo")} method="post">
                  <button class="button button--quiet" type="submit" disabled={pending()}>Check outline</button>
                </form>
                <form action={planSpec.with(params.id ?? "demo")} method="post">
                  <button class="button button--quiet" type="submit" disabled={pending()}>Preview plan</button>
                </form>
                <form action={generateDraft.with(params.id ?? "demo")} method="post">
                  <button class="button button--ink" type="submit" disabled={pending()}>Build draft</button>
                </form>
                <form action={installGeneratedApp.with(params.id ?? "demo")} method="post">
                  <button class="button button--quiet" type="submit" disabled={pending()}>Install app</button>
                </form>
                <form action={checkGeneratedApp.with(params.id ?? "demo")} method="post">
                  <button class="button button--quiet" type="submit" disabled={pending()}>Quality check</button>
                </form>
                <form action={buildGeneratedApp.with(params.id ?? "demo")} method="post">
                  <button class="button button--ink" type="submit" disabled={pending()}>Production build</button>
                </form>
              </div>
              <Show
                when={
                  composeSpecSubmission.error ??
                  validateSpecSubmission.error ??
                  planSpecSubmission.error ??
                  generateDraftSubmission.error ??
                  installGeneratedAppSubmission.error ??
                  checkGeneratedAppSubmission.error ??
                  buildGeneratedAppSubmission.error
                }
              >
                {error => <p class="prompt-example" role="alert">{error().message}</p>}
              </Show>
            </section>

            <section class="control-card">
              <h3>Activity</h3>
              <div class="timeline">
                <Show when={(timeline()?.length ?? 0) > 0} fallback={<p>Waiting on next instruction.</p>}>
                  <For each={timeline()}>
                    {event => (
                      <div class="timeline-item">
                        <span class="timeline-dot" />
                        <p>
                          {event.summary ?? event.type}
                          <Show when={event.artifact_path}>
                            {artifactPath => <small> Artifact: {artifactPath()}</small>}
                          </Show>
                        </p>
                      </div>
                    )}
                  </For>
                </Show>
              </div>
            </section>
            </div>
          </details>
        </aside>
      </section>
    </main>
  );
}
