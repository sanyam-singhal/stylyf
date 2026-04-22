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
    env: {
      type: "object",
      additionalProperties: false,
      properties: {
        extras: {
          type: "array",
          items: {
            type: "object",
            required: ["name"],
            additionalProperties: false,
            properties: {
              name: { type: "string", minLength: 1 },
              exposure: { enum: ["server", "public"] },
              required: { type: "boolean" },
              example: { type: "string" },
              description: { type: "string" },
            },
          },
        },
      },
    },
    database: {
      type: "object",
      required: ["dialect"],
      additionalProperties: false,
      properties: {
        dialect: { enum: ["postgres", "sqlite"] },
        migrations: { enum: ["drizzle-kit"] },
        schema: {
          type: "array",
          items: {
            type: "object",
            required: ["table", "columns"],
            additionalProperties: false,
            properties: {
              table: { type: "string", minLength: 1 },
              columns: {
                type: "array",
                minItems: 1,
                items: {
                  type: "object",
                  required: ["name", "type"],
                  additionalProperties: false,
                  properties: {
                    name: { type: "string", minLength: 1 },
                    type: { enum: ["text", "varchar", "integer", "boolean", "timestamp", "jsonb", "uuid"] },
                    nullable: { type: "boolean" },
                    primaryKey: { type: "boolean" },
                    unique: { type: "boolean" },
                  },
                },
              },
              timestamps: { type: "boolean" },
            },
          },
        },
      },
    },
    auth: {
      type: "object",
      required: ["provider"],
      additionalProperties: false,
      properties: {
        provider: { enum: ["better-auth"] },
        mode: { enum: ["session"] },
        features: {
          type: "object",
          additionalProperties: false,
          properties: {
            emailPassword: { type: "boolean" },
            magicLink: { type: "boolean" },
          },
        },
        protect: {
          type: "array",
          items: {
            type: "object",
            required: ["target", "kind", "access"],
            additionalProperties: false,
            properties: {
              target: { type: "string", minLength: 1 },
              kind: { enum: ["route", "api", "server"] },
              access: { enum: ["public", "user"] },
            },
          },
        },
      },
    },
    storage: {
      type: "object",
      required: ["provider"],
      additionalProperties: false,
      properties: {
        provider: { enum: ["s3"] },
        mode: { enum: ["presigned-put"] },
        bucketAlias: { type: "string", minLength: 1 },
      },
    },
    apis: {
      type: "array",
      items: {
        type: "object",
        required: ["path", "method", "type", "name"],
        additionalProperties: false,
        properties: {
          path: { type: "string", minLength: 1 },
          method: { enum: ["GET", "POST", "PATCH", "DELETE"] },
          type: { enum: ["json", "webhook", "presign-upload"] },
          name: { type: "string", minLength: 1 },
          auth: { enum: ["public", "user"] },
        },
      },
    },
    server: {
      type: "array",
      items: {
        type: "object",
        required: ["name", "type"],
        additionalProperties: false,
        properties: {
          name: { type: "string", minLength: 1 },
          type: { enum: ["query", "action"] },
          resource: { type: "string", minLength: 1 },
          auth: { enum: ["public", "user"] },
        },
      },
    },
  },
} as const satisfies Record<string, unknown>;

export function schemaAsJson() {
  return JSON.stringify(appIrSchema, null, 2);
}

export type AppIrSchema = typeof appIrSchema & { __type?: AppIR };
