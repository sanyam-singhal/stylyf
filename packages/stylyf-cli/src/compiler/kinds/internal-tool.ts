import type { ResourceIR } from "../generated-app.js";
import type { KindExpansion } from "./common.js";
import { singularTitle, slugify, titleFor } from "./common.js";
import type { FlowSpec, ObjectSpec, StylyfSpecV10, SurfaceSpec } from "../../spec/types.js";

function defaultObjects(spec: StylyfSpecV10): ObjectSpec[] {
  if (spec.objects && spec.objects.length > 0) {
    return spec.objects;
  }

  return [
    {
      name: "records",
      ownership: "user",
      visibility: "private",
      fields: [
        { name: "title", type: "short-text", required: true },
        { name: "status", type: "status", options: ["draft", "review", "approved"] },
        { name: "summary", type: "long-text" },
      ],
    },
  ];
}

function defaultFlows(spec: StylyfSpecV10): FlowSpec[] {
  return spec.flows ?? [];
}

function defaultSurfaces(_spec: StylyfSpecV10, resources: ResourceIR[]): SurfaceSpec[] {
  return [
    { name: "Overview", kind: "dashboard", path: "/", audience: "user" },
    ...resources.flatMap(resource => [
      { name: titleFor(resource.name), kind: "list" as const, object: resource.name, path: `/${slugify(resource.name)}`, audience: "user" as const },
      { name: `Create ${singularTitle(resource.name)}`, kind: "create" as const, object: resource.name, path: `/${slugify(resource.name)}/new`, audience: "user" as const },
      { name: `Edit ${singularTitle(resource.name)}`, kind: "edit" as const, object: resource.name, path: `/${slugify(resource.name)}/:id/edit`, audience: "user" as const },
    ]),
    { name: "Settings", kind: "settings", path: "/settings", audience: "user" },
  ];
}

export const internalToolExpansion: KindExpansion = {
  shell: "sidebar-app",
  defaultObjects,
  defaultFlows,
  defaultSurfaces,
};
