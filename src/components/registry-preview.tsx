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
} from "~/components/registry/tier-1/actions-navigation/demos";
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
} from "~/components/registry/tier-1/form-inputs/demos";
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
};

export function RegistryPreview(props: { item: RegistryItem }) {
  const Preview = implementedPreviewBySlug[props.item.slug];

  if (Preview) {
    return <Preview item={props.item} />;
  }

  return <PreviewShell item={props.item} />;
}
