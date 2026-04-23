import { ChevronDown, Filter, Image as ImageIcon, Search, SlidersHorizontal, UserPlus } from "lucide-solid";
import { createSignal } from "solid-js";
import type { JSX } from "solid-js";
import type { RegistryItem } from "~/lib/registry";
import { Badge } from "~/components/registry/feedback-display/badge";
import { Button } from "~/components/registry/actions-navigation/button";
import { Checkbox } from "~/components/registry/form-inputs/checkbox";
import { Select } from "~/components/registry/form-inputs/select";
import { Switch } from "~/components/registry/form-inputs/switch";
import { TextArea } from "~/components/registry/form-inputs/text-area";
import { TextField } from "~/components/registry/form-inputs/text-field";
import { FieldRow } from "~/components/registry/form-systems/field-row";
import { FieldsetCard } from "~/components/registry/form-systems/fieldset-card";
import { FileUploader } from "~/components/registry/form-systems/file-uploader";
import { FilterToolbar } from "~/components/registry/form-systems/filter-toolbar";
import { FormSection } from "~/components/registry/form-systems/form-section";
import { InlineEditableField } from "~/components/registry/form-systems/inline-editable-field";
import { MediaUploader } from "~/components/registry/form-systems/media-uploader";
import { SearchField } from "~/components/registry/form-systems/search-field";
import { SettingsPanel } from "~/components/registry/form-systems/settings-panel";
import { SettingsRow } from "~/components/registry/form-systems/settings-row";
import { SortMenu } from "~/components/registry/form-systems/sort-menu";

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

export function FieldRowPreview(props: { item: RegistryItem }) {
  return (
    <DemoFrame item={props.item} title="Live block">
      <FieldRow
        label="Workspace name"
        description="This label/control relationship becomes the canonical wrapper for settings, forms, and onboarding flows."
        action={<Badge tone="accent">Busy</Badge>}
      >
        <TextField
          label={undefined}
          placeholder="Stylyf Studio"
          description={undefined}
          suffix={<span class="ui-chip ui-chip-muted">slug sync</span>}
        />
      </FieldRow>
    </DemoFrame>
  );
}

export function FieldsetCardPreview(props: { item: RegistryItem }) {
  return (
    <DemoFrame item={props.item} title="Live block">
      <FieldsetCard
        title="Publishing defaults"
        description="Grouped controls stay framed and readable as forms become denser."
        dirty
        actions={<Button type="button" tone="outline" intent="neutral">Reset</Button>}
        footer={<div class="flex justify-end"><Button type="button">Save section</Button></div>}
      >
        <TextField label="Default author" placeholder="Sanyam Singhal" />
        <TextArea label="Publishing note" defaultValue="Review hero messaging and verify footer conversion path." autoResize />
      </FieldsetCard>
    </DemoFrame>
  );
}

