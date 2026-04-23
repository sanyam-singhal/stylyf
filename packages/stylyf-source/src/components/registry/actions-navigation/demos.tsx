import { ArrowRight, Bell, Bookmark, Bold, ChevronRight, Filter, Home, LayoutGrid, Plus, Settings, Sparkles } from "lucide-solid";
import { Show, createSignal } from "solid-js";
import type { JSX } from "solid-js";
import type { RegistryItem } from "~/lib/registry";
import { Breadcrumb } from "~/components/registry/actions-navigation/breadcrumb";
import { Button } from "~/components/registry/actions-navigation/button";
import { IconButton } from "~/components/registry/actions-navigation/icon-button";
import { LinkButton } from "~/components/registry/actions-navigation/link-button";
import { Pagination } from "~/components/registry/actions-navigation/pagination";
import { Toggle } from "~/components/registry/actions-navigation/toggle";
import { ToggleGroup } from "~/components/registry/actions-navigation/toggle-group";

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

export function ButtonPreview(props: { item: RegistryItem }) {
  return (
    <DemoFrame item={props.item} title="Live primitive">
      <div class="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <div class="space-y-3">
          <div class="flex flex-wrap gap-3">
            <Button leftIcon={<Sparkles />}>Primary action</Button>
            <Button intent="neutral" tone="outline">Secondary</Button>
            <Button intent="highlight" tone="soft" rightIcon={<ArrowRight />}>
              Highlighted
            </Button>
            <Button destructive>Delete record</Button>
          </div>
          <div class="flex flex-wrap gap-3">
            <Button loading>Working</Button>
            <Button pending intent="neutral" tone="soft">Pending review</Button>
            <Button size="lg" radius="lg" rightIcon={<ChevronRight />}>Continue flow</Button>
          </div>
        </div>
        <div class="ui-demo-inset border-dashed">
          <div class="text-xs uppercase tracking-[0.22em] text-muted-foreground">Contract focus</div>
          <p class="mt-3 text-sm leading-6 text-foreground">
            Base recipe plus variant overrides, explicit loading and pending state, and icon placement without hiding
            button semantics.
          </p>
        </div>
      </div>
    </DemoFrame>
  );
}

export function IconButtonPreview(props: { item: RegistryItem }) {
  return (
    <DemoFrame item={props.item} title="Live primitive">
      <div class="flex flex-wrap items-center gap-3">
        <IconButton label="Create" intent="primary" tone="solid">
          <Plus />
        </IconButton>
        <IconButton label="Notifications" tone="soft">
          <Bell />
        </IconButton>
        <IconButton label="Saved" tone="outline" pressed>
          <Bookmark />
        </IconButton>
        <IconButton label="Settings" tone="ghost" size="lg" shape="square">
          <Settings />
        </IconButton>
        <IconButton label="Syncing" loading tone="soft" />
      </div>
    </DemoFrame>
  );
}

export function LinkButtonPreview(props: { item: RegistryItem }) {
  return (
    <DemoFrame item={props.item} title="Live primitive">
      <div class="flex flex-wrap gap-3">
        <LinkButton href="#tier-1-form-inputs" intent="primary" tone="solid">Form inputs section</LinkButton>
        <LinkButton href="#theme-studio" intent="highlight" tone="soft">Theme studio</LinkButton>
        <LinkButton href="https://solidjs.com" external tone="outline">
          Solid docs
        </LinkButton>
        <LinkButton href="#tier-1-disclosure-overlay" tone="ghost" underline pending>Pending nav</LinkButton>
      </div>
    </DemoFrame>
  );
}

export function TogglePreview(props: { item: RegistryItem }) {
  const [muted, setMuted] = createSignal(false);

  return (
    <DemoFrame item={props.item} title="Live primitive">
      <div class="flex flex-wrap gap-3">
        <Toggle pressed={muted()} onPressedChange={setMuted} leftIcon={<Bold />}>
          Mute alerts
        </Toggle>
        <Toggle defaultPressed tone="outline">Bookmarked</Toggle>
        <Toggle tone="ghost" pending>Pending</Toggle>
      </div>
    </DemoFrame>
  );
}

