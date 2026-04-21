import { Quote } from "lucide-solid";
import { Show, mergeProps, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { Avatar } from "~/components/registry/feedback-display/avatar";
import { cn } from "~/lib/cn";

export type TestimonialCardProps = Omit<JSX.HTMLAttributes<HTMLElement>, "children"> & {
  author?: JSX.Element;
  class?: string;
  company?: JSX.Element;
  quote?: JSX.Element;
  role?: JSX.Element;
};

export function TestimonialCard(userProps: TestimonialCardProps) {
  const props = mergeProps(
    {
      author: "Avery Chen",
      company: "Northwind Cloud",
      quote: "Stylyf gave us the shadcn-style workflow we wanted without locking our team into a closed package library.",
      role: "Design systems lead",
    },
    userProps,
  );

  const [local, others] = splitProps(props, ["author", "class", "company", "quote", "role"]);

  return (
    <section class={cn("ui-card space-y-[var(--space-5)] p-[var(--space-6)]", local.class)} {...others}>
      <div class="inline-flex size-10 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-soft">
        <Quote class="size-4.5" />
      </div>
      <blockquote class="text-lg leading-8 tracking-[-0.02em] text-foreground">{local.quote}</blockquote>
      <div class="flex items-center gap-3">
        <Avatar alt={typeof local.author === "string" ? local.author : "Customer"} size="sm" />
        <div class="space-y-0.5">
          <div class="text-sm font-semibold text-foreground">{local.author}</div>
          <div class="text-sm text-muted-foreground">
            {local.role}
            <Show when={local.company}>
              <span> · {local.company}</span>
            </Show>
          </div>
        </div>
      </div>
    </section>
  );
}
