import { For, Show } from "solid-js";
import { Blocks, Braces, Workflow } from "lucide-solid";
import type { RegistryItem } from "~/lib/registry";

export function PreviewShell(props: { item: RegistryItem }) {
  return (
    <div class="relative overflow-hidden rounded-[1.5rem] border border-border/70 bg-background-subtle p-5 shadow-inset">
      <div class="pointer-events-none absolute inset-0 bg-linear-to-br from-accent/14 via-transparent to-highlight/10" />
      <div class="relative flex items-center justify-between gap-3">
        <div class="inline-flex items-center gap-2 rounded-full border border-border/70 bg-panel px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          <Blocks class="size-3.5" />
          <span>Preview shell</span>
        </div>
        <div class="inline-flex items-center gap-2 text-xs text-muted-foreground">
          <Workflow class="size-3.5" />
          <span>{props.item.clusterLabel}</span>
        </div>
      </div>

      <div class="mt-5 grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <div class="rounded-[1.35rem] border border-border/80 bg-panel p-4 shadow-soft">
          <div class="text-sm font-semibold text-foreground">{props.item.name}</div>
          <div class="mt-2 text-sm leading-6 text-muted-foreground">{props.item.description}</div>
          <div class="mt-4 rounded-[var(--radius-xl)] border border-border/70 bg-background px-4 py-4">
            <div class="text-xs uppercase tracking-[0.2em] text-muted-foreground">Anatomy</div>
            <div class="mt-2 text-sm text-foreground">{props.item.pattern}</div>
          </div>
        </div>

        <div class="rounded-[1.35rem] border border-dashed border-border/80 bg-panel/80 p-4">
          <div class="inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-muted-foreground">
            <Braces class="size-3.5" />
            <span>State sample</span>
          </div>
          <div class="mt-4 flex flex-wrap gap-2">
            <For each={props.item.stateParams.slice(0, 4)}>
              {state => (
                <span class="rounded-full border border-border/70 bg-background px-3 py-1 text-xs text-muted-foreground">
                  {state}
                </span>
              )}
            </For>
            <Show when={props.item.stateParams.length === 0}>
              <span class="rounded-full border border-border/70 bg-background px-3 py-1 text-xs text-muted-foreground">
                Static surface
              </span>
            </Show>
          </div>
          <p class="mt-4 text-sm leading-6 text-foreground">{props.item.notes}</p>
        </div>
      </div>
    </div>
  );
}
