import { Title } from "@solidjs/meta";
import { HttpStatusCode } from "@solidjs/start";

export default function NotFound() {
  return (
    <main class="mx-auto flex min-h-[60vh] w-full max-w-7xl items-center px-4 py-12 sm:px-6 lg:px-8">
      <Title>Page Not Found | Stylyf</Title>
      <HttpStatusCode code={404} />

      <section class="ui-shell max-w-2xl p-8">
        <div class="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">404</div>
        <h1 class="mt-4 text-4xl font-semibold tracking-tight text-foreground">This page is not part of the Stylyf landing site.</h1>
        <p class="mt-4 text-base leading-7 text-muted-foreground">
          The public web app is now intentionally small and focused on the CLI. Head back to the homepage for the repo,
          install commands, and backend mode overview.
        </p>
        <a
          href="/"
          class="mt-6 inline-flex h-11 items-center rounded-[var(--radius-xl)] border border-border bg-card px-5 text-sm font-medium text-foreground transition hover:border-primary/40"
        >
          Back to Stylyf
        </a>
      </section>
    </main>
  );
}
