import type { ResourceIR } from "../generated-app.js";
import type { KindExpansion } from "./common.js";
import type { FlowSpec, ObjectSpec, StylyfSpecV10, SurfaceSpec } from "../../spec/types.js";

function hasSavedResults(spec: StylyfSpecV10) {
  return (spec.flows ?? []).some(flow => flow.kind === "saved-results");
}

function defaultObjects(spec: StylyfSpecV10): ObjectSpec[] {
  if (spec.objects && spec.objects.length > 0) {
    return spec.objects;
  }

  return hasSavedResults(spec)
    ? [
        {
          name: "tool_runs",
          ownership: "user",
          visibility: "private",
          fields: [
            { name: "input", type: "json" },
            { name: "output", type: "json" },
            { name: "status", type: "status", options: ["queued", "complete", "failed"] },
          ],
        },
      ]
    : [];
}

function defaultFlows(spec: StylyfSpecV10): FlowSpec[] {
  return spec.flows ?? [];
}

function defaultSurfaces(_spec: StylyfSpecV10, resources: ResourceIR[]): SurfaceSpec[] {
  const hasSavedResultsResource = resources.some(resource => resource.name === "tool_runs");
  return [
    { name: "Home", kind: "landing", path: "/", audience: "public" },
    { name: "Tool", kind: "tool", path: "/tool", audience: "public" },
    ...(hasSavedResultsResource
      ? [
          { name: "Dashboard", kind: "dashboard" as const, path: "/dashboard", audience: "user" as const },
          { name: "Settings", kind: "settings" as const, path: "/settings", audience: "user" as const },
        ]
      : []),
  ];
}

export const freeSaasToolExpansion: KindExpansion = {
  shell: "topbar-app",
  defaultObjects,
  defaultFlows,
  defaultSurfaces,
};
