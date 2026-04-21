import { Portal } from "solid-js/web";
import { Show, createEffect, createSignal, createUniqueId, mergeProps, onCleanup, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { Info } from "lucide-solid";
import { cn } from "~/lib/cn";

export type TooltipProps = Omit<JSX.HTMLAttributes<HTMLSpanElement>, "children" | "ref"> & {
  class?: string;
  content?: JSX.Element;
  delay?: number;
  label?: JSX.Element;
  placement?: "bottom" | "left" | "right" | "top";
};

function getTooltipPosition(anchor: HTMLElement, placement: NonNullable<TooltipProps["placement"]>) {
  const rect = anchor.getBoundingClientRect();

  if (placement === "bottom") {
    return { left: `${Math.round(rect.left + rect.width / 2)}px`, top: `${Math.round(rect.bottom + 12)}px`, transform: "translateX(-50%)" };
  }

  if (placement === "left") {
    return { left: `${Math.round(rect.left - 12)}px`, top: `${Math.round(rect.top + rect.height / 2)}px`, transform: "translate(-100%, -50%)" };
  }

  if (placement === "right") {
    return { left: `${Math.round(rect.right + 12)}px`, top: `${Math.round(rect.top + rect.height / 2)}px`, transform: "translateY(-50%)" };
  }

  return { left: `${Math.round(rect.left + rect.width / 2)}px`, top: `${Math.round(rect.top - 12)}px`, transform: "translate(-50%, -100%)" };
}

export function Tooltip(userProps: TooltipProps) {
  const props = mergeProps(
    {
      content: "Use a tooltip for helpful supplementary detail, never for required information.",
      delay: 160,
      label: "Why is this locked?",
      placement: "top" as const,
    },
    userProps,
  );

  const [local, others] = splitProps(props, ["class", "content", "delay", "label", "placement"]);
  const tooltipId = createUniqueId();
  const [open, setOpen] = createSignal(false);
  const [position, setPosition] = createSignal<Record<string, string>>({});
  let triggerRef: HTMLButtonElement | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const show = () => {
    timer = setTimeout(() => {
      if (!triggerRef) return;
      setPosition({
        ...getTooltipPosition(triggerRef, local.placement),
        position: "fixed",
      });
      setOpen(true);
    }, local.delay);
  };

  const hide = () => {
    if (timer) clearTimeout(timer);
    setOpen(false);
  };

  createEffect(() => {
    if (!open()) return;

    const update = () => {
      if (triggerRef) {
        setPosition({
          ...getTooltipPosition(triggerRef, local.placement),
          position: "fixed",
        });
      }
    };

    const handleScroll = () => update();
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", update);

    onCleanup(() => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", update);
    });
  });

  onCleanup(() => {
    if (timer) clearTimeout(timer);
  });

  return (
    <span class="inline-flex" {...others}>
      <button
        ref={triggerRef}
        type="button"
        class="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-3 py-2 text-sm text-foreground transition hover:border-primary/30 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
        aria-describedby={open() ? tooltipId : undefined}
        onPointerEnter={show}
        onPointerLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        <Info class="size-4 text-primary" />
        <span>{local.label}</span>
      </button>

      <Show when={open()}>
        <Portal>
          <div
            id={tooltipId}
            role="tooltip"
            style={position()}
            class={cn(
              "z-50 max-w-xs rounded-[var(--radius-md)] border border-border/80 bg-foreground px-3 py-2 text-sm leading-6 text-background shadow-soft",
              local.class,
            )}
          >
            {local.content}
          </div>
        </Portal>
      </Show>
    </span>
  );
}
