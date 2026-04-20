import { ShieldCheck, Sparkles } from "lucide-solid";
import { Show, mergeProps, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { Badge } from "~/components/registry/tier-1/feedback-display/badge";
import { cn } from "~/lib/cn";

export type AuthCardShellProps = Omit<JSX.HTMLAttributes<HTMLElement>, "children"> & {
  body?: JSX.Element;
  class?: string;
  footer?: JSX.Element;
  maxWidth?: "md" | "lg";
  status?: "error" | "submitting" | "success";
  subtitle?: JSX.Element;
  title?: JSX.Element;
  visual?: JSX.Element;
};

export function AuthCardShell(userProps: AuthCardShellProps) {
  const props = mergeProps(
    {
      maxWidth: "lg" as const,
      status: undefined,
      subtitle: "Purpose-built auth shell for login, signup, invite, and verification flows.",
      title: "Welcome back",
      visual: undefined,
    },
    userProps,
  );

  const [local, others] = splitProps(props, ["body", "class", "footer", "maxWidth", "status", "subtitle", "title", "visual"]);

  return (
    <section
      class={cn(
        "ui-card overflow-hidden p-0",
        local.maxWidth === "md" ? "max-w-3xl" : "max-w-5xl",
        local.class,
      )}
      {...others}
    >
      <div class={cn("grid min-h-[30rem]", local.visual ? "lg:grid-cols-[1.05fr_0.95fr]" : "grid-cols-1")}>
        <Show when={local.visual}>
          <div class="relative overflow-hidden border-b border-border/70 bg-linear-to-br from-accent via-background-subtle to-card px-[var(--space-8)] py-[var(--space-8)] lg:border-b-0 lg:border-r">
            <div class="absolute right-6 top-6">
              <Badge tone="accent" emphasis="soft">Auth shell</Badge>
            </div>
            <div class="relative flex h-full flex-col justify-between gap-8">
              <div class="inline-flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-soft">
                <ShieldCheck class="size-5" />
              </div>
              <div class="space-y-4">
                <div class="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Protected workspace</div>
                <div class="text-3xl font-semibold tracking-[-0.03em] text-foreground">Secure access with a flexible, brandable auth shell.</div>
                <div class="max-w-md text-sm leading-6 text-muted-foreground">
                  Use the visual side for context, trust messaging, enterprise proof, or first-run onboarding.
                </div>
              </div>
              <Show when={local.visual}>{local.visual}</Show>
            </div>
          </div>
        </Show>

        <div class="flex flex-col justify-between px-[var(--space-6)] py-[var(--space-6)] lg:px-[var(--space-8)] lg:py-[var(--space-8)]">
          <div class="space-y-6">
            <div class="space-y-3">
              <div class="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                <Sparkles class="size-3.5" />
                <span>Stylyf auth</span>
              </div>
              <div class="flex flex-wrap items-center gap-3">
                <h3 class="text-3xl font-semibold tracking-[-0.03em] text-foreground">{local.title}</h3>
                <Show when={local.status}>
                  <Badge tone={local.status === "error" ? "danger" : local.status === "success" ? "success" : "accent"}>
                    {local.status}
                  </Badge>
                </Show>
              </div>
              <p class="max-w-xl text-sm leading-6 text-muted-foreground">{local.subtitle}</p>
            </div>

            <div class="space-y-4">{local.body}</div>
          </div>

          <Show when={local.footer}>
            <div class="mt-[var(--space-8)] border-t border-border/70 pt-[var(--space-4)] text-sm text-muted-foreground">{local.footer}</div>
          </Show>
        </div>
      </div>
    </section>
  );
}
