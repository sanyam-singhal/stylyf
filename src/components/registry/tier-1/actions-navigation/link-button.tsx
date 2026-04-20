import { A } from "@solidjs/router";
import { ArrowUpRight, LoaderCircle } from "lucide-solid";
import { Show, mergeProps, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { cn } from "~/lib/cn";
import {
  type ActionDensity,
  type ActionIntent,
  type ActionRadius,
  type ActionSize,
  type ActionTone,
  buttonFrameVariants,
  buttonToneClasses,
} from "~/components/registry/tier-1/actions-navigation/button";

export type LinkButtonProps = Omit<JSX.AnchorHTMLAttributes<HTMLAnchorElement>, "children" | "href"> & {
  children?: JSX.Element;
  class?: string;
  current?: boolean;
  density?: ActionDensity;
  destructive?: boolean;
  disabled?: boolean;
  end?: boolean;
  external?: boolean;
  fullWidth?: boolean;
  href?: string;
  intent?: ActionIntent;
  pending?: boolean;
  radius?: ActionRadius;
  showExternalBadge?: boolean;
  size?: ActionSize;
  tone?: ActionTone;
  underline?: boolean;
};

function isInternalHref(href: string, external?: boolean) {
  return !external && href.startsWith("/");
}

function sharedClass(props: {
  class?: string;
  current?: boolean;
  density?: ActionDensity;
  destructive?: boolean;
  fullWidth?: boolean;
  intent?: ActionIntent;
  pending?: boolean;
  radius?: ActionRadius;
  size?: ActionSize;
  tone?: ActionTone;
}) {
  return cn(
    buttonFrameVariants({
      size: props.size,
      density: props.density,
      radius: props.radius,
      fullWidth: props.fullWidth,
    }),
    buttonToneClasses({
      intent: props.intent,
      tone: props.tone,
      destructive: props.destructive,
    }),
    props.current && "border-primary/24 bg-accent text-foreground shadow-xs",
    props.pending && "opacity-85",
    props.class,
  );
}

export function LinkButton(userProps: LinkButtonProps) {
  const props = mergeProps(
    {
      href: "/",
      children: "Explore Stylyf",
      intent: "neutral" as const,
      tone: "outline" as const,
      size: "md" as const,
      density: "comfortable" as const,
      radius: "pill" as const,
      fullWidth: false,
      current: false,
      pending: false,
      underline: false,
      showExternalBadge: true,
    },
    userProps,
  );

  const [local, others] = splitProps(props, [
    "children",
    "class",
    "current",
    "density",
    "destructive",
    "disabled",
    "end",
    "external",
    "fullWidth",
    "href",
    "intent",
    "pending",
    "radius",
    "showExternalBadge",
    "size",
    "tone",
    "underline",
  ]);

  const className = sharedClass(local);
  const activeClass = buttonToneClasses({
    destructive: local.destructive,
    intent: local.intent,
    tone: "soft",
  });

  const content = (
    <>
      <span
        class={cn(
          "inline-flex min-w-0 items-center gap-2",
          local.underline && "[&_span:last-child]:underline [&_span:last-child]:underline-offset-4",
        )}
      >
        <Show when={local.pending}>
          <LoaderCircle class="size-4 animate-spin" />
        </Show>
        <span class="truncate">{local.children}</span>
      </span>
      <Show when={local.external && local.showExternalBadge}>
        <ArrowUpRight class="size-4" />
      </Show>
    </>
  );

  if (local.disabled || others["aria-disabled"]) {
    return (
      <a
        class={className}
        href={local.href}
        aria-disabled="true"
        tabIndex={-1}
        data-current={local.current ? "true" : "false"}
        data-loading="false"
        data-pending={local.pending ? "true" : "false"}
        data-pressed="false"
        onClick={event => event.preventDefault()}
      >
        {content}
      </a>
    );
  }

  if (isInternalHref(local.href, local.external)) {
    return (
      <A
        href={local.href}
        end={local.end}
        class={className}
        activeClass={activeClass}
        aria-disabled={local.disabled ? true : undefined}
        data-current={local.current ? "true" : "false"}
        data-loading="false"
        data-pending={local.pending ? "true" : "false"}
        data-pressed="false"
        {...others}
      >
        {content}
      </A>
    );
  }

  return (
    <a
      href={local.href}
      class={className}
      aria-disabled={local.disabled ? true : undefined}
      rel={local.external ? "noreferrer noopener" : others.rel}
      target={local.external ? "_blank" : others.target}
      data-current={local.current ? "true" : "false"}
      data-loading="false"
      data-pending={local.pending ? "true" : "false"}
      data-pressed="false"
      {...others}
    >
      {content}
    </a>
  );
}
