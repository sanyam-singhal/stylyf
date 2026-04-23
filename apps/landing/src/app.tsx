import { Meta, MetaProvider, Title } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { GitBranch, Layers3, Package2 } from "lucide-solid";
import { Suspense } from "solid-js";
import { ThemeToggle } from "~/components/theme-toggle";
import "./app.css";

export default function App() {
  return (
    <Router
      root={props => (
        <MetaProvider>
          <Title>Stylyf</Title>
          <Meta
            name="description"
            content="Stylyf is a JSON-driven CLI for generating standalone full-stack SolidStart apps with a reusable UI inventory and two backend paths."
          />

          <div class="min-h-screen bg-background text-foreground">
            <header class="sticky top-0 z-40 border-b border-border/80 bg-background/92 backdrop-blur-xl">
              <div class="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
                <a href="/" class="inline-flex items-center gap-3">
                  <span class="inline-flex size-11 items-center justify-center rounded-[var(--radius-xl)] border border-border bg-card text-primary shadow-soft">
                    <Layers3 class="size-5" />
                  </span>
                  <span>
                    <span class="block text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                      Full-stack assembly line
                    </span>
                    <span class="block text-xl font-semibold tracking-[-0.03em] text-foreground">Stylyf</span>
                  </span>
                </a>

                <div class="hidden items-center gap-2 md:flex">
                  <a href="#capabilities" class="ui-pillbar px-3 py-2 text-sm text-muted-foreground transition hover:text-foreground">
                    Capabilities
                  </a>
                  <a href="#modes" class="ui-pillbar px-3 py-2 text-sm text-muted-foreground transition hover:text-foreground">
                    Backend modes
                  </a>
                  <a href="#quickstart" class="ui-pillbar px-3 py-2 text-sm text-muted-foreground transition hover:text-foreground">
                    Quickstart
                  </a>
                </div>

                <div class="flex items-center gap-3">
                  <a
                    href="https://www.npmjs.com/package/@depths/stylyf-cli"
                    target="_blank"
                    rel="noreferrer"
                    class="ui-pillbar hidden items-center gap-2 px-4 py-2 text-sm text-muted-foreground transition hover:text-foreground sm:inline-flex"
                  >
                    <Package2 class="size-4" />
                    <span>@depths/stylyf-cli</span>
                  </a>
                  <ThemeToggle />
                </div>
              </div>
            </header>

            <Suspense>{props.children}</Suspense>

            <footer class="border-t border-border/80 bg-background/96">
              <div class="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
                <p>Stylyf ships generated apps as ordinary SolidStart source code, not runtime magic.</p>
                <div class="flex flex-wrap gap-3">
                  <a href="https://github.com/Depths-AI/stylyf" target="_blank" rel="noreferrer" class="transition hover:text-foreground">
                    GitHub
                  </a>
                  <a href="https://www.npmjs.com/package/@depths/stylyf-cli" target="_blank" rel="noreferrer" class="transition hover:text-foreground">
                    npm
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
