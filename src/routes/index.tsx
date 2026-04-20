import { Title } from "@solidjs/meta";
import { For, Show, createMemo, createSignal } from "solid-js";
import { ArrowDown, ArrowRight, CheckCircle2, Layers3, Orbit, PanelTopOpen } from "lucide-solid";
import { RegistryCard } from "~/components/registry-card";
import { RegistrySidebar } from "~/components/registry-sidebar";
import { registryCounts, registryTiers, type RegistryTier } from "~/lib/registry";

const implementationWaves = [
  {
    label: "Wave 1",
    title: "Interaction-critical primitives",
    description:
      "Button, TextField, Select, Combobox, Checkbox, RadioGroup, Switch, Tabs, Accordion, Dialog, Drawer, Popover, DropdownMenu, CommandMenu, Toast, Table, and Calendar.",
  },
  {
    label: "Wave 2",
    title: "Assembly shells",
    description:
      "FieldRow, FormSection, SearchField, FilterToolbar, PageHeader, EmptyState, ErrorState, StatCard, DataTableShell, SidebarNav, TopNavBar, WizardShell, and AuthCardShell.",
  },
  {
    label: "Wave 3",
    title: "App and marketing blocks",
    description:
      "Authentication variants, dashboard shells, analytics pages, settings routes, marketing navigation, hero sections, pricing surfaces, FAQ, and docs layouts.",
  },
];

function matchesTier(tier: RegistryTier, query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return tier;
  }

  const clusters = tier.clusters
    .map(cluster => {
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

      return {
        ...cluster,
        items,
      };
    })
    .filter(cluster => cluster.items.length);

  return {
    ...tier,
    clusters,
  };
}

