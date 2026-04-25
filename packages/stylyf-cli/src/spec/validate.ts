import { readFileSync } from "node:fs";
import {
  actorKinds,
  apiRateLimitWindows,
  apiRouteMethods,
  apiSchemaPrimitives,
  apiRouteTypes,
  apiWebhookProviders,
  appKinds,
  appShells,
  authAccessLevels,
  attachmentKinds,
  audiences,
  backendModes,
  bindingKinds,
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
import type { StylyfSpecV10 } from "./types.js";
import { layoutPropContracts, type CompositionPropContract } from "../manifests/props.js";

type ValidationContext = {
  errors: string[];
};

type AssemblyContractEntry = {
  id: string;
  slug: string;
  label: string;
  exportName: string;
  clusterDirectory: string;
  props?: CompositionPropContract[];
};

let componentContractLookup: Map<string, CompositionPropContract[]> | undefined;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function loadComponentContractLookup() {
  if (componentContractLookup) {
    return componentContractLookup;
  }

  const lookup = new Map<string, CompositionPropContract[]>();
  const registryUrl = new URL("../manifests/generated/assembly-registry.json", import.meta.url);
  const registry = JSON.parse(readFileSync(registryUrl, "utf8")) as AssemblyContractEntry[];

  for (const item of registry) {
    const props = item.props ?? [];
    for (const alias of [item.id, item.slug, item.label, item.exportName, `${item.clusterDirectory}/${item.slug}`]) {
      lookup.set(normalizeKey(alias), props);
    }
  }

  componentContractLookup = lookup;
  return lookup;
}

function componentPropContracts(componentName: string) {
  return loadComponentContractLookup().get(normalizeKey(componentName)) ?? [];
}

function hasOnlyKeys(value: Record<string, unknown>, allowed: readonly string[], path: string, context: ValidationContext) {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) {
      context.errors.push(`${path}.${key} is not supported in Stylyf v1.0 specs.`);
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

function propContractByName(contracts: readonly CompositionPropContract[]) {
  const byName = new Map<string, CompositionPropContract>();
  for (const contract of contracts) {
    byName.set(contract.name, contract);
    for (const alias of contract.aliases ?? []) {
      byName.set(alias, contract);
    }
  }
  return byName;
}

function validateContractValue(value: unknown, contract: CompositionPropContract, path: string, context: ValidationContext) {
  if (contract.type === "enum") {
    if (!contract.values?.some(entry => entry === value)) {
      context.errors.push(`${path} must be one of: ${(contract.values ?? []).join(", ")}.`);
    }
    return;
  }

  if (contract.type === "boolean" && typeof value !== "boolean") {
    context.errors.push(`${path} must be a boolean.`);
    return;
  }

  if (contract.type === "number" && typeof value !== "number") {
    context.errors.push(`${path} must be a number.`);
    return;
  }

  if ((contract.type === "string" || contract.type === "jsx") && typeof value !== "string") {
    context.errors.push(`${path} must be a string.`);
    return;
  }

  if (contract.type === "json" && value === undefined) {
    context.errors.push(`${path} must be valid JSON.`);
  }
}

function validateLayoutProps(layout: string, value: unknown, path: string, context: ValidationContext) {
  if (value === undefined) {
    return;
  }
  if (!isRecord(value)) {
    context.errors.push(`${path} must be an object when provided.`);
    return;
  }

  const layoutContract = layoutPropContracts[layout as keyof typeof layoutPropContracts];
  if (!layoutContract) {
    for (const [key, item] of Object.entries(value)) {
      if (typeof item !== "string" && typeof item !== "number" && typeof item !== "boolean") {
        context.errors.push(`${path}.${key} must be a string, number, or boolean.`);
      }
    }
    return;
  }

  const contracts = propContractByName(layoutContract.props);
  for (const [key, item] of Object.entries(value)) {
    if (typeof item !== "string" && typeof item !== "number" && typeof item !== "boolean") {
      context.errors.push(`${path}.${key} must be a string, number, or boolean.`);
      continue;
    }

    const contract = contracts.get(key);
    if (!contract) {
      context.errors.push(`${path}.${key} is not supported by the ${layout} layout. Supported props: ${layoutContract.props.map(prop => prop.name).join(", ")}.`);
      continue;
    }

    validateContractValue(item, contract, `${path}.${key}`, context);
  }
}

function validateComponentProps(componentName: string, value: unknown, path: string, context: ValidationContext) {
  if (value === undefined || !isRecord(value)) {
    return;
  }

  const contracts = propContractByName(componentPropContracts(componentName));
  for (const [key, item] of Object.entries(value)) {
    const contract = contracts.get(key);
    if (!contract) {
      continue;
    }

    validateContractValue(item, contract, `${path}.${key}`, context);
  }
}

function normalizeLayoutProps(layout: string, props: unknown) {
  if (!isRecord(props)) {
    return;
  }

  const layoutContract = layoutPropContracts[layout as keyof typeof layoutPropContracts];
  if (!layoutContract) {
    return;
  }

  for (const contract of layoutContract.props as readonly CompositionPropContract[]) {
    for (const alias of contract.aliases ?? []) {
      if (props[alias] !== undefined && props[contract.name] === undefined) {
        props[contract.name] = props[alias];
      }
      if (props[alias] !== undefined) {
        delete props[alias];
      }
    }
  }
}

function normalizeCompositionNode(value: unknown) {
  if (typeof value === "string" || !isRecord(value)) {
    return;
  }

  if (typeof value.layout === "string") {
    normalizeLayoutProps(value.layout, value.props);
    if (Array.isArray(value.children)) {
      value.children.forEach(normalizeCompositionNode);
    }
  }
}

function normalizeSections(value: unknown) {
  if (!Array.isArray(value)) {
    return;
  }

  for (const section of value) {
    if (!isRecord(section)) {
      continue;
    }
    if (typeof section.layout === "string") {
      normalizeLayoutProps(section.layout, section.props);
    }
    if (Array.isArray(section.children)) {
      section.children.forEach(normalizeCompositionNode);
    }
  }
}

function normalizeSpecAliases(value: Record<string, unknown>) {
  const normalized = JSON.parse(JSON.stringify(value)) as Record<string, unknown>;

  for (const surface of Array.isArray(normalized.surfaces) ? normalized.surfaces : []) {
    if (isRecord(surface)) {
      normalizeSections(surface.sections);
    }
  }

  for (const route of Array.isArray(normalized.routes) ? normalized.routes : []) {
    if (isRecord(route)) {
      normalizeSections(route.sections);
    }
  }

  return normalized;
}

function validateBindings(value: unknown, path: string, context: ValidationContext) {
  if (value === undefined) {
    return;
  }
  if (!Array.isArray(value)) {
    context.errors.push(`${path} must be an array when provided.`);
    return;
  }
  value.forEach((binding, index) => {
    const bindingPath = `${path}[${index}]`;
    if (!isRecord(binding)) {
      context.errors.push(`${bindingPath} must be an object.`);
      return;
    }
    hasOnlyKeys(binding, ["name", "kind", "resource", "workflow", "transition", "attachment", "section", "component"], bindingPath, context);
    optionalString(binding, "name", bindingPath, context);
    enumValue(binding.kind, bindingKinds, `${bindingPath}.kind`, context);
    optionalString(binding, "resource", bindingPath, context);
    optionalString(binding, "workflow", bindingPath, context);
    optionalString(binding, "transition", bindingPath, context);
    optionalString(binding, "attachment", bindingPath, context);
    optionalString(binding, "section", bindingPath, context);
    optionalString(binding, "component", bindingPath, context);
  });
}

function validateComponentNode(value: Record<string, unknown>, path: string, context: ValidationContext) {
  hasOnlyKeys(value, ["component", "variant", "props", "items", "bindings"], path, context);
  requireString(value, "component", path, context);
  optionalString(value, "variant", path, context);
  optionalRecord(value, "props", path, context);
  validateBindings(value.bindings, `${path}.bindings`, context);
  if (typeof value.component === "string") {
    validateComponentProps(value.component, value.props, `${path}.props`, context);
  }

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
    hasOnlyKeys(value, ["layout", "props", "children", "bindings"], path, context);
    enumValue(value.layout, layoutNodes, `${path}.layout`, context);
    validateLayoutProps(value.layout, value.props, `${path}.props`, context);
    validateBindings(value.bindings, `${path}.bindings`, context);
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
    hasOnlyKeys(section, ["id", "layout", "props", "bindings", "children"], sectionPath, context);
    optionalString(section, "id", sectionPath, context);
    enumValue(section.layout, layoutNodes, `${sectionPath}.layout`, context);
    if (typeof section.layout === "string") {
      validateLayoutProps(section.layout, section.props, `${sectionPath}.props`, context);
    }
    validateBindings(section.bindings, `${sectionPath}.bindings`, context);
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
      hasOnlyKeys(field, ["name", "label", "type", "required", "unique", "indexed", "default", "options"], fieldPath, context);
      requireString(field, "name", fieldPath, context);
      optionalString(field, "label", fieldPath, context);
      enumValue(field.type, fieldTypes, `${fieldPath}.type`, context);
      optionalBoolean(field, "required", fieldPath, context);
      optionalBoolean(field, "unique", fieldPath, context);
      optionalBoolean(field, "indexed", fieldPath, context);
      if (field.default !== undefined && !["string", "number", "boolean"].includes(typeof field.default)) {
        context.errors.push(`${fieldPath}.default must be a string, number, or boolean when provided.`);
      }
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

function validatePolicies(value: unknown, context: ValidationContext) {
  if (value === undefined) {
    return;
  }
  if (!isRecord(value)) {
    context.errors.push("policies must be an object when provided.");
    return;
  }

  hasOnlyKeys(value, ["roles", "memberships", "actors"], "policies", context);

  if (value.roles !== undefined) {
    if (!Array.isArray(value.roles)) {
      context.errors.push("policies.roles must be an array when provided.");
    } else {
      value.roles.forEach((role, index) => {
        const path = `policies.roles[${index}]`;
        if (!isRecord(role)) {
          context.errors.push(`${path} must be an object.`);
          return;
        }
        hasOnlyKeys(role, ["name", "description"], path, context);
        requireString(role, "name", path, context);
        optionalString(role, "description", path, context);
      });
    }
  }

  if (value.memberships !== undefined) {
    if (!Array.isArray(value.memberships)) {
      context.errors.push("policies.memberships must be an array when provided.");
    } else {
      value.memberships.forEach((membership, index) => {
        const path = `policies.memberships[${index}]`;
        if (!isRecord(membership)) {
          context.errors.push(`${path} must be an object.`);
          return;
        }
        hasOnlyKeys(membership, ["name", "table", "userField", "workspaceField", "roleField", "roles"], path, context);
        optionalString(membership, "name", path, context);
        optionalString(membership, "table", path, context);
        optionalString(membership, "userField", path, context);
        optionalString(membership, "workspaceField", path, context);
        optionalString(membership, "roleField", path, context);
        optionalStringArray(membership, "roles", path, context);
      });
    }
  }

  if (value.actors !== undefined) {
    if (!Array.isArray(value.actors)) {
      context.errors.push("policies.actors must be an array when provided.");
    } else {
      value.actors.forEach((actor, index) => {
        const path = `policies.actors[${index}]`;
        if (!isRecord(actor)) {
          context.errors.push(`${path} must be an object.`);
          return;
        }
        hasOnlyKeys(actor, ["actor", "role", "membership"], path, context);
        requireString(actor, "actor", path, context);
        optionalString(actor, "role", path, context);
        optionalString(actor, "membership", path, context);
      });
    }
  }
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
    hasOnlyKeys(surface, ["name", "kind", "object", "path", "audience", "shell", "page", "title", "bindings", "metadata", "sections"], path, context);
    requireString(surface, "name", path, context);
    enumValue(surface.kind, surfaceKinds, `${path}.kind`, context);
    optionalString(surface, "object", path, context);
    optionalString(surface, "path", path, context);
    optionalEnum(surface, "audience", audiences, path, context);
    optionalEnum(surface, "shell", appShells, path, context);
    optionalEnum(surface, "page", pageShells, path, context);
    optionalString(surface, "title", path, context);
    validateBindings(surface.bindings, `${path}.bindings`, context);
    validateRouteMetadata(surface.metadata, `${path}.metadata`, context);
    validateSections(surface.sections, `${path}.sections`, context);
  });
}

function validateRouteMetadata(value: unknown, path: string, context: ValidationContext) {
  if (value === undefined) {
    return;
  }
  if (!isRecord(value)) {
    context.errors.push(`${path} must be an object when provided.`);
    return;
  }
  hasOnlyKeys(value, ["title", "description", "canonical", "robots", "openGraph", "structuredData"], path, context);
  optionalString(value, "title", path, context);
  optionalString(value, "description", path, context);
  optionalString(value, "canonical", path, context);
  optionalEnum(value, "robots", ["index", "noindex"], path, context);
  if (value.openGraph !== undefined) {
    if (!isRecord(value.openGraph)) {
      context.errors.push(`${path}.openGraph must be an object when provided.`);
    } else {
      hasOnlyKeys(value.openGraph, ["title", "description", "image"], `${path}.openGraph`, context);
      optionalString(value.openGraph, "title", `${path}.openGraph`, context);
      optionalString(value.openGraph, "description", `${path}.openGraph`, context);
      optionalString(value.openGraph, "image", `${path}.openGraph`, context);
    }
  }
  if (value.structuredData !== undefined && !isRecord(value.structuredData)) {
    context.errors.push(`${path}.structuredData must be an object when provided.`);
  }
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
    hasOnlyKeys(route, ["path", "shell", "page", "resource", "title", "access", "bindings", "metadata", "sections"], path, context);
    requireString(route, "path", path, context);
    optionalEnum(route, "shell", appShells, path, context);
    enumValue(route.page, pageShells, `${path}.page`, context);
    optionalString(route, "resource", path, context);
    optionalString(route, "title", path, context);
    optionalEnum(route, "access", authAccessLevels, path, context);
    validateBindings(route.bindings, `${path}.bindings`, context);
    validateRouteMetadata(route.metadata, `${path}.metadata`, context);
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
    hasOnlyKeys(table, ["table", "columns", "timestamps", "softDelete"], tablePath, context);
    requireString(table, "table", tablePath, context);
    optionalBoolean(table, "timestamps", tablePath, context);
    optionalBoolean(table, "softDelete", tablePath, context);
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
      hasOnlyKeys(column, ["name", "type", "nullable", "primaryKey", "unique", "indexed", "default"], columnPath, context);
      requireString(column, "name", columnPath, context);
      enumValue(column.type, databaseColumnTypes, `${columnPath}.type`, context);
      optionalBoolean(column, "nullable", columnPath, context);
      optionalBoolean(column, "primaryKey", columnPath, context);
      optionalBoolean(column, "unique", columnPath, context);
      optionalBoolean(column, "indexed", columnPath, context);
      if (column.default !== undefined && !["string", "number", "boolean"].includes(typeof column.default)) {
        context.errors.push(`${columnPath}.default must be a string, number, or boolean when provided.`);
      }
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

function validateNumber(value: unknown, path: string, context: ValidationContext) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    context.errors.push(`${path} must be a finite number.`);
  }
}

