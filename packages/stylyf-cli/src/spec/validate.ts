import {
  actorKinds,
  appKinds,
  attachmentKinds,
  audiences,
  backendModes,
  densities,
  fieldTypes,
  flowKinds,
  mediaModes,
  ownershipModels,
  portableDatabases,
  radii,
  spacings,
  surfaceKinds,
  themeModes,
  themes,
  visibilityModes,
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
    hasOnlyKeys(attachment, ["name", "kind", "multiple", "required"], attachmentPath, context);
    requireString(attachment, "name", attachmentPath, context);
    optionalEnum(attachment, "kind", attachmentKinds, attachmentPath, context);
    optionalBoolean(attachment, "multiple", attachmentPath, context);
    optionalBoolean(attachment, "required", attachmentPath, context);
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
    hasOnlyKeys(object, ["name", "label", "purpose", "ownership", "visibility", "fields", "media"], path, context);
    requireString(object, "name", path, context);
    optionalString(object, "label", path, context);
    optionalString(object, "purpose", path, context);
    optionalEnum(object, "ownership", ownershipModels, path, context);
    optionalEnum(object, "visibility", visibilityModes, path, context);
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
    hasOnlyKeys(flow, ["name", "object", "kind", "states", "transitions"], path, context);
    requireString(flow, "name", path, context);
    requireString(flow, "object", path, context);
    enumValue(flow.kind, flowKinds, `${path}.kind`, context);
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
          hasOnlyKeys(transition, ["name", "from", "to", "actor"], transitionPath, context);
          requireString(transition, "name", transitionPath, context);
          if (typeof transition.from !== "string" && !(Array.isArray(transition.from) && transition.from.every(item => typeof item === "string"))) {
            context.errors.push(`${transitionPath}.from must be a string or array of strings.`);
          }
          requireString(transition, "to", transitionPath, context);
          optionalString(transition, "actor", transitionPath, context);
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
    hasOnlyKeys(surface, ["name", "kind", "object", "path", "audience"], path, context);
    requireString(surface, "name", path, context);
    enumValue(surface.kind, surfaceKinds, `${path}.kind`, context);
    optionalString(surface, "object", path, context);
    optionalString(surface, "path", path, context);
    optionalEnum(surface, "audience", audiences, path, context);
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
}

export function validateSpecV04(value: unknown): StylyfSpecV04 {
  const context: ValidationContext = { errors: [] };

  if (!isRecord(value)) {
    throw new Error("Spec must be a JSON object.");
  }

  hasOnlyKeys(value, ["version", "app", "backend", "media", "experience", "actors", "objects", "flows", "surfaces"], "spec", context);

  if (value.version !== "0.4") {
    context.errors.push('version must be "0.4".');
  }

  validateApp(value.app, context);
  validateBackend(value.backend, context);
  validateMedia(value.media, context);
  validateExperience(value.experience, context);
  validateActors(value.actors, context);
  validateObjects(value.objects, context);
  validateFlows(value.flows, context);
  validateSurfaces(value.surfaces, context);
  validateObjectReferences(value, context);

  if (isRecord(value.app) && value.app.kind === "free-saas-tool") {
    validateNoBillingConcepts(value, context);
  }

  if (context.errors.length > 0) {
    throw new Error(`Invalid Stylyf v0.4 spec:\n${context.errors.map(error => `- ${error}`).join("\n")}`);
  }

  return value as StylyfSpecV04;
}
