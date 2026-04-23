import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type {
  ApiRouteIR,
  AppIR,
  AuthIR,
  AuthProtectionIR,
  DatabaseIR,
  DatabaseSchemaIR,
  EnvIR,
  EnvVarIR,
  ResourceAttachmentIR,
  ResourceFieldIR,
  ResourceIR,
  ResourceRelationIR,
  RouteIR,
  ServerModuleIR,
  StorageIR,
  ThemeIR,
  WorkflowIR,
  WorkflowTransitionIR,
} from "./types.js";
import { assertValidAppIr } from "./validate.js";

type JsonRecord = Record<string, unknown>;

export type AppIrFragment = JsonRecord;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function mergeObject<T extends JsonRecord>(left: T | undefined, right: T | undefined): T | undefined {
  if (!left) return right ? ({ ...right } as T) : undefined;
  if (!right) return { ...left } as T;
  return { ...left, ...right } as T;
}

function uniqueOrdered(values: string[]) {
  const seen = new Set<string>();
  const ordered: string[] = [];

  for (const value of values) {
    if (!seen.has(value)) {
      seen.add(value);
      ordered.push(value);
    }
  }

  return ordered;
}

function mergeByKey<T>(
  left: T[] | undefined,
  right: T[] | undefined,
  keyOf: (item: T) => string,
  mergeItem: (leftItem: T, rightItem: T) => T,
): T[] | undefined {
  if (!left?.length && !right?.length) return undefined;
  if (!left?.length) return right ? [...right] : undefined;
  if (!right?.length) return [...left];

  const merged = [...left];
  const positions = new Map<string, number>();

  merged.forEach((item, index) => {
    positions.set(keyOf(item), index);
  });

  for (const item of right) {
    const key = keyOf(item);
    const existingIndex = positions.get(key);
    if (existingIndex === undefined) {
      positions.set(key, merged.length);
      merged.push(item);
      continue;
    }

    merged[existingIndex] = mergeItem(merged[existingIndex], item);
  }

  return merged;
}

function mergeTheme(left: ThemeIR | undefined, right: ThemeIR | undefined): ThemeIR | undefined {
  if (!left) return right ? { ...right, fonts: { ...right.fonts } } : undefined;
  if (!right) return { ...left, fonts: { ...left.fonts } };
  return {
    ...left,
    ...right,
    fonts: {
      ...left.fonts,
      ...right.fonts,
    },
  };
}

function mergeEnv(left: EnvIR | undefined, right: EnvIR | undefined): EnvIR | undefined {
  if (!left) return right ? { ...right, extras: right.extras ? [...right.extras] : undefined } : undefined;
  if (!right) return { ...left, extras: left.extras ? [...left.extras] : undefined };
  return {
    ...left,
    ...right,
    extras: mergeByKey(left.extras, right.extras, entry => entry.name, (existing, incoming) => ({ ...existing, ...incoming } satisfies EnvVarIR)),
  };
}

function mergeDatabaseTable(left: DatabaseSchemaIR, right: DatabaseSchemaIR): DatabaseSchemaIR {
  return {
    ...left,
    ...right,
    columns: mergeByKey(
      left.columns,
      right.columns,
      column => column.name,
      (existing, incoming) => ({ ...existing, ...incoming }),
    ) ?? [],
  };
}

function mergeDatabase(left: DatabaseIR | undefined, right: DatabaseIR | undefined): DatabaseIR | undefined {
  if (!left) return right ? { ...right, schema: right.schema ? [...right.schema] : undefined } : undefined;
  if (!right) return { ...left, schema: left.schema ? [...left.schema] : undefined };
  return {
    ...left,
    ...right,
    schema: mergeByKey(left.schema, right.schema, table => table.table, mergeDatabaseTable),
  };
}

function mergeResourceField(left: ResourceFieldIR, right: ResourceFieldIR): ResourceFieldIR {
  return { ...left, ...right };
}

function relationKey(relation: ResourceRelationIR) {
  return [relation.target, relation.kind, relation.field ?? "", relation.through ?? ""].join("|");
}

function attachmentKey(attachment: ResourceAttachmentIR) {
  return attachment.name;
}

function mergeResource(left: ResourceIR, right: ResourceIR): ResourceIR {
  return {
    ...left,
    ...right,
    ownership: mergeObject(left.ownership, right.ownership),
    access: mergeObject(left.access, right.access),
    fields: mergeByKey(left.fields, right.fields, field => field.name, mergeResourceField),
    relations: mergeByKey(left.relations, right.relations, relationKey, (existing, incoming) => ({ ...existing, ...incoming })),
    attachments: mergeByKey(left.attachments, right.attachments, attachmentKey, (existing, incoming) => ({ ...existing, ...incoming })),
  };
}

