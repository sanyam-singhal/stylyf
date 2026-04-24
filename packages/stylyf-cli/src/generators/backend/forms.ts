import { resolve } from "node:path";
import type { AppIR, ResourceFieldIR, ResourceIR } from "../../compiler/generated-app.js";
import { writeGeneratedFile } from "../assets.js";

function camelCase(value: string) {
  return value
    .split(/[^a-zA-Z0-9]+/g)
    .filter(Boolean)
    .map((segment, index) =>
      index === 0 ? `${segment[0]?.toLowerCase() ?? ""}${segment.slice(1)}` : `${segment[0]?.toUpperCase() ?? ""}${segment.slice(1)}`,
    )
    .join("");
}

function pascalCase(value: string) {
  return value
    .split(/[^a-zA-Z0-9]+/g)
    .filter(Boolean)
    .map(segment => `${segment[0]?.toUpperCase() ?? ""}${segment.slice(1)}`)
    .join("");
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function humanize(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, match => match.toUpperCase());
}

function tableNameFor(resource: ResourceIR) {
  return resource.table ?? resource.name;
}

function backendUsesSupabase(app: AppIR) {
  return app.database?.provider === "supabase" || app.auth?.provider === "supabase";
}

function backendPropertyName(fieldName: string, app: AppIR) {
  return backendUsesSupabase(app) ? fieldName : camelCase(fieldName);
}

function formableFields(resource: ResourceIR) {
  const ownerField = resource.ownership?.ownerField ?? "owner_id";
  const workspaceField = resource.ownership?.workspaceField ?? "workspace_id";

  return (resource.fields ?? []).filter(field => !field.primaryKey && field.name !== ownerField && field.name !== workspaceField);
}

function fieldTypeLabel(field: ResourceFieldIR) {
  switch (field.type) {
    case "longtext":
      return "longtext";
    case "jsonb":
      return "json";
    case "integer":
      return "number";
    case "boolean":
      return "boolean";
    case "date":
      return "date";
    case "timestamp":
      return "datetime";
    case "enum":
      return "enum";
    default:
      return "text";
  }
}

function renderGeneratedFormsCatalog(app: AppIR) {
  const forms = (app.resources ?? []).map(resource => ({
    resource: resource.name,
    table: tableNameFor(resource),
    fields: formableFields(resource).map(field => ({
      name: field.name,
      label: humanize(field.name),
      type: fieldTypeLabel(field),
      required: field.required ?? false,
      enumValues: field.enumValues ?? [],
    })),
  }));

  return [
    "export const resourceFormDefinitions = " + JSON.stringify(forms, null, 2) + " as const;",
    "",
    "export const resourceFormsByName = Object.fromEntries(resourceFormDefinitions.map(form => [form.resource, form]));",
    "",
  ].join("\n");
}

function valueTypeForField(field: ResourceFieldIR) {
  switch (field.type) {
    case "integer":
      return "number";
    case "boolean":
      return "boolean";
    case "jsonb":
      return "Record<string, unknown>";
    case "date":
    case "timestamp":
      return "Date";
    case "enum":
      return field.enumValues && field.enumValues.length > 0 ? field.enumValues.map(value => JSON.stringify(value)).join(" | ") : "string";
    default:
      return "string";
  }
}

function formValuesTypeName(resource: ResourceIR) {
  return `${pascalCase(resource.name)}FormValues`;
}

function fieldErrorsTypeName(resource: ResourceIR) {
  return `${pascalCase(resource.name)}FormFieldErrors`;
}

function formResultTypeName(resource: ResourceIR) {
  return `${pascalCase(resource.name)}FormResult`;
}

function createFormActionName(resource: ResourceIR) {
  return `submitCreate${pascalCase(resource.name)}Form`;
}

function updateFormActionName(resource: ResourceIR) {
  return `submitUpdate${pascalCase(resource.name)}Form`;
}

function detailQueryName(resource: ResourceIR) {
  return `get${pascalCase(resource.name)}`;
}

function createActionName(resource: ResourceIR) {
  return `create${pascalCase(resource.name)}`;
}

function updateActionName(resource: ResourceIR) {
  return `update${pascalCase(resource.name)}`;
}

function serverActionPath(resource: ResourceIR, operation: "create" | "update") {
  return `~/lib/server/actions/${slugify(`${resource.name}-${operation}`)}`;
}

