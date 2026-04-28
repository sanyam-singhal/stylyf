export const resourceDefinitions = [
  {
    "name": "projects",
    "table": "projects",
    "visibility": "private",
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
    ],
    "ownership": {
      "model": "user",
      "ownerField": "owner_id"
    },
    "access": {
      "list": "user",
      "read": "owner",
      "create": "user",
      "update": "owner",
      "delete": "owner"
    },
    "attachments": [
      {
        "name": "upload",
        "kind": "file"
      }
    ]
  },
  {
    "name": "agent_events",
    "table": "agent_events",
    "visibility": "private",
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
    ],
    "ownership": {
      "model": "user",
      "ownerField": "owner_id"
    },
    "access": {
      "list": "owner",
      "read": "owner",
      "create": "owner",
      "update": "owner",
      "delete": "owner"
    },
    "attachments": [
      {
        "name": "upload",
        "kind": "file"
      }
    ]
  }
] as const;

export const attachmentDefinitions = [
  {
    "resource": "projects",
    "table": "projects_assets",
    "attachments": [
      {
        "name": "upload",
        "kind": "file"
      }
    ]
  },
  {
    "resource": "agent_events",
    "table": "agent_events_assets",
    "attachments": [
      {
        "name": "upload",
        "kind": "file"
      }
    ]
  }
] as const;

type WorkflowDefinition = {
  name: string;
};

export const workflowDefinitions = [] as readonly WorkflowDefinition[];

export const resourcesByName = Object.fromEntries(resourceDefinitions.map(resource => [resource.name, resource]));
export const attachmentsByResource = Object.fromEntries(attachmentDefinitions.map(entry => [entry.resource, entry]));
export const workflowsByName = Object.fromEntries(workflowDefinitions.map(workflow => [workflow.name, workflow]));
