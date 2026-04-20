import { ChevronRight, PanelLeftOpen, Search } from "lucide-solid";
import { For, Show, createSignal } from "solid-js";
import { Dynamic } from "solid-js/web";
import { cn } from "~/lib/cn";
import type { RegistryClusterSection } from "~/lib/registry";
import { clusterVisualStyle, iconForItem, visualForCluster } from "~/lib/registry-visuals";

type RegistrySidebarProps = {
  clusters: RegistryClusterSection[];
  onClusterIntent?: (clusterId: string) => void;
  onComponentIntent?: (clusterId: string) => void;
  query: string;
  totalComponents: number;
  onQueryInput: (value: string) => void;
};

export function RegistrySidebar(props: RegistrySidebarProps) {
  const [namesOpen, setNamesOpen] = createSignal(false);

  return (
    <aside class="lg:sticky lg:top-24">
      <div class="flex items-start gap-3">
        <nav class="ui-shell-muted w-[5.4rem] shrink-0 px-3 py-3">
          <button
            type="button"
            onClick={() => setNamesOpen(current => !current)}
            data-sidebar-names-toggle
            class="flex w-full items-center justify-center rounded-[var(--radius-xl)] border border-border/80 bg-card px-3 py-3 text-muted-foreground shadow-soft transition hover:border-primary/30 hover:text-foreground"
            aria-label={namesOpen() ? "Collapse names column" : "Open names column"}
            title={namesOpen() ? "Collapse names column" : "Open names column"}
          >
            <PanelLeftOpen class={cn("size-4 transition", namesOpen() && "rotate-180")} />
          </button>

          <div class="mt-4 space-y-4">
            <For each={props.clusters}>
              {cluster => (
                <div class="space-y-2" style={clusterVisualStyle(cluster.id)}>
                  <div class="mx-auto h-px w-8 bg-[color:var(--cluster-line)]" />
                  <a
                    href={`#${cluster.id}`}
                    data-sidebar-cluster={cluster.id}
                    onMouseEnter={() => props.onClusterIntent?.(cluster.id)}
                    onFocus={() => props.onClusterIntent?.(cluster.id)}
                    onPointerDown={() => props.onClusterIntent?.(cluster.id)}
                    class="group relative mx-auto flex size-11 items-center justify-center rounded-[var(--radius-xl)] border border-[color:var(--cluster-line)] bg-[color:var(--cluster-soft)] text-[color:var(--cluster-color)] shadow-inset transition hover:bg-[color:var(--cluster-color)] hover:text-[color:var(--cluster-contrast)]"
                  >
                    <Dynamic component={visualForCluster(cluster.id).icon} class="size-[1.125rem]" />
                    <span class="pointer-events-none absolute left-full top-1/2 z-20 ml-3 -translate-y-1/2 rounded-[var(--radius-xl)] bg-foreground px-3 py-2 text-xs font-medium text-background opacity-0 shadow-floating transition group-hover:opacity-100 group-focus-visible:opacity-100">
                      {cluster.title}
                    </span>
                  </a>

                  <div class="grid justify-center gap-1.5">
                    <For each={cluster.items}>
                      {item => (
                        <a
                          href={`#${item.slug}`}
                          data-sidebar-component={item.slug}
                          onMouseEnter={() => props.onComponentIntent?.(cluster.id)}
                          onFocus={() => props.onComponentIntent?.(cluster.id)}
                          onPointerDown={() => props.onComponentIntent?.(cluster.id)}
                          class="group relative mx-auto flex size-9 items-center justify-center rounded-[var(--radius-lg)] border border-transparent bg-transparent text-[color:var(--cluster-color)]/82 transition hover:border-[color:var(--cluster-line)] hover:bg-[color:var(--cluster-color)] hover:text-[color:var(--cluster-contrast)]"
                          style={clusterVisualStyle(cluster.id)}
                        >
                          <Dynamic component={iconForItem(item.name, cluster.id)} class="size-4" />
                          <span class="pointer-events-none absolute left-full top-1/2 z-20 ml-3 -translate-y-1/2 whitespace-nowrap rounded-[var(--radius-xl)] bg-foreground px-3 py-2 text-xs font-medium text-background opacity-0 shadow-floating transition group-hover:opacity-100 group-focus-visible:opacity-100">
                            {item.name}
                          </span>
                        </a>
                      )}
                    </For>
                  </div>
                </div>
              )}
            </For>
          </div>
        </nav>

        <Show when={namesOpen()}>
          <div class="ui-shell w-[21rem] shrink-0 p-4">
            <div class="ui-shell-muted flex items-center gap-3 px-4 py-3">
              <Search class="size-4 text-muted-foreground" />
              <input
                value={props.query}
                onInput={event => props.onQueryInput(event.currentTarget.value)}
                type="search"
                placeholder="Search clusters or components"
                class="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>

            <div class="mt-4 flex items-center justify-between gap-3">
              <div>
                <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Navigation</div>
                <div class="mt-1 text-lg font-semibold text-foreground">{props.clusters.length} clusters</div>
              </div>
              <div class="ui-pillbar px-3 py-1 text-xs text-muted-foreground">
                {props.totalComponents} items
              </div>
            </div>

            <div class="mt-4 space-y-3">
              <For each={props.clusters}>
                {cluster => (
                  <details open class="group rounded-[var(--radius-2xl)] border border-border/80 bg-background px-4 py-3">
                    <summary class="flex cursor-pointer list-none items-center justify-between gap-3">
                      <a
                        href={`#${cluster.id}`}
                        data-sidebar-cluster={cluster.id}
                        onMouseEnter={() => props.onClusterIntent?.(cluster.id)}
                        onFocus={() => props.onClusterIntent?.(cluster.id)}
                        onPointerDown={() => props.onClusterIntent?.(cluster.id)}
                        class="flex min-w-0 items-center gap-3"
                        style={clusterVisualStyle(cluster.id)}
                      >
                        <span class="inline-flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-xl)] border border-[color:var(--cluster-line)] bg-[color:var(--cluster-soft)] text-[color:var(--cluster-color)]">
                          <Dynamic component={visualForCluster(cluster.id).icon} class="size-4" />
                        </span>
                        <span class="min-w-0">
                          <span class="block truncate text-sm font-semibold text-foreground">{cluster.title}</span>
                          <span class="block truncate text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{cluster.tierLabel}</span>
                        </span>
                      </a>
                      <ChevronRight class="size-4 text-muted-foreground transition group-open:rotate-90" />
                    </summary>

                    <div class="mt-3 space-y-1 border-t border-border/70 pt-3">
                      <For each={cluster.items}>
                        {item => (
                          <a
                            href={`#${item.slug}`}
                            data-sidebar-component={item.slug}
                            onMouseEnter={() => props.onComponentIntent?.(cluster.id)}
                            onFocus={() => props.onComponentIntent?.(cluster.id)}
                            onPointerDown={() => props.onComponentIntent?.(cluster.id)}
                            class={cn(
                              "flex items-center gap-3 rounded-[var(--radius-xl)] px-3 py-2.5 text-sm text-muted-foreground transition hover:bg-muted-soft hover:text-foreground",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
                            )}
                            style={clusterVisualStyle(cluster.id)}
                          >
                            <span class="inline-flex size-7 shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-[color:var(--cluster-soft)] text-[color:var(--cluster-color)]">
                              <Dynamic component={iconForItem(item.name, cluster.id)} class="size-3.5" />
                            </span>
                            <span class="truncate">{item.name}</span>
                          </a>
                        )}
                      </For>
                    </div>
                  </details>
                )}
              </For>
            </div>
          </div>
        </Show>
      </div>
    </aside>
  );
}