function serverQueryPath(resource: ResourceIR) {
  return `~/lib/server/queries/${slugify(`${resource.name}-detail`)}`;
}

function componentFilePath(resource: ResourceIR) {
  return `src/components/resource-forms/${slugify(resource.name)}-form.tsx`;
}

function serverFormFilePath(resource: ResourceIR) {
  return `src/lib/server/forms/${slugify(resource.name)}.ts`;
}

function renderFieldTypeLine(field: ResourceFieldIR, app: AppIR) {
  const propertyName = backendPropertyName(field.name, app);
  const type = valueTypeForField(field);
  const optional = field.required ? "" : "?";
  const nullable = field.required ? "" : " | null";
  return `  ${propertyName}${optional}: ${type}${nullable};`;
}

function renderParseBranch(field: ResourceFieldIR, app: AppIR) {
  const rawName = field.name;
  const propertyName = backendPropertyName(field.name, app);
  const label = humanize(field.name);
  const requiredCheck = field.required
    ? [
        `  if (${propertyName}Value == null || ${propertyName}Value === "") {`,
        `    fieldErrors[${JSON.stringify(rawName)}] = ${JSON.stringify(`${label} is required.`)};`,
        "  }",
      ].join("\n")
    : "";

  switch (field.type) {
    case "boolean":
      return [
        `  const ${propertyName}Value = readBooleanField(formData, ${JSON.stringify(rawName)});`,
        `  values.${propertyName} = ${propertyName}Value;`,
      ].join("\n");
    case "integer":
      return [
        `  const ${propertyName}Parsed = readIntegerField(formData, ${JSON.stringify(rawName)});`,
        `  if (${propertyName}Parsed.error) {`,
        `    fieldErrors[${JSON.stringify(rawName)}] = ${propertyName}Parsed.error;`,
        "  } else if (" + propertyName + "Parsed.value != null) {",
        `    values.${propertyName} = ${propertyName}Parsed.value;`,
        `  }${field.required ? " else {" : ""}`,
        field.required ? `    fieldErrors[${JSON.stringify(rawName)}] = ${JSON.stringify(`${label} is required.`)};` : "",
        field.required ? "  }" : "",
      ]
        .filter(Boolean)
        .join("\n");
    case "jsonb":
      return [
        `  const ${propertyName}Parsed = readJsonField(formData, ${JSON.stringify(rawName)});`,
        `  if (${propertyName}Parsed.error) {`,
        `    fieldErrors[${JSON.stringify(rawName)}] = ${propertyName}Parsed.error;`,
        "  } else if (" + propertyName + "Parsed.value != null) {",
        `    values.${propertyName} = ${propertyName}Parsed.value;`,
        `  }${field.required ? " else {" : ""}`,
        field.required ? `    fieldErrors[${JSON.stringify(rawName)}] = ${JSON.stringify(`${label} is required.`)};` : "",
        field.required ? "  }" : "",
      ]
        .filter(Boolean)
        .join("\n");
    case "date":
    case "timestamp":
      return [
        `  const ${propertyName}Parsed = readDateField(formData, ${JSON.stringify(rawName)});`,
        `  if (${propertyName}Parsed.error) {`,
        `    fieldErrors[${JSON.stringify(rawName)}] = ${propertyName}Parsed.error;`,
        "  } else if (" + propertyName + "Parsed.value != null) {",
        `    values.${propertyName} = ${propertyName}Parsed.value;`,
        `  }${field.required ? " else {" : ""}`,
        field.required ? `    fieldErrors[${JSON.stringify(rawName)}] = ${JSON.stringify(`${label} is required.`)};` : "",
        field.required ? "  }" : "",
      ]
        .filter(Boolean)
        .join("\n");
    case "enum":
      return [
        `  const ${propertyName}Value = readStringField(formData, ${JSON.stringify(rawName)});`,
        requiredCheck,
        `  if (${propertyName}Value) {`,
        `    if (!${JSON.stringify(field.enumValues ?? [])}.includes(${propertyName}Value)) {`,
        `      fieldErrors[${JSON.stringify(rawName)}] = ${JSON.stringify(`${label} must be one of the configured options.`)};`,
        "    } else {",
        `      values.${propertyName} = ${propertyName}Value as ${valueTypeForField(field)};`,
        "    }",
        "  }",
      ]
        .filter(Boolean)
        .join("\n");
    default:
      return [
        `  const ${propertyName}Value = readStringField(formData, ${JSON.stringify(rawName)});`,
        requiredCheck,
        `  if (${propertyName}Value) {`,
        `    values.${propertyName} = ${propertyName}Value;`,
        field.required
          ? "  }"
          : "  } else if (!fieldErrors[" +
              JSON.stringify(rawName) +
              "]) {\n" +
              `    values.${propertyName} = null;\n` +
              "  }",
      ]
        .filter(Boolean)
        .join("\n");
  }
}

