import { FileUp, Files, RefreshCw, TriangleAlert } from "lucide-solid";
import { For, Show, mergeProps, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { Button } from "~/components/registry/actions-navigation/button";
import { Badge } from "~/components/registry/feedback-display/badge";
import { Progress } from "~/components/registry/feedback-display/progress";
import { cn } from "~/lib/cn";

export type UploadItem = {
  name: string;
  progress?: number;
  status: "complete" | "error" | "uploading";
  subtitle?: string;
};

export type FileUploaderProps = Omit<JSX.HTMLAttributes<HTMLDivElement>, "children"> & {
  class?: string;
  compact?: boolean;
  items?: UploadItem[];
  title?: JSX.Element;
};

const defaultItems: UploadItem[] = [
  { name: "customer-export.csv", status: "uploading", progress: 72, subtitle: "Mapping headers…" },
  { name: "workspace-members.csv", status: "complete", progress: 100, subtitle: "Ready to import" },
  { name: "legacy-contacts.csv", status: "error", progress: 28, subtitle: "Header mismatch in column 4" },
];

export function FileUploader(userProps: FileUploaderProps) {
  const props = mergeProps(
    {
      compact: false,
      items: defaultItems,
      title: "Upload files",
    },
    userProps,
  );

  const [local, others] = splitProps(props, ["class", "compact", "items", "title"]);

  return (
    <div class={cn("ui-card space-y-[var(--space-5)] p-[var(--space-6)]", local.class)} {...others}>
      <div class="flex items-center justify-between gap-3">
        <div>
          <div class="text-base font-semibold tracking-[-0.02em] text-foreground">{local.title}</div>
          <div class="mt-1 text-sm text-muted-foreground">Drag and drop source files or browse locally, then inspect per-file status.</div>
        </div>
        <Badge tone="accent" emphasis="soft">
          CSV / JSON
        </Badge>
      </div>

      <div class={cn("rounded-[calc(var(--radius)*1.2)] border border-dashed border-primary/28 bg-accent/30 text-center", local.compact ? "p-[var(--space-5)]" : "p-[var(--space-8)]")}>
        <div class="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-soft">
          <FileUp class="size-5" />
        </div>
        <div class="mt-4 text-sm font-semibold text-foreground">Drop files here or browse</div>
        <div class="mt-2 text-sm text-muted-foreground">Uploads remain source-owned. This shell only defines the staging and status treatment.</div>
        <div class="mt-4 flex justify-center gap-2">
          <Button type="button">Choose files</Button>
          <Button type="button" tone="outline" intent="neutral">Use sample data</Button>
        </div>
      </div>

      <div class="space-y-3">
        <For each={local.items}>
          {item => (
            <div class="rounded-[calc(var(--radius)*1.05)] border border-border/70 bg-background-subtle/55 p-[var(--space-4)]">
              <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div class="flex min-w-0 items-start gap-3">
                  <span class="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    {item.status === "error" ? <TriangleAlert class="size-4" /> : item.status === "uploading" ? <RefreshCw class="size-4 animate-spin" /> : <Files class="size-4" />}
                  </span>
                  <div class="min-w-0">
                    <div class="truncate text-sm font-semibold text-foreground">{item.name}</div>
                    <div class="text-sm text-muted-foreground">{item.subtitle}</div>
                  </div>
                </div>
                <Badge tone={item.status === "error" ? "danger" : item.status === "complete" ? "success" : "accent"}>
                  {item.status}
                </Badge>
              </div>
              <Show when={item.progress !== undefined}>
                <div class="mt-4">
                  <Progress
                    value={item.progress}
                    tone={item.status === "error" ? "danger" : item.status === "complete" ? "highlight" : "accent"}
                    label="Upload progress"
                  />
                </div>
              </Show>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}
