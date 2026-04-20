import { Title } from "@solidjs/meta";
import { For, Show, createEffect, createMemo, createSignal, onCleanup, onMount } from "solid-js";
import type { Component } from "solid-js";
import { Dynamic } from "solid-js/web";
import { Layers3, Orbit } from "lucide-solid";
import { RegistryCard } from "~/components/registry-card";
import { RegistrySidebar } from "~/components/registry-sidebar";
import { ThemeStudio } from "~/components/theme-studio";
import { eagerClusterIds, eagerPreviewMapForCluster, loadPreviewMapForCluster } from "~/lib/registry-previews";
import { registryClusters, registryCounts, registryItemBySlug, type RegistryClusterSection, type RegistryItem } from "~/lib/registry";
import { clusterVisualStyle, visualForCluster } from "~/lib/registry-visuals";

type PreviewMap = Record<string, Component<{ item: RegistryItem }>>;

function matchesCluster(cluster: RegistryClusterSection, query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return cluster;
  }

  const matchesClusterLabel = [
    cluster.title,
    cluster.description,
    cluster.tierLabel,
    cluster.tierTitle,
  ]
    .join(" ")
    .toLowerCase()
    .includes(normalizedQuery);

  const items = cluster.items.filter(item => {
    const haystack = [
      item.name,
      item.description,
      item.pattern,
      item.notes,
      item.registryShape,
      item.clusterLabel,
      ...item.styleParams,
      ...item.stateParams,
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });

  if (matchesClusterLabel && items.length === 0) {
    return cluster;
  }

  return {
    ...cluster,
    items,
  };
}