function renderResourceFormServerModule(resource: ResourceIR, app: AppIR) {
  const fields = formableFields(resource);
  const valuesType = formValuesTypeName(resource);
  const fieldErrorsType = fieldErrorsTypeName(resource);
  const formResultType = formResultTypeName(resource);
  const createAction = createActionName(resource);
  const updateAction = updateActionName(resource);
  const createFormAction = createFormActionName(resource);
  const updateFormAction = updateFormActionName(resource);
  const resourceLabel = humanize(resource.name).replace(/s$/, "");

  const fieldTypeLines = fields.length > 0 ? fields.map(field => renderFieldTypeLine(field, app)).join("\n") : "  // No editable fields configured.";
  const parseBranches = fields.length > 0 ? fields.map(field => renderParseBranch(field, app)).join("\n\n") : "";

  return [
    'import { action } from "@solidjs/router";',
    `import { ${createAction} } from "${serverActionPath(resource, "create")}";`,
    `import { ${updateAction} } from "${serverActionPath(resource, "update")}";`,
    "",
    `export type ${valuesType} = {`,
    fieldTypeLines,
    "};",
    "",
    `export type ${fieldErrorsType} = Partial<Record<${fields.map(field => JSON.stringify(field.name)).join(" | ") || "never"}, string>>;`,
    "",
    `export type ${formResultType} =`,
    "  | { ok: true; message: string }",
    `  | { ok: false; fieldErrors: ${fieldErrorsType}; formError?: string };`,
    "",
    "function readStringField(formData: FormData, name: string) {",
    "  const value = formData.get(name);",
    '  return typeof value === "string" ? value.trim() : "";',
    "}",
    "",
    "function readBooleanField(formData: FormData, name: string) {",
    "  const value = formData.get(name);",
    '  return value === "on" || value === "true" || value === "1";',
    "}",
    "",
    "function readIntegerField(formData: FormData, name: string) {",
    "  const value = readStringField(formData, name);",
    "  if (!value) return { value: null as number | null };",
    "  const next = Number.parseInt(value, 10);",
    "  if (Number.isNaN(next)) {",
    '    return { value: null as number | null, error: "Enter a whole number." };',
    "  }",
    "  return { value: next };",
    "}",
    "",
    "function readJsonField(formData: FormData, name: string) {",
    "  const value = readStringField(formData, name);",
    "  if (!value) return { value: null as Record<string, unknown> | null };",
    "  try {",
    "    const parsed = JSON.parse(value) as Record<string, unknown>;",
    "    return { value: parsed };",
    "  } catch {",
    '    return { value: null as Record<string, unknown> | null, error: "Enter valid JSON." };',
    "  }",
    "}",
    "",
    "function readDateField(formData: FormData, name: string) {",
    "  const value = readStringField(formData, name);",
    "  if (!value) return { value: null as Date | null };",
    "  const parsed = new Date(value);",
    "  if (Number.isNaN(parsed.getTime())) {",
    '    return { value: null as Date | null, error: "Enter a valid date." };',
    "  }",
    "  return { value: parsed };",
    "}",
    "",
    `export function parse${pascalCase(resource.name)}FormData(formData: FormData): { ok: true; values: ${valuesType} } | { ok: false; fieldErrors: ${fieldErrorsType}; formError?: string } {`,
    `  const values: Partial<${valuesType}> = {};`,
    `  const fieldErrors: ${fieldErrorsType} = {};`,
    parseBranches,
    "",
    "  if (Object.keys(fieldErrors).length > 0) {",
    '    return { ok: false, fieldErrors, formError: "Please fix the highlighted fields and try again." };',
    "  }",
    "",
    `  return { ok: true, values: values as ${valuesType} };`,
    "}",
    "",
    `export const ${createFormAction} = action(async (formData: FormData): Promise<${formResultType}> => {`,
    '  "use server";',
    `  const parsed = parse${pascalCase(resource.name)}FormData(formData);`,
    "  if (!parsed.ok) return parsed;",
    "  try {",
    `    await ${createAction}(parsed.values as any);`,
    `    return { ok: true, message: ${JSON.stringify(`${resourceLabel} created successfully.`)} };`,
    "  } catch (error) {",
    '    return { ok: false, fieldErrors: {}, formError: error instanceof Error ? error.message : "Unable to save this record." };',
    "  }",
    `}, ${JSON.stringify(`${resource.name}.submit-create-form`)});`,
    "",
    `export const ${updateFormAction} = action(async (id: string, formData: FormData): Promise<${formResultType}> => {`,
    '  "use server";',
    `  const parsed = parse${pascalCase(resource.name)}FormData(formData);`,
    "  if (!parsed.ok) return parsed;",
    "  try {",
    `    await ${updateAction}({ id, ...parsed.values } as any);`,
    `    return { ok: true, message: ${JSON.stringify(`${resourceLabel} updated successfully.`)} };`,
    "  } catch (error) {",
    '    return { ok: false, fieldErrors: {}, formError: error instanceof Error ? error.message : "Unable to update this record." };',
    "  }",
    `}, ${JSON.stringify(`${resource.name}.submit-update-form`)});`,
    "",
  ].join("\n");
}

