import { Portal } from "solid-js/web";
import { Show, createEffect, createSignal, createUniqueId, mergeProps, onCleanup, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { ChevronDown } from "lucide-solid";
import { Button } from "~/components/registry/tier-1/actions-navigation/button";
import { cn } from "~/lib/cn";

export type PopoverProps = Omit<JSX.HTMLAttributes<HTMLDivElement>, "children" | "ref"> & {
  children?: JSX.Element;
  class?: string;
  defaultOpen?: boolean;
  description?: JSX.Element;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  placement?: "bottom-end" | "bottom-start" | "top-end" | "top-start";
  title?: JSX.Element;
  triggerLabel?: JSX.Element;
};

function getPosition(anchor: HTMLElement, placement: PopoverProps["placement"]) {
  const rect = anchor.getBoundingClientRect();
  const top = placement?.startsWith("top") ? rect.top - 12 : rect.bottom + 12;
  const left = placement?.endsWith("end") ? rect.right : rect.left;
  const transform = placement?.endsWith("end")
    ? placement?.startsWith("top")
      ? "translate(-100%, -100%)"
      : "translateX(-100%)"
    : placement?.startsWith("top")
      ? "translateY(-100%)"
      : "none";

  return {
    left: `${Math.max(16, Math.round(left))}px`,
    position: "fixed",
    top: `${Math.max(16, Math.round(top))}px`,
    transform,
  };
}

export function Popover(userProps: PopoverProps) {
  const props = mergeProps(
    {
      defaultOpen: false,
      description: "Anchored surfaces are useful for rich inline actions that should not block the rest of the page.",
      placement: "bottom-start" as const,
      title: "Quick actions",
      triggerLabel: "Open popover",
    },
    userProps,
  );

  const [local, others] = splitProps(props, [
    "children",
    "class",
    "defaultOpen",
    "description",
    "onOpenChange",
    "open",
    "placement",
    "title",
    "triggerLabel",
  ]);

  const titleId = createUniqueId();
  const [internalOpen, setInternalOpen] = createSignal(Boolean(local.defaultOpen));
  const [position, setPosition] = createSignal<Record<string, string>>({});
  let triggerRef: HTMLButtonElement | undefined;
  let panelRef: HTMLDivElement | undefined;

  const isOpen = () => (local.open !== undefined ? local.open : internalOpen());

  const setOpen = (next: boolean) => {
    if (local.open === undefined) {
      setInternalOpen(next);
    }

    local.onOpenChange?.(next);
  };

  createEffect(() => {
    if (!isOpen() || !triggerRef) return;

    const update = () => {
      if (triggerRef) {
        setPosition(getPosition(triggerRef, local.placement));
      }
    };

    update();

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;

      if (!(target instanceof Node)) return;
      if (triggerRef?.contains(target) || panelRef?.contains(target)) return;
      setOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        triggerRef?.focus();
      }
    };

    const handleScroll = () => update();
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", update);
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    queueMicrotask(() => {
      panelRef?.focus();
    });

    onCleanup(() => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", update);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    });
  });

  return (
    <div class="inline-flex" {...others}>
      <Button
        ref={triggerRef}
        intent="neutral"
        tone={isOpen() ? "solid" : "outline"}
        rightIcon={<ChevronDown class={cn("transition", isOpen() && "rotate-180")} />}
        aria-expanded={isOpen()}
        onClick={() => setOpen(!isOpen())}
      >
        {local.triggerLabel}
      </Button>

      <Show when={isOpen()}>
        <Portal>
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="false"
            aria-labelledby={titleId}
            tabIndex={-1}
            style={position()}
            class={cn(
              "z-50 w-[min(24rem,calc(100vw-2rem))] rounded-[1.45rem] border border-border/70 bg-panel p-4 shadow-soft focus:outline-none",
              local.class,
            )}
          >
            <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">Inline surface</div>
            <h3 id={titleId} class="mt-3 text-lg font-semibold tracking-tight text-foreground">
              {local.title}
            </h3>
            <p class="mt-2 text-sm leading-6 text-muted">{local.description}</p>
            <div class="mt-4">
              {local.children ?? (
                <div class="grid gap-3">
                  <div class="rounded-[1.1rem] border border-border/70 bg-background px-4 py-3 text-sm text-foreground">
                    Assign review to operations
                  </div>
                  <div class="rounded-[1.1rem] border border-border/70 bg-background px-4 py-3 text-sm text-foreground">
                    Request legal sign-off
                  </div>
                </div>
              )}
            </div>
          </div>
        </Portal>
      </Show>
    </div>
  );
}
