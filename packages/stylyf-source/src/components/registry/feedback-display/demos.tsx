import type { JSX } from "solid-js";
import { createSignal } from "solid-js";
import type { RegistryItem } from "~/lib/registry";
import { Avatar } from "~/components/registry/feedback-display/avatar";
import { Badge } from "~/components/registry/feedback-display/badge";
import { Progress } from "~/components/registry/feedback-display/progress";
import { Separator } from "~/components/registry/feedback-display/separator";
import { Skeleton } from "~/components/registry/feedback-display/skeleton";
import { Toast } from "~/components/registry/feedback-display/toast";

function DemoFrame(props: { children: JSX.Element; item: RegistryItem; title: string }) {
  return (
    <div class="space-y-4" data-demo={props.item.slug}>
      <div class="ui-demo-chip">
        <span>{props.title}</span>
        <span class="text-border">/</span>
        <span>{props.item.name}</span>
      </div>
      <div class="ui-demo-frame">{props.children}</div>
    </div>
  );
}

export function ProgressPreview(props: { item: RegistryItem }) {
  return (
    <DemoFrame item={props.item} title="Live primitive">
      <div class="grid gap-5">
        <Progress label="Deployment rollout" value={76} striped animated />
        <Progress label="Billing migration" tone="highlight" value={42} />
        <Progress label="Background sync" indeterminate striped animated tone="accent" />
      </div>
    </DemoFrame>
  );
}

export function BadgePreview(props: { item: RegistryItem }) {
  const [showDraft, setShowDraft] = createSignal(true);

  return (
    <DemoFrame item={props.item} title="Live primitive">
      <div class="flex flex-wrap gap-3">
        <Badge tone="accent">Featured</Badge>
        <Badge tone="success" emphasis="solid">Healthy</Badge>
        <Badge tone="danger" selected>At risk</Badge>
        {showDraft() ? (
          <Badge tone="neutral" emphasis="soft" removable onRemove={() => setShowDraft(false)}>
            Draft
          </Badge>
        ) : (
          <Badge tone="neutral" emphasis="soft">Removed</Badge>
        )}
      </div>
    </DemoFrame>
  );
}

export function AvatarPreview(props: { item: RegistryItem }) {
  const placeholderImage =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 128 128'%3E%3Crect width='128' height='128' rx='28' fill='%23d9ecff'/%3E%3Ccircle cx='64' cy='46' r='24' fill='%235b7db8'/%3E%3Cpath d='M24 112c8-20 26-30 40-30s32 10 40 30' fill='%235b7db8'/%3E%3C/svg%3E";

  return (
    <DemoFrame item={props.item} title="Live primitive">
      <div class="flex flex-wrap items-end gap-4">
        <Avatar alt="Sanyam Singhal" status="online" />
        <Avatar alt="Operations Desk" shape="rounded" status="offline" />
        <Avatar
          alt="Customer success lead"
          size="lg"
          src={placeholderImage}
          fallback={<span class="font-semibold tracking-[0.08em] text-accent-strong">CS</span>}
        />
        <Avatar alt="Loading profile" loading bordered={false} />
      </div>
    </DemoFrame>
  );
}

export function ToastPreview(props: { item: RegistryItem }) {
  return (
    <DemoFrame item={props.item} title="Live primitive">
      <Toast
        defaultItems={[
          {
            id: "deploy",
            title: "Registry deploy complete",
            description: "The latest registry cluster is live on stylyf.com.",
            tone: "success",
            actionLabel: "Inspect",
          },
          {
            id: "risk",
            title: "One workspace needs review",
            description: "A policy change is pending sign-off from billing admins.",
            tone: "danger",
          },
          {
            id: "sync",
            title: "Workspace sync paused",
            description: "One importer is waiting for new credentials.",
            tone: "info",
            actionLabel: "Resume",
          },
        ]}
      />
    </DemoFrame>
  );
}

export function SkeletonPreview(props: { item: RegistryItem }) {
  return (
    <DemoFrame item={props.item} title="Live primitive">
      <div class="ui-demo-inset grid gap-4 lg:grid-cols-[auto_1fr]">
        <Skeleton shape="circle" width="4rem" height="4rem" />
        <div class="space-y-3">
          <Skeleton shape="line" width="10rem" height="0.95rem" />
          <Skeleton shape="line" width="100%" height="0.8rem" />
          <Skeleton shape="line" width="72%" height="0.8rem" />
          <Skeleton width="52%" height="2.6rem" />
        </div>
      </div>
    </DemoFrame>
  );
}

export function SeparatorPreview(props: { item: RegistryItem }) {
  return (
    <DemoFrame item={props.item} title="Live primitive">
      <div class="space-y-6">
        <Separator label="Section" />
        <div class="flex h-20 items-center gap-5">
          <span class="text-sm text-muted-foreground">Queue</span>
          <Separator orientation="vertical" tone="accent" />
          <span class="text-sm text-muted-foreground">Details</span>
        </div>
      </div>
    </DemoFrame>
  );
}

export const previewBySlug = {
  avatar: AvatarPreview,
  badge: BadgePreview,
  progress: ProgressPreview,
  separator: SeparatorPreview,
  skeleton: SkeletonPreview,
  toast: ToastPreview,
};
