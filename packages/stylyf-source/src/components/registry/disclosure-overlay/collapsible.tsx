import { Show, createSignal, createUniqueId, mergeProps, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { ChevronDown } from "lucide-solid";
import { cn } from "~/lib/cn";

export type CollapsibleProps = Omit<JSX.HTMLAttributes<HTMLElement>, "children" | "ref"> & {
  children?: JSX.Element;
  class?: string;
  defaultOpen?: boolean;
  description?: JSX.Element;
  disabled?: boolean;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  title?: JSX.Element;
};

export function Collapsible(userProps: CollapsibleProps) {
  const props = mergeProps(
    {
      defaultOpen: false,
      description: "A lighter disclosure for secondary detail and supporting notes.",
      title: "Workspace details",
    },
    userProps,
  );

  const [local, others] = splitProps(props, [
    "children",
    "class",
    "defaultOpen",
    "description",
    "disabled",
    "onOpenChange",
    "open",
    "title",
  ]);

  const regionId = createUniqueId();
  const [internalOpen, setInternalOpen] = createSignal(Boolean(local.defaultOpen));
  const isOpen = () => (local.open !== undefined ? local.open : internalOpen());

  const setOpen = (next: boolean) => {
    if (local.open === undefined) {
      setInternalOpen(next);
    }

    local.onOpenChange?.(next);
  };

  return (
    <section class={cn("ui-card overflow-hidden", local.class)} {...others}>
      <button
        type="button"
        aria-expanded={isOpen()}
        aria-controls={regionId}
        disabled={local.disabled}
        class={cn(
          "flex w-full items-start justify-between gap-4 px-5 py-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35",
          isOpen() ? "bg-[var(--muted-soft)]" : "hover:bg-accent/75",
          local.disabled && "cursor-not-allowed opacity-50",
        )}
        onClick={() => setOpen(!isOpen())}
      >
        <div>
          <div class="font-semibold tracking-[-0.01em] text-foreground">{local.title}</div>
          <Show when={local.description}>
            <div class="mt-1 text-sm leading-6 text-muted-foreground">{local.description}</div>
          </Show>
        </div>
        <ChevronDown class={cn("mt-0.5 size-5 shrink-0 text-muted-foreground transition", isOpen() && "rotate-180 text-foreground")} />
      </button>

      <Show when={isOpen()}>
        <div id={regionId} class="border-t border-border/70 bg-background px-5 py-4">
          {local.children ?? (
            <div class="space-y-3 text-sm leading-6 text-muted-foreground">
              <p>Progressive disclosure works best when the hidden content is related but not required for the main path.</p>
              <p>This component retains state and keeps the trigger semantics explicit for keyboard and assistive technology.</p>
            </div>
          )}
        </div>
      </Show>
    </section>
  );
}
