import { Portal } from "solid-js/web";
import { Show, createEffect, createSignal, createUniqueId, mergeProps, onCleanup, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { X } from "lucide-solid";
import { cn } from "~/lib/cn";

export type DialogProps = Omit<JSX.HTMLAttributes<HTMLDivElement>, "children" | "ref"> & {
  children?: JSX.Element;
  class?: string;
  closeLabel?: string;
  defaultOpen?: boolean;
  description?: JSX.Element;
  dismissible?: boolean;
  footer?: JSX.Element;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  size?: "sm" | "md" | "lg";
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

export function Dialog(userProps: DialogProps) {
  const props = mergeProps(
    {
      closeLabel: "Close dialog",
      defaultOpen: false,
      description: "Dialogs block the surrounding page and focus attention on a contained decision or task.",
      dismissible: true,
      size: "md" as const,
      title: "Review change",
    },
    userProps,
  );

  const [local, others] = splitProps(props, [
    "children",
    "class",
    "closeLabel",
    "defaultOpen",
    "description",
    "dismissible",
    "footer",
    "onOpenChange",
    "open",
    "size",
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
    if (!isOpen()) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
    document.body.style.overflow = "hidden";

    queueMicrotask(() => {
      const focusable = getFocusableElements(panelRef);
      focusable[0]?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!panelRef) {
        return;
      }

      if (event.key === "Escape" && local.dismissible) {
        event.preventDefault();
        setOpen(false);
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusable = getFocusableElements(panelRef);

      if (!focusable.length) {
        event.preventDefault();
        panelRef.focus();
        return;
      }

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

  const sizeClass = () =>
    ({
      sm: "max-w-md",
      md: "max-w-xl",
      lg: "max-w-3xl",
    })[local.size];

  return (
    <Show when={isOpen()}>
      <Portal>
        <div class="fixed inset-0 z-50 px-4 py-6 sm:px-6 sm:py-10">
          <div
            aria-hidden="true"
            class="ui-overlay absolute inset-0"
            onClick={() => {
              if (local.dismissible) setOpen(false);
            }}
          />
          <div class="relative flex min-h-full items-center justify-center">
            <div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              aria-describedby={descriptionId}
              tabIndex={-1}
              class={cn(
                "ui-popover relative z-10 max-h-full w-full overflow-auto p-6 focus:outline-none",
                sizeClass(),
                local.class,
              )}
              onPointerDown={event => event.stopPropagation()}
              {...others}
            >
              <Show when={local.dismissible}>
                <button
                  type="button"
                  aria-label={local.closeLabel}
                  class="absolute right-4 top-4 inline-flex size-10 items-center justify-center rounded-full border border-border/70 bg-background text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
                  onClick={() => setOpen(false)}
                >
                  <X class="size-4.5" />
                </button>
              </Show>

              <div class="pr-12">
                <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Modal surface</div>
                <h3 id={titleId} class="mt-3 text-2xl font-semibold tracking-tight text-foreground">
                  {local.title}
                </h3>
                <Show when={local.description}>
                  <p id={descriptionId} class="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                    {local.description}
                  </p>
                </Show>
              </div>

              <div class="mt-6 space-y-4">
                {local.children ?? (
                  <div class="grid gap-4 lg:grid-cols-2">
                    <div class="ui-demo-inset">
                      <div class="text-xs uppercase tracking-[0.2em] text-muted-foreground">Request summary</div>
                      <div class="mt-3 text-sm leading-6 text-foreground">
                        Promote the new pricing section to live and notify workspace owners when the publish completes.
                      </div>
                    </div>
                    <div class="ui-demo-inset">
                      <div class="text-xs uppercase tracking-[0.2em] text-muted-foreground">Impact</div>
                      <div class="mt-3 text-sm leading-6 text-muted-foreground">
                        This affects one public route and triggers a content sync to the marketing cache.
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Show when={local.footer}>
                <div class="mt-6 border-t border-border/70 pt-5">{local.footer}</div>
              </Show>
            </div>
          </div>
        </div>
      </Portal>
    </Show>
  );
}
