import type { JSX } from "solid-js";
import { splitProps } from "solid-js";
import { cn } from "~/lib/cn";

export type AuthPageShellProps = JSX.HTMLAttributes<HTMLDivElement> & {
  children?: JSX.Element;
  footer?: JSX.Element;
  subtitle?: JSX.Element;
  title?: JSX.Element;
};

export function AuthPageShell(userProps: AuthPageShellProps) {
  const [local, others] = splitProps(userProps, ["children", "class", "footer", "subtitle", "title"]);

  return (
    <div class={cn("builder-stage flex min-h-screen items-center justify-center px-[var(--space-5)] py-[var(--space-8)]", local.class)} {...others}>
      <div class="grid w-full max-w-6xl overflow-hidden rounded-[calc(var(--radius-3xl)+0.65rem)] border border-border/75 bg-card/78 shadow-floating backdrop-blur md:grid-cols-[1.05fr_0.95fr]">
        <div class="builder-panel-ink relative hidden min-h-[38rem] flex-col justify-between overflow-hidden p-[var(--space-8)] md:flex">
          <div class="space-y-5">
            <div class="builder-orb size-14 font-mono text-base font-black">S</div>
            <div class="space-y-3">
              <p class="text-xs font-semibold uppercase tracking-[0.24em] text-ink-foreground/48">Internal builder</p>
              <h2 class="max-w-md text-5xl font-semibold tracking-[-0.07em] text-ink-foreground">Ship small apps without losing the architecture.</h2>
              <p class="max-w-md text-sm leading-6 text-ink-foreground/64">Stylyf composes the SolidStart app, Codex iterates in a workspace, Webknife verifies the preview, and GitHub keeps every step reviewable.</p>
            </div>
          </div>
          <div class="grid gap-3 text-sm text-ink-foreground/72">
            <div class="builder-rail-card">1. Prompt an app idea</div>
            <div class="builder-rail-card">2. Edit the IR with friendly controls</div>
            <div class="builder-rail-card">3. Generate, preview, validate, commit</div>
          </div>
        </div>
        <div class="flex items-center justify-center p-[var(--space-7)]">
        <div class="w-full max-w-md space-y-[var(--space-5)]">
        <div class="space-y-3">
          <p class="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-primary">Depths AI</p>
          <h1 class="text-4xl font-semibold tracking-[-0.055em] text-foreground">{local.title ?? `Sign in to Stylyf Builder`}</h1>
          <p class="text-sm leading-6 text-muted-foreground">{local.subtitle ?? "Generated authentication shell with restrained width and support copy."}</p>
        </div>
        {local.children}
        <div class="text-xs text-muted-foreground">
          {local.footer ?? "Need help? Contact support or return to the main site."}
        </div>
      </div>
      </div>
      </div>
    </div>
  );
}
