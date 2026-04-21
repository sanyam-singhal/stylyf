import { PanelLeftOpen, Search } from "lucide-solid";
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
      <nav
        class={cn(
          "ui-shell-muted overflow-hidden px-3 py-3 transition-[width] duration-200",
          namesOpen() ? "w-[21.5rem]" : "w-[5.9rem]",
        )}
      >
        <div class="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setNamesOpen(current => !current)}
            data-sidebar-names-toggle
            class={cn(
              "flex items-center rounded-[var(--radius-xl)] border border-border/80 bg-card px-3 py-3 text-muted-foreground shadow-soft transition hover:border-primary/30 hover:text-foreground",
              namesOpen() ? "w-full justify-between" : "w-full justify-center",
            )}
            aria-label={namesOpen() ? "Collapse names column" : "Open names column"}
            title={namesOpen() ? "Collapse names column" : "Open names column"}
          >
            <span class="inline-flex size-4 items-center justify-center">
              <PanelLeftOpen class={cn("size-4 transition", namesOpen() && "rotate-180")} />
            </span>
            <Show when={namesOpen()}>
              <span class="text-sm font-medium">Navigation</span>
            </Show>
          </button>
        </div>

        <Show when={namesOpen()}>
          <div class="mt-3 space-y-3">
            <div class="ui-shell flex items-center gap-3 px-3 py-3">
              <Search class="size-4 shrink-0 text-muted-foreground" />
              <input
                value={props.query}
                onInput={event => props.onQueryInput(event.currentTarget.value)}
                type="search"
                placeholder="Search components"
                class="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>

            <div class="flex items-center justify-between gap-3 px-1 text-sm">
              <span class="text-muted-foreground">{props.clusters.length} clusters</span>
              <span class="ui-pillbar px-3 py-1 text-xs text-muted-foreground">{props.totalComponents} items</span>
            </div>
          </div>
        </Show>

        <div class="mt-4 space-y-4">
          <For each={props.clusters}>
            {cluster => (
              <section class="space-y-2" style={clusterVisualStyle(cluster.id)}>
                <div class={cn("h-px bg-[color:var(--cluster-line)]", namesOpen() ? "mx-1" : "mx-auto w-8")} />

                <a
                  href={`#${cluster.id}`}
                  data-sidebar-cluster={cluster.id}
                  onMouseEnter={() => props.onClusterIntent?.(cluster.id)}
                  onFocus={() => props.onClusterIntent?.(cluster.id)}
                  onPointerDown={() => props.onClusterIntent?.(cluster.id)}
                  class={cn(
                    "group relative flex items-center gap-3 rounded-[var(--radius-xl)] border border-[color:var(--cluster-line)] bg-[color:var(--cluster-soft)] px-2.5 py-2.5 text-[color:var(--cluster-color)] shadow-inset transition hover:bg-[color:var(--cluster-color)] hover:text-[color:var(--cluster-contrast)]",
                    namesOpen() ? "justify-start" : "justify-center",
                  )}
                >
                  <span class="inline-flex size-8 shrink-0 items-center justify-center">
                    <Dynamic component={visualForCluster(cluster.id).icon} class="size-[1.05rem]" />
                  </span>
                  <Show when={namesOpen()} fallback={
                    <span class="pointer-events-none absolute left-full top-1/2 z-20 ml-3 -translate-y-1/2 whitespace-nowrap rounded-[var(--radius-xl)] bg-foreground px-3 py-2 text-xs font-medium text-background opacity-0 shadow-floating transition group-hover:opacity-100 group-focus-visible:opacity-100">
                      {cluster.title}
                    </span>
                  }>
                    <span class="min-w-0 truncate text-sm font-semibold">{cluster.title}</span>
                  </Show>
                </a>

                <div class="space-y-1">
                  <For each={cluster.items}>
                    {item => (
                      <a
                        href={`#${item.slug}`}
                        data-sidebar-component={item.slug}
                        onMouseEnter={() => props.onComponentIntent?.(cluster.id)}
                        onFocus={() => props.onComponentIntent?.(cluster.id)}
                        onPointerDown={() => props.onComponentIntent?.(cluster.id)}
                        class={cn(
                          "group relative flex items-center gap-3 rounded-[var(--radius-xl)] px-2.5 py-2 text-muted-foreground transition hover:bg-[color:var(--cluster-soft)] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
                          namesOpen() ? "justify-start" : "justify-center",
                        )}
                        style={clusterVisualStyle(cluster.id)}
                      >
                        <span class="inline-flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-[color:var(--cluster-soft)] text-[color:var(--cluster-color)]">
                          <Dynamic component={iconForItem(item.name, cluster.id)} class="size-4" />
                        </span>
                        <Show when={namesOpen()} fallback={
                          <span class="pointer-events-none absolute left-full top-1/2 z-20 ml-3 -translate-y-1/2 whitespace-nowrap rounded-[var(--radius-xl)] bg-foreground px-3 py-2 text-xs font-medium text-background opacity-0 shadow-floating transition group-hover:opacity-100 group-focus-visible:opacity-100">
                            {item.name}
                          </span>
                        }>
                          <span class="min-w-0 truncate text-sm">{item.name}</span>
                        </Show>
                      </a>
                    )}
                  </For>
                </div>
              </section>
            )}
          </For>
        </div>
      </nav>
    </aside>
  );
}
