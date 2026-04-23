import { Portal } from "solid-js/web";
import { Show, createEffect, createSignal, createUniqueId, mergeProps, onCleanup, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { AlertTriangle } from "lucide-solid";
import { Button } from "~/components/registry/actions-navigation/button";
import { cn } from "~/lib/cn";

export type AlertDialogProps = Omit<JSX.HTMLAttributes<HTMLDivElement>, "children" | "ref"> & {
  busy?: boolean;
  cancelLabel?: string;
  class?: string;
  confirmLabel?: string;
  defaultOpen?: boolean;
  description?: JSX.Element;
  onCancel?: () => void;
  onConfirm?: () => void;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  severity?: "danger" | "warning";
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

export function AlertDialog(userProps: AlertDialogProps) {
  const props = mergeProps(
    {
      busy: false,
      cancelLabel: "Cancel",
      confirmLabel: "Delete workspace",
      defaultOpen: false,
      description: "This action permanently removes the workspace, active sessions, and queued automations.",
      severity: "danger" as const,
      title: "Delete workspace?",
    },
    userProps,
  );

  const [local, others] = splitProps(props, [
    "busy",
    "cancelLabel",
    "class",
    "confirmLabel",
    "defaultOpen",
    "description",
    "onCancel",
    "onConfirm",
    "onOpenChange",
    "open",
    "severity",
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
        local.onCancel?.();
        setOpen(false);
        return;
      }

      if (event.key !== "Tab") return;

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

  const severeTone = () =>
    local.severity === "danger"
      ? "border-destructive/30 bg-destructive/10 text-destructive"
      : "border-secondary/30 bg-secondary/16 text-secondary-foreground";

  return (
    <Show when={isOpen()}>
      <Portal>
        <div class="fixed inset-0 z-50 px-4 py-6 sm:px-6 sm:py-10">
          <div
            aria-hidden="true"
            class="ui-overlay absolute inset-0"
            onClick={() => {
              local.onCancel?.();
              setOpen(false);
            }}
          />
          <div class="relative flex min-h-full items-center justify-center">
            <div
              ref={panelRef}
              role="alertdialog"
              aria-modal="true"
              aria-labelledby={titleId}
              aria-describedby={descriptionId}
              tabIndex={-1}
              class={cn("ui-popover relative z-10 w-full max-w-xl p-6", local.class)}
              onPointerDown={event => event.stopPropagation()}
              {...others}
            >
              <div class={cn("inline-flex size-12 items-center justify-center rounded-2xl border", severeTone())}>
                <AlertTriangle class="size-5" />
              </div>
              <h3 id={titleId} class="mt-5 text-2xl font-semibold tracking-tight text-foreground">
                {local.title}
              </h3>
              <p id={descriptionId} class="mt-3 text-sm leading-6 text-muted-foreground">
                {local.description}
              </p>

              <div class="ui-demo-inset mt-5 text-sm leading-6 text-muted-foreground">
                This pattern keeps the decision explicit and emphasizes the cost of the irreversible action.
              </div>

              <div class="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button intent="neutral" tone="outline" onClick={() => {
                  local.onCancel?.();
                  setOpen(false);
                }}>
                  {local.cancelLabel}
                </Button>
                <Button destructive loading={local.busy} onClick={() => local.onConfirm?.()}>
                  {local.confirmLabel}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Portal>
    </Show>
  );
}
