import { createAsync, useSubmission } from "@solidjs/router";
import { Show } from "solid-js";
import { Select } from "~/components/registry/form-inputs/select";
import { TextArea } from "~/components/registry/form-inputs/text-area";
import { TextField } from "~/components/registry/form-inputs/text-field";
import { Button } from "~/components/registry/actions-navigation/button";
import { getProjects } from "~/lib/server/queries/projects-detail";
import { submitCreateProjectsForm, submitUpdateProjectsForm, type ProjectsFormFieldErrors } from "~/lib/server/forms/projects";
type ProjectsFormInitialValues = Partial<Record<string, unknown>>;
type ProjectsRecord = NonNullable<Awaited<ReturnType<typeof getProjects>>>;
export type ProjectsFormProps = {
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
function normalizeProjectsInitialValues(record?: ProjectsRecord | null): ProjectsFormInitialValues {
  if (!record) return {};
  return {
    "name": record?.["name"] ?? "",
    "slug": record?.["slug"] ?? "",
    "status": record?.["status"] ?? "",
    "summary": record?.["summary"] ?? "",
    "workspacePath": record?.["workspacePath"] ?? "",
    "previewUrl": record?.["previewUrl"] ?? "",
    "githubRepoFullName": record?.["githubRepoFullName"] ?? "",
    "lastPushedSha": record?.["lastPushedSha"] ?? "",
  };
}
function ProjectsFormFields(props: { initialValues?: ProjectsFormInitialValues; fieldErrors: ProjectsFormFieldErrors; mode: "create" | "edit" }) {
  return (
    <div class="space-y-[var(--space-5)]">
      <Show when={props.mode === "create"} fallback={
        <>
          <div class="grid gap-[var(--space-5)] md:grid-cols-2">
            <TextField
              name="name"
              label={"Project name"}
              type={"text"}
              defaultValue={(((props.initialValues?.["name"] ?? "") as string))}
              invalid={Boolean(props.fieldErrors["name"])}
              errorMessage={props.fieldErrors["name"]}
              description="Human-readable name for the app idea."
              required
            />

            <TextField
              name="slug"
              label={"Slug"}
              type={"text"}
              defaultValue={(((props.initialValues?.["slug"] ?? "") as string))}
              invalid={Boolean(props.fieldErrors["slug"])}
              errorMessage={props.fieldErrors["slug"]}
              description="Used for workspace and repository naming."
              required
            />
          </div>

          <Select
            name="status"
            label={"Status"}
            defaultValue={((props.initialValues?.["status"] ?? "") as string)}
            options={[{"label":"Draft","value":"draft"},{"label":"Generating","value":"generating"},{"label":"Ready","value":"ready"},{"label":"Error","value":"error"},{"label":"Archived","value":"archived"}] }
            invalid={Boolean(props.fieldErrors["status"])}
            errorMessage={props.fieldErrors["status"]}
            required
            placeholder="Select status"
          />

          <TextArea
            name="summary"
            label={"Product brief"}
            defaultValue={(((props.initialValues?.["summary"] ?? "") as string))}
            invalid={Boolean(props.fieldErrors["summary"])}
            errorMessage={props.fieldErrors["summary"]}
            description="Describe the user, app type, core workflow, visual mood, and first version scope."
            minRows={6}
          />
        </>
      }>
        <TextField
          name="name"
          label={"Project name"}
          type={"text"}
          defaultValue={(((props.initialValues?.["name"] ?? "") as string))}
          invalid={Boolean(props.fieldErrors["name"])}
          errorMessage={props.fieldErrors["name"]}
          description="Give the app a simple working title. Stylyf will create the workspace, repo, specs, and agent instructions."
          required
        />
      </Show>

      <Show when={props.mode === "edit"}>
        <div class="rounded-[var(--radius-2xl)] border border-border/70 bg-muted-soft p-[var(--space-5)]">
          <div class="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Workspace internals</div>
          <div class="grid gap-[var(--space-5)] md:grid-cols-2">
        <TextField
          name="workspacePath"
          label={"Workspace Path"}
          type={"text"}
          defaultValue={(((props.initialValues?.["workspacePath"] ?? "") as string))}
          invalid={Boolean(props.fieldErrors["workspacePath"])}
          errorMessage={props.fieldErrors["workspacePath"]}
        />

        <TextField
          name="previewUrl"
          label={"Preview Url"}
          type={"text"}
          defaultValue={(((props.initialValues?.["previewUrl"] ?? "") as string))}
          invalid={Boolean(props.fieldErrors["previewUrl"])}
          errorMessage={props.fieldErrors["previewUrl"]}
        />

        <TextField
          name="githubRepoFullName"
          label={"Github Repo Full Name"}
          type={"text"}
          defaultValue={(((props.initialValues?.["githubRepoFullName"] ?? "") as string))}
          invalid={Boolean(props.fieldErrors["githubRepoFullName"])}
          errorMessage={props.fieldErrors["githubRepoFullName"]}
        />

        <TextField
          name="lastPushedSha"
          label={"Last Pushed Sha"}
          type={"text"}
          defaultValue={(((props.initialValues?.["lastPushedSha"] ?? "") as string))}
          invalid={Boolean(props.fieldErrors["lastPushedSha"])}
          errorMessage={props.fieldErrors["lastPushedSha"]}
        />
          </div>
        </div>
      </Show>
    </div>
  );
}
export function ProjectsForm(props: ProjectsFormProps) {
  const createSubmission = useSubmission(submitCreateProjectsForm);
  const updateSubmission = useSubmission(submitUpdateProjectsForm);
  const record = createAsync(async () => {
    if (props.mode !== "edit" || !props.resourceId) return null;
    return await getProjects(props.resourceId);
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
              <form action={props.resourceId ? submitUpdateProjectsForm.with(props.resourceId) : submitUpdateProjectsForm.with("")} method="post" class="space-y-[var(--space-5)]">
                <Show when={formError()}><div class="rounded-[var(--radius-lg)] border border-destructive/25 bg-destructive/8 px-[var(--space-5)] py-[var(--space-4)] text-sm text-destructive">{formError()}</div></Show>
                <Show when={successMessage()}><div class="rounded-[var(--radius-lg)] border border-primary/22 bg-primary/8 px-[var(--space-5)] py-[var(--space-4)] text-sm text-foreground">{successMessage()}</div></Show>
                <ProjectsFormFields initialValues={normalizeProjectsInitialValues(record())} fieldErrors={fieldErrors()} mode="edit" />
                <div class="flex justify-end">
                  <Button type="submit" loading={activeSubmission().pending}>Save changes</Button>
                </div>
              </form>
            </Show>
          </Show>
        </Show>
      }>
        <form action={submitCreateProjectsForm} method="post" class="space-y-[var(--space-5)]">
          <Show when={formError()}><div class="rounded-[var(--radius-lg)] border border-destructive/25 bg-destructive/8 px-[var(--space-5)] py-[var(--space-4)] text-sm text-destructive">{formError()}</div></Show>
          <Show when={successMessage()}><div class="rounded-[var(--radius-lg)] border border-primary/22 bg-primary/8 px-[var(--space-5)] py-[var(--space-4)] text-sm text-foreground">{successMessage()}</div></Show>
          <ProjectsFormFields fieldErrors={fieldErrors()} mode="create" />
          <div class="flex justify-end">
            <Button type="submit" loading={activeSubmission().pending}>Create Project</Button>
          </div>
        </form>
      </Show>
    </div>
  );
}
