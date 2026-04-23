import { AtSign, CalendarDays, DollarSign, Hash, Mail, Search, ShieldCheck } from "lucide-solid";
import { createSignal } from "solid-js";
import type { JSX } from "solid-js";
import type { RegistryItem } from "~/lib/registry";
import { Calendar } from "~/components/registry/form-inputs/calendar";
import { Checkbox } from "~/components/registry/form-inputs/checkbox";
import { Combobox } from "~/components/registry/form-inputs/combobox";
import { DatePicker } from "~/components/registry/form-inputs/date-picker";
import { NumberField } from "~/components/registry/form-inputs/number-field";
import { OTPField } from "~/components/registry/form-inputs/otp-field";
import { RadioGroup } from "~/components/registry/form-inputs/radio-group";
import { Select } from "~/components/registry/form-inputs/select";
import { Slider } from "~/components/registry/form-inputs/slider";
import { Switch } from "~/components/registry/form-inputs/switch";
import { TextArea } from "~/components/registry/form-inputs/text-area";
import { TextField } from "~/components/registry/form-inputs/text-field";
import { cn } from "~/lib/cn";

function DemoFrame(props: { children: JSX.Element; frameClass?: string; item: RegistryItem; title: string }) {
  return (
    <div class="space-y-4" data-demo={props.item.slug}>
      <div class="ui-demo-chip">
        <span>{props.title}</span>
        <span class="text-border">/</span>
        <span>{props.item.name}</span>
      </div>
      <div class={cn("ui-demo-frame", props.frameClass)}>{props.children}</div>
    </div>
  );
}

export function TextFieldPreview(props: { item: RegistryItem }) {
  return (
    <DemoFrame item={props.item} title="Live primitive">
      <div class="grid gap-4 xl:grid-cols-2">
        <div data-demo-slot="workspace-name">
          <TextField
            label="Workspace name"
            description="This appears in invites and billing surfaces."
            placeholder="Stylyf internal tools"
            clearable
            prefix={<Hash class="size-4" />}
          />
        </div>
        <div data-demo-slot="owner-email">
          <TextField
            label="Owner email"
            type="email"
            placeholder="ops@stylyf.com"
            prefix={<Mail class="size-4" />}
            suffix={<ShieldCheck class="size-4" />}
            invalid
            errorMessage="Use a valid company email address."
          />
        </div>
      </div>
    </DemoFrame>
  );
}

export function TextAreaPreview(props: { item: RegistryItem }) {
  return (
    <DemoFrame item={props.item} title="Live primitive">
      <div class="grid gap-4 xl:grid-cols-2">
        <div data-demo-slot="release-note">
          <TextArea
            label="Release note"
            description="Auto-resize keeps copy editing comfortable."
            defaultValue="Shipped production-safe hydration fixes for Stylyf and moved the edge compression contract fully into Caddy."
            autoResize
          />
        </div>
        <div data-demo-slot="admin-note">
          <TextArea
            label="Admin note"
            placeholder="Describe why this account needs an exception."
            invalid
            errorMessage="An explanation is required before saving."
          />
        </div>
      </div>
    </DemoFrame>
  );
}

export function NumberFieldPreview(props: { item: RegistryItem }) {
  const [seats, setSeats] = createSignal<number | undefined>(12);

  return (
    <DemoFrame item={props.item} title="Live primitive">
      <div class="grid gap-4 xl:grid-cols-2">
        <div data-demo-slot="team-seats">
          <NumberField
            label="Team seats"
            description="Steppers keep the value bounded and fast to adjust."
            min={1}
            max={50}
            value={seats()}
            onValueChange={setSeats}
            align="center"
            suffix={<span class="text-xs uppercase tracking-[0.18em] text-muted-foreground">seats</span>}
          />
        </div>
        <div data-demo-slot="budget-cap">
          <NumberField
            label="Budget cap"
            defaultValue={2400}
            min={0}
            step={100}
            prefix={<DollarSign class="size-4" />}
            formatOptions={{ maximumFractionDigits: 0 }}
          />
        </div>
      </div>
    </DemoFrame>
  );
}

