import type { JSX } from "solid-js";
import { splitProps } from "solid-js";
import { ContentFrame } from "~/components/layout/content-frame";

export type BlankPageShellProps = JSX.HTMLAttributes<HTMLDivElement> & {
  children?: JSX.Element;
};

export function BlankPageShell(userProps: BlankPageShellProps) {
  const [local, others] = splitProps(userProps, ["children", "class"]);

  return (
    <ContentFrame width="wide" class={local.class} {...others}>
      {local.children}
    </ContentFrame>
  );
}