export default function Home() {
  const [query, setQuery] = createSignal("");
  const initialPreviewMaps: Record<string, PreviewMap> = {};

  for (const cluster of registryClusters) {
    const eagerPreviewMap = eagerPreviewMapForCluster(cluster.id);

    if (eagerPreviewMap) {
      initialPreviewMaps[cluster.id] = eagerPreviewMap;
    }
  }

  const [previewMaps, setPreviewMaps] = createSignal<Record<string, PreviewMap>>(initialPreviewMaps);
  const [loadedClusters, setLoadedClusters] = createSignal<Set<string>>(new Set(eagerClusterIds));
  const [loadingClusters, setLoadingClusters] = createSignal<Set<string>>(new Set());
  const sectionRefs = new Map<string, HTMLElement>();
  const preloadPromises = new Map<string, Promise<void>>();
  let observer: IntersectionObserver | undefined;

  const filteredClusters = createMemo(() =>
    registryClusters
      .map(cluster => matchesCluster(cluster, query()))
      .filter(cluster => cluster.items.length),
  );

  const visibleComponentCount = createMemo(() =>
    filteredClusters().reduce((sum, cluster) => sum + cluster.items.length, 0),
  );

  const clusterById = new Map(registryClusters.map(cluster => [cluster.id, cluster]));

  const preloadCluster = (clusterId: string) => {
    if (loadedClusters().has(clusterId)) {
      return Promise.resolve();
    }

    const existing = preloadPromises.get(clusterId);

    if (existing) {
      return existing;
    }

    const cluster = clusterById.get(clusterId);

    if (!cluster) {
      return Promise.resolve();
    }

    setLoadingClusters(current => {
      const next = new Set(current);
      next.add(clusterId);
      return next;
    });

    const promise = loadPreviewMapForCluster(cluster)
      .then(map => {
        setPreviewMaps(current => ({ ...current, [clusterId]: map }));
        setLoadedClusters(current => {
          const next = new Set(current);
          next.add(clusterId);
          return next;
        });
      })
      .finally(() => {
        setLoadingClusters(current => {
          const next = new Set(current);
          next.delete(clusterId);
          return next;
        });
        preloadPromises.delete(clusterId);
      });

    preloadPromises.set(clusterId, promise);
    return promise;
  };

  const observeCurrentSections = () => {
    if (!observer) {
      return;
    }

    observer.disconnect();

    for (const cluster of filteredClusters()) {
      const element = sectionRefs.get(cluster.id);

      if (element) {
        observer.observe(element);
      }
    }
  };

  createEffect(() => {
    const firstVisibleCluster = filteredClusters()[0];

    if (firstVisibleCluster) {
      void preloadCluster(firstVisibleCluster.id);
    }
  });

  onMount(() => {
    observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            void preloadCluster((entry.target as HTMLElement).id);
          }
        }
      },
      { rootMargin: "1000px 0px" },
    );

    const preloadHashTarget = () => {
      const hash = decodeURIComponent(window.location.hash.replace(/^#/, ""));

      if (!hash) {
        return;
      }

      const item = registryItemBySlug[hash];

      if (item) {
        void preloadCluster(item.clusterId);
        return;
      }

      if (clusterById.has(hash)) {
        void preloadCluster(hash);
      }
    };

    createEffect(() => {
      filteredClusters();

      queueMicrotask(observeCurrentSections);
    });

    queueMicrotask(() => {
      observeCurrentSections();
      preloadHashTarget();
    });
    window.addEventListener("hashchange", preloadHashTarget);

    onCleanup(() => {
      observer?.disconnect();
      window.removeEventListener("hashchange", preloadHashTarget);
    });
  });

  return (
    <main id="library" class="mx-auto flex w-full max-w-[1600px] flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <Title>Stylyf | Registry</Title>

      <section class="ui-shell relative overflow-hidden px-6 py-7 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
        <div class="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--primary)_10%,transparent),transparent_38%,color-mix(in_oklab,var(--secondary)_10%,transparent))]" />
        <div class="relative grid gap-8 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] xl:items-end">
          <div>
            <div class="ui-pillbar inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              <Orbit class="size-3.5" />
              <span>Cluster-first registry demo</span>
            </div>
            <h1 class="mt-5 max-w-4xl text-balance text-4xl font-semibold tracking-[-0.04em] text-foreground sm:text-5xl lg:text-6xl">
              One scrollable section per cluster, one subsection per component.
            </h1>
            <p class="mt-5 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
              The demo app is structured as a single vertical registry page. Each cluster is a section. Each component
              inside that cluster is rendered as its own subsection with the same review contract: name, description,
              style params, state params, actual display, source display, and copy action.
            </p>
          </div>

          <div class="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
            <div class="ui-shell-muted p-5">
              <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Clusters</div>
              <div class="mt-2 text-3xl font-semibold tracking-tight text-foreground">{registryClusters.length}</div>
              <div class="mt-2 text-sm text-muted-foreground">Role-based sections across all three tiers.</div>
            </div>
            <div class="ui-shell-muted p-5">
              <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Components</div>
              <div class="mt-2 text-3xl font-semibold tracking-tight text-foreground">{registryCounts.total}</div>
              <div class="mt-2 text-sm text-muted-foreground">Each one rendered with the same preview and source contract.</div>
            </div>
            <div class="ui-shell-muted p-5">
              <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Current view</div>
              <div class="mt-2 text-3xl font-semibold tracking-tight text-foreground">{visibleComponentCount()}</div>
              <div class="mt-2 text-sm text-muted-foreground">Visible after cluster and component filtering.</div>
            </div>
          </div>
        </div>
      </section>

      <ThemeStudio />

      <section class="grid gap-6 xl:grid-cols-[auto_minmax(0,1fr)]">
        <RegistrySidebar
          clusters={filteredClusters()}
          onClusterIntent={preloadCluster}
          onComponentIntent={preloadCluster}
          query={query()}
          totalComponents={visibleComponentCount()}
          onQueryInput={setQuery}
        />

        <div class="space-y-8">
          <Show
            when={filteredClusters().length}
            fallback={
              <section class="ui-shell p-8">
                <div class="max-w-xl">
                  <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">No matches</div>
                  <h2 class="mt-3 text-2xl font-semibold tracking-tight text-foreground">The current filter hides every cluster.</h2>
                  <p class="mt-3 text-sm leading-6 text-muted-foreground">
                    Try a cluster term like <code class="rounded bg-background px-1.5 py-0.5">navigation</code> or a
                    component/state term like <code class="rounded bg-background px-1.5 py-0.5">dialog</code> or{" "}
                    <code class="rounded bg-background px-1.5 py-0.5">loading</code>.
                  </p>
                </div>
              </section>
            }
          >
            <For each={filteredClusters()}>
              {cluster => (
                <section
                  id={cluster.id}
                  ref={element => {
                    sectionRefs.set(cluster.id, element);
                    observer?.observe(element);
                  }}
                  class="scroll-mt-28 space-y-5"
                >
                  <header class="ui-shell p-6 lg:p-7" style={clusterVisualStyle(cluster.id)}>
                    <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div class="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                          <span>{cluster.tierLabel}</span>
                          <span class="text-border">/</span>
                          <span>{cluster.tierTitle}</span>
                        </div>
                        <div class="mt-3 flex items-center gap-3">
                          <span class="inline-flex size-11 items-center justify-center rounded-[var(--radius-xl)] border border-[color:var(--cluster-line)] bg-[color:var(--cluster-soft)] text-[color:var(--cluster-color)] shadow-inset">
                            <Dynamic component={visualForCluster(cluster.id).icon} class="size-5" />
                          </span>
                          <h2 class="text-3xl font-semibold tracking-tight text-foreground">{cluster.title}</h2>
                        </div>
                        <p class="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{cluster.description}</p>
                      </div>
                      <div class="rounded-[calc(var(--radius-xl)+0.06rem)] border border-[color:var(--cluster-line)] bg-[color:var(--cluster-soft)] px-4 py-2 text-sm text-[color:var(--cluster-color)]">
                        {loadedClusters().has(cluster.id)
                          ? `${cluster.items.length} components`
                          : loadingClusters().has(cluster.id)
                            ? "Loading preview payload"
                            : `${cluster.items.length} components`}
                      </div>
                    </div>
                  </header>

                  <div class="space-y-5">
                    <For each={cluster.items}>
                      {item => (
                        <RegistryCard
                          item={item}
                          previewComponent={previewMaps()[cluster.id]?.[item.slug]}
                          previewReady={loadedClusters().has(cluster.id)}
                        />
                      )}
                    </For>
                  </div>
                </section>
              )}
            </For>
          </Show>
        </div>
      </section>
    </main>
  );
}
