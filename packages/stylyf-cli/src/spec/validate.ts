import {
  actorKinds,
  apiRouteMethods,
  apiRouteTypes,
  appKinds,
  appShells,
  authAccessLevels,
  attachmentKinds,
  audiences,
  backendModes,
  databaseColumnTypes,
  densities,
  envExposures,
  fieldTypes,
  flowKinds,
  layoutNodes,
  mediaModes,
  ownershipModels,
  pageShells,
  portableDatabases,
  radii,
  relationKinds,
  resourceAccessPresets,
  serverModuleTypes,
  spacings,
  surfaceKinds,
  themeModes,
  themes,
  visibilityModes,
  workflowNotificationAudiences,
} from "./schema.js";
import type { StylyfSpecV04 } from "./types.js";

type ValidationContext = {
  errors: string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, allowed: readonly string[], path: string, context: ValidationContext) {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) {
      context.errors.push(`${path}.${key} is not supported in Stylyf v0.4 specs.`);
    }
  }
}

function requireString(value: Record<string, unknown>, key: string, path: string, context: ValidationContext) {
  if (typeof value[key] !== "string" || value[key] === "") {
    context.errors.push(`${path}.${key} must be a non-empty string.`);
  }
}

function optionalString(value: Record<string, unknown>, key: string, path: string, context: ValidationContext) {
  if (value[key] !== undefined && typeof value[key] !== "string") {
    context.errors.push(`${path}.${key} must be a string when provided.`);
  }
}

function optionalBoolean(value: Record<string, unknown>, key: string, path: string, context: ValidationContext) {
  if (value[key] !== undefined && typeof value[key] !== "boolean") {
    context.errors.push(`${path}.${key} must be a boolean when provided.`);
  }
}

function enumValue(value: unknown, allowed: readonly string[], path: string, context: ValidationContext) {
  if (typeof value !== "string" || !allowed.includes(value)) {
    context.errors.push(`${path} must be one of: ${allowed.join(", ")}.`);
  }
}

function optionalEnum(value: Record<string, unknown>, key: string, allowed: readonly string[], path: string, context: ValidationContext) {
  if (value[key] !== undefined) {
    enumValue(value[key], allowed, `${path}.${key}`, context);
  }
}

function optionalStringArray(value: Record<string, unknown>, key: string, path: string, context: ValidationContext) {
  const item = value[key];
  if (item === undefined) {
    return;
  }
  if (!Array.isArray(item) || item.some(entry => typeof entry !== "string")) {
    context.errors.push(`${path}.${key} must be an array of strings when provided.`);
  }
}

function optionalEnumArray(value: Record<string, unknown>, key: string, allowed: readonly string[], path: string, context: ValidationContext) {
  const item = value[key];
  if (item === undefined) {
    return;
  }
  if (!Array.isArray(item) || item.some(entry => typeof entry !== "string" || !allowed.includes(entry))) {
    context.errors.push(`${path}.${key} must be an array containing only: ${allowed.join(", ")}.`);
  }
}

function optionalRecord(value: Record<string, unknown>, key: string, path: string, context: ValidationContext) {
  const item = value[key];
  if (item !== undefined && !isRecord(item)) {
    context.errors.push(`${path}.${key} must be an object when provided.`);
  }
}

function validateLayoutProps(value: unknown, path: string, context: ValidationContext) {
  if (value === undefined) {
    return;
  }
  if (!isRecord(value)) {
    context.errors.push(`${path} must be an object when provided.`);
    return;
  }
  for (const [key, item] of Object.entries(value)) {
    if (typeof item !== "string" && typeof item !== "number" && typeof item !== "boolean") {
      context.errors.push(`${path}.${key} must be a string, number, or boolean.`);
    }
  }
}

function validateComponentNode(value: Record<string, unknown>, path: string, context: ValidationContext) {
  hasOnlyKeys(value, ["component", "variant", "props", "items"], path, context);
  requireString(value, "component", path, context);
  optionalString(value, "variant", path, context);
  optionalRecord(value, "props", path, context);

  if (value.items !== undefined) {
    if (!Array.isArray(value.items) || value.items.some(item => !isRecord(item))) {
      context.errors.push(`${path}.items must be an array of objects when provided.`);
    }
  }
}