function validatePositiveInteger(value: unknown, path: string, context: ValidationContext) {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    context.errors.push(`${path} must be a positive integer.`);
  }
}

function validateApiSchemaObject(value: unknown, path: string, context: ValidationContext) {
  if (value === undefined) {
    return;
  }
  if (!isRecord(value)) {
    context.errors.push(`${path} must be an object when provided.`);
    return;
  }

  for (const [fieldName, field] of Object.entries(value)) {
    const fieldPath = `${path}.${fieldName}`;
    if (!isRecord(field)) {
      context.errors.push(`${fieldPath} must be an object.`);
      continue;
    }
    hasOnlyKeys(field, ["type", "required", "array", "enum", "min", "max"], fieldPath, context);
    enumValue(field.type, apiSchemaPrimitives, `${fieldPath}.type`, context);
    optionalBoolean(field, "required", fieldPath, context);
    optionalBoolean(field, "array", fieldPath, context);
    optionalStringArray(field, "enum", fieldPath, context);
    if (field.min !== undefined) validateNumber(field.min, `${fieldPath}.min`, context);
    if (field.max !== undefined) validateNumber(field.max, `${fieldPath}.max`, context);
  }
}

function validateApiRequestContract(value: unknown, path: string, context: ValidationContext) {
  if (value === undefined) {
    return;
  }
  if (!isRecord(value)) {
    context.errors.push(`${path} must be an object when provided.`);
    return;
  }
  hasOnlyKeys(value, ["body", "query", "params", "headers"], path, context);
  validateApiSchemaObject(value.body, `${path}.body`, context);
  validateApiSchemaObject(value.query, `${path}.query`, context);
  validateApiSchemaObject(value.params, `${path}.params`, context);
  validateApiSchemaObject(value.headers, `${path}.headers`, context);
}

