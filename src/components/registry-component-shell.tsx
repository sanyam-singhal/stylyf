import { For, Show, children, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import type { RegistryItem } from "~/lib/registry";
import { cn } from "~/lib/cn";

type RegistryComponentShellProps = JSX.HTMLAttributes<HTMLElement> & {
  item: RegistryItem;
};

export function RegistryComponentShell(props: RegistryComponentShellProps) {
  const [local, others] = splitProps(props, ["item", "class", "children"]);
  const resolvedChildren = children(() => local.children);

  return (
    <section
      class={cn(
        "relative overflow-hidden rounded-[1.75rem] border border-border/70 bg-panel p-6 shadow-soft",
        local.class,
      )}
      data-registry-item={local.item.slug}
      {...others}
    >
      <div class="pointer-events-none absolute inset-0 bg-linear-to-br from-accent/14 via-transparent to-highlight/10" />
      <div class="relative">
        <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">{local.item.clusterLabel}</div>

        <div class="mt-4 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div class="max-w-2xl">
            <h2 class="text-2xl font-semibold tracking-tight text-foreground">{local.item.name}</h2>
            <p class="mt-3 text-sm leading-6 text-muted-foreground">{local.item.description}</p>
          </div>
        </div>

        <div class="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.52fr)]">
          <div class="rounded-[1.35rem] border border-dashed border-border/70 bg-background-subtle p-5">
            <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Empty shell intent</div>
            <p class="mt-3 text-sm leading-6 text-foreground">
              This file is the source-owned starting point for <span class="font-semibold">{local.item.name}</span>.
              The public API, slot anatomy, state styling, and accessibility contract should be implemented here in a
              later sweep.
            </p>
            <p class="mt-4 text-sm leading-6 text-muted-foreground">{local.item.pattern}</p>
            <Show when={resolvedChildren()}>
              <div class="mt-4">{resolvedChildren()}</div>
            </Show>
          </div>

          <aside class="rounded-[1.35rem] border border-border/70 bg-background p-5">
            <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Registry contract</div>
            <div class="mt-4 space-y-4">
              <div>
                <div class="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Style params</div>
                <div class="mt-2 flex flex-wrap gap-2">
                  <For each={local.item.styleParams}>
                    {value => (
                      <span class="rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs text-accent-strong">
                        {value}
                      </span>
                    )}
                  </For>
                </div>
              </div>

              <div>
                <div class="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">State params</div>
                <div class="mt-2 flex flex-wrap gap-2">
                  <Show
                    when={local.item.stateParams.length}
                    fallback={
                      <span class="rounded-full border border-border/70 bg-panel px-3 py-1 text-xs text-muted-foreground">
                        No special state contract
                      </span>
                    }
                  >
                    <For each={local.item.stateParams}>
                      {value => (
                        <span class="rounded-full border border-highlight/25 bg-highlight/14 px-3 py-1 text-xs text-highlight-strong">
                          {value}
                        </span>
                      )}
                    </For>
                  </Show>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
