import { For, Match, Show, Switch } from "solid-js";
import { Braces, Component, Layers3, MonitorSmartphone, Workflow } from "lucide-solid";
import type { RegistryItem } from "~/lib/registry";

function surfaceKind(item: RegistryItem) {
  if (item.registryShape.includes("page")) {
    return "page";
  }

  if (item.registryShape.includes("block")) {
    return "block";
  }

  return "ui";
}

function accentTone(item: RegistryItem) {
  if (item.tierId === "tier-1") return "from-accent/24 via-accent/10 to-transparent";
  if (item.tierId === "tier-2") return "from-highlight/24 via-highlight/10 to-transparent";
  return "from-emerald-400/24 via-emerald-300/10 to-transparent";
}

export function PreviewShell(props: { item: RegistryItem }) {
  const kind = surfaceKind(props.item);

  return (
    <div class="relative overflow-hidden rounded-[1.5rem] border border-border/70 bg-background-subtle p-5 shadow-inset">
      <div class={`pointer-events-none absolute inset-0 bg-linear-to-br ${accentTone(props.item)}`} />
      <div class="relative flex items-center justify-between gap-3">
        <div class="inline-flex items-center gap-2 rounded-full border border-border/70 bg-panel px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
          <Switch>
            <Match when={kind === "ui"}>
              <Component class="size-3.5" />
              <span>Live primitive shell</span>
            </Match>
            <Match when={kind === "block"}>
              <Layers3 class="size-3.5" />
              <span>Live block shell</span>
            </Match>
            <Match when={kind === "page"}>
              <MonitorSmartphone class="size-3.5" />
              <span>Live page shell</span>
            </Match>
          </Switch>
        </div>
        <div class="inline-flex items-center gap-2 text-xs text-muted">
          <Workflow class="size-3.5" />
          <span>{props.item.registryShape}</span>
        </div>
      </div>

      <div class="mt-5">
        <Switch>
          <Match when={kind === "ui"}>
            <div class="space-y-4">
              <div class="flex flex-wrap gap-3">
                <div class="inline-flex min-w-40 items-center justify-between rounded-2xl border border-border/80 bg-panel px-4 py-3 shadow-soft">
                  <div>
                    <div class="text-sm font-semibold text-foreground">{props.item.name}</div>
                    <div class="text-xs text-muted">Reserved primitive preview</div>
                  </div>
                  <div class="size-9 rounded-full bg-accent/18 ring-1 ring-accent/30" />
                </div>
                <div class="min-w-52 flex-1 rounded-2xl border border-dashed border-border/80 bg-panel/75 px-4 py-3">
                  <div class="text-xs uppercase tracking-[0.22em] text-muted">Anatomy</div>
                  <div class="mt-2 text-sm text-foreground">{props.item.pattern}</div>
                </div>
              </div>
              <div class="flex flex-wrap gap-2">
                <For each={props.item.stateParams.slice(0, 4)}>
                  {state => (
                    <span class="rounded-full border border-border/70 bg-background px-3 py-1 text-xs text-muted">
                      {state}
                    </span>
                  )}
                </For>
                <Show when={props.item.stateParams.length === 0}>
                  <span class="rounded-full border border-border/70 bg-background px-3 py-1 text-xs text-muted">
                    Static shell
                  </span>
                </Show>
              </div>
            </div>
          </Match>

          <Match when={kind === "block"}>
            <div class="space-y-4">
              <div class="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
                <div class="rounded-[1.4rem] border border-border/80 bg-panel p-4 shadow-soft">
                  <div class="flex items-start justify-between gap-4">
                    <div>
                      <div class="text-sm font-semibold text-foreground">{props.item.name}</div>
                      <div class="mt-1 max-w-xl text-sm text-muted">{props.item.description}</div>
                    </div>
                    <div class="rounded-full border border-border/70 bg-background px-3 py-1 text-xs text-muted">
                      Block frame
                    </div>
                  </div>
                  <div class="mt-4 grid gap-3 sm:grid-cols-2">
                    <div class="rounded-2xl border border-border/70 bg-background p-4">
                      <div class="h-3 w-24 rounded-full bg-muted/30" />
                      <div class="mt-3 h-8 rounded-xl bg-accent/12" />
                    </div>
                    <div class="rounded-2xl border border-border/70 bg-background p-4">
                      <div class="h-3 w-20 rounded-full bg-muted/30" />
                      <div class="mt-3 space-y-2">
                        <div class="h-2 rounded-full bg-muted/20" />
                        <div class="h-2 w-10/12 rounded-full bg-muted/20" />
                      </div>
                    </div>
                  </div>
                </div>
                <div class="rounded-[1.4rem] border border-dashed border-border/80 bg-panel/75 p-4">
                  <div class="inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-muted">
                    <Braces class="size-3.5" />
                    <span>Composition notes</span>
                  </div>
                  <p class="mt-3 text-sm text-foreground">{props.item.notes}</p>
                  <div class="mt-4 flex flex-wrap gap-2">
                    <For each={props.item.styleParams.slice(0, 4)}>
                      {style => (
                        <span class="rounded-full border border-border/70 bg-background px-3 py-1 text-xs text-muted">
                          {style}
                        </span>
                      )}
                    </For>
                  </div>
                </div>
              </div>
            </div>
          </Match>

          <Match when={kind === "page"}>
            <div class="space-y-4">
              <div class="rounded-[1.5rem] border border-border/80 bg-panel p-4 shadow-soft">
                <div class="flex flex-col gap-4 xl:flex-row">
                  <div class="min-w-0 flex-1 rounded-[1.25rem] border border-border/70 bg-background p-5">
                    <div class="text-xs uppercase tracking-[0.22em] text-muted">{props.item.clusterLabel}</div>
                    <div class="mt-2 text-xl font-semibold text-foreground">{props.item.name}</div>
                    <div class="mt-2 max-w-2xl text-sm text-muted">{props.item.description}</div>
                    <div class="mt-6 grid gap-3 sm:grid-cols-2">
                      <div class="rounded-2xl border border-border/70 bg-panel px-4 py-3">
                        <div class="h-3 w-20 rounded-full bg-muted/30" />
                        <div class="mt-3 h-9 rounded-xl bg-accent/12" />
                      </div>
                      <div class="rounded-2xl border border-border/70 bg-panel px-4 py-3">
                        <div class="h-3 w-16 rounded-full bg-muted/30" />
                        <div class="mt-3 space-y-2">
                          <div class="h-2 rounded-full bg-muted/20" />
                          <div class="h-2 w-9/12 rounded-full bg-muted/20" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="w-full rounded-[1.25rem] border border-dashed border-border/80 bg-background p-5 xl:max-w-sm">
                    <div class="text-xs uppercase tracking-[0.22em] text-muted">Route shell</div>
                    <div class="mt-3 flex flex-wrap gap-2">
                      <For each={props.item.stateParams.slice(0, 5)}>
                        {state => (
                          <span class="rounded-full border border-border/70 bg-panel px-3 py-1 text-xs text-muted">
                            {state}
                          </span>
                        )}
                      </For>
                    </div>
                    <p class="mt-4 text-sm text-foreground">{props.item.pattern}</p>
                  </div>
                </div>
              </div>
            </div>
          </Match>
        </Switch>
      </div>
    </div>
  );
}