function validateApiResponseContract(value: unknown, path: string, context: ValidationContext) {
  if (value === undefined) {
    return;
  }
  if (!isRecord(value)) {
    context.errors.push(`${path} must be an object when provided.`);
    return;
  }
  hasOnlyKeys(value, ["status", "body"], path, context);
  if (value.status !== undefined) {
    validatePositiveInteger(value.status, `${path}.status`, context);
  }
  validateApiSchemaObject(value.body, `${path}.body`, context);
}

function validateApiRateLimit(value: unknown, path: string, context: ValidationContext) {
  if (value === undefined) {
    return;
  }
  if (!isRecord(value)) {
    context.errors.push(`${path} must be an object when provided.`);
    return;
  }
  hasOnlyKeys(value, ["window", "max"], path, context);
  enumValue(value.window, apiRateLimitWindows, `${path}.window`, context);
  validatePositiveInteger(value.max, `${path}.max`, context);
}

function validateApiIdempotency(value: unknown, path: string, context: ValidationContext) {
  if (value === undefined) {
    return;
  }
  if (!isRecord(value)) {
    context.errors.push(`${path} must be an object when provided.`);
    return;
  }
  hasOnlyKeys(value, ["required", "header"], path, context);
  optionalBoolean(value, "required", path, context);
  optionalString(value, "header", path, context);
}

