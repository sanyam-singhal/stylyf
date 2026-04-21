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

type PanelBaseProps = {
  as?: "div" | "section";
  children?: JSX.Element;
  class?: string;
  padding?: keyof typeof paddingClasses;
  tone?: keyof typeof toneClasses;
};

type PanelDivProps = JSX.HTMLAttributes<HTMLDivElement> & PanelBaseProps & {
  as: "div";
};

type PanelSectionProps = JSX.HTMLAttributes<HTMLElement> & PanelBaseProps & {
  as?: "section";
};

export type PanelProps = PanelDivProps | PanelSectionProps;

export function Panel(userProps: PanelProps) {
  const [local, others] = splitProps(userProps, ["as", "children", "class", "padding", "tone"]);
  const classes = cn(toneClasses[local.tone ?? "default"], paddingClasses[local.padding ?? "comfortable"], local.class);

  if (local.as === "div") {
    return (
      <div class={classes} {...(others as JSX.HTMLAttributes<HTMLDivElement>)}>
        {local.children}
      </div>
    );
  }

  return (
    <section class={classes} {...(others as JSX.HTMLAttributes<HTMLElement>)}>
      {local.children}
    </section>
  );
}
