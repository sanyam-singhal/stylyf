import { For, mergeProps, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { Badge } from "~/components/registry/feedback-display/badge";
import { cn } from "~/lib/cn";

export type NotificationItem = {
  body: string;
  title: string;
  unread?: boolean;
};

export type NotificationListProps = Omit<JSX.HTMLAttributes<HTMLElement>, "children"> & {
  class?: string;
  items?: NotificationItem[];
};

const defaultItems: NotificationItem[] = [
  { title: "Deployment recovered", body: "stylyf.com is serving the latest production build.", unread: true },
  { title: "Invite accepted", body: "A new collaborator joined the workspace.", unread: true },
  { title: "Billing receipt ready", body: "April invoice is now available.", unread: false },
];

export function NotificationList(userProps: NotificationListProps) {
  const props = mergeProps(
    {
      items: defaultItems,
    },
    userProps,
  );

  const [local, others] = splitProps(props, ["class", "items"]);

  return (
    <section class={cn("ui-shell-muted overflow-hidden border border-border/80 p-0 shadow-soft", local.class)} {...others}>
      <div class="border-b border-border/70 px-[var(--space-5)] py-[var(--space-4)]">
        <div class="flex items-center justify-between gap-3">
          <div>
            <div class="text-sm font-semibold text-foreground">Inbox</div>
            <div class="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Unread and recent notices</div>
          </div>
          <Badge tone="accent">{local.items.filter(item => item.unread).length} unread</Badge>
        </div>
      </div>
      <div class="divide-y divide-border/70 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--card)_97%,white_3%),color-mix(in_oklab,var(--card)_90%,var(--muted-soft)_10%))]">
        <For each={local.items}>
          {item => (
            <div class={cn("flex items-start gap-3 px-[var(--space-5)] py-[var(--space-4)]", item.unread && "bg-[color:color-mix(in_oklab,var(--info)_8%,var(--card)_92%)]")}>
              <span class={cn("mt-2 size-2 rounded-full", item.unread ? "bg-warning" : "bg-border")} />
              <div class="min-w-0 flex-1 space-y-1.5">
                <div class="flex flex-wrap items-center gap-2">
                  <div class="text-sm font-semibold text-foreground">{item.title}</div>
                  {item.unread ? <Badge tone="accent">Unread</Badge> : null}
                </div>
                <p class="text-sm leading-6 text-muted-foreground">{item.body}</p>
              </div>
            </div>
          )}
        </For>
      </div>
    </section>
  );
}