export function OTPFieldPreview(props: { item: RegistryItem }) {
  const [code, setCode] = createSignal("");

  return (
    <DemoFrame item={props.item} title="Live primitive">
      <div class="grid gap-4 xl:grid-cols-[1fr_auto] xl:items-end">
        <div data-demo-slot="verification-code">
          <OTPField
            label="Verification code"
            description="Paste is supported and focus advances automatically."
            value={code()}
            onValueChange={setCode}
          />
        </div>
        <div class="ui-demo-inset text-sm text-muted-foreground">
          Aggregated value: <span class="font-mono text-foreground">{code() || "------"}</span>
        </div>
      </div>
    </DemoFrame>
  );
}

export function CheckboxPreview(props: { item: RegistryItem }) {
  const [updates, setUpdates] = createSignal(true);

  return (
    <DemoFrame item={props.item} title="Live primitive">
      <div class="space-y-4">
        <div data-demo-slot="product-digest">
          <Checkbox
            label="Weekly product digest"
            description="Receives the Friday summary of shipped changes."
            checked={updates()}
            onCheckedChange={setUpdates}
          />
        </div>
        <div data-demo-slot="child-workspaces">
          <Checkbox
            label="Apply to all child workspaces"
            description="A tri-state checkbox for cascading workspace permissions."
            indeterminate
          />
        </div>
        <div data-demo-slot="security-acknowledgment">
          <Checkbox
            label="Accept the security acknowledgment"
            invalid
            errorMessage="This acknowledgment is required."
          />
        </div>
      </div>
    </DemoFrame>
  );
}

export function RadioGroupPreview(props: { item: RegistryItem }) {
  const [plan, setPlan] = createSignal("team");

  return (
    <DemoFrame item={props.item} title="Live primitive">
      <div data-demo-slot="workspace-plan">
        <RadioGroup
          label="Workspace plan"
          description="Arrow keys move through the set because the primitive uses real radio inputs."
          value={plan()}
          onValueChange={setPlan}
        />
      </div>
    </DemoFrame>
  );
}

export function SwitchPreview(props: { item: RegistryItem }) {
  const [enabled, setEnabled] = createSignal(false);

  return (
    <DemoFrame item={props.item} title="Live primitive">
      <div class="space-y-4">
        <div data-demo-slot="immediate-publish">
          <Switch
            label="Immediate publish"
            description="When enabled, approved content goes live without a second review gate."
            checked={enabled()}
            onCheckedChange={setEnabled}
          />
        </div>
        <div data-demo-slot="lock-external-sharing">
          <Switch
            label="Lock external sharing"
            description="A more severe setting with an invalid state for policy conflict."
            tone="outline"
            invalid
            errorMessage="Cannot be enabled while guest access is still active."
          />
        </div>
      </div>
    </DemoFrame>
  );
}

export function SelectPreview(props: { item: RegistryItem }) {
  return (
    <DemoFrame item={props.item} title="Live primitive">
      <div class="grid gap-4 xl:grid-cols-2">
        <div data-demo-slot="surface-preset">
          <Select label="Surface preset" description="The trigger, listbox, and selected value stay fully themeable." />
        </div>
        <div data-demo-slot="environment">
          <Select
            label="Environment"
            placeholder="Choose an environment"
            invalid
            errorMessage="Production access requires explicit approval."
            options={[
              { value: "dev", label: "Development" },
              { value: "stage", label: "Staging" },
              { value: "prod", label: "Production" },
            ]}
          />
        </div>
      </div>
    </DemoFrame>
  );
}

