import type { JSX } from "solid-js";
import { splitProps } from "solid-js";
import { cn } from "~/lib/cn";

const paddingClasses = {
  tight: "p-[var(--space-4)]",
  comfortable: "p-[var(--space-5)]",
  loose: "p-[var(--space-6)]",
} as const;

const toneClasses = {
  default: "ui-shell-muted",
  inset: "ui-card-muted",
  elevated: "ui-card",
} as const;

export type PanelProps = JSX.HTMLAttributes<HTMLElement> & {
  as?: "div" | "section";
  padding?: keyof typeof paddingClasses;
  tone?: keyof typeof toneClasses;
};

export function Panel(userProps: PanelProps) {
  const [local, others] = splitProps(userProps, ["as", "children", "class", "padding", "tone"]);
  const Component = local.as ?? "section";

  return (
    <Component class={cn(toneClasses[local.tone ?? "default"], paddingClasses[local.padding ?? "comfortable"], local.class)} {...others}>
      {local.children}
    </Component>
  );
}

