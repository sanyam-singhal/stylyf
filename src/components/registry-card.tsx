import { For, Show } from "solid-js";
import { ArrowRight, Dot } from "lucide-solid";
import { CopyButton } from "~/components/copy-button";
import { PreviewShell } from "~/components/preview-shell";
import { cn } from "~/lib/cn";
import { sourceFor, targetPath, type RegistryItem } from "~/lib/registry";

function pillTone(index: number) {
  const tones = [
    "border-accent/30 bg-accent/10 text-accent-strong",
    "border-highlight/30 bg-highlight/12 text-highlight-strong",
    "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
  ];

  return tones[index % tones.length];
}

export function RegistryCard(props: { item: RegistryItem }) {
  const source = sourceFor(props.item);

  return (
    <article
      id={props.item.slug}
      class="scroll-mt-28 rounded-[1.8rem] border border-border/70 bg-panel/92 p-6 shadow-soft backdrop-blur-sm lg:p-7"
    >
      <div class="flex flex-col gap-5">
        <header class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-muted">
              <span>{props.item.tierLabel}</span>
              <Dot class="size-3" />
              <span>{props.item.clusterLabel}</span>
            </div>
            <div class="mt-3 flex flex-wrap items-center gap-3">
              <h3 class="text-2xl font-semibold tracking-tight text-foreground">{props.item.name}</h3>
              <span class="rounded-full border border-border/70 bg-background px-3 py-1 text-xs text-muted">
                {props.item.registryShape}
              </span>
            </div>
            <p class="mt-3 max-w-3xl text-sm leading-6 text-muted">{props.item.description}</p>
          </div>
          <div class="flex items-center gap-3">
            <CopyButton value={source} />
            <a
              href={`#${props.item.slug}`}
              class="inline-flex h-9 items-center gap-2 rounded-full border border-border/70 bg-background px-3 text-xs font-medium text-muted transition hover:border-accent/50 hover:text-foreground"
            >
              <span>Deep link</span>
              <ArrowRight class="size-3.5" />
            </a>
          </div>
        </header>

        <div class="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <PreviewShell item={props.item} />

          <div class="rounded-[1.5rem] border border-border/70 bg-background-subtle p-5 shadow-inset">
            <div class="flex items-center justify-between gap-3">
              <div>
                <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">Starter source</div>
                <div class="mt-1 text-sm text-foreground">{targetPath(props.item)}</div>
              </div>
              <CopyButton class="hidden sm:inline-flex" value={source} />
            </div>
            <pre class="mt-4 max-h-[28rem] overflow-auto rounded-[1.2rem] border border-border/70 bg-ink px-4 py-4 text-[12px] leading-6 text-ink-foreground">
              <code>{source}</code>
            </pre>
          </div>
        </div>

        <div class="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div class="rounded-[1.4rem] border border-border/70 bg-background p-4">
            <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">Design pattern</div>
            <p class="mt-3 text-sm leading-6 text-foreground">{props.item.pattern}</p>
            <Show when={props.item.notes}>
              <p class="mt-3 text-sm leading-6 text-muted">{props.item.notes}</p>
            </Show>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div class="rounded-[1.4rem] border border-border/70 bg-background p-4">
              <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">Style params</div>
              <div class="mt-3 flex flex-wrap gap-2">
                <For each={props.item.styleParams}>
                  {(param, index) => (
                    <span class={cn("rounded-full border px-3 py-1 text-xs", pillTone(index()))}>{param}</span>
                  )}
                </For>
              </div>
            </div>

            <div class="rounded-[1.4rem] border border-border/70 bg-background p-4">
              <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">State params</div>
              <div class="mt-3 flex flex-wrap gap-2">
                <Show
                  when={props.item.stateParams.length}
                  fallback={
                    <span class="rounded-full border border-border/70 bg-panel px-3 py-1 text-xs text-muted">
                      No special state contract
                    </span>
                  }
                >
                  <For each={props.item.stateParams}>
                    {(param, index) => (
                      <span class={cn("rounded-full border px-3 py-1 text-xs", pillTone(index() + 1))}>{param}</span>
                    )}
                  </For>
                </Show>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