function mergeWorkflowTransition(left: WorkflowTransitionIR, right: WorkflowTransitionIR): WorkflowTransitionIR {
  return {
    ...left,
    ...right,
    emits: uniqueOrdered([...(left.emits ?? []), ...(right.emits ?? [])]),
    notifies: uniqueOrdered([...(left.notifies ?? []), ...(right.notifies ?? [])]) as WorkflowTransitionIR["notifies"],
  };
}

function mergeWorkflow(left: WorkflowIR, right: WorkflowIR): WorkflowIR {
  return {
    ...left,
    ...right,
    states: uniqueOrdered([...(left.states ?? []), ...(right.states ?? [])]),
    transitions:
      mergeByKey(left.transitions, right.transitions, transition => transition.name, mergeWorkflowTransition) ?? [],
  };
}

function mergeAuth(left: AuthIR | undefined, right: AuthIR | undefined): AuthIR | undefined {
  if (!left) {
    return right
      ? {
          ...right,
          features: right.features ? { ...right.features } : undefined,
          protect: right.protect ? [...right.protect] : undefined,
        }
      : undefined;
  }
  if (!right) {
    return {
      ...left,
      features: left.features ? { ...left.features } : undefined,
      protect: left.protect ? [...left.protect] : undefined,
    };
  }
  return {
    ...left,
    ...right,
    features: mergeObject(left.features, right.features),
    protect: mergeByKey(
      left.protect,
      right.protect,
      entry => `${entry.kind}|${entry.target}`,
      (existing, incoming) => ({ ...existing, ...incoming } satisfies AuthProtectionIR),
    ),
  };
}

function mergeStorage(left: StorageIR | undefined, right: StorageIR | undefined): StorageIR | undefined {
  return mergeObject(left, right) as StorageIR | undefined;
}

function mergeRoute(_left: RouteIR, right: RouteIR): RouteIR {
  return { ...right, sections: [...right.sections] };
}

function mergeServerModule(left: ServerModuleIR, right: ServerModuleIR): ServerModuleIR {
  return { ...left, ...right };
}

function mergeApiRoute(left: ApiRouteIR, right: ApiRouteIR): ApiRouteIR {
  return { ...left, ...right };
}

function apiRouteKey(route: ApiRouteIR) {
  return `${route.method}|${route.path}`;
}

function routeKey(route: RouteIR) {
  return route.path;
}

function serverModuleKey(module: ServerModuleIR) {
  return module.name;
}

export function mergeAppIrFragments(fragments: AppIrFragment[]): AppIR {
  const merged = fragments.reduce<Partial<AppIR>>(
    (current, fragment) => {
      const next = fragment as Partial<AppIR>;

      return {
        ...current,
        ...next,
        name: next.name ?? current.name,
        shell: next.shell ?? current.shell,
        theme: mergeTheme(current.theme, next.theme),
        env: mergeEnv(current.env, next.env),
        database: mergeDatabase(current.database, next.database),
        resources: mergeByKey(current.resources, next.resources, resource => resource.name, mergeResource),
        workflows: mergeByKey(current.workflows, next.workflows, workflow => workflow.name, mergeWorkflow),
        auth: mergeAuth(current.auth, next.auth),
        storage: mergeStorage(current.storage, next.storage),
        routes: mergeByKey(current.routes, next.routes, routeKey, mergeRoute) ?? [],
        apis: mergeByKey(current.apis, next.apis, apiRouteKey, mergeApiRoute),
        server: mergeByKey(current.server, next.server, serverModuleKey, mergeServerModule),
      };
    },
    {},
  );

  assertValidAppIr(merged);
  return merged;
}

export async function readIrFragment(irPath: string): Promise<AppIrFragment> {
  const resolved = resolve(process.cwd(), irPath);
  const raw = await readFile(resolved, "utf8");
  const parsed = JSON.parse(raw) as unknown;

  if (!isRecord(parsed)) {
    throw new Error(`IR fragment must be a JSON object: ${resolved}`);
  }

  return parsed;
}

export async function composeAppIrFromPaths(irPaths: string[]) {
  if (irPaths.length === 0) {
    throw new Error("At least one --ir <path> input is required");
  }

  const fragments = await Promise.all(irPaths.map(readIrFragment));
  const app = mergeAppIrFragments(fragments);

  return {
    app,
    fragments,
  };
}
