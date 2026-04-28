import type { JSX } from "solid-js";
import { splitProps } from "solid-js";
import { cn } from "~/lib/cn";

const widthClasses = {
  narrow: "max-w-4xl",
  prose: "max-w-5xl",
  wide: "max-w-7xl",
  full: "max-w-none",
} as const;

export type ContentFrameProps = JSX.HTMLAttributes<HTMLDivElement> & {
  width?: keyof typeof widthClasses;
};

export function ContentFrame(userProps: ContentFrameProps) {
  const [local, others] = splitProps(userProps, ["children", "class", "width"]);

  return (
    <div class={cn("mx-auto w-full px-[var(--space-4)] sm:px-[var(--space-5)] lg:px-[var(--space-6)]", widthClasses[local.width ?? "wide"], local.class)} {...others}>
      {local.children}
    </div>
  );
}

