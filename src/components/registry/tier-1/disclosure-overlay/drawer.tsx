import { Portal } from "solid-js/web";
import { Show, createEffect, createSignal, createUniqueId, mergeProps, onCleanup, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { X } from "lucide-solid";
import { Button } from "~/components/registry/tier-1/actions-navigation/button";
import { cn } from "~/lib/cn";

export type DrawerProps = Omit<JSX.HTMLAttributes<HTMLDivElement>, "children" | "ref"> & {
  children?: JSX.Element;
  class?: string;
  defaultOpen?: boolean;
  description?: JSX.Element;
  footer?: JSX.Element;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  side?: "bottom" | "left" | "right";
  title?: JSX.Element;
};

function getFocusableElements(container: HTMLElement | undefined) {
  if (!container) return [];

  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  );
}

export function Drawer(userProps: DrawerProps) {
  const props = mergeProps(
    {
      defaultOpen: false,
      description: "Drawers keep surrounding context visible while exposing a substantial secondary surface.",
      side: "right" as const,
      title: "Edit member access",
    },
    userProps,
  );

  const [local, others] = splitProps(props, [
    "children",
    "class",
    "defaultOpen",
    "description",
    "footer",
    "onOpenChange",
    "open",
    "side",
    "title",
  ]);

  const titleId = createUniqueId();
  const descriptionId = createUniqueId();
  const [internalOpen, setInternalOpen] = createSignal(Boolean(local.defaultOpen));
  let panelRef: HTMLDivElement | undefined;

  const isOpen = () => (local.open !== undefined ? local.open : internalOpen());

  const setOpen = (next: boolean) => {
    if (local.open === undefined) {
      setInternalOpen(next);
    }

    local.onOpenChange?.(next);
  };

  createEffect(() => {
    if (!isOpen()) return;

    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
    document.body.style.overflow = "hidden";

    queueMicrotask(() => {
      getFocusableElements(panelRef)[0]?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!panelRef) return;

      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = getFocusableElements(panelRef);
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    onCleanup(() => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    });
  });

  const layoutClass = () =>
    ({
      right: "ml-auto h-full max-h-full w-full max-w-xl",
      left: "mr-auto h-full max-h-full w-full max-w-xl",
      bottom: "mt-auto w-full max-w-3xl",
    })[local.side];

  return (
    <Show when={isOpen()}>
      <Portal>
        <div class="fixed inset-0 z-50 flex p-3 sm:p-4">
          <div aria-hidden="true" class="ui-overlay absolute inset-0" onClick={() => setOpen(false)} />
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            tabIndex={-1}
            class={cn(
              "ui-popover relative z-10 flex w-full flex-col overflow-hidden p-6 focus:outline-none",
              layoutClass(),
              local.class,
            )}
            onPointerDown={event => event.stopPropagation()}
            {...others}
          >
            <div class="flex items-start justify-between gap-4">
              <div>
                <div class="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  <span>Contextual edit</span>
                </div>
                <h3 id={titleId} class="mt-4 text-2xl font-semibold tracking-tight text-foreground">
                  {local.title}
                </h3>
                <p id={descriptionId} class="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                  {local.description}
                </p>
              </div>

              <button
                type="button"
                aria-label="Close drawer"
                class="inline-flex size-10 items-center justify-center rounded-full border border-border/70 bg-background text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
                onClick={() => setOpen(false)}
              >
                <X class="size-4.5" />
              </button>
            </div>

            <div class="mt-6 flex-1 overflow-auto">
              {local.children ?? (
                <div class="grid gap-4">
                  <div class="ui-demo-inset">
                    <div class="text-xs uppercase tracking-[0.2em] text-muted-foreground">Role</div>
                    <div class="mt-3 text-sm font-medium text-foreground">Billing administrator</div>
                    <div class="mt-2 text-sm leading-6 text-muted-foreground">Can manage invoices, seats, payment methods, and upgrade actions.</div>
                  </div>
                  <div class="ui-demo-inset">
                    <div class="text-xs uppercase tracking-[0.2em] text-muted-foreground">Scope</div>
                    <div class="mt-3 text-sm leading-6 text-muted-foreground">
                      Applies to the current workspace only, which is why a side panel works better than a route change.
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div class="mt-6 border-t border-border/70 pt-5">
              {local.footer ?? (
                <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <Button intent="neutral" tone="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button>Save changes</Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </Portal>
    </Show>
  );
}
