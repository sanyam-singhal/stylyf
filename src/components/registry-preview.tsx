import type { Component } from "solid-js";
import { PreviewShell } from "~/components/preview-shell";
import {
  BreadcrumbPreview,
  ButtonPreview,
  IconButtonPreview,
  LinkButtonPreview,
  PaginationPreview,
  ToggleGroupPreview,
  TogglePreview,
} from "~/components/registry/actions-navigation/demos";
import {
  CalendarPreview,
  CheckboxPreview,
  ComboboxPreview,
  DatePickerPreview,
  NumberFieldPreview,
  OTPFieldPreview,
  RadioGroupPreview,
  SelectPreview,
  SliderPreview,
  SwitchPreview,
  TextAreaPreview,
  TextFieldPreview,
} from "~/components/registry/form-inputs/demos";
import {
  AccordionPreview,
  AlertDialogPreview,
  CollapsiblePreview,
  CommandMenuPreview,
  ContextMenuPreview,
  DialogPreview,
  DrawerPreview,
  DropdownMenuPreview,
  MenubarPreview,
  PopoverPreview,
  TabsPreview,
  TooltipPreview,
} from "~/components/registry/disclosure-overlay/demos";
import {
  AvatarPreview,
  BadgePreview,
  ProgressPreview,
  SeparatorPreview,
  SkeletonPreview,
  ToastPreview,
} from "~/components/registry/feedback-display/demos";
import { TablePreview } from "~/components/registry/data-structure/demos";
import type { RegistryItem } from "~/lib/registry";

const implementedPreviewBySlug: Record<string, Component<{ item: RegistryItem }>> = {
  button: ButtonPreview,
  "icon-button": IconButtonPreview,
  "link-button": LinkButtonPreview,
  toggle: TogglePreview,
  "toggle-group": ToggleGroupPreview,
  breadcrumb: BreadcrumbPreview,
  pagination: PaginationPreview,
  "text-field": TextFieldPreview,
  "text-area": TextAreaPreview,
  "number-field": NumberFieldPreview,
  "otp-field": OTPFieldPreview,
  checkbox: CheckboxPreview,
  "radio-group": RadioGroupPreview,
  switch: SwitchPreview,
  select: SelectPreview,
  combobox: ComboboxPreview,
  slider: SliderPreview,
  calendar: CalendarPreview,
  "date-picker": DatePickerPreview,
  tabs: TabsPreview,
  accordion: AccordionPreview,
  collapsible: CollapsiblePreview,
  dialog: DialogPreview,
  "alert-dialog": AlertDialogPreview,
  drawer: DrawerPreview,
  popover: PopoverPreview,
  tooltip: TooltipPreview,
  "dropdown-menu": DropdownMenuPreview,
  "context-menu": ContextMenuPreview,
  menubar: MenubarPreview,
  "command-menu": CommandMenuPreview,
  progress: ProgressPreview,
  badge: BadgePreview,
  avatar: AvatarPreview,
  toast: ToastPreview,
  skeleton: SkeletonPreview,
  separator: SeparatorPreview,
  table: TablePreview,
};

export function RegistryPreview(props: { item: RegistryItem }) {
  const Preview = implementedPreviewBySlug[props.item.slug];

  if (Preview) {
    return <Preview item={props.item} />;
  }

  return <PreviewShell item={props.item} />;
}