function renderFieldControl(resource: ResourceIR, field: ResourceFieldIR) {
  const rawName = JSON.stringify(field.name);
  const label = JSON.stringify(humanize(field.name));
  const errorRef = `props.fieldErrors[${rawName}]`;
  const initialRef = `props.initialValues?.[${rawName}]`;

  if (field.type === "enum") {
    return [
      "        <Select",
      `          name=${rawName}`,
      `          label={${label}}`,
      `          defaultValue={((${initialRef} ?? "") as string)}`,
      `          options={${JSON.stringify((field.enumValues ?? []).map(value => ({ label: humanize(value), value })))} }`,
      `          invalid={Boolean(${errorRef})}`,
      `          errorMessage={${errorRef}}`,
      field.required ? "          required" : "",
      `          placeholder=${JSON.stringify(`Select ${humanize(field.name).toLowerCase()}`)}`,
      "        />",
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (field.type === "longtext" || field.type === "jsonb") {
    const valueExpr = field.type === "jsonb" ? `formatJsonValue(${initialRef})` : `(((${initialRef} ?? "") as string))`;
    return [
      "        <TextArea",
      `          name=${rawName}`,
      `          label={${label}}`,
      `          defaultValue={${valueExpr}}`,
      `          invalid={Boolean(${errorRef})}`,
      `          errorMessage={${errorRef}}`,
      field.required ? "          required" : "",
      field.type === "jsonb" ? '          description="JSON object stored alongside this resource."' : "",
      "        />",
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (field.type === "boolean") {
    return [
      "        <Checkbox",
      `          name=${rawName}`,
      `          label={${label}}`,
      `          defaultChecked={Boolean(${initialRef})}`,
      `          invalid={Boolean(${errorRef})}`,
      `          errorMessage={${errorRef}}`,
      "        />",
    ].join("\n");
  }

  const inputType =
    field.type === "integer" ? '"number"' : field.type === "date" ? '"date"' : field.type === "timestamp" ? '"datetime-local"' : '"text"';
  const valueExpr =
    field.type === "date"
      ? `formatDateValue(${initialRef})`
      : field.type === "timestamp"
        ? `formatDateTimeValue(${initialRef})`
        : `(((${initialRef} ?? "") as string))`;

  return [
    "        <TextField",
    `          name=${rawName}`,
    `          label={${label}}`,
    `          type={${inputType}}`,
    `          defaultValue={${valueExpr}}`,
    `          invalid={Boolean(${errorRef})}`,
    `          errorMessage={${errorRef}}`,
    field.required ? "          required" : "",
    field.type === "integer" ? '          inputMode="numeric"' : "",
    "        />",
  ]
    .filter(Boolean)
    .join("\n");
}

function renderResourceFormComponent(resource: ResourceIR, app: AppIR) {
  const fields = formableFields(resource);
  const componentName = `${pascalCase(resource.name)}Form`;
  const valuesType = formValuesTypeName(resource);
  const fieldErrorsType = fieldErrorsTypeName(resource);
  const createFormAction = createFormActionName(resource);
  const updateFormAction = updateFormActionName(resource);
  const detailQuery = detailQueryName(resource);
  const detailImportPath = serverQueryPath(resource);
  const serverFormImportPath = `~/lib/server/forms/${slugify(resource.name)}`;
  const resourceLabel = humanize(resource.name).replace(/s$/, "");
  const usesTextField = fields.some(field => !["longtext", "jsonb", "enum", "boolean"].includes(field.type));
  const usesTextArea = fields.some(field => field.type === "longtext" || field.type === "jsonb");
  const usesSelect = fields.some(field => field.type === "enum");
  const usesCheckbox = fields.some(field => field.type === "boolean");
  const normalizeAssignments =
    fields.length > 0
      ? fields
          .map(field => {
            const inputKey = JSON.stringify(field.name);
            const recordKey = JSON.stringify(backendPropertyName(field.name, app));
            if (field.type === "jsonb") {
              return `    ${inputKey}: record?.[${recordKey}] ?? null,`;
            }
            return `    ${inputKey}: record?.[${recordKey}] ?? ${field.type === "boolean" ? "false" : '""'},`;
          })
          .join("\n")
      : "";
  const fieldControls =
    fields.length > 0
      ? fields.map(field => renderFieldControl(resource, field)).join("\n\n")
      : `        <div class="rounded-[var(--radius-lg)] border border-dashed border-border/70 bg-muted-soft px-[var(--space-5)] py-[var(--space-4)] text-sm text-muted-foreground">\n          No editable fields are configured for ${resourceLabel.toLowerCase()} yet.\n        </div>`;

  return [
    'import { createAsync, useSubmission } from "@solidjs/router";',
    'import { Show } from "solid-js";',
    usesCheckbox ? 'import { Checkbox } from "~/components/registry/form-inputs/checkbox";' : "",
    usesSelect ? 'import { Select } from "~/components/registry/form-inputs/select";' : "",
    usesTextArea ? 'import { TextArea } from "~/components/registry/form-inputs/text-area";' : "",
    usesTextField ? 'import { TextField } from "~/components/registry/form-inputs/text-field";' : "",
    'import { Button } from "~/components/registry/actions-navigation/button";',
    `import { ${detailQuery} } from "${detailImportPath}";`,
    `import { ${createFormAction}, ${updateFormAction}, type ${fieldErrorsType} } from "${serverFormImportPath}";`,
    "",
    `type ${componentName}InitialValues = Partial<Record<string, unknown>>;`,
    `type ${pascalCase(resource.name)}Record = NonNullable<Awaited<ReturnType<typeof ${detailQuery}>>>;`,
    "",
    `export type ${componentName}Props = {`,
    '  mode: "create" | "edit";',
    "  resourceId?: string;",
    "  class?: string;",
    "};",
    "",
    "function formatDateValue(value: unknown) {",
    "  if (!value) return \"\";",
    "  const parsed = value instanceof Date ? value : new Date(String(value));",
    "  if (Number.isNaN(parsed.getTime())) return \"\";",
    "  return parsed.toISOString().slice(0, 10);",
    "}",
    "",
    "function formatDateTimeValue(value: unknown) {",
    "  if (!value) return \"\";",
    "  const parsed = value instanceof Date ? value : new Date(String(value));",
    "  if (Number.isNaN(parsed.getTime())) return \"\";",
    "  return parsed.toISOString().slice(0, 16);",
    "}",
    "",
    "function formatJsonValue(value: unknown) {",
    "  if (value == null) return \"\";",
    "  try {",
    "    return JSON.stringify(value, null, 2);",
    "  } catch {",
    "    return \"\";",
    "  }",
    "}",
    "",
    `function normalize${pascalCase(resource.name)}InitialValues(record?: ${pascalCase(resource.name)}Record | null): ${componentName}InitialValues {`,
    "  if (!record) return {};",
    "  return {",
    normalizeAssignments,
    "  };",
    "}",
    "",
    `function ${componentName}Fields(props: { initialValues?: ${componentName}InitialValues; fieldErrors: ${fieldErrorsType} }) {`,
    "  return (",
    '    <div class="space-y-[var(--space-5)]">',
    fieldControls,
    "    </div>",
    "  );",
    "}",
    "",
    `export function ${componentName}(props: ${componentName}Props) {`,
    `  const createSubmission = useSubmission(${createFormAction});`,
    `  const updateSubmission = useSubmission(${updateFormAction});`,
    "  const record = createAsync(async () => {",
    '    if (props.mode !== "edit" || !props.resourceId) return null;',
    `    return await ${detailQuery}(props.resourceId);`,
    "  });",
    "",
    '  const activeSubmission = () => (props.mode === "edit" ? updateSubmission : createSubmission);',
    "  const fieldErrors = () => {",
    "    const result = activeSubmission().result;",
    '    return result && !result.ok ? result.fieldErrors ?? {} : {};',
    "  };",
    "  const formError = () => {",
    "    const result = activeSubmission().result;",
    '    return result && !result.ok ? result.formError : undefined;',
    "  };",
    "  const successMessage = () => {",
    "    const result = activeSubmission().result;",
    '    return result && result.ok ? result.message : undefined;',
    "  };",
    "",
    "  return (",
    '    <div class={props.class ?? "space-y-[var(--space-5)]"}>',
    '      <Show when={props.mode === "create"} fallback={',
    '        <Show when={props.resourceId} fallback={<div class="rounded-[var(--radius-lg)] border border-destructive/25 bg-destructive/8 px-[var(--space-5)] py-[var(--space-4)] text-sm text-destructive">This edit route requires a record id.</div>}>',
    '          <Show when={record() !== undefined} fallback={<div class="rounded-[var(--radius-lg)] border border-border/70 bg-muted-soft px-[var(--space-5)] py-[var(--space-4)] text-sm text-muted-foreground">Loading current values...</div>}>',
    '            <Show when={record()} fallback={<div class="rounded-[var(--radius-lg)] border border-destructive/25 bg-destructive/8 px-[var(--space-5)] py-[var(--space-4)] text-sm text-destructive">We could not load this record for editing.</div>}>',
    '              <form action={props.resourceId ? ' + updateFormAction + '.with(props.resourceId) : ' + updateFormAction + '.with("")} method="post" class="space-y-[var(--space-5)]">',
    '                <Show when={formError()}><div class="rounded-[var(--radius-lg)] border border-destructive/25 bg-destructive/8 px-[var(--space-5)] py-[var(--space-4)] text-sm text-destructive">{formError()}</div></Show>',
    '                <Show when={successMessage()}><div class="rounded-[var(--radius-lg)] border border-primary/22 bg-primary/8 px-[var(--space-5)] py-[var(--space-4)] text-sm text-foreground">{successMessage()}</div></Show>',
    `                <${componentName}Fields initialValues={normalize${pascalCase(resource.name)}InitialValues(record())} fieldErrors={fieldErrors()} />`,
    '                <div class="flex justify-end">',
    '                  <Button type="submit" loading={activeSubmission().pending}>Save changes</Button>',
    "                </div>",
    "              </form>",
    "            </Show>",
    "          </Show>",
    "        </Show>",
    "      }>",
    '        <form action={' + createFormAction + '} method="post" class="space-y-[var(--space-5)]">',
    '          <Show when={formError()}><div class="rounded-[var(--radius-lg)] border border-destructive/25 bg-destructive/8 px-[var(--space-5)] py-[var(--space-4)] text-sm text-destructive">{formError()}</div></Show>',
    '          <Show when={successMessage()}><div class="rounded-[var(--radius-lg)] border border-primary/22 bg-primary/8 px-[var(--space-5)] py-[var(--space-4)] text-sm text-foreground">{successMessage()}</div></Show>',
    `          <${componentName}Fields fieldErrors={fieldErrors()} />`,
    '          <div class="flex justify-end">',
    `            <Button type="submit" loading={activeSubmission().pending}>Create ${resourceLabel}</Button>`,
    "          </div>",
    "        </form>",
    "      </Show>",
    "    </div>",
    "  );",
    "}",
    "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function hasGeneratedForms(app: AppIR) {
  return (app.resources ?? []).some(resource => formableFields(resource).length >= 0);
}

export async function writeGeneratedResourceForms(app: AppIR, targetRoot: string) {
  const resources = app.resources ?? [];

  if (resources.length === 0) {
    return 0;
  }

  await writeGeneratedFile(resolve(targetRoot, "src/lib/forms.ts"), renderGeneratedFormsCatalog(app));

  for (const resource of resources) {
    await writeGeneratedFile(resolve(targetRoot, serverFormFilePath(resource)), renderResourceFormServerModule(resource, app));
    await writeGeneratedFile(resolve(targetRoot, componentFilePath(resource)), renderResourceFormComponent(resource, app));
  }

  return resources.length;
}