export default function Home() {
  const [query, setQuery] = createSignal("");

  const filteredTiers = createMemo(() =>
    registryTiers
      .map(tier => matchesTier(tier, query()))
      .filter(tier => tier.clusters.length),
  );

  const filteredCount = createMemo(() =>
    filteredTiers().reduce(
      (sum, tier) => sum + tier.clusters.reduce((clusterSum, cluster) => clusterSum + cluster.items.length, 0),
      0,
    ),
  );

  return (
    <main id="library" class="mx-auto flex w-full max-w-[1600px] flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <Title>Stylyf | Registry</Title>

      <section class="relative overflow-hidden rounded-[2rem] border border-border/70 bg-panel/92 px-6 py-7 shadow-soft backdrop-blur-sm sm:px-8 sm:py-8 lg:px-10 lg:py-10">
        <div class="pointer-events-none absolute inset-0 bg-linear-to-br from-accent/18 via-transparent to-highlight/16" />
        <div class="relative grid gap-8 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] xl:items-end">
          <div>
            <div class="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-muted">
              <Orbit class="size-3.5" />
              <span>SolidJS + SolidStart rich registry</span>
            </div>
            <h1 class="mt-5 max-w-4xl text-balance text-4xl font-semibold tracking-[-0.04em] text-foreground sm:text-5xl lg:text-6xl">
              Professional-grade registry shell for a shadcn-like SolidStart component system.
            </h1>
            <p class="mt-5 max-w-3xl text-base leading-7 text-muted sm:text-lg">
              This first pass implements the catalog surface for every registry item: name, description, anatomy,
              styling parameters, state parameters, a live preview shell, and starter source code you can copy as the
              implementation baseline.
            </p>
            <div class="mt-6 flex flex-wrap gap-3">
              <a
                href="#implementation-waves"
                class="inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background transition hover:opacity-92"
              >
                <span>See implementation waves</span>
                <ArrowRight class="size-4" />
              </a>
              <a
                href="#tier-1"
                class="inline-flex h-11 items-center gap-2 rounded-full border border-border/70 bg-background px-5 text-sm font-medium text-foreground transition hover:border-accent/50"
              >
                <span>Start with Tier 1</span>
                <ArrowDown class="size-4" />
              </a>
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
            <For each={registryCounts.tiers}>
              {tier => (
                <div class="rounded-[1.5rem] border border-border/70 bg-background/92 p-5 shadow-inset">
                  <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">{tier.label}</div>
                  <div class="mt-2 text-3xl font-semibold tracking-tight text-foreground">{tier.total}</div>
                  <div class="mt-2 text-sm text-muted">
                    {tier.label === "Tier 1" && "Foundational primitives"}
                    {tier.label === "Tier 2" && "Generic derived compositions"}
                    {tier.label === "Tier 3" && "Specialized blocks and pages"}
                  </div>
                </div>
              )}
            </For>
          </div>
        </div>
      </section>

      <section class="grid gap-6 xl:grid-cols-[minmax(280px,340px)_minmax(0,1fr)]">
        <RegistrySidebar query={query()} onQueryInput={setQuery} tiers={filteredTiers()} total={filteredCount()} />

        <div class="space-y-8">
          <section id="implementation-waves" class="rounded-[1.8rem] border border-border/70 bg-panel/92 p-6 shadow-soft backdrop-blur-sm lg:p-7">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div class="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
                  <PanelTopOpen class="size-3.5" />
                  <span>Implementation order</span>
                </div>
                <h2 class="mt-4 text-2xl font-semibold tracking-tight text-foreground">Suggested promotion path</h2>
                <p class="mt-2 max-w-3xl text-sm leading-6 text-muted">
                  The registry shell already covers all items. Promotion to stable should happen only after responsive,
                  focus-visible, keyboard, empty/loading/error, and Tailwind override ergonomics have been storyboarded.
                </p>
              </div>
              <div class="rounded-full border border-border/70 bg-background px-4 py-2 text-sm text-muted">
                {filteredCount()} visible shells
              </div>
            </div>

            <div class="mt-6 grid gap-4 lg:grid-cols-3">
              <For each={implementationWaves}>
                {wave => (
                  <div class="rounded-[1.5rem] border border-border/70 bg-background p-5 shadow-inset">
                    <div class="inline-flex items-center gap-2 rounded-full border border-border/70 bg-panel px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
                      <CheckCircle2 class="size-3.5" />
                      <span>{wave.label}</span>
                    </div>
                    <h3 class="mt-4 text-lg font-semibold text-foreground">{wave.title}</h3>
                    <p class="mt-3 text-sm leading-6 text-muted">{wave.description}</p>
                  </div>
                )}
              </For>
            </div>
          </section>

          <Show
            when={filteredTiers().length}
            fallback={
              <section class="rounded-[1.8rem] border border-border/70 bg-panel/92 p-8 shadow-soft">
                <div class="max-w-xl">
                  <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">No matches</div>
                  <h2 class="mt-3 text-2xl font-semibold tracking-tight text-foreground">The current query returned no registry items.</h2>
                  <p class="mt-3 text-sm leading-6 text-muted">
                    Try a component name, a state like <code class="rounded bg-background px-1.5 py-0.5">loading</code>,
                    or a cluster keyword like <code class="rounded bg-background px-1.5 py-0.5">navigation</code>.
                  </p>
                </div>
              </section>
            }
          >
            <For each={filteredTiers()}>
              {tier => (
                <section id={tier.id} class="space-y-6">
                  <header class="rounded-[1.8rem] border border-border/70 bg-panel/92 p-6 shadow-soft backdrop-blur-sm lg:p-7">
                    <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">{tier.label}</div>
                        <h2 class="mt-3 text-3xl font-semibold tracking-tight text-foreground">{tier.title}</h2>
                        <p class="mt-3 max-w-3xl text-sm leading-6 text-muted">{tier.description}</p>
                      </div>
                      <div class="rounded-full border border-border/70 bg-background px-4 py-2 text-sm text-muted">
                        {tier.clusters.reduce((sum, cluster) => sum + cluster.items.length, 0)} items
                      </div>
                    </div>
                  </header>

                  <For each={tier.clusters}>
                    {cluster => (
                      <section class="space-y-4">
                        <div class="rounded-[1.5rem] border border-border/70 bg-background px-5 py-5">
                          <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">{cluster.items.length} components</div>
                          <h3 class="mt-2 text-xl font-semibold tracking-tight text-foreground">{cluster.title}</h3>
                          <p class="mt-2 max-w-3xl text-sm leading-6 text-muted">{cluster.description}</p>
                        </div>
                        <div class="space-y-5">
                          <For each={cluster.items}>{item => <RegistryCard item={item} />}</For>
                        </div>
                      </section>
                    )}
                  </For>
                </section>
              )}
            </For>
          </Show>
        </div>
      </section>
    </main>
  );
}
