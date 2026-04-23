import { ImagePlus, Play, Scissors, TriangleAlert, UploadCloud } from "lucide-solid";
import { For, Show, createSignal, mergeProps, onCleanup, splitProps } from "solid-js";
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

type MediaEntry = MediaItem & {
  id: string;
  previewUrl?: string;
  ownsPreviewUrl?: boolean;
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
      title: "Media uploader",
    },
    userProps,
  );

  const [local, others] = splitProps(props, ["class", "items", "title"]);
  const [dragging, setDragging] = createSignal(false);
  const [replaceTargetId, setReplaceTargetId] = createSignal<string | null>(null);
  const [items, setItems] = createSignal<MediaEntry[]>(
    (local.items ?? defaultItems).map((item, index) => ({
      ...item,
      id: `seed-media-${index}`,
    })),
  );
  let inputRef: HTMLInputElement | undefined;
  let mediaSequence = 0;

  const revokeOwnedPreview = (entry?: MediaEntry) => {
    if (entry?.previewUrl && entry.ownsPreviewUrl) {
      URL.revokeObjectURL(entry.previewUrl);
    }
  };

  onCleanup(() => {
    for (const item of items()) {
      revokeOwnedPreview(item);
    }
  });

  const openPicker = (replaceId?: string) => {
    setReplaceTargetId(replaceId ?? null);
    inputRef?.click();
  };

  const completeUpload = (entryId: string) => {
    window.setTimeout(() => {
      setItems(current =>
        current.map(item =>
          item.id === entryId
            ? {
                ...item,
                status: undefined,
              }
            : item,
        ),
      );
    }, 920);
  };

  const toEntry = (file: File): MediaEntry => {
    const isVideo = file.type.startsWith("video/");
    const title = file.name.replace(/\.[^.]+$/, "");

    return {
      id: `media-${Date.now()}-${mediaSequence++}`,
      kind: isVideo ? "video" : "image",
      previewUrl: URL.createObjectURL(file),
      ownsPreviewUrl: true,
      status: "uploading",
      title,
    };
  };

  const ingestFiles = (fileList: FileList | File[]) => {
    const nextFiles = Array.from(fileList);

    if (!nextFiles.length) {
      return;
    }

    const created = nextFiles.map(file => toEntry(file));
    const replaceId = replaceTargetId();

    setItems(current => {
      if (!replaceId) {
        return [...created, ...current];
      }

      const target = current.find(item => item.id === replaceId);
      revokeOwnedPreview(target);

      const [replacement, ...restCreated] = created;

      return current.flatMap(item => {
        if (item.id !== replaceId) {
          return [item];
        }

        return replacement ? [replacement, ...restCreated] : [];
      });
    });

    for (const entry of created) {
      completeUpload(entry.id);
    }

    setReplaceTargetId(null);
  };

  const handleCrop = (entryId: string) => {
    setItems(current =>
      current.map(item =>
        item.id === entryId
          ? {
              ...item,
              status: "cropping",
            }
          : item,
      ),
    );

    window.setTimeout(() => {
      setItems(current =>
        current.map(item =>
          item.id === entryId
            ? {
                ...item,
                status: undefined,
              }
            : item,
        ),
      );
    }, 850);
  };

  return (
    <div class={cn("ui-card space-y-[var(--space-5)] p-[var(--space-6)]", local.class)} {...others}>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        class="sr-only"
        onChange={event => {
          if (event.currentTarget.files) {
            ingestFiles(event.currentTarget.files);
            event.currentTarget.value = "";
          }
        }}
      />

      <div class="flex items-center justify-between gap-3">
        <div>
          <div class="text-base font-semibold tracking-[-0.02em] text-foreground">{local.title}</div>
          <div class="mt-1 text-sm text-muted-foreground">Image and video dropzone with preview tiles and contextual controls.</div>
        </div>
        <Button type="button" leftIcon={<ImagePlus />} onClick={() => openPicker()}>
          Add media
        </Button>
      </div>

      <div
        role="button"
        tabIndex={0}
        class={cn(
          "rounded-[calc(var(--radius)*1.16)] border border-dashed border-primary/28 bg-accent/28 p-[var(--space-5)] transition",
          dragging() && "border-primary/48 bg-accent/54 shadow-soft",
        )}
        onClick={() => openPicker()}
        onKeyDown={event => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openPicker();
          }
        }}
        onDragEnter={event => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={event => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={event => {
          event.preventDefault();
          if (event.currentTarget === event.target) {
            setDragging(false);
          }
        }}
        onDrop={event => {
          event.preventDefault();
          setDragging(false);
          if (event.dataTransfer?.files?.length) {
            ingestFiles(event.dataTransfer.files);
          }
        }}
      >
        <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div class="flex items-start gap-3">
            <span class="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-soft">
              {dragging() ? <UploadCloud class="size-5" /> : <ImagePlus class="size-5" />}
            </span>
            <div>
              <div class="text-sm font-semibold text-foreground">
                {dragging() ? "Release to add media" : "Drop images or videos here"}
              </div>
              <div class="mt-1 text-sm text-muted-foreground">
                Add assets, replace an existing tile, or trigger a crop state directly inside the demo.
              </div>
            </div>
          </div>
          <Button
            type="button"
            tone="outline"
            intent="neutral"
            onClick={event => {
              event.stopPropagation();
              openPicker();
            }}
          >
            Browse library
          </Button>
        </div>
      </div>

      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <For each={items()}>
          {item => (
            <div class="overflow-hidden rounded-[calc(var(--radius)*1.12)] border border-border/70 bg-card shadow-xs">
              <div class="relative aspect-[4/3] bg-linear-to-br from-accent via-muted-soft to-background">
                <Show
                  when={item.previewUrl}
                  fallback={
                    <div class="absolute inset-0 grid place-items-center">
                      <span class="inline-flex size-12 items-center justify-center rounded-full border border-background/55 bg-background/78 text-foreground shadow-soft backdrop-blur-sm">
                        {item.kind === "video" ? <Play class="size-4.5" /> : <ImagePlus class="size-4.5" />}
                      </span>
                    </div>
                  }
                >
                  {previewUrl => (
                    <>
                      <Show
                        when={item.kind === "image"}
                        fallback={<video src={previewUrl()} class="absolute inset-0 size-full object-cover" muted playsinline />}
                      >
                        <img src={previewUrl()} alt={item.title} class="absolute inset-0 size-full object-cover" />
                      </Show>
                      <div class="absolute inset-0 bg-linear-to-t from-foreground/28 via-transparent to-transparent" />
                      <div class="absolute inset-0 grid place-items-center">
                        <span class="inline-flex size-11 items-center justify-center rounded-full border border-background/55 bg-background/76 text-foreground shadow-soft backdrop-blur-sm">
                          {item.kind === "video" ? <Play class="size-4.5" /> : <ImagePlus class="size-4.5" />}
                        </span>
                      </div>
                    </>
                  )}
                </Show>
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
                  <Button type="button" tone="outline" intent="neutral" size="sm" onClick={() => openPicker(item.id)}>Replace</Button>
                  <Show when={item.kind === "image"}>
                    <Button
                      type="button"
                      tone="ghost"
                      intent="neutral"
                      size="sm"
                      leftIcon={<Scissors />}
                      onClick={() => handleCrop(item.id)}
                    >
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
