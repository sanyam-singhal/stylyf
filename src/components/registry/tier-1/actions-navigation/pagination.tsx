import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-solid";
import { For, Show, createMemo, createSignal, mergeProps, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { cn } from "~/lib/cn";
import { buttonFrameVariants, buttonToneClasses } from "~/components/registry/tier-1/actions-navigation/button";

type PaginationToken = number | "ellipsis";

function buildRange(currentPage: number, pageCount: number, siblingCount: number, showEdges: boolean) {
  const safePageCount = Math.max(pageCount, 1);
  const safePage = Math.min(Math.max(currentPage, 1), safePageCount);
  const safeSiblingCount = Math.max(siblingCount, 0);

  if (!showEdges) {
    const start = Math.max(1, safePage - safeSiblingCount);
    const end = Math.min(safePageCount, safePage + safeSiblingCount);
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }

  const range = (start: number, end: number) =>
    Array.from({ length: end - start + 1 }, (_, index) => start + index);

  const totalSlots = safeSiblingCount * 2 + 5;

  if (safePageCount <= totalSlots) {
    return range(1, safePageCount);
  }

  const leftSibling = Math.max(safePage - safeSiblingCount, 2);
  const rightSibling = Math.min(safePage + safeSiblingCount, safePageCount - 1);
  const showLeftEllipsis = leftSibling > 2;
  const showRightEllipsis = rightSibling < safePageCount - 1;

  if (!showLeftEllipsis && showRightEllipsis) {
    return [...range(1, 3 + safeSiblingCount * 2), "ellipsis", safePageCount];
  }

  if (showLeftEllipsis && !showRightEllipsis) {
    return [1, "ellipsis", ...range(safePageCount - (2 + safeSiblingCount * 2), safePageCount)];
  }

  return [1, "ellipsis", ...range(leftSibling, rightSibling), "ellipsis", safePageCount];
}

export type PaginationProps = Omit<JSX.HTMLAttributes<HTMLElement>, "children"> & {
  class?: string;
  compact?: boolean;
  defaultPage?: number;
  disabled?: boolean;
  onPageChange?: (page: number) => void;
  page?: number;
  pageCount?: number;
  siblingCount?: number;
  showEdges?: boolean;
  summary?: boolean;
};

export function Pagination(userProps: PaginationProps) {
  const props = mergeProps(
    {
      compact: false,
      defaultPage: 3,
      pageCount: 9,
      siblingCount: 1,
      showEdges: true,
      summary: true,
    },
    userProps,
  );

  const [local, others] = splitProps(props, [
    "class",
    "compact",
    "defaultPage",
    "disabled",
    "onPageChange",
    "page",
    "pageCount",
    "showEdges",
    "siblingCount",
    "summary",
  ]);

  const [internalPage, setInternalPage] = createSignal(local.defaultPage);
  const page = createMemo(() => {
    const raw = local.page ?? internalPage();
    return Math.min(Math.max(raw, 1), local.pageCount);
  });

  const tokens = createMemo(() => buildRange(page(), local.pageCount, local.siblingCount, local.showEdges));

  const commit = (nextPage: number) => {
    const clamped = Math.min(Math.max(nextPage, 1), local.pageCount);

    if (local.page === undefined) {
      setInternalPage(clamped);
    }

    local.onPageChange?.(clamped);
  };

  const pageButtonSize = () => (local.compact ? "sm" : "md");

  return (
    <nav
      aria-label="Pagination"
      class={cn("flex flex-col gap-3 text-sm", local.class)}
      {...others}
    >
      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class={cn(
            buttonFrameVariants({ size: pageButtonSize(), density: "comfortable", radius: "pill" }),
            buttonToneClasses({ intent: "neutral", tone: "outline" }),
            "shadow-xs",
          )}
          disabled={local.disabled || page() <= 1}
          onClick={() => commit(page() - 1)}
        >
          <ChevronLeft class="size-4" />
          <span>Previous</span>
        </button>

        <div class="inline-flex items-center gap-1 rounded-full border border-input/80 bg-[var(--muted-soft)] p-1 shadow-inset">
          <For each={tokens()}>
            {token => (
              <Show
                when={token !== "ellipsis"}
                fallback={
                  <span
                    class={cn(
                      "inline-flex items-center justify-center text-muted-foreground",
                      local.compact ? "size-[calc(var(--control-height)-0.55rem)]" : "size-[var(--control-height)]",
                    )}
                    aria-hidden="true"
                  >
                    <MoreHorizontal class="size-4" />
                  </span>
                }
              >
                <button
                  type="button"
                  class={cn(
                    buttonFrameVariants({
                      size: pageButtonSize(),
                      density: "comfortable",
                      radius: "pill",
                    }),
                    local.compact ? "size-[calc(var(--control-height)-0.55rem)] px-0 text-[0.84rem]" : "size-[var(--control-height)] px-0",
                    "min-w-0 font-medium shadow-none",
                    page() === token
                      ? "border-primary/28 bg-primary text-primary-foreground shadow-xs"
                      : "border-transparent bg-transparent text-muted-foreground hover:bg-background hover:text-foreground",
                  )}
                  aria-current={page() === token ? "page" : undefined}
                  data-current={page() === token ? "true" : "false"}
                  data-loading="false"
                  data-pending="false"
                  data-pressed="false"
                  disabled={local.disabled}
                  onClick={() => commit(token as number)}
                >
                  {token}
                </button>
              </Show>
            )}
          </For>
        </div>

        <button
          type="button"
          class={cn(
            buttonFrameVariants({ size: pageButtonSize(), density: "comfortable", radius: "pill" }),
            buttonToneClasses({ intent: "neutral", tone: "outline" }),
            "shadow-xs",
          )}
          disabled={local.disabled || page() >= local.pageCount}
          onClick={() => commit(page() + 1)}
        >
          <span>Next</span>
          <ChevronRight class="size-4" />
        </button>
      </div>

      <Show when={local.summary}>
        <div class="text-sm text-muted-foreground">
          Page <span class="font-semibold text-foreground">{page()}</span> of{" "}
          <span class="font-semibold text-foreground">{local.pageCount}</span>
        </div>
      </Show>
    </nav>
  );
}
