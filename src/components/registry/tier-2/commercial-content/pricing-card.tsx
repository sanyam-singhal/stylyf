import { Check } from "lucide-solid";
import { For, Show, mergeProps, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { Badge } from "~/components/registry/tier-1/feedback-display/badge";
import { cn } from "~/lib/cn";

export type PricingCardProps = Omit<JSX.HTMLAttributes<HTMLElement>, "children"> & {
  cta?: JSX.Element;
  class?: string;
  description?: JSX.Element;
  featured?: boolean;
  features?: string[];
  plan?: JSX.Element;
  price?: JSX.Element;
};

export function PricingCard(userProps: PricingCardProps) {
  const props = mergeProps(
    {
      description: "For growing teams shipping a source-owned design system and registry.",
      featured: false,
      features: ["Unlimited components", "Theme studio", "Source-owned exports", "Workspace admin"],
      plan: "Scale",
      price: "$48 / seat",
    },
    userProps,
  );

  const [local, others] = splitProps(props, ["cta", "class", "description", "featured", "features", "plan", "price"]);

  return (
    <section
      class={cn(
        "ui-card space-y-[var(--space-5)] p-[var(--space-6)]",
        local.featured && "border-primary/24 bg-accent/20 shadow-floating",
        local.class,
      )}
      {...others}
    >
      <div class="flex items-start justify-between gap-4">
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <h3 class="text-lg font-semibold tracking-[-0.02em] text-foreground">{local.plan}</h3>
            <Show when={local.featured}>
              <Badge tone="accent">Featured</Badge>
            </Show>
          </div>
          <p class="text-sm leading-6 text-muted-foreground">{local.description}</p>
        </div>
        <div class="text-right">
          <div class="text-3xl font-semibold tracking-[-0.03em] text-foreground">{local.price}</div>
          <div class="text-sm text-muted-foreground">Annual billing</div>
        </div>
      </div>

      <div class="space-y-3">
        <For each={local.features}>
          {feature => (
            <div class="flex items-start gap-3 text-sm text-muted-foreground">
              <span class="mt-0.5 inline-flex size-5 items-center justify-center rounded-full bg-success text-success-foreground">
                <Check class="size-3.5" />
              </span>
              <span>{feature}</span>
            </div>
          )}
        </For>
      </div>

      <Show when={local.cta}>
        <div>{local.cta}</div>
      </Show>
    </section>
  );
}