export function ToggleGroupPreview(props: { item: RegistryItem }) {
  const [selection, setSelection] = createSignal<string | undefined>("grid");
  const [filters, setFilters] = createSignal<string[]>(["active"]);

  return (
    <DemoFrame item={props.item} title="Live primitive">
      <div class="space-y-5">
        <ToggleGroup value={selection()} onValueChange={value => setSelection(value as string | undefined)} label="View mode">
          <ToggleGroup.Item value="grid">
            <LayoutGrid />
            <span>Grid</span>
          </ToggleGroup.Item>
          <ToggleGroup.Item value="list">
            <Filter />
            <span>List</span>
          </ToggleGroup.Item>
          <ToggleGroup.Item value="board">
            <Sparkles />
            <span>Board</span>
          </ToggleGroup.Item>
        </ToggleGroup>

        <ToggleGroup
          mode="multiple"
          value={filters()}
          onValueChange={value => setFilters((value as string[]) ?? [])}
          label="Quick filters"
          layout="card"
          tone="outline"
          fullWidth
        >
          <ToggleGroup.Item value="active">
            <div class="flex flex-col items-start gap-1">
              <span class="font-semibold">Active</span>
              <span class="text-xs text-muted-foreground">Records with movement in the last 7 days.</span>
            </div>
          </ToggleGroup.Item>
          <ToggleGroup.Item value="starred">
            <div class="flex flex-col items-start gap-1">
              <span class="font-semibold">Starred</span>
              <span class="text-xs text-muted-foreground">Pinned items that need regular review.</span>
            </div>
          </ToggleGroup.Item>
          <ToggleGroup.Item value="assigned">
            <div class="flex flex-col items-start gap-1">
              <span class="font-semibold">Assigned</span>
              <span class="text-xs text-muted-foreground">Only items already owned by this operator.</span>
            </div>
          </ToggleGroup.Item>
        </ToggleGroup>
      </div>
    </DemoFrame>
  );
}

export function BreadcrumbPreview(props: { item: RegistryItem }) {
  const [expanded, setExpanded] = createSignal(false);

  return (
    <DemoFrame item={props.item} title="Live primitive">
      <div class="space-y-5">
        <Breadcrumb>
          <Breadcrumb.List>
            <Breadcrumb.Item>
              <Breadcrumb.Link href="#library">
                <Home class="size-4" />
                <span>Home</span>
              </Breadcrumb.Link>
            </Breadcrumb.Item>
            <Breadcrumb.Separator />
            <Breadcrumb.Item>
              <Breadcrumb.Link href="#navigation-workflow">Workspace</Breadcrumb.Link>
            </Breadcrumb.Item>
            <Breadcrumb.Separator />
            <Breadcrumb.Item>
              <Breadcrumb.Current>Members</Breadcrumb.Current>
            </Breadcrumb.Item>
          </Breadcrumb.List>
        </Breadcrumb>

        <Breadcrumb>
          <Breadcrumb.List>
            <Breadcrumb.Item>
              <Breadcrumb.Link href="#library">Home</Breadcrumb.Link>
            </Breadcrumb.Item>
            <Breadcrumb.Separator />
            <Show
              when={expanded()}
              fallback={
                <>
                  <Breadcrumb.Item>
                    <Breadcrumb.Collapsed onClick={() => setExpanded(true)} />
                  </Breadcrumb.Item>
                  <Breadcrumb.Separator />
                </>
              }
            >
                <>
                  <Breadcrumb.Item>
                    <Breadcrumb.Link href="#theme-studio">Workspace</Breadcrumb.Link>
                  </Breadcrumb.Item>
                  <Breadcrumb.Separator />
                  <Breadcrumb.Item>
                    <Breadcrumb.Link href="#tier-1-actions-navigation">Security</Breadcrumb.Link>
                  </Breadcrumb.Item>
                <Breadcrumb.Separator />
              </>
            </Show>
            <Breadcrumb.Item>
              <Breadcrumb.Current>Sessions</Breadcrumb.Current>
            </Breadcrumb.Item>
          </Breadcrumb.List>
        </Breadcrumb>
      </div>
    </DemoFrame>
  );
}

export function PaginationPreview(props: { item: RegistryItem }) {
  const [page, setPage] = createSignal(5);

  return (
    <DemoFrame item={props.item} title="Live primitive">
      <div class="space-y-5">
        <Pagination page={page()} onPageChange={setPage} pageCount={12} siblingCount={1} />
        <Pagination defaultPage={2} pageCount={7} compact showEdges={false} summary={false} />
      </div>
    </DemoFrame>
  );
}

export const previewBySlug = {
  breadcrumb: BreadcrumbPreview,
  button: ButtonPreview,
  "icon-button": IconButtonPreview,
  "link-button": LinkButtonPreview,
  pagination: PaginationPreview,
  toggle: TogglePreview,
  "toggle-group": ToggleGroupPreview,
};
