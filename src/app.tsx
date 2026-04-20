import { Meta, MetaProvider, Title } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Layers3 } from "lucide-solid";
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
            content="A SolidJS + SolidStart component registry shell with tiered primitives, blocks, and route-ready modules."
          />

          <div class="relative min-h-screen overflow-x-clip bg-background text-foreground">
            <a
              href="#library"
              class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-foreground focus:px-4 focus:py-2 focus:text-background"
            >
              Skip to library
            </a>

            <header class="sticky top-0 z-40 border-b border-border/70 bg-background/88 backdrop-blur-xl">
              <div class="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
                <div class="flex min-w-0 items-center gap-3">
                  <div class="inline-flex size-11 items-center justify-center rounded-2xl border border-border/70 bg-panel shadow-soft">
                    <Layers3 class="size-5 text-accent-strong" />
                  </div>
                  <div class="min-w-0">
                    <a href="/" class="block text-lg font-semibold tracking-tight text-foreground">
                      Stylyf
                    </a>
                    <p class="truncate text-sm text-muted">
                      SolidStart registry shell for {registryCounts.total} source-owned components
                    </p>
                  </div>
                </div>

                <div class="flex items-center gap-3">
                  <div class="hidden items-center gap-2 rounded-full border border-border/70 bg-panel px-4 py-2 text-sm text-muted md:inline-flex">
                    <span>38 primitives</span>
                    <span class="text-border">/</span>
                    <span>37 compositions</span>
                    <span class="text-border">/</span>
                    <span>63 blocks</span>
                  </div>
                  <ThemeToggle />
                </div>
              </div>
            </header>

            <Suspense>{props.children}</Suspense>

            <footer class="border-t border-border/70 bg-background/88">
              <div class="mx-auto flex w-full max-w-[1600px] flex-col gap-4 px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
                <div>
                  <p class="text-sm font-medium text-foreground">Stylyf registry shell</p>
                  <p class="mt-1 text-sm text-muted">
                    Tailwind v4 tokens, SolidStart v1, and a tiered catalog ready for source-owned component implementation.
                  </p>
                </div>
                <div class="flex flex-wrap gap-2 text-sm text-muted">
                  <a href="#theme-studio" class="rounded-full border border-border/70 bg-panel px-4 py-2 transition hover:text-foreground">
                    Theme studio
                  </a>
                  <a href="#library" class="rounded-full border border-border/70 bg-panel px-4 py-2 transition hover:text-foreground">
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