function validateCompositionNode(value: unknown, path: string, context: ValidationContext) {
  if (typeof value === "string") {
    return;
  }
  if (!isRecord(value)) {
    context.errors.push(`${path} must be a component reference, layout node, or string component id.`);
    return;
  }
  if (typeof value.component === "string") {
    validateComponentNode(value, path, context);
    return;
  }
  if (typeof value.layout === "string") {
    hasOnlyKeys(value, ["layout", "props", "children"], path, context);
    enumValue(value.layout, layoutNodes, `${path}.layout`, context);
    validateLayoutProps(value.props, `${path}.props`, context);
    if (value.children !== undefined) {
      validateCompositionChildren(value.children, `${path}.children`, context);
    }
    return;
  }
  context.errors.push(`${path} must include either a component string or a layout string.`);
}

function validateCompositionChildren(value: unknown, path: string, context: ValidationContext) {
  if (!Array.isArray(value)) {
    context.errors.push(`${path} must be an array.`);
    return;
  }
  value.forEach((child, index) => validateCompositionNode(child, `${path}[${index}]`, context));
}

function validateSections(value: unknown, path: string, context: ValidationContext) {
  if (value === undefined) {
    return;
  }
  if (!Array.isArray(value)) {
    context.errors.push(`${path} must be an array when provided.`);
    return;
  }
  value.forEach((section, index) => {
    const sectionPath = `${path}[${index}]`;
    if (!isRecord(section)) {
      context.errors.push(`${sectionPath} must be an object.`);
      return;
    }
    hasOnlyKeys(section, ["id", "layout", "props", "children"], sectionPath, context);
    optionalString(section, "id", sectionPath, context);
    enumValue(section.layout, layoutNodes, `${sectionPath}.layout`, context);
    validateLayoutProps(section.props, `${sectionPath}.props`, context);
    validateCompositionChildren(section.children, `${sectionPath}.children`, context);
  });
}

function validateApp(value: unknown, context: ValidationContext) {
  if (!isRecord(value)) {
    context.errors.push("app must be an object.");
    return;
  }
  hasOnlyKeys(value, ["name", "kind", "description"], "app", context);
  requireString(value, "name", "app", context);
  enumValue(value.kind, appKinds, "app.kind", context);
  optionalString(value, "description", "app", context);
}

function validateBackend(value: unknown, context: ValidationContext) {
  if (!isRecord(value)) {
    context.errors.push("backend must be an object.");
    return;
  }
  hasOnlyKeys(value, ["mode", "portable"], "backend", context);
  enumValue(value.mode, backendModes, "backend.mode", context);

  if (value.portable !== undefined) {
    if (!isRecord(value.portable)) {
      context.errors.push("backend.portable must be an object when provided.");
    } else {
      hasOnlyKeys(value.portable, ["database"], "backend.portable", context);
      optionalEnum(value.portable, "database", portableDatabases, "backend.portable", context);
    }
  }
}

function validateMedia(value: unknown, context: ValidationContext) {
  if (value === undefined) {
    return;
  }
  if (!isRecord(value)) {
    context.errors.push("media must be an object when provided.");
    return;
  }
  hasOnlyKeys(value, ["mode"], "media", context);
  enumValue(value.mode, mediaModes, "media.mode", context);
}

function validateExperience(value: unknown, context: ValidationContext) {
  if (value === undefined) {
    return;
  }
  if (!isRecord(value)) {
    context.errors.push("experience must be an object when provided.");
    return;
  }
  hasOnlyKeys(value, ["theme", "mode", "density", "spacing", "radius"], "experience", context);
  optionalEnum(value, "theme", themes, "experience", context);
  optionalEnum(value, "mode", themeModes, "experience", context);
  optionalEnum(value, "density", densities, "experience", context);
  optionalEnum(value, "spacing", spacings, "experience", context);
  optionalEnum(value, "radius", radii, "experience", context);
}

