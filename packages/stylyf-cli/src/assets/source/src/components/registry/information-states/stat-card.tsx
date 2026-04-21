import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-solid";
import { Match, Show, Switch, mergeProps, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { Skeleton } from "~/components/registry/feedback-display/skeleton";
import { cn } from "~/lib/cn";

export type StatCardProps = Omit<JSX.HTMLAttributes<HTMLElement>, "children"> & {
  accent?: "accent" | "highlight" | "neutral";
  class?: string;
  delta?: string;
  footer?: JSX.Element;
  icon?: JSX.Element;
  label?: JSX.Element;
  loading?: boolean;
  trend?: "negative" | "neutral" | "positive";
  value?: JSX.Element;
};

export function StatCard(userProps: StatCardProps) {
  const props = mergeProps(
    {
      accent: "accent" as const,
      delta: "+12.4%",
      footer: "Compared with last week",
      label: "Net expansion",
      loading: false,
      trend: "positive" as const,
      value: "$148.2k",
    },
    userProps,
  );

  const [local, others] = splitProps(props, ["accent", "class", "delta", "footer", "icon", "label", "loading", "trend", "value"]);

  return (
    <article
      class={cn(
        "ui-card overflow-hidden p-[var(--space-5)] shadow-soft",
        local.accent === "accent" && "bg-[linear-gradient(180deg,color-mix(in_oklab,var(--accent)_50%,var(--card)_50%),var(--card))]",
        local.accent === "highlight" && "border-secondary/30 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--secondary)_18%,var(--card)_82%),var(--card))]",
        local.accent === "neutral" && "bg-card",
        local.class,
      )}
      {...others}
    >
      <div class="flex items-start justify-between gap-4">
        <div class="space-y-2">
          <div class="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">{local.label}</div>
          <Show when={!local.loading} fallback={<Skeleton width="9rem" height="2.5rem" />}>
            <div class="text-3xl font-semibold tracking-[-0.03em] text-foreground">{local.value}</div>
          </Show>
        </div>
        <Show when={local.icon}>
          <div
            class={cn(
              "inline-flex size-11 items-center justify-center rounded-[var(--radius-xl)] border shadow-inset",
              local.accent === "highlight" && "border-secondary/24 bg-secondary/16 text-secondary-foreground",
              local.accent === "neutral" && "border-border/80 bg-[var(--muted-soft)] text-foreground",
              local.accent === "accent" && "border-accent/40 bg-accent text-accent-foreground",
            )}
          >
            {local.icon}
          </div>
        </Show>
      </div>

      <div class="mt-[var(--space-5)] flex items-center justify-between gap-3 border-t border-border/75 pt-[var(--space-4)]">
        <div class="inline-flex items-center gap-2 rounded-full bg-background px-3 py-1.5 text-sm font-medium shadow-inset">
          <Switch>
            <Match when={local.trend === "positive"}>
              <ArrowUpRight class="size-4 text-success" />
              <span class="text-success">{local.delta}</span>
            </Match>
            <Match when={local.trend === "negative"}>
              <ArrowDownRight class="size-4 text-destructive" />
              <span class="text-destructive">{local.delta}</span>
            </Match>
            <Match when={true}>
              <Minus class="size-4 text-muted-foreground" />
              <span class="text-muted-foreground">{local.delta}</span>
            </Match>
          </Switch>
        </div>
        <div class="text-right text-sm text-muted-foreground">{local.footer}</div>
      </div>
    </article>
  );
}
