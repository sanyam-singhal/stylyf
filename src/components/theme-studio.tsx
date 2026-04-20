import { Check, ChevronDown, Palette, Sparkles, SwatchBook } from "lucide-solid";
import { For, createMemo, createSignal, onCleanup, onMount } from "solid-js";
import { cn } from "~/lib/cn";
import {
  applyThemeState,
  defaultThemeState,
  readThemeStateFromDocument,
  subscribeThemeState,
  syncThemeFromStorage,
  themePresets,
  type ThemeDensity,
  type ThemeMode,
  type ThemeRadius,
  type ThemeSpacing,
  type ThemeState,
} from "~/lib/theme-system";

const modes: { label: string; value: ThemeMode }[] = [
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
  { label: "System", value: "system" },
];

const densities: { label: string; value: ThemeDensity }[] = [
  { label: "Comfortable", value: "comfortable" },
  { label: "Compact", value: "compact" },
];

const radii: { label: string; value: ThemeRadius }[] = [
  { label: "Knife", value: "edge" },
  { label: "Trim", value: "trim" },
  { label: "Soft", value: "soft" },
  { label: "Mellow", value: "mellow" },
];

const spacings: { label: string; value: ThemeSpacing }[] = [
  { label: "Tight", value: "tight" },
  { label: "Balanced", value: "balanced" },
  { label: "Airy", value: "airy" },
];