function validateActors(value: unknown, context: ValidationContext) {
  if (value === undefined) {
    return;
  }
  if (!Array.isArray(value)) {
    context.errors.push("actors must be an array when provided.");
    return;
  }
  value.forEach((actor, index) => {
    const path = `actors[${index}]`;
    if (!isRecord(actor)) {
      context.errors.push(`${path} must be an object.`);
      return;
    }
    hasOnlyKeys(actor, ["name", "kind", "description"], path, context);
    requireString(actor, "name", path, context);
    optionalEnum(actor, "kind", actorKinds, path, context);
    optionalString(actor, "description", path, context);
  });
}

function validateFields(value: unknown, path: string, context: ValidationContext) {
  if (value === undefined) {
    return;
  }
  if (!Array.isArray(value)) {
    context.errors.push(`${path} must be an array when provided.`);
    return;
  }
  value.forEach((field, index) => {
    const fieldPath = `${path}[${index}]`;
    if (!isRecord(field)) {
      context.errors.push(`${fieldPath} must be an object.`);
      return;
    }
    hasOnlyKeys(field, ["name", "label", "type", "required", "unique", "options"], fieldPath, context);
    requireString(field, "name", fieldPath, context);
    optionalString(field, "label", fieldPath, context);
    enumValue(field.type, fieldTypes, `${fieldPath}.type`, context);
    optionalBoolean(field, "required", fieldPath, context);
    optionalBoolean(field, "unique", fieldPath, context);
    optionalStringArray(field, "options", fieldPath, context);
  });
}

function validateObjectMedia(value: unknown, path: string, context: ValidationContext) {
  if (value === undefined) {
    return;
  }
  if (!Array.isArray(value)) {
    context.errors.push(`${path} must be an array when provided.`);
    return;
  }
  value.forEach((attachment, index) => {
    const attachmentPath = `${path}[${index}]`;
    if (!isRecord(attachment)) {
      context.errors.push(`${attachmentPath} must be an object.`);
      return;
    }
    hasOnlyKeys(attachment, ["name", "kind", "multiple", "required", "bucketAlias", "metadataTable"], attachmentPath, context);
    requireString(attachment, "name", attachmentPath, context);
    optionalEnum(attachment, "kind", attachmentKinds, attachmentPath, context);
    optionalBoolean(attachment, "multiple", attachmentPath, context);
    optionalBoolean(attachment, "required", attachmentPath, context);
    optionalString(attachment, "bucketAlias", attachmentPath, context);
    optionalString(attachment, "metadataTable", attachmentPath, context);
  });
}

function validateResourceAccess(value: unknown, path: string, context: ValidationContext) {
  if (value === undefined) {
    return;
  }
  if (!isRecord(value)) {
    context.errors.push(`${path} must be an object when provided.`);
    return;
  }
  hasOnlyKeys(value, ["list", "read", "create", "update", "delete"], path, context);
  optionalEnum(value, "list", resourceAccessPresets, path, context);
  optionalEnum(value, "read", resourceAccessPresets, path, context);
  optionalEnum(value, "create", resourceAccessPresets, path, context);
  optionalEnum(value, "update", resourceAccessPresets, path, context);
  optionalEnum(value, "delete", resourceAccessPresets, path, context);
}

function validateRelations(value: unknown, path: string, context: ValidationContext) {
  if (value === undefined) {
    return;
  }
  if (!Array.isArray(value)) {
    context.errors.push(`${path} must be an array when provided.`);
    return;
  }
  value.forEach((relation, index) => {
    const relationPath = `${path}[${index}]`;
    if (!isRecord(relation)) {
      context.errors.push(`${relationPath} must be an object.`);
      return;
    }
    hasOnlyKeys(relation, ["target", "kind", "field", "through"], relationPath, context);
    requireString(relation, "target", relationPath, context);
    enumValue(relation.kind, relationKinds, `${relationPath}.kind`, context);
    optionalString(relation, "field", relationPath, context);
    optionalString(relation, "through", relationPath, context);
  });
}

