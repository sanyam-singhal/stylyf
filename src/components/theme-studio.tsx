import { Check, ChevronDown, Palette, Sparkles } from "lucide-solid";
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
    <div class="space-y-2.5">
      <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">{props.label}</div>
      <div class="ui-pillbar grid gap-1 p-1" style={{ "grid-template-columns": `repeat(${props.options.length}, minmax(0, 1fr))` }}>
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

  return (
    <details id="theme-studio" open class="ui-shell group overflow-hidden">
      <summary data-theme-studio-summary class="flex cursor-pointer list-none flex-col gap-5 px-6 py-6 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10">
        <div>
          <div class="ui-pillbar inline-flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            <Palette class="size-3.5" />
            <span>Theme studio</span>
          </div>
          <h2 class="mt-4 text-3xl font-semibold tracking-[-0.03em] text-foreground">Compact theme controls, sharper live preview.</h2>
          <p class="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
            Four curated palette directions, reduced radius defaults, and app-level controls kept separate from component implementation.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3 lg:justify-end">
          <div class="ui-shell-muted flex items-center gap-3 px-4 py-3">
            <Sparkles class="size-4 text-primary" />
            <div>
              <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Active preset</div>
              <div class="text-sm font-semibold text-foreground">{activePreset().label}</div>
            </div>
          </div>
          <div class="ui-pillbar inline-flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground">
            <span>{state().mode}</span>
            <span class="text-border">/</span>
            <span>{state().radius}</span>
            <span class="text-border">/</span>
            <span>{state().spacing}</span>
          </div>
          <div class="ui-pillbar inline-flex size-11 items-center justify-center text-muted-foreground transition group-open:rotate-180">
            <ChevronDown class="size-4" />
          </div>
        </div>
      </summary>

      <div class="border-t border-border/80 px-6 py-6 sm:px-8 lg:px-10 lg:py-8">
        <div class="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
          <section class="space-y-5">
            <div class="grid gap-3 sm:grid-cols-2">
              <For each={themePresets}>
                {preset => (
                  <button
                    type="button"
                    onClick={() => updateTheme({ preset: preset.id })}
                    data-theme-preset-option={preset.id}
                    style={{
                      background: `linear-gradient(155deg, color-mix(in oklab, ${preset.swatches[0]} 24%, var(--card) 76%), color-mix(in oklab, ${preset.swatches[1]} 16%, var(--card) 84%) 52%, color-mix(in oklab, ${preset.swatches[2]} 10%, var(--card) 90%))`,
                    }}
                    class={cn(
                      "rounded-[var(--radius-2xl)] border px-4 py-4 text-left transition",
                      state().preset === preset.id
                        ? "border-[color:color-mix(in_oklab,var(--primary)_38%,var(--border)_62%)] shadow-soft"
                        : "border-border/80 hover:border-primary/24 hover:bg-card",
                    )}
                  >
                    <div class="flex items-start justify-between gap-4">
                      <div class="min-w-0">
                        <div class="flex items-center gap-2 text-base font-semibold text-foreground">
                          <span>{preset.label}</span>
                          {state().preset === preset.id ? <Check class="size-4 text-primary" /> : null}
                        </div>
                        <p class="mt-2 text-sm leading-6 text-muted-foreground">{preset.description}</p>
                      </div>
                      <div class="flex shrink-0 gap-1.5">
                        <For each={preset.swatches}>
                          {swatch => (
                            <span
                              class="size-7 rounded-[calc(var(--radius-lg)+0.02rem)] border border-border/75 shadow-xs"
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

            <div class="ui-shell-muted p-4">
              <div class="grid gap-4 lg:grid-cols-2">
                <SegmentedControl label="Mode" options={modes} value={state().mode} onChange={mode => updateTheme({ mode })} />
                <SegmentedControl label="Radius" options={radii} value={state().radius} onChange={radius => updateTheme({ radius })} />
                <SegmentedControl label="Density" options={densities} value={state().density} onChange={density => updateTheme({ density })} />
                <SegmentedControl label="Spacing" options={spacings} value={state().spacing} onChange={spacing => updateTheme({ spacing })} />
              </div>
            </div>
          </section>

          <section class="ui-shell-muted p-4">
            <div class="flex items-center justify-between gap-3">
              <div>
                <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Live sample</div>
                <div class="mt-1 text-lg font-semibold text-foreground">Registry shell preview</div>
              </div>
              <div class="ui-pillbar px-3 py-1 text-xs text-muted-foreground">{activePreset().label}</div>
            </div>

            <div class="mt-4 rounded-[var(--radius-2xl)] border border-border/80 bg-card p-4 shadow-soft">
              <div class="flex items-center justify-between gap-3 rounded-[var(--radius-xl)] border border-border/75 bg-background px-3 py-3">
                <div>
                  <div class="text-sm font-semibold text-foreground">Cluster shell</div>
                  <div class="text-sm text-muted-foreground">Aligned navigation and restrained surfaces.</div>
                </div>
                <div class="inline-flex size-10 items-center justify-center rounded-[var(--radius-xl)] bg-accent text-accent-foreground shadow-inset">
                  <Palette class="size-4.5" />
                </div>
              </div>

              <div class="mt-3 grid gap-3 sm:grid-cols-[1.1fr_0.9fr]">
                <div class="rounded-[var(--radius-xl)] border border-border/75 bg-[var(--muted-soft)] p-3">
                  <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Actions</div>
                  <div class="mt-3 flex flex-wrap gap-2">
                    <button class="inline-flex h-9 items-center rounded-[var(--radius-xl)] bg-primary px-4 text-sm font-medium text-primary-foreground shadow-soft">
                      Primary
                    </button>
                    <button class="inline-flex h-9 items-center rounded-[var(--radius-xl)] border border-border bg-background px-4 text-sm font-medium text-foreground">
                      Secondary
                    </button>
                  </div>
                </div>

                <div class="rounded-[var(--radius-xl)] border border-border/75 bg-[var(--muted-soft)] p-3">
                  <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Surface</div>
                  <div class="mt-3 space-y-2">
                    <div class="h-8 rounded-[var(--radius-lg)] border border-border/70 bg-background shadow-inset" />
                    <div class="h-8 rounded-[var(--radius-lg)] bg-ink text-ink-foreground" />
                  </div>
                </div>
              </div>

              <div class="mt-3 grid grid-cols-4 gap-2">
                <For each={[
                  { label: "Page", tone: "bg-background" },
                  { label: "Card", tone: "bg-card" },
                  { label: "Accent", tone: "bg-accent" },
                  { label: "Ink", tone: "bg-ink" },
                ]}>
                  {sample => (
                    <div class="rounded-[var(--radius-xl)] border border-border/75 bg-background p-2">
                      <div class={cn("h-8 rounded-[var(--radius-lg)] border border-border/70 shadow-inset", sample.tone)} />
                      <div class="mt-2 text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{sample.label}</div>
                    </div>
                  )}
                </For>
              </div>
            </div>

            <div class="mt-3 text-sm leading-6 text-muted-foreground">
              Warm editorial `Amber`, marine `Emerald`, stone `Pearl`, and retro `Opal` share the same shell structure so contrast and spacing stay predictable.
            </div>
          </section>
        </div>
      </div>
    </details>
  );
}
