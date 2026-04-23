import { For, mergeProps, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { cn } from "~/lib/cn";

export type StepperItem = {
  description?: string;
  state: "complete" | "current" | "upcoming";
  title: string;
};

export type StepperProps = Omit<JSX.HTMLAttributes<HTMLElement>, "children"> & {
  class?: string;
  items?: StepperItem[];
  orientation?: "horizontal" | "vertical";
};

const defaultItems: StepperItem[] = [
  { title: "Workspace basics", description: "Name and slug", state: "complete" },
  { title: "Brand tokens", description: "Colors and type", state: "current" },
  { title: "Invite team", description: "Roles and defaults", state: "upcoming" },
];

export function Stepper(userProps: StepperProps) {
  const props = mergeProps(
    {
      items: defaultItems,
      orientation: "horizontal" as const,
    },
    userProps,
  );

  const [local, others] = splitProps(props, ["class", "items", "orientation"]);

  return (
    <section class={cn("ui-shell-muted border border-border/80 p-[var(--space-5)] shadow-soft", local.class)} {...others}>
      <div class="mb-[var(--space-5)] flex items-center justify-between gap-3">
        <div>
          <div class="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Progress</div>
          <div class="mt-1 text-sm font-semibold text-foreground">
            {local.items.findIndex(item => item.state === "current") + 1} of {local.items.length} active
          </div>
        </div>
        <div class="ui-chip ui-chip-muted">{local.orientation === "horizontal" ? "Horizontal" : "Vertical"}</div>
      </div>

      <div class={cn("gap-[var(--space-4)]", local.orientation === "horizontal" ? "grid md:grid-cols-3" : "space-y-[var(--space-4)]")}>
        <For each={local.items}>
          {(item, index) => (
            <div
              class={cn(
                "relative rounded-[var(--radius-lg)] border px-[var(--space-4)] py-[var(--space-4)] transition-colors",
                item.state === "complete" && "border-success/20 bg-[color:color-mix(in_oklab,var(--success)_8%,var(--card)_92%)]",
                item.state === "current" && "border-primary/25 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--primary)_10%,var(--card)_90%),var(--card))] shadow-inset",
                item.state === "upcoming" && "border-border/80 bg-background/70",
                local.orientation === "horizontal" && index() !== local.items.length - 1 && "md:pr-[calc(var(--space-4)+0.6rem)]",
              )}
            >
              <div class="flex gap-3">
                <span
                  class={cn(
                    "inline-flex size-10 shrink-0 items-center justify-center rounded-full border text-sm font-semibold shadow-xs",
                    item.state === "complete" && "border-success/30 bg-success text-success-foreground",
                    item.state === "current" && "border-primary/32 bg-primary text-primary-foreground",
                    item.state === "upcoming" && "border-border/70 bg-background text-muted-foreground",
                  )}
                  aria-current={item.state === "current" ? "step" : undefined}
                >
                  {index() + 1}
                </span>
                <div class="min-w-0 space-y-1.5">
                  <div class="text-sm font-semibold text-foreground">{item.title}</div>
                  <div class="text-sm leading-6 text-muted-foreground">{item.description}</div>
                  <div
                    class={cn(
                      "inline-flex w-fit rounded-full border px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em]",
                      item.state === "complete" && "border-success/25 bg-success/10 text-success-foreground",
                      item.state === "current" && "border-primary/25 bg-primary/10 text-primary",
                      item.state === "upcoming" && "border-border/70 bg-background text-muted-foreground",
                    )}
                  >
                    {item.state}
                  </div>
                </div>
              </div>
              <span
                class={cn(
                  "absolute bg-border/80",
                  local.orientation === "horizontal"
                    ? "left-[calc(2.5rem+var(--space-3))] top-5 hidden h-px w-[calc(100%-3.8rem)] md:block"
                    : "left-5 top-[calc(2.5rem+var(--space-3))] h-[calc(100%-3.2rem)] w-px",
                  index() === local.items.length - 1 && "hidden",
                )}
              />
            </div>
          )}
        </For>
      </div>
    </section>
  );
}
