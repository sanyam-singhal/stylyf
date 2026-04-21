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
    <section class={cn("ui-card overflow-hidden p-0", local.class)} {...others}>
      <div class="divide-y divide-border/70">
        <For each={local.items}>
          {item => (
            <div class={cn("flex items-start gap-3 px-[var(--space-5)] py-[var(--space-4)]", item.unread && "bg-accent/22")}>
              <span class={cn("mt-2 size-2 rounded-full", item.unread ? "bg-primary" : "bg-border")} />
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
