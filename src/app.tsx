import { Meta, MetaProvider, Title } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Compass, Layers3 } from "lucide-solid";
import { Suspense } from "solid-js";
import { ThemeToggle } from "~/components/theme-toggle";
import { registryCounts } from "~/lib/registry";
import "./app.css";

export default function App() {
  return (
    <Router
      root={props => (
        <MetaProvider>
          <Title>Stylyf</Title>
          <Meta
            name="description"
            content="A SolidJS + SolidStart component registry shell organized around role-based clusters and source-owned components."
          />

          <div class="relative min-h-screen overflow-x-clip bg-background text-foreground">
            <a
              href="#library"
              class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-foreground focus:px-4 focus:py-2 focus:text-background"
            >
              Skip to library
            </a>

            <header class="sticky top-0 z-40 border-b border-border/80 bg-background/94 backdrop-blur-xl">
              <div class="mx-auto grid w-full max-w-[1600px] grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
                <div class="hidden items-center gap-2 md:flex">
                  <a href="#theme-studio" class="ui-pillbar px-3 py-2 text-sm text-muted-foreground transition hover:text-foreground">
                    Theme selector
                  </a>
                  <a href="#library" class="ui-pillbar px-3 py-2 text-sm text-muted-foreground transition hover:text-foreground">
                    Registry
                  </a>
                </div>

                <a href="/" class="justify-self-center text-center">
                  <div class="mx-auto inline-flex items-center gap-3 rounded-[var(--radius-2xl)] border border-border/80 bg-card px-4 py-2.5 shadow-soft">
                    <span class="inline-flex size-10 items-center justify-center rounded-[var(--radius-xl)] bg-[color-mix(in_oklab,var(--primary)_18%,var(--card)_82%)] text-primary shadow-inset">
                      <Layers3 class="size-[1.125rem]" />
                    </span>
                    <span class="block">
                      <span class="block text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">SolidStart registry</span>
                      <span class="mt-0.5 block text-xl font-semibold tracking-[-0.03em] text-foreground">Stylyf</span>
                    </span>
                  </div>
                </a>

                <div class="flex items-center justify-self-end gap-3">
                  <div class="ui-pillbar hidden items-center gap-2 px-4 py-2 text-sm text-muted-foreground xl:inline-flex">
                    <Compass class="size-4 text-primary" />
                    <span>{registryCounts.clusters} clusters</span>
                    <span class="text-border">/</span>
                    <span>{registryCounts.total} components</span>
                  </div>
                  <ThemeToggle />
                </div>
              </div>
            </header>

            <Suspense>{props.children}</Suspense>

            <footer class="border-t border-border/80 bg-background/96">
              <div class="mx-auto flex w-full max-w-[1600px] flex-col gap-4 px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
                <div>
                  <p class="text-sm font-medium text-foreground">Stylyf registry shell</p>
                  <p class="mt-1 text-sm text-muted-foreground">
                    Tailwind v4 tokens, SolidStart v1, and a cluster-first catalog for source-owned component implementation.
                  </p>
                </div>
                <div class="flex flex-wrap gap-2 text-sm text-muted-foreground">
                  <a href="#theme-studio" class="ui-pillbar px-4 py-2 transition hover:text-foreground">
                    Theme studio
                  </a>
                  <a href="#library" class="ui-pillbar px-4 py-2 transition hover:text-foreground">
                    Library
                  </a>
                </div>
              </div>
            </footer>
          </div>
        </MetaProvider>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
