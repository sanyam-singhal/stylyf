import { Title } from "@solidjs/meta";
import { HttpStatusCode } from "@solidjs/start";

export default function NotFound() {
  return (
    <main class="mx-auto flex min-h-[60vh] w-full max-w-[1600px] items-center px-4 py-12 sm:px-6 lg:px-8">
      <Title>Page Not Found | Stylyf</Title>
      <HttpStatusCode code={404} />

      <section class="max-w-2xl rounded-[2rem] border border-border/70 bg-panel/92 p-8 shadow-soft">
        <div class="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">404</div>
        <h1 class="mt-4 text-4xl font-semibold tracking-tight text-foreground">This route is not part of the registry shell.</h1>
        <p class="mt-4 text-base leading-7 text-muted">
          The current first pass focuses on the continuous library page and the shared site frame. Return to the
          catalog to continue reviewing the component registry structure.
        </p>
        <a
          href="/"
          class="mt-6 inline-flex h-11 items-center rounded-full border border-border/70 bg-background px-5 text-sm font-medium text-foreground transition hover:border-accent/50"
        >
          Back to Stylyf
        </a>
      </section>
    </main>
  );
}
