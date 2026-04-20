import { LaptopMinimal, MoonStar, SunMedium } from "lucide-solid";
import { createSignal, onCleanup, onMount } from "solid-js";
import { Dynamic } from "solid-js/web";
import { cn } from "~/lib/cn";
import { applyThemeState, readThemeStateFromDocument, subscribeThemeState, syncThemeFromStorage, type ThemeMode } from "~/lib/theme-system";

const modeMeta: Record<ThemeMode, { icon: typeof SunMedium; label: string }> = {
  light: { icon: SunMedium, label: "Light" },
  dark: { icon: MoonStar, label: "Dark" },
  system: { icon: LaptopMinimal, label: "System" },
};

const modeOrder: ThemeMode[] = ["light", "dark", "system"];

export function ThemeToggle(props: { class?: string }) {
  const [mode, setMode] = createSignal<ThemeMode>("system");

  onMount(() => {
    setMode(syncThemeFromStorage().mode);

    const unsubscribe = subscribeThemeState(state => {
      setMode(state.mode);
    });

    onCleanup(unsubscribe);
  });

  const handleToggle = () => {
    const currentMode = readThemeStateFromDocument().mode;
    const currentIndex = modeOrder.indexOf(currentMode);
    const nextMode = modeOrder[(currentIndex + 1) % modeOrder.length] ?? "system";

    setMode(applyThemeState({ mode: nextMode }).mode);
  };

  const currentMeta = () => modeMeta[mode()];

  return (
    <button
      type="button"
      onClick={handleToggle}
      class={cn(
        "inline-flex h-10 items-center gap-2 rounded-full border border-border/70 bg-panel px-4 text-sm font-medium text-muted transition hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        props.class,
      )}
      aria-label={`Cycle color mode. Current mode: ${currentMeta().label}`}
      title={`Mode: ${currentMeta().label}`}
    >
      <Dynamic component={currentMeta().icon} class="size-4" />
      <span>{currentMeta().label}</span>
    </button>
  );
}
