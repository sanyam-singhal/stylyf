import type { AppIR } from "./types.js";

export const appIrSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://stylyf.dev/schemas/app-ir.json",
  title: "Stylyf App IR",
  type: "object",
  required: ["name", "shell", "theme", "routes"],
  additionalProperties: false,
  properties: {
    name: { type: "string", minLength: 1 },
    shell: { enum: ["sidebar-app", "topbar-app", "docs-shell", "marketing-shell"] },
    theme: {
      type: "object",
      required: ["preset", "mode", "radius", "density", "spacing", "fonts"],
      additionalProperties: false,
      properties: {
        preset: { enum: ["amber", "emerald", "pearl", "opal"] },
        mode: { enum: ["light", "dark", "system"] },
        radius: { enum: ["edge", "trim", "soft", "mellow"] },
        density: { enum: ["compact", "comfortable", "relaxed"] },
        spacing: { enum: ["tight", "balanced", "airy"] },
        fonts: {
          type: "object",
          required: ["fancy", "sans", "mono"],
          additionalProperties: false,
          properties: {
            fancy: { type: "string", minLength: 1 },
            sans: { type: "string", minLength: 1 },
            mono: { type: "string", minLength: 1 },
          },
        },
      },
    },
    routes: {
      type: "array",
      minItems: 1,
    },
  },
} as const satisfies Record<string, unknown>;

export function schemaAsJson() {
  return JSON.stringify(appIrSchema, null, 2);
}

export type AppIrSchema = typeof appIrSchema & { __type?: AppIR };