function validateObjects(value: unknown, context: ValidationContext) {
  if (value === undefined) {
    return;
  }
  if (!Array.isArray(value)) {
    context.errors.push("objects must be an array when provided.");
    return;
  }
  value.forEach((object, index) => {
    const path = `objects[${index}]`;
    if (!isRecord(object)) {
      context.errors.push(`${path} must be an object.`);
      return;
    }
    hasOnlyKeys(object, ["name", "table", "label", "purpose", "ownership", "visibility", "access", "relations", "fields", "media"], path, context);
    requireString(object, "name", path, context);
    optionalString(object, "table", path, context);
    optionalString(object, "label", path, context);
    optionalString(object, "purpose", path, context);
    optionalEnum(object, "ownership", ownershipModels, path, context);
    optionalEnum(object, "visibility", visibilityModes, path, context);
    validateResourceAccess(object.access, `${path}.access`, context);
    validateRelations(object.relations, `${path}.relations`, context);
    validateFields(object.fields, `${path}.fields`, context);
    validateObjectMedia(object.media, `${path}.media`, context);
  });
}

function validateFlows(value: unknown, context: ValidationContext) {
  if (value === undefined) {
    return;
  }
  if (!Array.isArray(value)) {
    context.errors.push("flows must be an array when provided.");
    return;
  }
  value.forEach((flow, index) => {
    const path = `flows[${index}]`;
    if (!isRecord(flow)) {
      context.errors.push(`${path} must be an object.`);
      return;
    }
    hasOnlyKeys(flow, ["name", "object", "kind", "field", "states", "transitions"], path, context);
    requireString(flow, "name", path, context);
    requireString(flow, "object", path, context);
    enumValue(flow.kind, flowKinds, `${path}.kind`, context);
    optionalString(flow, "field", path, context);
    optionalStringArray(flow, "states", path, context);
    if (flow.transitions !== undefined) {
      if (!Array.isArray(flow.transitions)) {
        context.errors.push(`${path}.transitions must be an array when provided.`);
      } else {
        flow.transitions.forEach((transition, transitionIndex) => {
          const transitionPath = `${path}.transitions[${transitionIndex}]`;
          if (!isRecord(transition)) {
            context.errors.push(`${transitionPath} must be an object.`);
            return;
          }
          hasOnlyKeys(transition, ["name", "from", "to", "actor", "emits", "notifies"], transitionPath, context);
          requireString(transition, "name", transitionPath, context);
          if (typeof transition.from !== "string" && !(Array.isArray(transition.from) && transition.from.every(item => typeof item === "string"))) {
            context.errors.push(`${transitionPath}.from must be a string or array of strings.`);
          }
          requireString(transition, "to", transitionPath, context);
          optionalString(transition, "actor", transitionPath, context);
          optionalStringArray(transition, "emits", transitionPath, context);
          optionalEnumArray(transition, "notifies", workflowNotificationAudiences, transitionPath, context);
        });
      }
    }
  });
}

function validateSurfaces(value: unknown, context: ValidationContext) {
  if (value === undefined) {
    return;
  }
  if (!Array.isArray(value)) {
    context.errors.push("surfaces must be an array when provided.");
    return;
  }
  value.forEach((surface, index) => {
    const path = `surfaces[${index}]`;
    if (!isRecord(surface)) {
      context.errors.push(`${path} must be an object.`);
      return;
    }
    hasOnlyKeys(surface, ["name", "kind", "object", "path", "audience", "shell", "page", "title", "sections"], path, context);
    requireString(surface, "name", path, context);
    enumValue(surface.kind, surfaceKinds, `${path}.kind`, context);
    optionalString(surface, "object", path, context);
    optionalString(surface, "path", path, context);
    optionalEnum(surface, "audience", audiences, path, context);
    optionalEnum(surface, "shell", appShells, path, context);
    optionalEnum(surface, "page", pageShells, path, context);
    optionalString(surface, "title", path, context);
    validateSections(surface.sections, `${path}.sections`, context);
  });
}

function validateRoutes(value: unknown, context: ValidationContext) {
  if (value === undefined) {
    return;
  }
  if (!Array.isArray(value)) {
    context.errors.push("routes must be an array when provided.");
    return;
  }
  value.forEach((route, index) => {
    const path = `routes[${index}]`;
    if (!isRecord(route)) {
      context.errors.push(`${path} must be an object.`);
      return;
    }
    hasOnlyKeys(route, ["path", "shell", "page", "resource", "title", "access", "sections"], path, context);
    requireString(route, "path", path, context);
    optionalEnum(route, "shell", appShells, path, context);
    enumValue(route.page, pageShells, `${path}.page`, context);
    optionalString(route, "resource", path, context);
    optionalString(route, "title", path, context);
    optionalEnum(route, "access", authAccessLevels, path, context);
    validateSections(route.sections, `${path}.sections`, context);
  });
}

