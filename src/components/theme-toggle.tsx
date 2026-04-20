import { MoonStar, SunMedium } from "lucide-solid";
import { createSignal, onMount } from "solid-js";
import { cn } from "~/lib/cn";

type Theme = "light" | "dark";

const STORAGE_KEY = "stylyf-theme";

function setTheme(theme: Theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.classList.toggle("dark", theme === "dark");
}

export function ThemeToggle(props: { class?: string }) {
  const [theme, setThemeState] = createSignal<Theme>("light");

  onMount(() => {
    const rootTheme = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    setThemeState(rootTheme);
    setTheme(rootTheme);
  });

  const handleToggle = () => {
    const nextTheme = theme() === "dark" ? "light" : "dark";
    setThemeState(nextTheme);
    setTheme(nextTheme);
    localStorage.setItem(STORAGE_KEY, nextTheme);
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      class={cn(
        "inline-flex h-10 items-center gap-2 rounded-full border border-border/70 bg-panel px-4 text-sm font-medium text-muted transition hover:border-accent/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
        props.class,
      )}
      aria-label="Toggle color theme"
    >
      {theme() === "dark" ? <SunMedium class="size-4" /> : <MoonStar class="size-4" />}
      <span>{theme() === "dark" ? "Light" : "Dark"}</span>
    </button>
  );
}
