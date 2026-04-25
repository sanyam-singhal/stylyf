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
  const resource = resources[0]?.name;
  return [
    { name: "Home", kind: resource ? "dashboard" : "landing", path: "/", audience: resource ? "user" : "public" },
    ...(resource
      ? [
          { name: titleFor(resource), kind: "list" as const, object: resource, path: `/${slugify(resource)}`, audience: "user" as const },
          { name: `Create ${singularTitle(resource)}`, kind: "create" as const, object: resource, path: `/${slugify(resource)}/new`, audience: "user" as const },
          { name: "Settings", kind: "settings" as const, path: "/settings", audience: "user" as const },
        ]
      : []),
  ];
}

export const genericExpansion: KindExpansion = {
  shell: "sidebar-app",
  defaultObjects,
  defaultFlows,
  defaultSurfaces,
};
