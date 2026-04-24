import { validateSpecV04 } from "./validate.js";

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function keyByName(value: unknown) {
  return isRecord(value) && typeof value.name === "string" ? value.name : null;
}

function keySurface(value: unknown) {
  if (!isRecord(value)) return null;
  if (typeof value.path === "string") return value.path;
  const kind = typeof value.kind === "string" ? value.kind : "surface";
  const object = typeof value.object === "string" ? value.object : "";
  const name = typeof value.name === "string" ? value.name : "";
  return `${kind}:${object}:${name}`;
}

function keyRoute(value: unknown) {
  return isRecord(value) && typeof value.path === "string" ? value.path : null;
}

function keyApi(value: unknown) {
  if (!isRecord(value) || typeof value.path !== "string") return null;
  const method = typeof value.method === "string" ? value.method : "GET";
  return `${method}:${value.path}`;
}

function keyRelation(value: unknown) {
  if (!isRecord(value) || typeof value.target !== "string" || typeof value.kind !== "string") return null;
  return `${value.kind}:${value.target}:${typeof value.field === "string" ? value.field : ""}:${typeof value.through === "string" ? value.through : ""}`;
}

function keyTransition(value: unknown) {
  return keyByName(value);
}

function keyColumn(value: unknown) {
  return isRecord(value) && typeof value.name === "string" ? value.name : null;
}

function mergeKeyedArray(
  base: unknown,
  patch: unknown,
  keyFor: (value: unknown) => string | null,
  mergeItem: (baseItem: unknown, patchItem: unknown) => unknown = mergeValue,
) {
  const baseItems = Array.isArray(base) ? base : [];
  const patchItems = Array.isArray(patch) ? patch : [];
  const output: unknown[] = [];
  const positions = new Map<string, number>();

  for (const item of baseItems) {
    const key = keyFor(item);
    if (key) {
      positions.set(key, output.length);
    }
    output.push(item);
  }

  for (const item of patchItems) {
    const key = keyFor(item);
    if (!key || !positions.has(key)) {
      if (key) positions.set(key, output.length);
      output.push(item);
      continue;
    }

    const index = positions.get(key) ?? output.length;
    output[index] = mergeItem(output[index], item);
  }

  return output;
}

function mergeObjectFields(base: JsonRecord, patch: JsonRecord) {
  let merged = mergeRecords(base, patch);
  if ("fields" in patch) {
    merged = { ...merged, fields: mergeKeyedArray(base.fields, patch.fields, keyByName) };
  }
  if ("media" in patch) {
    merged = { ...merged, media: mergeKeyedArray(base.media, patch.media, keyByName) };
  }
  if ("relations" in patch) {
    merged = { ...merged, relations: mergeKeyedArray(base.relations, patch.relations, keyRelation) };
  }
  return merged;
}

function mergeFlow(base: JsonRecord, patch: JsonRecord) {
  const merged = mergeRecords(base, patch);
  if ("transitions" in patch) {
    return { ...merged, transitions: mergeKeyedArray(base.transitions, patch.transitions, keyTransition) };
  }
  return merged;
}

function mergeDatabase(base: unknown, patch: unknown) {
  if (!isRecord(base) || !isRecord(patch)) {
    return patch ?? base;
  }
  const merged = mergeRecords(base, patch);
  if ("schema" in patch) {
    const tables = mergeKeyedArray(base.schema, patch.schema, value => (isRecord(value) && typeof value.table === "string" ? value.table : null));
    return {
      ...merged,
      schema: tables.map(table => {
        const baseTable = Array.isArray(base.schema) ? base.schema.find(item => isRecord(item) && isRecord(table) && item.table === table.table) : undefined;
        return isRecord(baseTable) && isRecord(table) && "columns" in table
          ? { ...table, columns: mergeKeyedArray(baseTable.columns, table.columns, keyColumn) }
          : table;
      }),
    };
  }
  return merged;
}

function mergeEnv(base: unknown, patch: unknown) {
  if (!isRecord(base) || !isRecord(patch)) {
    return patch ?? base;
  }
  const merged = mergeRecords(base, patch);
  if ("extras" in patch) {
    return { ...merged, extras: mergeKeyedArray(base.extras, patch.extras, keyByName) };
  }
  return merged;
}

function mergeValue(base: unknown, patch: unknown): unknown {
  if (isRecord(base) && isRecord(patch)) {
    return mergeRecords(base, patch);
  }
  return patch;
}

function mergeRecords(base: JsonRecord, patch: JsonRecord): JsonRecord {
  const output: JsonRecord = { ...base };

  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) {
      continue;
    }

    if (key === "version") {
      output.version = value;
      continue;
    }

    if (key === "objects") {
      output.objects = mergeKeyedArray(output.objects, value, keyByName, (baseItem, patchItem) =>
        isRecord(baseItem) && isRecord(patchItem) ? mergeObjectFields(baseItem, patchItem) : mergeValue(baseItem, patchItem),
      );
      continue;
    }

    if (key === "flows") {
      output.flows = mergeKeyedArray(output.flows, value, keyByName, (baseItem, patchItem) =>
        isRecord(baseItem) && isRecord(patchItem) ? mergeFlow(baseItem, patchItem) : mergeValue(baseItem, patchItem),
      );
      continue;
    }

    if (key === "actors") {
      output.actors = mergeKeyedArray(output.actors, value, keyByName);
      continue;
    }

    if (key === "surfaces") {
      output.surfaces = mergeKeyedArray(output.surfaces, value, keySurface);
      continue;
    }

    if (key === "routes") {
      output.routes = mergeKeyedArray(output.routes, value, keyRoute);
      continue;
    }

    if (key === "apis") {
      output.apis = mergeKeyedArray(output.apis, value, keyApi);
      continue;
    }

    if (key === "server") {
      output.server = mergeKeyedArray(output.server, value, keyByName);
      continue;
    }

    if (key === "database") {
      output.database = mergeDatabase(output.database, value);
      continue;
    }

    if (key === "env") {
      output.env = mergeEnv(output.env, value);
      continue;
    }

    output[key] = mergeValue(output[key], value);
  }

  return output;
}

export function composeSpecFragments(base: unknown, fragments: unknown[]) {
  if (!isRecord(base)) {
    throw new Error("Base spec must be a JSON object.");
  }

  const composed = fragments.reduce<JsonRecord>((current, fragment, index) => {
    if (!isRecord(fragment)) {
      throw new Error(`Spec fragment ${index + 1} must be a JSON object.`);
    }
    return mergeRecords(current, fragment);
  }, base);

  return validateSpecV04(composed);
}