export function ComboboxPreview(props: { item: RegistryItem }) {
  const [selected, setSelected] = createSignal<string | undefined>();

  return (
    <DemoFrame item={props.item} title="Live primitive">
      <div class="grid gap-4 xl:grid-cols-[1fr_auto] xl:items-start">
        <div data-demo-slot="workspace-search">
          <Combobox
            label="Search workspace"
            description="Listbox suggestions filter as you type and support keyboard selection."
            onSelectedValueChange={setSelected}
            placeholder="Search collections"
            options={[
              { value: "search", label: "Search", description: "Discovery and knowledge retrieval" },
              { value: "billing", label: "Billing", description: "Invoices, cards, and plans" },
              { value: "ops", label: "Ops", description: "Queues and support tooling" },
              { value: "security", label: "Security", description: "Sessions, keys, and access policy" },
            ]}
          />
        </div>
        <div class="ui-demo-inset mt-8 text-sm text-muted-foreground xl:mt-0">
          Selected: <span class="font-semibold text-foreground">{selected() ?? "None"}</span>
        </div>
      </div>
    </DemoFrame>
  );
}

export function SliderPreview(props: { item: RegistryItem }) {
  const [threshold, setThreshold] = createSignal<number | [number, number]>(42);
  const [range, setRange] = createSignal<number | [number, number]>([18, 72]);

  return (
    <DemoFrame item={props.item} title="Live primitive">
      <div class="space-y-6">
        <div data-demo-slot="confidence-threshold">
          <Slider
            label="Confidence threshold"
            description="Native range inputs keep pointer and keyboard behavior stable."
            value={threshold()}
            onValueChange={setThreshold}
            marks={[0, 25, 50, 75, 100]}
          />
        </div>
        <div data-demo-slot="usage-band">
          <Slider
            label="Usage band"
            description="Range mode is useful for filtering and quota targeting."
            value={range()}
            onValueChange={setRange}
            marks={[10, 25, 50, 75, 90]}
          />
        </div>
      </div>
    </DemoFrame>
  );
}

export function CalendarPreview(props: { item: RegistryItem }) {
  const [single, setSingle] = createSignal<Date | undefined>(new Date());
  const [range, setRange] = createSignal<[Date | undefined, Date | undefined] | undefined>([new Date(), undefined]);

  return (
    <DemoFrame item={props.item} title="Live primitive">
      <div class="grid gap-4 xl:grid-cols-2">
        <div data-demo-slot="single-date">
          <Calendar
            label="Single date"
            value={single()}
            onValueChange={value => setSingle(value as Date | undefined)}
          />
        </div>
        <div data-demo-slot="date-range">
          <Calendar
            label="Date range"
            mode="range"
            value={range()}
            onValueChange={value => setRange(value as [Date | undefined, Date | undefined] | undefined)}
          />
        </div>
      </div>
    </DemoFrame>
  );
}

export function DatePickerPreview(props: { item: RegistryItem }) {
  const [single, setSingle] = createSignal<Date | undefined>(new Date());
  const [range, setRange] = createSignal<[Date | undefined, Date | undefined] | undefined>(undefined);

  return (
    <DemoFrame item={props.item} title="Live primitive">
      <div class="grid gap-4 xl:grid-cols-2">
        <div data-demo-slot="launch-date">
          <DatePicker
            label="Launch date"
            description="Field shell plus calendar overlay for route-level forms."
            value={single()}
            onValueChange={value => setSingle(value as Date | undefined)}
          />
        </div>
        <div data-demo-slot="campaign-window">
          <DatePicker
            label="Campaign window"
            mode="range"
            value={range()}
            onValueChange={value => setRange(value as [Date | undefined, Date | undefined] | undefined)}
            description="Range mode closes only after both boundaries are selected."
          />
        </div>
      </div>
    </DemoFrame>
  );
}

export const previewBySlug = {
  calendar: CalendarPreview,
  checkbox: CheckboxPreview,
  combobox: ComboboxPreview,
  "date-picker": DatePickerPreview,
  "number-field": NumberFieldPreview,
  "otp-field": OTPFieldPreview,
  "radio-group": RadioGroupPreview,
  select: SelectPreview,
  slider: SliderPreview,
  switch: SwitchPreview,
  "text-area": TextAreaPreview,
  "text-field": TextFieldPreview,
};