function SegmentedControl<T extends string>(props: {
  label: string;
  options: { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div class="space-y-3">
      <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">{props.label}</div>
      <div class="ui-pillbar grid grid-cols-2 gap-1 p-1">
        <For each={props.options}>
          {option => (
            <button
              type="button"
              onClick={() => props.onChange(option.value)}
              data-theme-segment={option.value}
              class={cn(
                "rounded-[calc(var(--radius-lg)+0.06rem)] px-3 py-2 text-sm font-medium transition",
                props.value === option.value
                  ? "bg-foreground text-background shadow-xs"
                  : "text-muted-foreground hover:bg-card hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          )}
        </For>
      </div>
    </div>
  );
}

export function ThemeStudio() {
  const [state, setState] = createSignal<ThemeState>(defaultThemeState);

  onMount(() => {
    setState(syncThemeFromStorage());

    const unsubscribe = subscribeThemeState(nextState => {
      setState(nextState);
    });

    onCleanup(unsubscribe);
  });

  const updateTheme = (next: Partial<ThemeState>) => {
    setState(applyThemeState({ ...readThemeStateFromDocument(), ...next }));
  };

  const activePreset = createMemo(() => themePresets.find(preset => preset.id === state().preset) ?? themePresets[0]);

  const semanticSwatches = [
    { label: "Page", token: "bg-background" },
    { label: "Card", token: "bg-card" },
    { label: "Primary", token: "bg-primary" },
    { label: "Secondary", token: "bg-secondary" },
    { label: "Accent", token: "bg-accent" },
    { label: "Ink", token: "bg-ink" },
  ];

  return (
    <details id="theme-studio" open class="ui-shell group overflow-hidden">
      <summary data-theme-studio-summary class="flex cursor-pointer list-none flex-col gap-5 px-6 py-6 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10">
        <div>
          <div class="ui-pillbar inline-flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            <Palette class="size-3.5" />
            <span>Theme selector</span>
          </div>
          <h2 class="mt-4 text-3xl font-semibold tracking-[-0.03em] text-foreground">Sharper palettes, lower radii, app-level control.</h2>
          <p class="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
            Four curated directions tuned for this registry shell: warm `Amber`, oceanic `Emerald`, stone-like `Pearl`, and retro `Opal`.
            The controls stay global, and the component files remain pure.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3 lg:justify-end">
          <div class="ui-shell-muted flex items-center gap-3 px-4 py-3">
            <Sparkles class="size-4 text-primary" />
            <div>
              <div class="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Active</div>
              <div class="text-sm font-semibold text-foreground">{activePreset().label}</div>
            </div>
          </div>
          <div class="ui-shell-muted flex items-center gap-3 px-4 py-3">
            <SwatchBook class="size-4 text-primary" />
            <div class="text-sm text-foreground">
              {state().mode} / {state().radius} / {state().spacing}
            </div>
          </div>
          <div class="ui-pillbar inline-flex size-11 items-center justify-center text-muted-foreground transition group-open:rotate-180">
            <ChevronDown class="size-4" />
          </div>
        </div>
      </summary>

      <div class="border-t border-border/80 px-6 py-6 sm:px-8 lg:px-10 lg:py-8">
        <div class="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)]">
          <div class="grid gap-4 sm:grid-cols-2">
            <For each={themePresets}>
              {preset => (
                <button
                  type="button"
                  onClick={() => updateTheme({ preset: preset.id })}
                  data-theme-preset-option={preset.id}
                  style={{
                    background: `linear-gradient(160deg, color-mix(in oklab, ${preset.swatches[0]} 22%, var(--card) 78%), var(--card) 54%, color-mix(in oklab, ${preset.swatches[1]} 9%, var(--card) 91%))`,
                  }}
                  class={cn(
                    "rounded-[var(--radius-2xl)] border p-4 text-left transition",
                    state().preset === preset.id
                      ? "border-[color:color-mix(in_oklab,var(--primary)_40%,var(--border)_60%)] shadow-soft"
                      : "border-border/80 hover:border-primary/28 hover:bg-card",
                  )}
                >
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <div class="flex items-center gap-2 text-base font-semibold text-foreground">
                        <span>{preset.label}</span>
                        {state().preset === preset.id ? <Check class="size-4 text-primary" /> : null}
                      </div>
                      <p class="mt-2 text-sm leading-6 text-muted-foreground">{preset.description}</p>
                    </div>
                    <div class="grid gap-2">
                      <For each={preset.swatches}>
                        {swatch => (
                          <span
                            class="size-8 rounded-[calc(var(--radius-lg)+0.06rem)] border border-border/75 shadow-xs"
                            style={{ background: swatch }}
                            aria-hidden="true"
                          />
                        )}
                      </For>
                    </div>
                  </div>
                </button>
              )}
            </For>
          </div>

          <div class="grid gap-4">
            <div class="ui-shell-muted p-4">
              <div class="grid gap-4 lg:grid-cols-2">
                <SegmentedControl label="Mode" options={modes} value={state().mode} onChange={mode => updateTheme({ mode })} />
                <SegmentedControl
                  label="Radius"
                  options={radii}
                  value={state().radius}
                  onChange={radius => updateTheme({ radius })}
                />
              </div>

              <div class="mt-4 grid gap-4 lg:grid-cols-2">
                <SegmentedControl
                  label="Density"
                  options={densities}
                  value={state().density}
                  onChange={density => updateTheme({ density })}
                />
                <SegmentedControl
                  label="Spacing"
                  options={spacings}
                  value={state().spacing}
                  onChange={spacing => updateTheme({ spacing })}
                />
              </div>
            </div>

            <div class="ui-shell-muted p-5">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Application sample</div>
                  <div class="mt-2 text-lg font-semibold text-foreground">Registry shell tokens</div>
                </div>
                <div class="ui-pillbar px-3 py-1 text-xs text-muted-foreground">
                  app-level only
                </div>
              </div>

              <div class="mt-5 grid gap-3 sm:grid-cols-3">
                <For each={semanticSwatches}>
                  {swatch => (
                    <div class="rounded-[var(--radius-xl)] border border-border/80 bg-card p-3">
                      <div class={cn("h-12 rounded-[var(--radius-lg)] border border-border/70 shadow-inset", swatch.token)} />
                      <div class="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{swatch.label}</div>
                    </div>
                  )}
                </For>
              </div>

              <div class="mt-5 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                <div class="rounded-[var(--radius-xl)] border border-border/80 bg-card p-4 shadow-soft">
                  <div class="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div class="text-sm font-semibold text-card-foreground">Shell preview</div>
                      <div class="mt-1 text-sm text-muted-foreground">Sharper edges, stronger contrast, and less generic surfaces.</div>
                    </div>
                    <div class="flex flex-wrap gap-2">
                      <button class="inline-flex h-10 items-center rounded-[var(--radius-xl)] bg-primary px-4 text-sm font-medium text-primary-foreground shadow-soft">
                        Primary
                      </button>
                      <button class="inline-flex h-10 items-center rounded-[var(--radius-xl)] border border-border bg-secondary px-4 text-sm font-medium text-secondary-foreground">
                        Secondary
                      </button>
                    </div>
                  </div>

                  <div class="mt-4 grid gap-3 sm:grid-cols-3">
                    <div class="rounded-[var(--radius-xl)] border border-border/75 bg-[var(--muted-soft)] p-3">
                      <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Status</div>
                      <div class="mt-3 inline-flex rounded-[var(--radius-xl)] bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground">Accent</div>
                    </div>
                    <div class="rounded-[var(--radius-xl)] border border-border/75 bg-[var(--muted-soft)] p-3">
                      <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Panel</div>
                      <div class="mt-3 h-8 rounded-[var(--radius-lg)] border border-border/70 bg-background" />
                    </div>
                    <div class="rounded-[var(--radius-xl)] border border-border/75 bg-[var(--muted-soft)] p-3">
                      <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Ring</div>
                      <div class="mt-3 h-8 rounded-[var(--radius-lg)] border border-ring/50 bg-background shadow-[0_0_0_3px_color-mix(in_oklab,var(--ring)_26%,transparent)]" />
                    </div>
                  </div>
                </div>

                <div class="rounded-[var(--radius-xl)] border border-border/80 bg-ink p-4 text-ink-foreground shadow-soft">
                  <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-foreground/72">Theme notes</div>
                  <div class="mt-3 space-y-3 text-sm leading-6">
                    <p>Amber keeps cream and ochre without going sugary.</p>
                    <p>Emerald leans marine instead of generic teal SaaS.</p>
                    <p>Pearl is the stone option: restrained, not dead.</p>
                    <p>Opal carries the retro contrast without becoming novelty UI.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </details>
  );
}
