import { action } from "@solidjs/router";
import { createAgentEvents } from "~/lib/server/actions/agent-events-create";
import { updateAgentEvents } from "~/lib/server/actions/agent-events-update";

export type AgentEventsFormValues = {
  type: string;
  payload?: Record<string, unknown> | null;
};

export type AgentEventsFormFieldErrors = Partial<Record<"type" | "payload", string>>;

export type AgentEventsFormResult =
  | { ok: true; message: string }
  | { ok: false; fieldErrors: AgentEventsFormFieldErrors; formError?: string };

function readStringField(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function readBooleanField(formData: FormData, name: string) {
  const value = formData.get(name);
  return value === "on" || value === "true" || value === "1";
}

function readIntegerField(formData: FormData, name: string) {
  const value = readStringField(formData, name);
  if (!value) return { value: null as number | null };
  const next = Number.parseInt(value, 10);
  if (Number.isNaN(next)) {
    return { value: null as number | null, error: "Enter a whole number." };
  }
  return { value: next };
}

function readJsonField(formData: FormData, name: string) {
  const value = readStringField(formData, name);
  if (!value) return { value: null as Record<string, unknown> | null };
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    return { value: parsed };
  } catch {
    return { value: null as Record<string, unknown> | null, error: "Enter valid JSON." };
  }
}

function readDateField(formData: FormData, name: string) {
  const value = readStringField(formData, name);
  if (!value) return { value: null as Date | null };
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return { value: null as Date | null, error: "Enter a valid date." };
  }
  return { value: parsed };
}

export function parseAgentEventsFormData(formData: FormData): { ok: true; values: AgentEventsFormValues } | { ok: false; fieldErrors: AgentEventsFormFieldErrors; formError?: string } {
  const values: Partial<AgentEventsFormValues> = {};
  const fieldErrors: AgentEventsFormFieldErrors = {};
  const typeValue = readStringField(formData, "type");
  if (typeValue == null || typeValue === "") {
    fieldErrors["type"] = "Type is required.";
  }
  if (typeValue) {
    values.type = typeValue;
  }

  const payloadParsed = readJsonField(formData, "payload");
  if (payloadParsed.error) {
    fieldErrors["payload"] = payloadParsed.error;
  } else if (payloadParsed.value != null) {
    values.payload = payloadParsed.value;
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors, formError: "Please fix the highlighted fields and try again." };
  }

  return { ok: true, values: values as AgentEventsFormValues };
}

export const submitCreateAgentEventsForm = action(async (formData: FormData): Promise<AgentEventsFormResult> => {
  "use server";
  const parsed = parseAgentEventsFormData(formData);
  if (!parsed.ok) return parsed;
  try {
    await createAgentEvents(parsed.values as any);
    return { ok: true, message: "Agent event created successfully." };
  } catch (error) {
    return { ok: false, fieldErrors: {}, formError: error instanceof Error ? error.message : "Unable to save this record." };
  }
}, "agent_events.submit-create-form");

export const submitUpdateAgentEventsForm = action(async (id: string, formData: FormData): Promise<AgentEventsFormResult> => {
  "use server";
  const parsed = parseAgentEventsFormData(formData);
  if (!parsed.ok) return parsed;
  try {
    await updateAgentEvents({ id, ...parsed.values } as any);
    return { ok: true, message: "Agent event updated successfully." };
  } catch (error) {
    return { ok: false, fieldErrors: {}, formError: error instanceof Error ? error.message : "Unable to update this record." };
  }
}, "agent_events.submit-update-form");
