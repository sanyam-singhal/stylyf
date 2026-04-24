import type { AppKind, BackendMode, MediaMode, StylyfSpecV04 } from "./types.js";

function defaultPortableBackend(mode: BackendMode): StylyfSpecV04["backend"] {
  if (mode === "hosted") {
    return { mode: "hosted" };
  }

  return {
    mode: "portable",
    portable: {
      database: "sqlite",
    },
  };
}

function defaultExperience(): StylyfSpecV04["experience"] {
  return {
    theme: "opal",
    mode: "light",
    radius: "trim",
    density: "comfortable",
    spacing: "tight",
  };
}

export function createSpecPreset(options: {
  kind: AppKind;
  name: string;
  backend: BackendMode;
  media: MediaMode;
}): StylyfSpecV04 {
  const base = {
    version: "0.4" as const,
    app: {
      name: options.name,
      kind: options.kind,
    },
    backend: defaultPortableBackend(options.backend),
    media: {
      mode: options.media,
    },
    experience: defaultExperience(),
  };

  if (options.kind === "cms-site") {
    return {
      ...base,
      app: {
        ...base.app,
        description: "A publishing workspace with public content routes.",
      },
      objects: [
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
          ],
        },
      ],
      flows: [
        {
          name: "contentPublishing",
          object: "articles",
          kind: "publishing",
        },
      ],
    };
  }

  if (options.kind === "free-saas-tool") {
    return {
      ...base,
      app: {
        ...base.app,
        description: "A free utility app with an optional saved-results loop.",
      },
      flows: [
        {
          name: "savedResults",
          object: "tool_runs",
          kind: "saved-results",
        },
      ],
      surfaces: [
        { name: "Landing", kind: "landing", path: "/", audience: "public" },
        { name: "Tool", kind: "tool", path: "/tool", audience: "public" },
      ],
    };
  }

  if (options.kind === "generic") {
    return {
      ...base,
      app: {
        ...base.app,
        description: "A general full-stack SolidStart app scaffold with reusable resources and surfaces.",
      },
      objects: [
        {
          name: "records",
          ownership: "user",
          visibility: "private",
          fields: [
            { name: "title", type: "short-text", required: true },
            { name: "status", type: "status", options: ["draft", "active", "archived"] },
            { name: "notes", type: "long-text" },
          ],
        },
      ],
      surfaces: [
        { name: "Home", kind: "dashboard", path: "/", audience: "user" },
        { name: "Records", kind: "list", object: "records", path: "/records", audience: "user" },
        { name: "New Record", kind: "create", object: "records", path: "/records/new", audience: "user" },
        { name: "Settings", kind: "settings", path: "/settings", audience: "user" },
      ],
    };
  }

  return {
    ...base,
    app: {
      ...base.app,
      description: "An internal operations workspace.",
    },
    objects: [
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
    ],
  };
}
