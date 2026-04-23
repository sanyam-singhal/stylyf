import { For, mergeProps, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { Button } from "~/components/registry/actions-navigation/button";
import { Avatar } from "~/components/registry/feedback-display/avatar";
import { TextArea } from "~/components/registry/form-inputs/text-area";
import { cn } from "~/lib/cn";

export type CommentItem = {
  author: string;
  body: string;
  meta: string;
};

export type CommentThreadProps = Omit<JSX.HTMLAttributes<HTMLElement>, "children"> & {
  class?: string;
  comments?: CommentItem[];
};

const defaultComments: CommentItem[] = [
  { author: "Sanyam Singhal", body: "Let’s keep the larger compositions standalone even when that costs some duplication.", meta: "Today · 10:24 UTC" },
  { author: "Registry reviewer", body: "Agreed. That keeps the source tab honest and makes downstream copying cleaner.", meta: "Today · 10:27 UTC" },
];

export function CommentThread(userProps: CommentThreadProps) {
  const props = mergeProps(
    {
      comments: defaultComments,
    },
    userProps,
  );

  const [local, others] = splitProps(props, ["class", "comments"]);

  return (
    <section class={cn("ui-shell-muted space-y-[var(--space-5)] border border-border/80 p-[var(--space-6)] shadow-soft", local.class)} {...others}>
      <div class="space-y-[var(--space-4)]">
        <For each={local.comments}>
          {comment => (
            <div class="flex gap-3">
              <Avatar alt={comment.author} size="sm" />
              <div class="min-w-0 flex-1 rounded-[calc(var(--radius)*1.05)] border border-border/70 bg-background-subtle/55 px-[var(--space-4)] py-[var(--space-3)]">
                <div class="flex flex-wrap items-center gap-2">
                  <div class="text-sm font-semibold text-foreground">{comment.author}</div>
                  <div class="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{comment.meta}</div>
                </div>
                <p class="mt-2 text-sm leading-6 text-muted-foreground">{comment.body}</p>
              </div>
            </div>
          )}
        </For>
      </div>

      <div class="rounded-[calc(var(--radius)*1.08)] border border-border/70 bg-card p-[var(--space-4)] shadow-inset">
        <TextArea label="Reply" autoResize defaultValue="I’ll review the next cluster after build completes." />
        <div class="mt-[var(--space-4)] flex justify-end">
          <Button type="button">Post reply</Button>
        </div>
      </div>
    </section>
  );
}
