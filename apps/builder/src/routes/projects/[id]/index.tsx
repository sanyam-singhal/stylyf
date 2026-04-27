import { A, createAsync, useParams, useSubmission } from "@solidjs/router";
import { Meta, Title } from "@solidjs/meta";
import {
  ArrowLeft,
  Bot,
  Code2,
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
} from "lucide-solid";
import { For, Show, createSignal } from "solid-js";
import { demoProject, getProject } from "~/lib/server/projects";
import { getTimeline, runScreenshotReview, sendAgentPrompt, startPreview, stopPreview } from "~/lib/server/studio";

export default function ProjectStudioRoute() {
  const params = useParams();
  const [controlsVisible, setControlsVisible] = createSignal(true);
  const project = createAsync(() => getProject(params.id ?? "demo"));
  const timeline = createAsync(() => getTimeline(params.id ?? "demo"));
  const promptSubmission = useSubmission(sendAgentPrompt);
  const startPreviewSubmission = useSubmission(startPreview);
  const stopPreviewSubmission = useSubmission(stopPreview);
  const screenshotSubmission = useSubmission(runScreenshotReview);
  const activeProject = () => project() ?? demoProject;
  const projectName = () => activeProject().name;
  const pending = () => promptSubmission.pending || startPreviewSubmission.pending || stopPreviewSubmission.pending || screenshotSubmission.pending;

  return (
    <main class="app-frame app-frame--studio">
      <Title>{projectName()} Studio</Title>
      <Meta name="robots" content="noindex" />
      <section class="studio-shell" classList={{ "studio-shell--compact": !controlsVisible() }}>
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
            <article class="message message--builder">
              <strong><Bot size={15} /> Stylyf agent</strong>
              <p>
                I opened the first draft. Tell me what feels wrong, missing, or too plain.
              </p>
            </article>
            <article class="message message--user">
              <strong>Team brief</strong>
              <p>
                Make this feel like IMDb for user-generated social posts: ratings, submissions, leaderboard, and a clean
                moderation queue.
              </p>
            </article>
          </div>

          <form class="composer" action={sendAgentPrompt.with(params.id ?? "demo")} method="post">
            <label class="field-label">
              Next instruction
              <textarea
                class="input-field input-field--textarea"
                name="prompt"
                placeholder="Example: Make the leaderboard more editorial and add a clear submit-post button above the fold."
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
              <button class="button button--quiet" type="button">Attach reference <Image size={17} /></button>
            </div>
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
                <span class="browser-url">localhost:5173/social-post-ratings</span>
              </div>
              <Show
                when={activeProject().previewUrl}
                fallback={
                  <div class="preview-artboard">
                    <div class="mock-hero">
                      <span class="pill pill--coral">Community ratings</span>
                      <h3>The best social posts, ranked by people with taste.</h3>
                      <p class="body-copy">
                        Submit a TikTok, Instagram post, or tweet. The community rates originality, clarity, and cultural
                        spark.
                      </p>
                      <div class="button-row">
                        <span class="button">Submit a post</span>
                        <span class="button button--quiet">View leaderboard</span>
                      </div>
                    </div>
                    <div class="mock-grid">
                      <div class="mock-card"><span class="pill">9.2</span></div>
                      <div class="mock-card"><span class="pill">8.8</span></div>
                      <div class="mock-card"><span class="pill">8.5</span></div>
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
          <header class="pane-header">
            <div>
              <p class="eyebrow">Controls</p>
              <h2>Shape</h2>
              <p>Optional details.</p>
            </div>
            <button
              class="button button--quiet"
              type="button"
              onClick={() => setControlsVisible(value => !value)}
              aria-pressed={!controlsVisible()}
            >
              <PanelRightClose size={17} />
            </button>
          </header>

          <div class="control-list">
            <section class="control-card">
              <h3>App outline</h3>
              <label class="field-label">
                Direction
                <input class="input-field" value="Editorial rating site" />
              </label>
              <span class="pill pill--coral">Social posts</span>
            </section>

            <section class="control-card">
              <h3>Screens</h3>
              <ul>
                <li>Home</li>
                <li>Submit</li>
                <li>Leaderboard</li>
                <li>Moderation</li>
              </ul>
              <button class="button button--ink" type="button"><Code2 size={17} /> Edit details</button>
            </section>

            <section class="control-card">
              <h3>Activity</h3>
              <div class="timeline">
                <Show when={(timeline()?.length ?? 0) > 0} fallback={<p>Waiting on next instruction.</p>}>
                  <For each={timeline()}>
                    {event => (
                      <div class="timeline-item">
                        <span class="timeline-dot" />
                        <p>{event.summary ?? event.type}</p>
                      </div>
                    )}
                  </For>
                </Show>
              </div>
            </section>
          </div>
        </aside>
      </section>
    </main>
  );
}
