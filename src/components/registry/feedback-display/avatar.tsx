import { Match, Show, Switch, createMemo, createSignal, mergeProps, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { cn } from "~/lib/cn";

export type AvatarProps = Omit<JSX.HTMLAttributes<HTMLDivElement>, "children" | "ref"> & {
  alt?: string;
  bordered?: boolean;
  class?: string;
  fallback?: JSX.Element;
  loading?: boolean;
  shape?: "circle" | "rounded";
  size?: "lg" | "md" | "sm";
  src?: string;
  status?: "offline" | "online";
};

export function Avatar(userProps: AvatarProps) {
  const props = mergeProps(
    { alt: "Stylyf user", bordered: true, loading: false, shape: "circle" as const, size: "md" as const, status: undefined },
    userProps,
  );
  const [local, others] = splitProps(props, ["alt", "bordered", "class", "fallback", "loading", "shape", "size", "src", "status"]);
  const [failed, setFailed] = createSignal(false);
  const initials = createMemo(() =>
    local.alt
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase())
      .join("") || "ST",
  );

  const sizeClass = () =>
    ({
      sm: "size-10 text-sm",
      md: "size-12 text-base",
      lg: "size-16 text-lg",
    })[local.size];

  const statusSizeClass = () =>
    ({
      sm: "size-3",
      md: "size-3.5",
      lg: "size-4",
    })[local.size];

  return (
    <div
      class={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,var(--background)_0%,var(--muted-soft)_100%)]",
        sizeClass(),
        local.shape === "circle" ? "rounded-full" : "rounded-lg",
        local.bordered && "border border-border/72 shadow-soft",
        local.class,
      )}
      {...others}
    >
      <Switch
        fallback={
          <span class="relative z-10 font-semibold tracking-[0.08em] text-foreground">
            {local.loading ? null : local.fallback ?? initials()}
          </span>
        }
      >
        <Match when={local.src && !failed() && !local.loading}>
          <img src={local.src} alt={local.alt} class="size-full object-cover" onError={() => setFailed(true)} />
        </Match>
      </Switch>
      <Show when={local.loading}>
        <span
          aria-hidden="true"
          class={cn(
            "absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,transparent_28%,rgba(255,255,255,0.42)_46%,transparent_68%,transparent_100%)]",
            "animate-[ui-shimmer-sweep_1.4s_linear_infinite]",
          )}
        />
      </Show>
      <Show when={local.status}>
        <span
          class={cn(
            "absolute bottom-0.5 right-0.5 rounded-full border-2 border-card shadow-xs",
            statusSizeClass(),
            local.status === "online" ? "bg-success" : "bg-muted-foreground/40",
          )}
        />
      </Show>
    </div>
  );
}
