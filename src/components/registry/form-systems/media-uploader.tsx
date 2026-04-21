import { ImagePlus, Play, Scissors, TriangleAlert } from "lucide-solid";
import { For, Show, mergeProps, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { Button } from "~/components/registry/actions-navigation/button";
import { Badge } from "~/components/registry/feedback-display/badge";
import { cn } from "~/lib/cn";

export type MediaItem = {
  kind: "image" | "video";
  status?: "cropping" | "failed" | "uploading";
  title: string;
};

export type MediaUploaderProps = Omit<JSX.HTMLAttributes<HTMLDivElement>, "children"> & {
  class?: string;
  items?: MediaItem[];
  title?: JSX.Element;
};

const defaultItems: MediaItem[] = [
  { title: "Workspace hero", kind: "image" },
  { title: "Intro reel", kind: "video", status: "uploading" },
  { title: "Avatar crop", kind: "image", status: "cropping" },
  { title: "Fallback cover", kind: "image", status: "failed" },
];

export function MediaUploader(userProps: MediaUploaderProps) {
  const props = mergeProps(
    {
      items: defaultItems,
      title: "Media uploader",
    },
    userProps,
  );

  const [local, others] = splitProps(props, ["class", "items", "title"]);

  return (
    <div class={cn("ui-card space-y-[var(--space-5)] p-[var(--space-6)]", local.class)} {...others}>
      <div class="flex items-center justify-between gap-3">
        <div>
          <div class="text-base font-semibold tracking-[-0.02em] text-foreground">{local.title}</div>
          <div class="mt-1 text-sm text-muted-foreground">Image and video dropzone with preview tiles and contextual controls.</div>
        </div>
        <Button type="button" leftIcon={<ImagePlus />}>Add media</Button>
      </div>

      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <For each={local.items}>
          {item => (
            <div class="overflow-hidden rounded-[calc(var(--radius)*1.12)] border border-border/70 bg-card shadow-xs">
              <div class="relative aspect-[4/3] bg-linear-to-br from-accent via-muted-soft to-background">
                <div class="absolute inset-0 grid place-items-center">
                  <span class="inline-flex size-12 items-center justify-center rounded-full border border-background/55 bg-background/78 text-foreground shadow-soft backdrop-blur-sm">
                    {item.kind === "video" ? <Play class="size-4.5" /> : <ImagePlus class="size-4.5" />}
                  </span>
                </div>
                <Show when={item.status}>
                  <div class="absolute left-3 top-3">
                    <Badge tone={item.status === "failed" ? "danger" : "accent"}>{item.status}</Badge>
                  </div>
                </Show>
              </div>
              <div class="space-y-3 p-[var(--space-4)]">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <div class="text-sm font-semibold text-foreground">{item.title}</div>
                    <div class="text-sm text-muted-foreground">{item.kind === "video" ? "Video asset" : "Image asset"}</div>
                  </div>
                  <Show when={item.status === "failed"}>
                    <TriangleAlert class="mt-0.5 size-4 text-destructive" />
                  </Show>
                </div>
                <div class="flex flex-wrap gap-2">
                  <Button type="button" tone="outline" intent="neutral" size="sm">Replace</Button>
                  <Show when={item.kind === "image"}>
                    <Button type="button" tone="ghost" intent="neutral" size="sm" leftIcon={<Scissors />}>
                      Crop
                    </Button>
                  </Show>
                </div>
              </div>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}
