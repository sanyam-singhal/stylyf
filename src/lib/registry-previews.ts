import type { Component } from "solid-js";
import { previewBySlug as eagerFirstClusterPreviewBySlug } from "~/components/registry/actions-navigation/demos";
import type { RegistryClusterSection, RegistryItem } from "~/lib/registry";

type RegistryPreviewComponent = Component<{ item: RegistryItem }>;
type PreviewMap = Record<string, RegistryPreviewComponent>;
type PreviewModule = {
  previewBySlug?: PreviewMap;
};

const clusterPreviewLoaders: Record<string, () => Promise<PreviewModule>> = {
  "tier-1-data-structure": () => import("../components/registry/data-structure/demos"),
  "tier-1-disclosure-overlay": () => import("../components/registry/disclosure-overlay/demos"),
  "tier-1-feedback-display": () => import("../components/registry/feedback-display/demos"),
  "tier-1-form-inputs": () => import("../components/registry/form-inputs/demos"),
  "tier-2-form-systems": () => import("../components/registry/form-systems/demos"),
  "tier-2-data-views": () => import("../components/registry/data-views/demos"),
  "tier-2-information-states": () => import("../components/registry/information-states/demos"),
  "tier-2-navigation-workflow": () => import("../components/registry/navigation-workflow/demos"),
  "tier-2-commercial-content": () => import("../components/registry/commercial-content/demos"),
};

export const eagerClusterIds = new Set(["tier-1-actions-navigation"]);

export function eagerPreviewMapForCluster(clusterId: string) {
  if (clusterId === "tier-1-actions-navigation") {
    return eagerFirstClusterPreviewBySlug satisfies PreviewMap;
  }

  return undefined;
}

export async function loadPreviewMapForCluster(cluster: RegistryClusterSection) {
  const eagerPreviewMap = eagerPreviewMapForCluster(cluster.id);

  if (eagerPreviewMap) {
    return eagerPreviewMap;
  }

  const loader = clusterPreviewLoaders[cluster.id];

  if (!loader) {
    return {} satisfies PreviewMap;
  }

  const module = await loader();
  return module.previewBySlug ?? ({} satisfies PreviewMap);
}
