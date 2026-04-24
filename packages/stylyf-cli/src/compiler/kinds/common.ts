import type { AppShellId, ResourceIR } from "../generated-app.js";
import { humanize, singularize } from "../defaults.js";
import type { FlowSpec, ObjectSpec, StylyfSpecV04, SurfaceSpec } from "../../spec/types.js";

export type KindExpansion = {
  shell: AppShellId;
  defaultObjects(spec: StylyfSpecV04): ObjectSpec[];
  defaultFlows(spec: StylyfSpecV04, resources: ResourceIR[]): FlowSpec[];
  defaultSurfaces(spec: StylyfSpecV04, resources: ResourceIR[]): SurfaceSpec[];
};

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function titleFor(value: string) {
  return humanize(value);
}

export function singularTitle(value: string) {
  return titleFor(singularize(value));
}
