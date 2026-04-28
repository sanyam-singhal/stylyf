import { createAsync, useSubmission } from "@solidjs/router";
import { Show } from "solid-js";
import { TextArea } from "~/components/registry/form-inputs/text-area";
import { TextField } from "~/components/registry/form-inputs/text-field";
import { Button } from "~/components/registry/actions-navigation/button";
import { getAgentEvents } from "~/lib/server/queries/agent-events-detail";
import { submitCreateAgentEventsForm, submitUpdateAgentEventsForm, type AgentEventsFormFieldErrors } from "~/lib/server/forms/agent-events";
type AgentEventsFormInitialValues = Partial<Record<string, unknown>>;
type AgentEventsRecord = NonNullable<Awaited<ReturnType<typeof getAgentEvents>>>;
export type AgentEventsFormProps = {
  mode: "create" | "edit";
  resourceId?: string;
  class?: string;
};
function formatDateValue(value: unknown) {
  if (!value) return "";
  const parsed = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
}
function formatDateTimeValue(value: unknown) {
  if (!value) return "";
  const parsed = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 16);
}
function formatJsonValue(value: unknown) {
  if (value == null) return "";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "";
  }
}
function normalizeAgentEventsInitialValues(record?: AgentEventsRecord | null): AgentEventsFormInitialValues {
  if (!record) return {};
  return {
    "type": record?.["type"] ?? "",
    "payload": record?.["payload"] ?? null,
  };
}
function AgentEventsFormFields(props: { initialValues?: AgentEventsFormInitialValues; fieldErrors: AgentEventsFormFieldErrors }) {
  return (
    <div class="space-y-[var(--space-5)]">
        <TextField
          name="type"
          label={"Type"}
          type={"text"}
          defaultValue={(((props.initialValues?.["type"] ?? "") as string))}
          invalid={Boolean(props.fieldErrors["type"])}
          errorMessage={props.fieldErrors["type"]}
          required
        />

        <TextArea
          name="payload"
          label={"Payload"}
          defaultValue={formatJsonValue(props.initialValues?.["payload"])}
          invalid={Boolean(props.fieldErrors["payload"])}
          errorMessage={props.fieldErrors["payload"]}
          description="JSON object stored alongside this resource."
        />
    </div>
  );
}
export function AgentEventsForm(props: AgentEventsFormProps) {
  const createSubmission = useSubmission(submitCreateAgentEventsForm);
  const updateSubmission = useSubmission(submitUpdateAgentEventsForm);
  const record = createAsync(async () => {
    if (props.mode !== "edit" || !props.resourceId) return null;
    return await getAgentEvents(props.resourceId);
  });
  const activeSubmission = () => (props.mode === "edit" ? updateSubmission : createSubmission);
  const fieldErrors = () => {
    const result = activeSubmission().result;
    return result && !result.ok ? result.fieldErrors ?? {} : {};
  };
  const formError = () => {
    const result = activeSubmission().result;
    return result && !result.ok ? result.formError : undefined;
  };
  const successMessage = () => {
    const result = activeSubmission().result;
    return result && result.ok ? result.message : undefined;
  };
  return (
    <div class={props.class ?? "space-y-[var(--space-5)]"}>
      <Show when={props.mode === "create"} fallback={
        <Show when={props.resourceId} fallback={<div class="rounded-[var(--radius-lg)] border border-destructive/25 bg-destructive/8 px-[var(--space-5)] py-[var(--space-4)] text-sm text-destructive">This edit route requires a record id.</div>}>
          <Show when={record() !== undefined} fallback={<div class="rounded-[var(--radius-lg)] border border-border/70 bg-muted-soft px-[var(--space-5)] py-[var(--space-4)] text-sm text-muted-foreground">Loading current values...</div>}>
            <Show when={record()} fallback={<div class="rounded-[var(--radius-lg)] border border-destructive/25 bg-destructive/8 px-[var(--space-5)] py-[var(--space-4)] text-sm text-destructive">We could not load this record for editing.</div>}>
              <form action={props.resourceId ? submitUpdateAgentEventsForm.with(props.resourceId) : submitUpdateAgentEventsForm.with("")} method="post" class="space-y-[var(--space-5)]">
                <Show when={formError()}><div class="rounded-[var(--radius-lg)] border border-destructive/25 bg-destructive/8 px-[var(--space-5)] py-[var(--space-4)] text-sm text-destructive">{formError()}</div></Show>
                <Show when={successMessage()}><div class="rounded-[var(--radius-lg)] border border-primary/22 bg-primary/8 px-[var(--space-5)] py-[var(--space-4)] text-sm text-foreground">{successMessage()}</div></Show>
                <AgentEventsFormFields initialValues={normalizeAgentEventsInitialValues(record())} fieldErrors={fieldErrors()} />
                <div class="flex justify-end">
                  <Button type="submit" loading={activeSubmission().pending}>Save changes</Button>
                </div>
              </form>
            </Show>
          </Show>
        </Show>
      }>
        <form action={submitCreateAgentEventsForm} method="post" class="space-y-[var(--space-5)]">
          <Show when={formError()}><div class="rounded-[var(--radius-lg)] border border-destructive/25 bg-destructive/8 px-[var(--space-5)] py-[var(--space-4)] text-sm text-destructive">{formError()}</div></Show>
          <Show when={successMessage()}><div class="rounded-[var(--radius-lg)] border border-primary/22 bg-primary/8 px-[var(--space-5)] py-[var(--space-4)] text-sm text-foreground">{successMessage()}</div></Show>
          <AgentEventsFormFields fieldErrors={fieldErrors()} />
          <div class="flex justify-end">
            <Button type="submit" loading={activeSubmission().pending}>Create Agent event</Button>
          </div>
        </form>
      </Show>
    </div>
  );
}