import { Dynamic } from "solid-js/web";
import { For, Show, createEffect, createSignal } from "solid-js";
import type { Component } from "solid-js";
import { ArrowRight } from "lucide-solid";
import { CopyButton } from "~/components/copy-button";
import { PreviewShell } from "~/components/preview-shell";
import { Skeleton } from "~/components/registry/tier-1/feedback-display/skeleton";
import { cn } from "~/lib/cn";
import { targetPath, type RegistryItem } from "~/lib/registry";
import { loadSourceFor } from "~/lib/registry-source";

type RegistryPane = "preview" | "source";

function pillTone(index: number) {
  const tones = [
    "ui-chip ui-chip-accent",
    "ui-chip ui-chip-secondary",
    "ui-chip ui-chip-success",
  ];

  return tones[index % tones.length];
}

function PreviewPlaceholder() {
  return (
    <div class="space-y-4">
      <div class="ui-demo-chip">
        <span>Deferred preview</span>
        <span class="text-border">/</span>
        <span>Loading on demand</span>
      </div>
      <div class="ui-demo-frame">
        <div class="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div class="space-y-3">
            <Skeleton shape="line" width="10rem" height="0.85rem" />
            <Skeleton width="100%" height="4rem" />
            <Skeleton width="82%" height="3rem" />
          </div>
          <div class="ui-demo-inset space-y-3">
            <Skeleton shape="line" width="8rem" height="0.8rem" />
            <Skeleton width="100%" height="1rem" />
            <Skeleton width="90%" height="1rem" />
            <Skeleton width="64%" height="1rem" />
          </div>
        </div>
      </div>
    </div>
  );
}

function SourcePlaceholder(props: { loading: boolean }) {
  return (
    <div>
      <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {props.loading ? "Loading source" : "Source on demand"}
      </div>
      <div class="mt-1 text-sm text-foreground">
        {props.loading ? "Fetching the current source file." : "Open this tab to fetch the live source without front-loading every file."}
      </div>
      <div class="ui-code mt-4 space-y-3 px-4 py-4">
        <Skeleton width="20%" height="0.8rem" class="bg-white/10 border-white/12" />
        <Skeleton width="88%" height="0.8rem" class="bg-white/10 border-white/12" />
        <Skeleton width="74%" height="0.8rem" class="bg-white/10 border-white/12" />
        <Skeleton width="94%" height="0.8rem" class="bg-white/10 border-white/12" />
        <Skeleton width="60%" height="0.8rem" class="bg-white/10 border-white/12" />
      </div>
    </div>
  );
}

export function RegistryCard(props: {
  item: RegistryItem;
  previewComponent?: Component<{ item: RegistryItem }>;
  previewReady: boolean;
}) {
  const [activePane, setActivePane] = createSignal<RegistryPane>("preview");
  const [source, setSource] = createSignal<string>();
  const [sourceStatus, setSourceStatus] = createSignal<"idle" | "loading" | "ready" | "error">("idle");

  createEffect(() => {
    if (activePane() !== "source" || sourceStatus() !== "idle") {
      return;
    }

    setSourceStatus("loading");
    void loadSourceFor(props.item)
      .then(value => {
        setSource(value);
        setSourceStatus("ready");
      })
      .catch(() => {
        setSourceStatus("error");
      });
  });

  const sourceReady = () => sourceStatus() === "ready" && Boolean(source());
  const sourceValue = () => source() ?? "";

  return (
    <article
      id={props.item.slug}
      data-registry-card={props.item.slug}
      class="ui-card relative scroll-mt-28 overflow-visible p-[var(--space-6)] lg:p-[calc(var(--space-6)*1.12)]"
    >
      <div class="flex flex-col gap-6">
        <header class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div class="min-w-0">
            <div class="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">{props.item.clusterLabel}</div>
            <div class="mt-3 flex flex-wrap items-center gap-3">
              <h3 class="text-2xl font-semibold tracking-tight text-foreground">{props.item.name}</h3>
            </div>
            <p class="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{props.item.description}</p>
          </div>

          <div class="flex items-center gap-3">
            <CopyButton
              value={sourceValue()}
              disabled={!sourceReady()}
              label={sourceStatus() === "loading" ? "Loading source" : "Copy source"}
            />
            <a
              href={`#${props.item.slug}`}
              class="ui-chip rounded-[var(--radius-xl)] bg-background text-muted-foreground transition hover:border-primary/30 hover:bg-foreground hover:text-background"
            >
              <span>Deep link</span>
              <ArrowRight class="size-3.5" />
            </a>
          </div>
        </header>

        <div class="grid gap-4 lg:grid-cols-2">
          <div class="ui-demo-inset">
            <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Style params</div>
            <div class="mt-3 flex flex-wrap gap-2">
              <For each={props.item.styleParams}>
                {(param, index) => (
                  <span class={pillTone(index())}>{param}</span>
                )}
              </For>
            </div>
          </div>

          <div class="ui-demo-inset">
            <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">State params</div>
            <div class="mt-3 flex flex-wrap gap-2">
              <Show
                when={props.item.stateParams.length}
                fallback={
                  <span class="ui-chip ui-chip-muted">
                    No special state contract
                  </span>
                }
              >
                <For each={props.item.stateParams}>
                  {(param, index) => (
                    <span class={pillTone(index() + 1)}>{param}</span>
                  )}
                </For>
              </Show>
            </div>
          </div>
        </div>

        <section class="ui-card-muted border-[color:color-mix(in_oklab,var(--border)_70%,var(--primary)_30%)] p-[var(--space-5)] shadow-inset">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div class="ui-pillbar inline-flex p-1">
              <button
                type="button"
                onClick={() => setActivePane("preview")}
                data-pane-trigger="preview"
                class={cn(
                  "rounded-[calc(var(--radius-xl)+0.06rem)] px-4 py-2 text-sm font-medium transition",
                  activePane() === "preview"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Actual display
              </button>
              <button
                type="button"
                onClick={() => setActivePane("source")}
                data-pane-trigger="source"
                class={cn(
                  "rounded-[calc(var(--radius-xl)+0.06rem)] px-4 py-2 text-sm font-medium transition",
                  activePane() === "source"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Source code
              </button>
            </div>

            <Show when={activePane() === "source"}>
              <div class="flex items-center gap-3">
                <div class="hidden text-sm text-muted-foreground sm:block">{targetPath(props.item)}</div>
                <CopyButton
                  value={sourceValue()}
                  disabled={!sourceReady()}
                  label={sourceStatus() === "loading" ? "Loading source" : "Copy source"}
                />
              </div>
            </Show>
          </div>

          <div class="mt-5">
            <Show
              when={activePane() === "preview"}
              fallback={
                <Show
                  when={sourceReady()}
                  fallback={<SourcePlaceholder loading={sourceStatus() === "loading"} />}
                >
                  <div>
                    <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Live source</div>
                    <div class="mt-1 text-sm text-foreground">{targetPath(props.item)}</div>
                    <pre class="ui-code mt-4 max-h-[30rem] overflow-auto px-4 py-4 text-[12px] leading-6">
                      <code>{sourceValue()}</code>
                    </pre>
                  </div>
                </Show>
              }
            >
              <Show when={props.previewReady} fallback={<PreviewPlaceholder />}>
                <Show when={props.previewComponent} fallback={<PreviewShell item={props.item} />}>
                  {PreviewComponent => <Dynamic component={PreviewComponent()} item={props.item} />}
                </Show>
              </Show>
            </Show>
          </div>
        </section>
      </div>
    </article>
  );
}
