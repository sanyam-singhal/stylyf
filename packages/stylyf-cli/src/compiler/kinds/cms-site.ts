import type { ResourceIR } from "../generated-app.js";
import type { KindExpansion } from "./common.js";
import { singularTitle, slugify, titleFor } from "./common.js";
import type { FlowSpec, ObjectSpec, StylyfSpecV04, SurfaceSpec } from "../../spec/types.js";

function defaultObjects(spec: StylyfSpecV04): ObjectSpec[] {
  if (spec.objects && spec.objects.length > 0) {
    return spec.objects;
  }

  return [
    {
      name: "articles",
      ownership: "user",
      visibility: "mixed",
      fields: [
        { name: "title", type: "short-text", required: true },
        { name: "slug", type: "slug", required: true, unique: true },
        { name: "excerpt", type: "long-text" },
        { name: "body", type: "rich-text" },
        { name: "status", type: "status", options: ["draft", "review", "published", "archived"] },
        { name: "published_at", type: "datetime" },
      ],
    },
  ];
}

function defaultFlows(spec: StylyfSpecV04, resources: ResourceIR[]): FlowSpec[] {
  if (spec.flows && spec.flows.length > 0) {
    return spec.flows;
  }

  const primary = resources[0]?.name;
  return primary ? [{ name: "contentPublishing", object: primary, kind: "publishing" }] : [];
}

function defaultSurfaces(_spec: StylyfSpecV04, resources: ResourceIR[]): SurfaceSpec[] {
  const article = resources.find(resource => resource.name === "articles") ?? resources[0];
  const articleName = article?.name ?? "articles";
  return [
    { name: "Home", kind: "landing", path: "/", audience: "public" },
    { name: titleFor(articleName), kind: "content-index", object: articleName, path: `/${slugify(articleName)}`, audience: "public" },
    { name: singularTitle(articleName), kind: "content-detail", object: articleName, path: `/${slugify(articleName)}/:slug`, audience: "public" },
    { name: "Content", kind: "content-index", object: articleName, path: "/admin/content", audience: "admin" },
    { name: "Create content", kind: "create", object: articleName, path: "/admin/content/new", audience: "admin" },
    { name: "Edit content", kind: "edit", object: articleName, path: "/admin/content/:id/edit", audience: "admin" },
  ];
}

export const cmsSiteExpansion: KindExpansion = {
  shell: "sidebar-app",
  defaultObjects,
  defaultFlows,
  defaultSurfaces,
};