function validateDatabase(value: unknown, context: ValidationContext) {
  if (value === undefined) {
    return;
  }
  if (!isRecord(value)) {
    context.errors.push("database must be an object when provided.");
    return;
  }
  hasOnlyKeys(value, ["schema"], "database", context);
  if (value.schema === undefined) {
    return;
  }
  if (!Array.isArray(value.schema)) {
    context.errors.push("database.schema must be an array when provided.");
    return;
  }
  value.schema.forEach((table, tableIndex) => {
    const tablePath = `database.schema[${tableIndex}]`;
    if (!isRecord(table)) {
      context.errors.push(`${tablePath} must be an object.`);
      return;
    }
    hasOnlyKeys(table, ["table", "columns", "timestamps"], tablePath, context);
    requireString(table, "table", tablePath, context);
    optionalBoolean(table, "timestamps", tablePath, context);
    if (!Array.isArray(table.columns)) {
      context.errors.push(`${tablePath}.columns must be an array.`);
      return;
    }
    table.columns.forEach((column, columnIndex) => {
      const columnPath = `${tablePath}.columns[${columnIndex}]`;
      if (!isRecord(column)) {
        context.errors.push(`${columnPath} must be an object.`);
        return;
      }
      hasOnlyKeys(column, ["name", "type", "nullable", "primaryKey", "unique"], columnPath, context);
      requireString(column, "name", columnPath, context);
      enumValue(column.type, databaseColumnTypes, `${columnPath}.type`, context);
      optionalBoolean(column, "nullable", columnPath, context);
      optionalBoolean(column, "primaryKey", columnPath, context);
      optionalBoolean(column, "unique", columnPath, context);
    });
  });
}

function validateEnv(value: unknown, context: ValidationContext) {
  if (value === undefined) {
    return;
  }
  if (!isRecord(value)) {
    context.errors.push("env must be an object when provided.");
    return;
  }
  hasOnlyKeys(value, ["extras"], "env", context);
  if (value.extras === undefined) {
    return;
  }
  if (!Array.isArray(value.extras)) {
    context.errors.push("env.extras must be an array when provided.");
    return;
  }
  value.extras.forEach((entry, index) => {
    const path = `env.extras[${index}]`;
    if (!isRecord(entry)) {
      context.errors.push(`${path} must be an object.`);
      return;
    }
    hasOnlyKeys(entry, ["name", "exposure", "required", "example", "description"], path, context);
    requireString(entry, "name", path, context);
    optionalEnum(entry, "exposure", envExposures, path, context);
    optionalBoolean(entry, "required", path, context);
    optionalString(entry, "example", path, context);
    optionalString(entry, "description", path, context);
  });
}

function validateApis(value: unknown, context: ValidationContext) {
  if (value === undefined) {
    return;
  }
  if (!Array.isArray(value)) {
    context.errors.push("apis must be an array when provided.");
    return;
  }
  value.forEach((api, index) => {
    const path = `apis[${index}]`;
    if (!isRecord(api)) {
      context.errors.push(`${path} must be an object.`);
      return;
    }
    hasOnlyKeys(api, ["path", "method", "type", "name", "auth"], path, context);
    requireString(api, "path", path, context);
    enumValue(api.method, apiRouteMethods, `${path}.method`, context);
    enumValue(api.type, apiRouteTypes, `${path}.type`, context);
    requireString(api, "name", path, context);
    optionalEnum(api, "auth", authAccessLevels, path, context);
  });
}