function validateApiWebhook(value: unknown, path: string, context: ValidationContext) {
  if (value === undefined) {
    return;
  }
  if (!isRecord(value)) {
    context.errors.push(`${path} must be an object when provided.`);
    return;
  }
  hasOnlyKeys(value, ["provider", "signatureHeader", "secretEnv"], path, context);
  optionalEnum(value, "provider", apiWebhookProviders, path, context);
  optionalString(value, "signatureHeader", path, context);
  optionalString(value, "secretEnv", path, context);
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
    hasOnlyKeys(api, ["path", "method", "type", "name", "auth", "request", "response", "rateLimit", "idempotency", "webhook", "draft"], path, context);
    requireString(api, "path", path, context);
    enumValue(api.method, apiRouteMethods, `${path}.method`, context);
    enumValue(api.type, apiRouteTypes, `${path}.type`, context);
    requireString(api, "name", path, context);
    optionalEnum(api, "auth", authAccessLevels, path, context);
    optionalBoolean(api, "draft", path, context);
    validateApiRequestContract(api.request, `${path}.request`, context);
    validateApiResponseContract(api.response, `${path}.response`, context);
    validateApiRateLimit(api.rateLimit, `${path}.rateLimit`, context);
    validateApiIdempotency(api.idempotency, `${path}.idempotency`, context);
    validateApiWebhook(api.webhook, `${path}.webhook`, context);

    if (api.method === "GET" && isRecord(api.request) && api.request.body !== undefined) {
      context.errors.push(`${path}.request.body is not supported for GET routes.`);
    }
    if (api.type === "webhook" && api.method !== "POST") {
      context.errors.push(`${path}.method must be POST for webhook routes.`);
    }
    if (api.type === "presign-upload" && api.method !== "POST") {
      context.errors.push(`${path}.method must be POST for presign-upload routes.`);
    }
    if (api.type !== "webhook" && api.webhook !== undefined) {
      context.errors.push(`${path}.webhook is only supported when type is "webhook".`);
    }
    const hasContract = api.request !== undefined || api.response !== undefined;
    if (!hasContract && api.type !== "presign-upload" && api.draft !== true) {
      context.errors.push(`${path} must provide request/response contracts or set draft: true.`);
    }
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

function validateFixtures(value: unknown, context: ValidationContext) {
  if (value === undefined) {
    return;
  }
  if (!Array.isArray(value)) {
    context.errors.push("fixtures must be an array when provided.");
    return;
  }
  value.forEach((fixture, index) => {
    const path = `fixtures[${index}]`;
    if (!isRecord(fixture)) {
      context.errors.push(`${path} must be an object.`);
      return;
    }
    hasOnlyKeys(fixture, ["resource", "rows"], path, context);
    requireString(fixture, "resource", path, context);
    if (!Array.isArray(fixture.rows) || fixture.rows.some(row => !isRecord(row))) {
      context.errors.push(`${path}.rows must be an array of objects.`);
    }
  });
}

function validateNavItems(value: unknown, path: string, context: ValidationContext) {
  if (value === undefined) {
    return;
  }
  if (!Array.isArray(value)) {
    context.errors.push(`${path} must be an array when provided.`);
    return;
  }
  value.forEach((item, index) => {
    const itemPath = `${path}[${index}]`;
    if (!isRecord(item)) {
      context.errors.push(`${itemPath} must be an object.`);
      return;
    }
    hasOnlyKeys(item, ["label", "href", "group", "auth", "role", "command"], itemPath, context);
    requireString(item, "label", itemPath, context);
    requireString(item, "href", itemPath, context);
    optionalString(item, "group", itemPath, context);
    optionalEnum(item, "auth", authAccessLevels, itemPath, context);
    optionalString(item, "role", itemPath, context);
    optionalBoolean(item, "command", itemPath, context);
  });
}

function validateNavigation(value: unknown, context: ValidationContext) {
  if (value === undefined) {
    return;
  }
  if (!isRecord(value)) {
    context.errors.push("navigation must be an object when provided.");
    return;
  }
  hasOnlyKeys(value, ["primary", "secondary", "userMenu", "commandMenu"], "navigation", context);
  validateNavItems(value.primary, "navigation.primary", context);
  validateNavItems(value.secondary, "navigation.secondary", context);
  validateNavItems(value.userMenu, "navigation.userMenu", context);
  validateNavItems(value.commandMenu, "navigation.commandMenu", context);
}

function validateNoBillingConcepts(value: unknown, context: ValidationContext) {
  const serialized = JSON.stringify(value).toLowerCase();
  for (const token of ["stripe", "billing", "checkout", "payment", "subscription"]) {
    if (serialized.includes(token)) {
      context.errors.push(`free-saas-tool specs must not declare billing/payment concepts; found "${token}".`);
    }
  }
}

function validateBindingReferences(
  bindings: unknown,
  path: string,
  context: ValidationContext,
  objectNames: Set<string>,
  objectAttachments: Map<string, Set<string>>,
  flowTransitions: Map<string, Set<string>>,
) {
  if (!Array.isArray(bindings)) {
    return;
  }

  bindings.forEach((binding, index) => {
    if (!isRecord(binding) || typeof binding.kind !== "string") {
      return;
    }

    const bindingPath = `${path}[${index}]`;
    const resource = typeof binding.resource === "string" ? binding.resource : undefined;
    const workflow = typeof binding.workflow === "string" ? binding.workflow : undefined;
    const transition = typeof binding.transition === "string" ? binding.transition : undefined;
    const attachment = typeof binding.attachment === "string" ? binding.attachment : undefined;

    if (binding.kind.startsWith("resource.") || binding.kind === "attachment.lifecycle") {
      if (!resource) {
        context.errors.push(`${bindingPath}.resource is required for ${binding.kind} bindings.`);
      } else if (!objectNames.has(resource)) {
        context.errors.push(`${bindingPath}.resource references unknown object "${resource}".`);
      }
    }

    if (binding.kind === "attachment.lifecycle" && resource && attachment) {
      const attachments = objectAttachments.get(resource);
      if (attachments && !attachments.has(attachment)) {
        context.errors.push(`${bindingPath}.attachment references unknown attachment "${attachment}" on object "${resource}".`);
      }
    }

    if (binding.kind === "workflow.transition") {
      if (!workflow) {
        context.errors.push(`${bindingPath}.workflow is required for workflow.transition bindings.`);
      } else if (!flowTransitions.has(workflow)) {
        context.errors.push(`${bindingPath}.workflow references unknown flow "${workflow}".`);
      } else if (transition && !(flowTransitions.get(workflow)?.has(transition))) {
        context.errors.push(`${bindingPath}.transition references unknown transition "${transition}" on flow "${workflow}".`);
      }
    }
  });
}

function validateSectionBindingReferences(
  sections: unknown,
  path: string,
  context: ValidationContext,
  objectNames: Set<string>,
  objectAttachments: Map<string, Set<string>>,
  flowTransitions: Map<string, Set<string>>,
) {
  if (!Array.isArray(sections)) {
    return;
  }

  sections.forEach((section, sectionIndex) => {
    if (!isRecord(section)) {
      return;
    }

    const sectionPath = `${path}[${sectionIndex}]`;
    validateBindingReferences(section.bindings, `${sectionPath}.bindings`, context, objectNames, objectAttachments, flowTransitions);

    if (Array.isArray(section.children)) {
      section.children.forEach((child, childIndex) => {
        if (isRecord(child)) {
          validateCompositionBindingReferences(child, `${sectionPath}.children[${childIndex}]`, context, objectNames, objectAttachments, flowTransitions);
        }
      });
    }
  });
}

function validateCompositionBindingReferences(
  node: Record<string, unknown>,
  path: string,
  context: ValidationContext,
  objectNames: Set<string>,
  objectAttachments: Map<string, Set<string>>,
  flowTransitions: Map<string, Set<string>>,
) {
  validateBindingReferences(node.bindings, `${path}.bindings`, context, objectNames, objectAttachments, flowTransitions);

  if (Array.isArray(node.children)) {
    node.children.forEach((child, index) => {
      if (isRecord(child)) {
        validateCompositionBindingReferences(child, `${path}.children[${index}]`, context, objectNames, objectAttachments, flowTransitions);
      }
    });
  }
}

function validatePolicyReferences(value: Record<string, unknown>, context: ValidationContext) {
  if (!isRecord(value.policies)) {
    return;
  }

  const roles = new Set(
    Array.isArray(value.policies.roles)
      ? value.policies.roles
          .filter(isRecord)
          .map(role => role.name)
          .filter((name): name is string => typeof name === "string" && name.length > 0)
      : [],
  );
  const memberships = new Set(
    Array.isArray(value.policies.memberships)
      ? value.policies.memberships
          .filter(isRecord)
          .map(membership => (typeof membership.name === "string" ? membership.name : "workspace"))
          .filter((name): name is string => typeof name === "string" && name.length > 0)
      : ["workspace"],
  );

  if (Array.isArray(value.policies.memberships)) {
    value.policies.memberships.forEach((membership, index) => {
      if (!isRecord(membership) || !Array.isArray(membership.roles)) {
        return;
      }
      membership.roles.forEach((role, roleIndex) => {
        if (typeof role === "string" && roles.size > 0 && !roles.has(role)) {
          context.errors.push(`policies.memberships[${index}].roles[${roleIndex}] references unknown role "${role}".`);
        }
      });
    });
  }

  if (Array.isArray(value.policies.actors)) {
    value.policies.actors.forEach((actor, index) => {
      if (!isRecord(actor)) {
        return;
      }
      if (typeof actor.role === "string" && roles.size > 0 && !roles.has(actor.role)) {
        context.errors.push(`policies.actors[${index}].role references unknown role "${actor.role}".`);
      }
      if (typeof actor.membership === "string" && memberships.size > 0 && !memberships.has(actor.membership)) {
        context.errors.push(`policies.actors[${index}].membership references unknown membership "${actor.membership}".`);
      }
    });
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
  const objectAttachments = new Map<string, Set<string>>();
  value.objects.forEach(object => {
    if (!isRecord(object) || typeof object.name !== "string") {
      return;
    }
    const attachments = new Set(
      Array.isArray(object.media)
        ? object.media
            .filter(isRecord)
            .map(attachment => attachment.name)
            .filter((name): name is string => typeof name === "string" && name.length > 0)
        : [],
    );
    objectAttachments.set(object.name, attachments);
  });
  const flowTransitions = new Map<string, Set<string>>();

  if (Array.isArray(value.flows)) {
    value.flows.forEach((flow, index) => {
      if (isRecord(flow) && typeof flow.object === "string" && !objectNames.has(flow.object)) {
        context.errors.push(`flows[${index}].object references unknown object "${flow.object}".`);
      }
      if (isRecord(flow) && typeof flow.name === "string") {
        flowTransitions.set(
          flow.name,
          new Set(
            Array.isArray(flow.transitions)
              ? flow.transitions
                  .filter(isRecord)
                  .map(transition => transition.name)
                  .filter((name): name is string => typeof name === "string" && name.length > 0)
              : [],
          ),
        );
      }
    });
  }

  if (Array.isArray(value.surfaces)) {
    value.surfaces.forEach((surface, index) => {
      if (isRecord(surface) && typeof surface.object === "string" && !objectNames.has(surface.object)) {
        context.errors.push(`surfaces[${index}].object references unknown object "${surface.object}".`);
      }
      if (isRecord(surface)) {
        validateBindingReferences(surface.bindings, `surfaces[${index}].bindings`, context, objectNames, objectAttachments, flowTransitions);
        validateSectionBindingReferences(surface.sections, `surfaces[${index}].sections`, context, objectNames, objectAttachments, flowTransitions);
      }
    });
  }

  if (Array.isArray(value.routes)) {
    value.routes.forEach((route, index) => {
      if (isRecord(route) && typeof route.resource === "string" && !objectNames.has(route.resource)) {
        context.errors.push(`routes[${index}].resource references unknown object "${route.resource}".`);
      }
      if (isRecord(route)) {
        validateBindingReferences(route.bindings, `routes[${index}].bindings`, context, objectNames, objectAttachments, flowTransitions);
        validateSectionBindingReferences(route.sections, `routes[${index}].sections`, context, objectNames, objectAttachments, flowTransitions);
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

  if (Array.isArray(value.fixtures)) {
    value.fixtures.forEach((fixture, index) => {
      if (isRecord(fixture) && typeof fixture.resource === "string" && !objectNames.has(fixture.resource)) {
        context.errors.push(`fixtures[${index}].resource references unknown object "${fixture.resource}".`);
      }
    });
  }
}

export function validateSpecV10(value: unknown): StylyfSpecV10 {
  const context: ValidationContext = { errors: [] };

  if (!isRecord(value)) {
    throw new Error("Spec must be a JSON object.");
  }

  const normalized = normalizeSpecAliases(value);

  hasOnlyKeys(
    normalized,
    ["version", "app", "backend", "database", "env", "media", "experience", "actors", "policies", "objects", "flows", "surfaces", "routes", "apis", "server", "fixtures", "navigation"],
    "spec",
    context,
  );

  if (normalized.version !== "1.0") {
    context.errors.push('version must be "1.0".');
  }

  validateApp(normalized.app, context);
  validateBackend(normalized.backend, context);
  validateDatabase(normalized.database, context);
  validateEnv(normalized.env, context);
  validateMedia(normalized.media, context);
  validateExperience(normalized.experience, context);
  validateActors(normalized.actors, context);
  validatePolicies(normalized.policies, context);
  validateObjects(normalized.objects, context);
  validateFlows(normalized.flows, context);
  validateSurfaces(normalized.surfaces, context);
  validateRoutes(normalized.routes, context);
  validateApis(normalized.apis, context);
  validateServer(normalized.server, context);
  validateFixtures(normalized.fixtures, context);
  validateNavigation(normalized.navigation, context);
  validatePolicyReferences(normalized, context);
  validateObjectReferences(normalized, context);

  if (isRecord(normalized.app) && normalized.app.kind === "free-saas-tool") {
    validateNoBillingConcepts(normalized, context);
  }

  if (context.errors.length > 0) {
    throw new Error(`Invalid Stylyf v1.0 spec:\n${context.errors.map(error => `- ${error}`).join("\n")}`);
  }

  return normalized as StylyfSpecV10;
}
