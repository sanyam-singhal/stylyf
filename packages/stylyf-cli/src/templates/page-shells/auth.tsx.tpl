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
    <div class={cn("mx-auto flex min-h-[calc(100vh-var(--header-height))] w-full max-w-5xl items-center justify-center px-[var(--space-5)] py-[var(--space-8)]", local.class)} {...others}>
      <div class="ui-shell-muted w-full max-w-md space-y-[var(--space-5)] p-[var(--space-6)] shadow-floating">
        <div class="space-y-3 text-center">
          <p class="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Auth</p>
          <h1 class="text-3xl font-semibold tracking-[-0.04em] text-foreground">{local.title ?? `Sign in to {{APP_NAME}}`}</h1>
          <p class="text-sm leading-6 text-muted-foreground">{local.subtitle ?? "Generated authentication shell with restrained width and support copy."}</p>
        </div>
        {local.children}
        <div class="text-center text-xs text-muted-foreground">
          {local.footer ?? "Need help? Contact support or return to the main site."}
        </div>
      </div>
    </div>
  );
}

