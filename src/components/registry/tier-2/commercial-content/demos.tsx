import { ArrowRight, Layers3, Quote, Sparkles } from "lucide-solid";
import type { JSX } from "solid-js";
import type { RegistryItem } from "~/lib/registry";
import { Button } from "~/components/registry/tier-1/actions-navigation/button";
import { FAQList } from "~/components/registry/tier-2/commercial-content/faq-list";
import { FeatureCard } from "~/components/registry/tier-2/commercial-content/feature-card";
import { PricingCard } from "~/components/registry/tier-2/commercial-content/pricing-card";
import { TestimonialCard } from "~/components/registry/tier-2/commercial-content/testimonial-card";

function DemoFrame(props: { children: JSX.Element; item: RegistryItem; title: string }) {
  return (
    <div class="space-y-4" data-demo={props.item.slug}>
      <div class="ui-demo-chip">
        <span>{props.title}</span>
        <span class="text-border">/</span>
        <span>{props.item.name}</span>
      </div>
      <div class="ui-demo-frame">{props.children}</div>
    </div>
  );
}

export function PricingCardPreview(props: { item: RegistryItem }) {
  return (
    <DemoFrame item={props.item} title="Live block">
      <div class="max-w-sm">
        <PricingCard
          featured
          cta={<Button type="button" fullWidth>Choose plan</Button>}
        />
      </div>
    </DemoFrame>
  );
}

export function FeatureCardPreview(props: { item: RegistryItem }) {
  return (
    <DemoFrame item={props.item} title="Live block">
      <div class="max-w-md">
        <FeatureCard
          icon={<Layers3 class="size-5" />}
          media={<div class="aspect-[16/9] bg-linear-to-br from-accent via-background-subtle to-card" />}
          cta={<Button type="button" tone="ghost" intent="neutral" rightIcon={<ArrowRight />}>Explore registry</Button>}
        />
      </div>
    </DemoFrame>
  );
}

export function TestimonialCardPreview(props: { item: RegistryItem }) {
  return (
    <DemoFrame item={props.item} title="Live block">
      <div class="max-w-xl">
        <TestimonialCard />
      </div>
    </DemoFrame>
  );
}

export function FAQListPreview(props: { item: RegistryItem }) {
  return (
    <DemoFrame item={props.item} title="Live block">
      <FAQList />
    </DemoFrame>
  );
}

export const previewBySlug = {
  "faq-list": FAQListPreview,
  "feature-card": FeatureCardPreview,
  "pricing-card": PricingCardPreview,
  "testimonial-card": TestimonialCardPreview,
};
