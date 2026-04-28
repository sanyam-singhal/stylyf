import { A, createAsync } from "@solidjs/router";
import { Meta, Title } from "@solidjs/meta";
import { ArrowRight, Clock3, GalleryVerticalEnd, HelpCircle, Home, LayoutGrid, Plus, Sparkles, UsersRound } from "lucide-solid";
import { ErrorBoundary, For, Show } from "solid-js";
import { demoProject, listProjects } from "~/lib/server/projects";

export default function DashboardRoute() {
  const projects = createAsync(() => listProjects());
  const visibleProjects = () => {
    const rows = projects();
    return rows && rows.length > 0 ? rows : [demoProject];
  };

  return (
    <main class="app-frame">
      <Title>Stylyf Builder</Title>
      <Meta name="robots" content="noindex" />
      <div class="builder-workspace">
        <aside class="mini-rail" aria-label="Builder navigation">
          <span class="mini-rail__logo">s</span>
          <A href="/" class="mini-rail__button mini-rail__button--active" aria-label="Home"><Home size={21} /></A>
          <A href="/projects/new" class="mini-rail__button" aria-label="New app"><Plus size={22} /></A>
          <A href="/projects/demo" class="mini-rail__button" aria-label="Studio"><LayoutGrid size={21} /></A>
          <span class="mini-rail__spacer" />
          <span class="mini-rail__button" aria-label="Help"><HelpCircle size={21} /></span>
        </aside>

        <div class="dashboard-shell">
          <header class="dashboard-topbar surface">
            <A href="/" class="dashboard-brand" aria-label="Stylyf Builder home">
              <span class="brand-mark">s</span>
              <span>Stylyf Builder</span>
            </A>
            <nav class="button-row" aria-label="Primary actions">
              <A href="/projects/new" class="button">Start new app <Plus size={18} /></A>
            </nav>
          </header>

          <div class="dashboard-content">
            <section class="dashboard-hero">
              <div class="hero-copy surface">
                <p class="eyebrow">App drafts</p>
                <div class="hero-copy__text">
                  <h1 class="section-title">Build a small app from an idea.</h1>
                </div>
                <p class="body-copy">Describe what you need. We’ll turn it into a working draft you can refine.</p>
                <div class="button-row">
                  <A href="/projects/new" class="button">Start new app <Plus size={18} /></A>
                  <A href="/projects/demo" class="button button--quiet">Continue demo</A>
                </div>
              </div>

              <A href="/projects/new" class="draft-card draft-card--create surface">
                <div class="draft-card__header">
                  <div>
                    <span class="pill pill--coral"><Sparkles size={15} /> New</span>
                    <h2 style={{ "margin-top": "var(--space-4)" }}>Start with one sentence.</h2>
                  </div>
                  <ArrowRight size={24} />
                </div>
                <p>Name the app now. Shape everything else inside the studio.</p>
              </A>
            </section>

            <section>
              <p class="eyebrow" style={{ "margin-bottom": "var(--space-4)" }}>What you can build</p>
              <div class="buildable-grid">
                <A href="/projects/new" class="buildable-card surface">
                  <span class="buildable-icon"><UsersRound size={28} /></span>
                  <div>
                    <h2>Community hubs</h2>
                    <p>Share, vote, discuss, and review.</p>
                  </div>
                </A>
                <A href="/projects/new" class="buildable-card surface">
                  <span class="buildable-icon"><GalleryVerticalEnd size={28} /></span>
                  <div>
                    <h2>Content galleries</h2>
                    <p>Showcase posts, images, videos, and collections.</p>
                  </div>
                </A>
                <A href="/projects/new" class="buildable-card surface">
                  <span class="buildable-icon"><Clock3 size={28} /></span>
                  <div>
                    <h2>Simple tools</h2>
                    <p>Trackers, forms, queues, and dashboards.</p>
                  </div>
                </A>
              </div>
            </section>

            <section>
              <p class="eyebrow" style={{ "margin-bottom": "var(--space-4)" }}>App drafts</p>
              <ErrorBoundary fallback={<p class="prompt-example">Could not load app drafts.</p>}>
                <Show when={projects() !== undefined} fallback={<p class="prompt-example">Loading drafts...</p>}>
                  <div class="draft-gallery">
                    <For each={visibleProjects()}>
                      {project => (
                        <A href={`/projects/${project.id}`} class="gallery-card surface" aria-label={`Open ${project.name}`}>
                          <div class="gallery-card__image" />
                          <div class="gallery-card__body">
                            <span class="pill">{project.status}</span>
                            <h3>{project.name}</h3>
                            <p>{project.summary ?? "Open the studio and describe the first version."}</p>
                          </div>
                        </A>
                      )}
                    </For>
                    <A href="/projects/new" class="gallery-card surface" aria-label="Create new app">
                      <div class="gallery-card__image" />
                      <div class="gallery-card__body">
                        <span class="pill pill--coral">New</span>
                        <h3>Fresh idea</h3>
                        <p>Open a blank studio and start shaping a new app.</p>
                      </div>
                    </A>
                  </div>
                </Show>
              </ErrorBoundary>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
