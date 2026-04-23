import { Bell, Command, LayoutGrid, PanelsTopLeft, ShieldAlert, Sparkles } from "lucide-solid";
import { createSignal } from "solid-js";
import type { JSX } from "solid-js";
import type { RegistryItem } from "~/lib/registry";
import { Button } from "~/components/registry/actions-navigation/button";
import { Accordion } from "~/components/registry/disclosure-overlay/accordion";
import { AlertDialog } from "~/components/registry/disclosure-overlay/alert-dialog";
import { Collapsible } from "~/components/registry/disclosure-overlay/collapsible";
import { CommandMenu } from "~/components/registry/disclosure-overlay/command-menu";
import { ContextMenu } from "~/components/registry/disclosure-overlay/context-menu";
import { Dialog } from "~/components/registry/disclosure-overlay/dialog";
import { Drawer } from "~/components/registry/disclosure-overlay/drawer";
import { DropdownMenu } from "~/components/registry/disclosure-overlay/dropdown-menu";
import { Menubar } from "~/components/registry/disclosure-overlay/menubar";
import { Popover } from "~/components/registry/disclosure-overlay/popover";
import { Tabs } from "~/components/registry/disclosure-overlay/tabs";
import { Tooltip } from "~/components/registry/disclosure-overlay/tooltip";

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
          <div class="ui-demo-inset text-sm text-foreground">
            Reviewers are auto-assigned from the workspace policy set.
          </div>
          <div class="ui-demo-inset text-sm text-muted-foreground">
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
        <Button data-demo-action="open-dialog" onClick={() => setOpen(true)}>Open dialog</Button>
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
      <Button data-demo-action="open-alert-dialog" destructive leftIcon={<ShieldAlert />} onClick={() => setOpen(true)}>
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
      <Button data-demo-action="open-drawer" intent="neutral" tone="outline" leftIcon={<PanelsTopLeft />} onClick={() => setOpen(true)}>
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
        <Button data-demo-action="open-command-menu" leftIcon={<Command />} onClick={() => setOpen(true)}>
          Open palette
        </Button>
        <div class="ui-demo-inset text-sm leading-6 text-muted-foreground">
          Command surfaces are optimized for keyboard-first navigation, filtering, and quick action dispatch.
        </div>
      </div>
      <CommandMenu open={open()} onOpenChange={setOpen} />
    </DemoFrame>
  );
}

export const previewBySlug = {
  accordion: AccordionPreview,
  "alert-dialog": AlertDialogPreview,
  collapsible: CollapsiblePreview,
  "command-menu": CommandMenuPreview,
  "context-menu": ContextMenuPreview,
  dialog: DialogPreview,
  drawer: DrawerPreview,
  "dropdown-menu": DropdownMenuPreview,
  menubar: MenubarPreview,
  popover: PopoverPreview,
  tabs: TabsPreview,
  tooltip: TooltipPreview,
};
