import { PencilLine } from "lucide-solid";
import { Match, Show, Switch, createMemo, createSignal, mergeProps, splitProps } from "solid-js";
import type { JSX } from "solid-js";
import { Button } from "~/components/registry/actions-navigation/button";
import { TextField } from "~/components/registry/form-inputs/text-field";
import { cn } from "~/lib/cn";

export type InlineEditableFieldProps = Omit<JSX.HTMLAttributes<HTMLDivElement>, "children"> & {
  class?: string;
  defaultEditing?: boolean;
  defaultValue?: string;
  description?: JSX.Element;
  invalid?: boolean;
  label?: JSX.Element;
  onSave?: (value: string) => void;
  readOnly?: boolean;
  saving?: boolean;
  value?: string;
};

export function InlineEditableField(userProps: InlineEditableFieldProps) {
  const props = mergeProps(
    {
      defaultEditing: false,
      defaultValue: "launch-brief",
      description: "Inline mode keeps profile and settings surfaces scannable until the user chooses to edit.",
      invalid: false,
      label: "Project slug",
      readOnly: false,
      saving: false,
      value: undefined,
    },
    userProps,
  );

  const [local, others] = splitProps(props, [
    "class",
    "defaultEditing",
    "defaultValue",
    "description",
    "invalid",
    "label",
    "onSave",
    "readOnly",
    "saving",
    "value",
  ]);
  const [editing, setEditing] = createSignal(local.defaultEditing);
  const [draft, setDraft] = createSignal(local.defaultValue);
  const currentValue = createMemo(() => local.value ?? draft());

  return (
    <div
      class={cn(
        "rounded-[calc(var(--radius)*1.1)] border border-border/70 bg-card p-[var(--space-5)] shadow-xs transition",
        "hover:border-primary/24 hover:bg-background-subtle/65",
        local.class,
      )}
      {...others}
    >
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div class="space-y-1.5">
          <div class="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">{local.label}</div>
          <Switch>
            <Match when={editing()}>
              <div class="max-w-xl">
                <TextField
                  value={currentValue()}
                  onValueChange={setDraft}
                  invalid={local.invalid}
                  errorMessage={local.invalid ? "This value must remain URL-safe." : undefined}
                />
              </div>
            </Match>
            <Match when={true}>
              <div class="text-lg font-semibold tracking-[-0.02em] text-foreground">{currentValue()}</div>
            </Match>
          </Switch>
          <p class="text-sm leading-6 text-muted-foreground">{local.description}</p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <Show
            when={editing()}
            fallback={
              <Button
                type="button"
                tone="outline"
                intent="neutral"
                leftIcon={<PencilLine />}
                disabled={local.readOnly}
                onClick={() => setEditing(true)}
              >
                Edit
              </Button>
            }
          >
            <Button type="button" tone="ghost" intent="neutral" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              loading={local.saving}
              disabled={local.invalid}
              onClick={() => {
                local.onSave?.(currentValue());
                if (!local.saving) setEditing(false);
              }}
            >
              Save
            </Button>
          </Show>
        </div>
      </div>
    </div>
  );
}