export function FormSectionPreview(props: { item: RegistryItem }) {
  return (
    <DemoFrame item={props.item} title="Live block">
      <FormSection
        title="Workspace profile"
        description="Higher-order section treatment for grouped forms with metadata, actions, and section-level state."
        columns={2}
        dirty
        valid
        actions={<Button type="button" tone="outline" intent="neutral">Discard</Button>}
        footer={<div class="flex justify-end"><Button type="button">Save profile</Button></div>}
      >
        <TextField label="Workspace name" placeholder="Stylyf" />
        <TextField label="Domain" placeholder="stylyf.com" prefix={<span class="text-muted-foreground">https://</span>} />
        <TextArea label="Summary" autoResize defaultValue="Source-owned SolidStart registry and design system distribution." />
        <Select label="Workspace tier" />
      </FormSection>
    </DemoFrame>
  );
}

export function SearchFieldPreview(props: { item: RegistryItem }) {
  const [loading, setLoading] = createSignal(false);

  return (
    <DemoFrame item={props.item} title="Live block">
      <SearchField
        loading={loading()}
        onSearch={() => {
          setLoading(true);
          setTimeout(() => setLoading(false), 900);
        }}
      />
    </DemoFrame>
  );
}

export function FilterToolbarPreview(props: { item: RegistryItem }) {
  return (
    <DemoFrame item={props.item} title="Live block">
      <FilterToolbar
        dirtyFilters
        selectionCount={12}
        search={<SearchField />}
        filters={
          <div class="flex flex-wrap gap-2">
            <Select label="Status" size="sm" options={[{ value: "", label: "All statuses" }, { value: "open", label: "Open" }, { value: "ready", label: "Ready" }]} />
            <Select label="Owner" size="sm" options={[{ value: "", label: "Any owner" }, { value: "sanyam", label: "Sanyam" }, { value: "ops", label: "Ops" }]} />
          </div>
        }
        chips={
          <>
            <Badge icon={<Filter class="size-3" />} removable>Open</Badge>
            <Badge removable>Assigned to me</Badge>
            <Badge tone="success" removable>Ready for publish</Badge>
          </>
        }
        actions={
          <div class="flex flex-wrap gap-2">
            <Button type="button" tone="outline" intent="neutral" leftIcon={<SlidersHorizontal />}>Views</Button>
            <Button type="button" leftIcon={<UserPlus />}>Invite</Button>
          </div>
        }
        bulkActions={<Button type="button" tone="soft" intent="highlight">Export 12 rows</Button>}
      />
    </DemoFrame>
  );
}

export function SortMenuPreview(props: { item: RegistryItem }) {
  return (
    <DemoFrame item={props.item} title="Live block">
      <div class="max-w-sm">
        <SortMenu />
      </div>
    </DemoFrame>
  );
}

export function InlineEditableFieldPreview(props: { item: RegistryItem }) {
  const [value, setValue] = createSignal("stylyf-registry");

  return (
    <DemoFrame item={props.item} title="Live block">
      <InlineEditableField value={value()} onSave={setValue} />
    </DemoFrame>
  );
}

export function SettingsRowPreview(props: { item: RegistryItem }) {
  return (
    <DemoFrame item={props.item} title="Live block">
      <SettingsRow
        label="Email digests"
        description="Weekly usage summaries and release updates sent to workspace owners."
        meta="Last changed 2 days ago"
      >
        <Switch label="Enabled" defaultChecked />
      </SettingsRow>
    </DemoFrame>
  );
}

export function SettingsPanelPreview(props: { item: RegistryItem }) {
  return (
    <DemoFrame item={props.item} title="Live block">
      <SettingsPanel
        title="Project defaults"
        description="Reusable settings subsection card that wraps consistent rows, footers, and saving treatment."
        dirty
        actions={<Button type="button" tone="outline" intent="neutral">Reset</Button>}
        footer={<div class="flex justify-end"><Button type="button">Save changes</Button></div>}
      >
        <SettingsRow label="Public roadmap" description="Expose roadmap items to external viewers with private notes hidden.">
          <Switch label="Enabled" />
        </SettingsRow>
        <SettingsRow label="Default reviewers" description="New documents require at least one reviewer before publish." pending>
          <Select label="Reviewers" size="sm" options={[{ value: "design", label: "Design team" }, { value: "ops", label: "Ops team" }]} />
        </SettingsRow>
      </SettingsPanel>
    </DemoFrame>
  );
}

export function FileUploaderPreview(props: { item: RegistryItem }) {
  return (
    <DemoFrame item={props.item} title="Live block">
      <FileUploader />
    </DemoFrame>
  );
}

export function MediaUploaderPreview(props: { item: RegistryItem }) {
  return (
    <DemoFrame item={props.item} title="Live block">
      <MediaUploader />
    </DemoFrame>
  );
}

export const previewBySlug = {
  "field-row": FieldRowPreview,
  "fieldset-card": FieldsetCardPreview,
  "file-uploader": FileUploaderPreview,
  "filter-toolbar": FilterToolbarPreview,
  "form-section": FormSectionPreview,
  "inline-editable-field": InlineEditableFieldPreview,
  "media-uploader": MediaUploaderPreview,
  "search-field": SearchFieldPreview,
  "settings-panel": SettingsPanelPreview,
  "settings-row": SettingsRowPreview,
  "sort-menu": SortMenuPreview,
};
