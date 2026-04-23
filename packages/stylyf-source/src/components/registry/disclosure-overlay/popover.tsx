import { Portal } from "solid-js/web";
import { Show, createEffect, createSignal, createUniqueId, mergeProps, onCleanup, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { ChevronDown } from "lucide-solid";
import { Button } from "~/components/registry/actions-navigation/button";
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

function getPosition(anchor: HTMLElement, panel: HTMLElement | undefined, placement: PopoverProps["placement"]) {
  const rect = anchor.getBoundingClientRect();
  const panelWidth = panel?.offsetWidth ?? Math.min(384, window.innerWidth - 32);
  const panelHeight = panel?.offsetHeight ?? 240;
  const baseLeft = placement?.endsWith("end") ? rect.right - panelWidth : rect.left;
  const baseTop = placement?.startsWith("top") ? rect.top - panelHeight - 12 : rect.bottom + 12;
  const maxLeft = Math.max(16, window.innerWidth - panelWidth - 16);
  const maxTop = Math.max(16, window.innerHeight - panelHeight - 16);

  return {
    left: `${Math.min(Math.max(16, Math.round(baseLeft)), maxLeft)}px`,
    position: "fixed",
    top: `${Math.min(Math.max(16, Math.round(baseTop)), maxTop)}px`,
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
  const descriptionId = createUniqueId();
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
        setPosition(getPosition(triggerRef, panelRef, local.placement));
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
      update();
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
            aria-describedby={descriptionId}
            tabIndex={-1}
            style={position()}
            class={cn(
              "ui-popover z-50 w-[min(24rem,calc(100vw-2rem))] p-4 focus:outline-none",
              local.class,
            )}
          >
            <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Inline surface</div>
            <h3 id={titleId} class="mt-3 text-lg font-semibold tracking-tight text-foreground">
              {local.title}
            </h3>
            <p id={descriptionId} class="mt-2 text-sm leading-6 text-muted-foreground">{local.description}</p>
            <div class="mt-4">
              {local.children ?? (
                <div class="grid gap-3">
                  <div class="ui-demo-inset text-sm text-foreground">
                    Assign review to operations
                  </div>
                  <div class="ui-demo-inset text-sm text-foreground">
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
