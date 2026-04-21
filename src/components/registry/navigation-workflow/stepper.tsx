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
    <section class={cn("ui-card p-[var(--space-5)]", local.class)} {...others}>
      <div class={cn("gap-[var(--space-4)]", local.orientation === "horizontal" ? "grid md:grid-cols-3" : "space-y-[var(--space-5)]")}>
        <For each={local.items}>
          {(item, index) => (
            <div class={cn("relative", local.orientation === "horizontal" && index() !== local.items.length - 1 && "md:pr-[var(--space-4)]")}>
              <div class="flex gap-3">
                <span
                  class={cn(
                    "inline-flex size-9 shrink-0 items-center justify-center rounded-full border text-sm font-semibold",
                    item.state === "complete" && "border-success/30 bg-success text-success-foreground",
                    item.state === "current" && "border-primary/28 bg-primary text-primary-foreground",
                    item.state === "upcoming" && "border-border/70 bg-background text-muted-foreground",
                  )}
                >
                  {index() + 1}
                </span>
                <div class="space-y-1.5">
                  <div class="text-sm font-semibold text-foreground">{item.title}</div>
                  <div class="text-sm leading-6 text-muted-foreground">{item.description}</div>
                  <div class="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{item.state}</div>
                </div>
              </div>
              <span
                class={cn(
                  "absolute bg-border/70",
                  local.orientation === "horizontal"
                    ? "left-11 top-4 hidden h-px w-[calc(100%-3rem)] md:block"
                    : "left-4 top-11 h-[calc(100%-2rem)] w-px",
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
