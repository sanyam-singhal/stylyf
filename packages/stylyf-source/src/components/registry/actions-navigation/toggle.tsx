import { Bold } from "lucide-solid";
import { createSignal, mergeProps, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { cn } from "~/lib/cn";
import {
  type ActionDensity,
  type ActionIntent,
  type ActionRadius,
  type ActionSize,
  type ActionTone,
  ActionContent,
  buttonDisabledState,
  buttonFrameVariants,
  buttonToneClasses,
} from "~/components/registry/actions-navigation/button";

export type ToggleProps = Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  children?: JSX.Element;
  class?: string;
  defaultPressed?: boolean;
  density?: ActionDensity;
  destructive?: boolean;
  fullWidth?: boolean;
  intent?: ActionIntent;
  leftIcon?: JSX.Element;
  loading?: boolean;
  onPressedChange?: (pressed: boolean) => void;
  pending?: boolean;
  pressed?: boolean;
  radius?: ActionRadius;
  rightIcon?: JSX.Element;
  size?: ActionSize;
  tone?: ActionTone;
};

export function Toggle(userProps: ToggleProps) {
  const props = mergeProps(
    {
      type: "button" as const,
      children: "Toggle",
      intent: "neutral" as const,
      tone: "outline" as const,
      size: "md" as const,
      density: "comfortable" as const,
      radius: "pill" as const,
      fullWidth: false,
      defaultPressed: false,
    },
    userProps,
  );

  const [local, others] = splitProps(props, [
    "children",
    "class",
    "defaultPressed",
    "density",
    "destructive",
    "fullWidth",
    "intent",
    "leftIcon",
    "loading",
    "onPressedChange",
    "pending",
    "pressed",
    "radius",
    "rightIcon",
    "size",
    "tone",
    "type",
    "onClick",
  ]);

  const [internalPressed, setInternalPressed] = createSignal(Boolean(local.defaultPressed));
  const pressed = () => local.pressed ?? internalPressed();
  const unavailable = () => buttonDisabledState(local);

  const commit = (next: boolean) => {
    if (local.pressed === undefined) {
      setInternalPressed(next);
    }

    local.onPressedChange?.(next);
  };

  const handleClick: JSX.EventHandlerUnion<HTMLButtonElement, MouseEvent> = event => {
    const onClick = local.onClick as JSX.EventHandler<HTMLButtonElement, MouseEvent> | undefined;
    onClick?.(event);

    if (event.defaultPrevented || unavailable()) {
      return;
    }

    commit(!pressed());
  };

  return (
    <button
      type={local.type ?? "button"}
      class={cn(
        buttonFrameVariants({
          size: local.size,
          density: local.density,
          radius: local.radius,
          fullWidth: local.fullWidth,
        }),
        buttonToneClasses({
          intent: local.intent,
          tone: local.tone,
          destructive: local.destructive,
          pressedTone: true,
        }),
        "justify-start shadow-xs",
        local.class,
      )}
      disabled={unavailable()}
      aria-busy={local.loading || local.pending ? true : undefined}
      aria-pressed={pressed()}
      data-current="false"
      data-loading={local.loading ? "true" : "false"}
      data-pending={local.pending ? "true" : "false"}
      data-pressed={pressed() ? "true" : "false"}
      onClick={handleClick}
      {...others}
    >
      <ActionContent
        leftIcon={local.leftIcon ?? <Bold />}
        rightIcon={local.rightIcon}
        loading={local.loading}
        pending={local.pending}
      >
        {local.children}
      </ActionContent>
    </button>
  );
}
