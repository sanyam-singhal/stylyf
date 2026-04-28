import { A, useSubmission } from "@solidjs/router";
import { Meta, Title } from "@solidjs/meta";
import { ArrowLeft, ArrowRight } from "lucide-solid";
import { Show } from "solid-js";
import { createProject } from "~/lib/server/projects";

export default function NewProjectRoute() {
  const submission = useSubmission(createProject);

  return (
    <main class="app-frame">
      <Title>Create an app draft</Title>
      <Meta name="robots" content="noindex" />
      <section class="new-project-shell">
        <div class="new-project-copy surface--ink">
          <A href="/" class="pill">← Back to dashboard</A>
          <p class="eyebrow">New app</p>
          <h1 class="display-title">Give the idea a name.</h1>
          <p class="body-copy" style={{ color: "color-mix(in oklab, var(--builder-paper) 72%, transparent)" }}>
            Keep it short. You can describe the actual product in the studio.
          </p>
        </div>

        <form class="new-project-form surface" action={createProject} method="post">
          <p class="eyebrow">Create</p>
          <label class="field-label">
            App name
            <input class="input-field" name="name" placeholder="Name your app" autocomplete="off" required />
          </label>
          <Show when={submission.error}>
            {error => <p class="prompt-example" role="alert">{error().message}</p>}
          </Show>
          <div class="button-row">
            <button class="button" type="submit" disabled={submission.pending}>
              {submission.pending ? "Creating..." : "Create and open studio"} <ArrowRight size={18} />
            </button>
            <A href="/" class="button button--quiet"><ArrowLeft size={18} /> Cancel</A>
          </div>
        </form>
      </section>
    </main>
  );
}
