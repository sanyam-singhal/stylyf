import { Bell, Command, LayoutGrid, PanelsTopLeft, ShieldAlert, Sparkles } from "lucide-solid";
import { createSignal } from "solid-js";
import type { JSX } from "solid-js";
import type { RegistryItem } from "~/lib/registry";
import { Button } from "~/components/registry/tier-1/actions-navigation/button";
import { Accordion } from "~/components/registry/tier-1/disclosure-overlay/accordion";
import { AlertDialog } from "~/components/registry/tier-1/disclosure-overlay/alert-dialog";
import { Collapsible } from "~/components/registry/tier-1/disclosure-overlay/collapsible";
import { CommandMenu } from "~/components/registry/tier-1/disclosure-overlay/command-menu";
import { ContextMenu } from "~/components/registry/tier-1/disclosure-overlay/context-menu";
import { Dialog } from "~/components/registry/tier-1/disclosure-overlay/dialog";
import { Drawer } from "~/components/registry/tier-1/disclosure-overlay/drawer";
import { DropdownMenu } from "~/components/registry/tier-1/disclosure-overlay/dropdown-menu";
import { Menubar } from "~/components/registry/tier-1/disclosure-overlay/menubar";
import { Popover } from "~/components/registry/tier-1/disclosure-overlay/popover";
import { Tabs } from "~/components/registry/tier-1/disclosure-overlay/tabs";
import { Tooltip } from "~/components/registry/tier-1/disclosure-overlay/tooltip";

function DemoFrame(props: { children: JSX.Element; item: RegistryItem; title: string }) {
  return (
    <div class="space-y-4">
      <div class="inline-flex items-center gap-2 rounded-full border border-border/70 bg-panel px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
        <span>{props.title}</span>
        <span class="text-border">/</span>
        <span>{props.item.name}</span>
      </div>
      <div class="rounded-[1.5rem] border border-border/70 bg-panel p-5 shadow-soft">{props.children}</div>
    </div>
  );
}

export function TabsPreview(props: { item: RegistryItem }) {
  return (
    <DemoFrame item={props.item} title="Live primitive">
      <Tabs />
    </DemoFrame>
  );
}

export function AccordionPreview(props: { item: RegistryItem }) {
  return (
    <DemoFrame item={props.item} title="Live primitive">
      <Accordion multiple />
    </DemoFrame>
  );
}

export function CollapsiblePreview(props: { item: RegistryItem }) {
  return (
    <DemoFrame item={props.item} title="Live primitive">
      <Collapsible defaultOpen title="Publishing notes" description="Secondary guidance that does not need full accordion structure.">
        <div class="grid gap-3">
          <div class="rounded-[1.1rem] border border-border/70 bg-background px-4 py-3 text-sm text-foreground">
            Reviewers are auto-assigned from the workspace policy set.
          </div>
          <div class="rounded-[1.1rem] border border-border/70 bg-background px-4 py-3 text-sm text-muted">
            Non-critical contextual copy stays lightweight and easy to collapse.
          </div>
        </div>
      </Collapsible>
    </DemoFrame>
  );
}

export function DialogPreview(props: { item: RegistryItem }) {
  const [open, setOpen] = createSignal(false);

  return (
    <DemoFrame item={props.item} title="Live primitive">
      <div class="flex flex-wrap gap-3">
        <Button onClick={() => setOpen(true)}>Open dialog</Button>
        <Button intent="neutral" tone="outline">Secondary action</Button>
      </div>
      <Dialog
        open={open()}
        onOpenChange={setOpen}
        footer={
          <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button intent="neutral" tone="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button leftIcon={<Sparkles />} onClick={() => setOpen(false)}>
              Publish update
            </Button>
          </div>
        }
      />
    </DemoFrame>
  );
}

export function AlertDialogPreview(props: { item: RegistryItem }) {
  const [open, setOpen] = createSignal(false);

  return (
    <DemoFrame item={props.item} title="Live primitive">
      <Button destructive leftIcon={<ShieldAlert />} onClick={() => setOpen(true)}>
        Open confirmation
      </Button>
      <AlertDialog open={open()} onOpenChange={setOpen} onConfirm={() => setOpen(false)} onCancel={() => setOpen(false)} />
    </DemoFrame>
  );
}

export function DrawerPreview(props: { item: RegistryItem }) {
  const [open, setOpen] = createSignal(false);

  return (
    <DemoFrame item={props.item} title="Live primitive">
      <Button intent="neutral" tone="outline" leftIcon={<PanelsTopLeft />} onClick={() => setOpen(true)}>
        Open drawer
      </Button>
      <Drawer open={open()} onOpenChange={setOpen} side="right" />
    </DemoFrame>
  );
}

export function PopoverPreview(props: { item: RegistryItem }) {
  return (
    <DemoFrame item={props.item} title="Live primitive">
      <div class="flex items-center gap-3">
        <Popover triggerLabel="Workspace quick actions" />
        <Popover triggerLabel="Status options" placement="bottom-end" title="Status transitions" description="Anchored content can stay rich without taking over the route." />
      </div>
    </DemoFrame>
  );
}

export function TooltipPreview(props: { item: RegistryItem }) {
  return (
    <DemoFrame item={props.item} title="Live primitive">
      <div class="flex flex-wrap items-center gap-3">
        <Tooltip />
        <Tooltip label="Publishing policy" content="The current workspace requires one reviewer and one approver before content can ship." />
      </div>
    </DemoFrame>
  );
}

export function DropdownMenuPreview(props: { item: RegistryItem }) {
  return (
    <DemoFrame item={props.item} title="Live primitive">
      <DropdownMenu />
    </DemoFrame>
  );
}

export function ContextMenuPreview(props: { item: RegistryItem }) {
  return (
    <DemoFrame item={props.item} title="Live primitive">
      <ContextMenu />
    </DemoFrame>
  );
}

export function MenubarPreview(props: { item: RegistryItem }) {
  return (
    <DemoFrame item={props.item} title="Live primitive">
      <Menubar />
    </DemoFrame>
  );
}

export function CommandMenuPreview(props: { item: RegistryItem }) {
  const [open, setOpen] = createSignal(false);

  return (
    <DemoFrame item={props.item} title="Live primitive">
      <div class="grid gap-4 xl:grid-cols-[auto_1fr] xl:items-center">
        <Button leftIcon={<Command />} onClick={() => setOpen(true)}>
          Open palette
        </Button>
        <div class="rounded-[1.2rem] border border-border/70 bg-background px-4 py-3 text-sm leading-6 text-muted">
          Command surfaces are optimized for keyboard-first navigation, filtering, and quick action dispatch.
        </div>
      </div>
      <CommandMenu open={open()} onOpenChange={setOpen} />
    </DemoFrame>
  );
}