function validateServer(value: unknown, context: ValidationContext) {
  if (value === undefined) {
    return;
  }
  if (!Array.isArray(value)) {
    context.errors.push("server must be an array when provided.");
    return;
  }
  value.forEach((module, index) => {
    const path = `server[${index}]`;
    if (!isRecord(module)) {
      context.errors.push(`${path} must be an object.`);
      return;
    }
    hasOnlyKeys(module, ["name", "type", "resource", "auth"], path, context);
    requireString(module, "name", path, context);
    enumValue(module.type, serverModuleTypes, `${path}.type`, context);
    optionalString(module, "resource", path, context);
    optionalEnum(module, "auth", authAccessLevels, path, context);
  });
}

function validateNoBillingConcepts(value: unknown, context: ValidationContext) {
  const serialized = JSON.stringify(value).toLowerCase();
  for (const token of ["stripe", "billing", "checkout", "payment", "subscription"]) {
    if (serialized.includes(token)) {
      context.errors.push(`free-saas-tool specs must not declare billing/payment concepts; found "${token}".`);
    }
  }
}

function validateObjectReferences(value: Record<string, unknown>, context: ValidationContext) {
  if (!Array.isArray(value.objects)) {
    return;
  }

  const objectNames = new Set(
    value.objects
      .filter(isRecord)
      .map(object => object.name)
      .filter((name): name is string => typeof name === "string" && name.length > 0),
  );

  if (Array.isArray(value.flows)) {
    value.flows.forEach((flow, index) => {
      if (isRecord(flow) && typeof flow.object === "string" && !objectNames.has(flow.object)) {
        context.errors.push(`flows[${index}].object references unknown object "${flow.object}".`);
      }
    });
  }

  if (Array.isArray(value.surfaces)) {
    value.surfaces.forEach((surface, index) => {
      if (isRecord(surface) && typeof surface.object === "string" && !objectNames.has(surface.object)) {
        context.errors.push(`surfaces[${index}].object references unknown object "${surface.object}".`);
      }
    });
  }

  if (Array.isArray(value.routes)) {
    value.routes.forEach((route, index) => {
      if (isRecord(route) && typeof route.resource === "string" && !objectNames.has(route.resource)) {
        context.errors.push(`routes[${index}].resource references unknown object "${route.resource}".`);
      }
    });
  }

  value.objects.forEach((object, objectIndex) => {
    if (!isRecord(object) || !Array.isArray(object.relations)) {
      return;
    }
    object.relations.forEach((relation, relationIndex) => {
      if (isRecord(relation) && typeof relation.target === "string" && !objectNames.has(relation.target)) {
        context.errors.push(`objects[${objectIndex}].relations[${relationIndex}].target references unknown object "${relation.target}".`);
      }
    });
  });

  if (Array.isArray(value.server)) {
    value.server.forEach((module, index) => {
      if (isRecord(module) && typeof module.resource === "string" && !objectNames.has(module.resource)) {
        context.errors.push(`server[${index}].resource references unknown object "${module.resource}".`);
      }
    });
  }
}

export function validateSpecV04(value: unknown): StylyfSpecV04 {
  const context: ValidationContext = { errors: [] };

  if (!isRecord(value)) {
    throw new Error("Spec must be a JSON object.");
  }

  hasOnlyKeys(
    value,
    ["version", "app", "backend", "database", "env", "media", "experience", "actors", "objects", "flows", "surfaces", "routes", "apis", "server"],
    "spec",
    context,
  );

  if (value.version !== "0.4") {
    context.errors.push('version must be "0.4".');
  }

  validateApp(value.app, context);
  validateBackend(value.backend, context);
  validateDatabase(value.database, context);
  validateEnv(value.env, context);
  validateMedia(value.media, context);
  validateExperience(value.experience, context);
  validateActors(value.actors, context);
  validateObjects(value.objects, context);
  validateFlows(value.flows, context);
  validateSurfaces(value.surfaces, context);
  validateRoutes(value.routes, context);
  validateApis(value.apis, context);
  validateServer(value.server, context);
  validateObjectReferences(value, context);

  if (isRecord(value.app) && value.app.kind === "free-saas-tool") {
    validateNoBillingConcepts(value, context);
  }

  if (context.errors.length > 0) {
    throw new Error(`Invalid Stylyf v0.4 spec:\n${context.errors.map(error => `- ${error}`).join("\n")}`);
  }

  return value as StylyfSpecV04;
}
