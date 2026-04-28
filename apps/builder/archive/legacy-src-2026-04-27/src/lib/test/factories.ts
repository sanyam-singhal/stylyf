export const testResources = [
  {
    "name": "projects",
    "fields": [
      {
        "name": "name",
        "required": true,
        "indexed": true,
        "type": "varchar"
      },
      {
        "name": "slug",
        "required": true,
        "unique": true,
        "type": "varchar"
      },
      {
        "name": "status",
        "required": true,
        "default": "draft",
        "type": "enum",
        "enumValues": [
          "draft",
          "generating",
          "ready",
          "error",
          "archived"
        ]
      },
      {
        "name": "summary",
        "type": "longtext"
      },
      {
        "name": "workspacePath",
        "type": "varchar"
      },
      {
        "name": "previewUrl",
        "type": "varchar"
      },
      {
        "name": "githubRepoFullName",
        "type": "varchar"
      },
      {
        "name": "lastPushedSha",
        "type": "varchar"
      }
    ]
  },
  {
    "name": "agent_events",
    "fields": [
      {
        "name": "type",
        "required": true,
        "indexed": true,
        "type": "varchar"
      },
      {
        "name": "payload",
        "type": "jsonb"
      }
    ]
  }
] as const;

export function uniqueTestEmail(prefix = "stylyf") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`;
}

export function sampleRecord(overrides: Record<string, unknown> = {}) {
  return {
    title: "Generated smoke record",
    status: "draft",
    ...overrides,
  };
}
