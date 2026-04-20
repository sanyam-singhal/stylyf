import { For, Show, createSignal, mergeProps, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-solid";
import { Button } from "~/components/registry/tier-1/actions-navigation/button";
import { cn } from "~/lib/cn";

export type ToastItem = {
  actionLabel?: string;
  description?: JSX.Element;
  id: string;
  title: JSX.Element;
  tone?: "danger" | "info" | "success";
};

export type ToastProps = Omit<JSX.HTMLAttributes<HTMLDivElement>, "children" | "ref"> & {
  class?: string;
  defaultItems?: ToastItem[];
  items?: ToastItem[];
  onAction?: (id: string) => void;
  onDismiss?: (id: string) => void;
  placement?: "bottom-left" | "bottom-right" | "top-right";
};

const defaultItems: ToastItem[] = [
  {
    id: "deploy-success",
    title: "Deployment complete",
    description: "The production registry was rebuilt and verified.",
    tone: "success",
    actionLabel: "View logs",
  },
];

function toneClasses(tone: NonNullable<ToastItem["tone"]>) {
  return {
    danger: "border-destructive/30 bg-destructive/10 text-destructive",
    info: "border-accent/35 bg-accent text-accent-foreground",
    success: "border-success/30 bg-success/10 text-success",
  }[tone];
}

function toneIcon(tone: NonNullable<ToastItem["tone"]>) {
  if (tone === "danger") return <TriangleAlert class="size-4.5" />;
  if (tone === "success") return <CheckCircle2 class="size-4.5" />;
  return <Info class="size-4.5" />;
}

export function Toast(userProps: ToastProps) {
  const props = mergeProps({ defaultItems, placement: "top-right" as const }, userProps);
  const [local, others] = splitProps(props, ["class", "defaultItems", "items", "onAction", "onDismiss", "placement"]);
  const [internalItems, setInternalItems] = createSignal(local.defaultItems);
  const toasts = () => local.items ?? internalItems();

  const dismiss = (id: string) => {
    if (local.items === undefined) {
      setInternalItems(items => items.filter(item => item.id !== id));
    }

    local.onDismiss?.(id);
  };

  return (
    <div
      role="region"
      aria-label="Notifications"
      aria-live="polite"
      class={cn(
        "grid gap-3",
        local.placement === "top-right" && "justify-items-end",
        local.placement === "bottom-right" && "justify-items-end",
        local.placement === "bottom-left" && "justify-items-start",
        local.class,
      )}
      {...others}
    >
      <For each={toasts()}>
        {item => {
          const tone = item.tone ?? "info";

          return (
            <div class="relative w-full max-w-sm overflow-hidden rounded-[var(--radius-lg)] border border-border/78 bg-card p-4 shadow-soft">
              <span
                aria-hidden="true"
                class={cn(
                  "absolute inset-x-0 top-0 h-1",
                  tone === "danger" && "bg-destructive/82",
                  tone === "success" && "bg-success/82",
                  tone === "info" && "bg-primary/72",
                )}
              />
              <div class="flex items-start gap-3 pt-1">
                <div class={cn("inline-flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] border", toneClasses(tone))}>
                  {toneIcon(tone)}
                </div>
                <div class="min-w-0 flex-1">
                  <div class="font-semibold text-foreground">{item.title}</div>
                  <Show when={item.description}>
                    <div class="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</div>
                  </Show>
                  <Show when={item.actionLabel}>
                    <div class="mt-4">
                      <Button size="sm" tone="outline" intent="neutral" onClick={() => local.onAction?.(item.id)}>
                        {item.actionLabel}
                      </Button>
                    </div>
                  </Show>
                </div>
                <button
                  type="button"
                  aria-label="Dismiss notification"
                  class="inline-flex size-9 items-center justify-center rounded-full border border-border/70 bg-background text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
                  onClick={() => dismiss(item.id)}
                >
                  <X class="size-4" />
                </button>
              </div>
            </div>
          );
        }}
      </For>
    </div>
  );
}
