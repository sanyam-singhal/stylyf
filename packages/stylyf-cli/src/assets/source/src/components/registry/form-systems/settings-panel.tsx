import { Show, mergeProps, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { Badge } from "~/components/registry/feedback-display/badge";
import { cn } from "~/lib/cn";

export type SettingsPanelProps = Omit<JSX.HTMLAttributes<HTMLElement>, "children"> & {
  actions?: JSX.Element;
  children?: JSX.Element;
  class?: string;
  description?: JSX.Element;
  dirty?: boolean;
  footer?: JSX.Element;
  readOnly?: boolean;
  saving?: boolean;
  title?: JSX.Element;
};

export function SettingsPanel(userProps: SettingsPanelProps) {
  const props = mergeProps(
    {
      dirty: false,
      readOnly: false,
      saving: false,
    },
    userProps,
  );

  const [local, others] = splitProps(props, [
    "actions",
    "children",
    "class",
    "description",
    "dirty",
    "footer",
    "readOnly",
    "saving",
    "title",
  ]);

  return (
    <section class={cn("ui-card overflow-hidden p-0", local.class)} {...others}>
      <div class="flex flex-col gap-4 border-b border-border/70 px-[var(--space-6)] py-[var(--space-5)] lg:flex-row lg:items-start lg:justify-between">
        <div class="space-y-2">
          <div class="flex flex-wrap items-center gap-2">
            <h3 class="text-lg font-semibold tracking-[-0.02em] text-foreground">{local.title}</h3>
            <Show when={local.dirty}>
              <Badge tone="accent">Unsaved</Badge>
            </Show>
            <Show when={local.saving}>
              <Badge tone="accent">Saving</Badge>
            </Show>
            <Show when={local.readOnly}>
              <Badge>Read only</Badge>
            </Show>
          </div>
          <Show when={local.description}>
            <p class="max-w-3xl text-sm leading-6 text-muted-foreground">{local.description}</p>
          </Show>
        </div>
        <Show when={local.actions}>
          <div class="shrink-0">{local.actions}</div>
        </Show>
      </div>

      <div class="space-y-3 px-[var(--space-6)] py-[var(--space-6)]">{local.children}</div>

      <Show when={local.footer}>
        <div class="border-t border-border/70 bg-background-subtle/60 px-[var(--space-6)] py-[var(--space-4)]">{local.footer}</div>
      </Show>
    </section>
  );
}
