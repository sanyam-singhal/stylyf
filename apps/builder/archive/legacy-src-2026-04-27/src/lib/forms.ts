export const resourceFormDefinitions = [
  {
    "resource": "projects",
    "table": "projects",
    "fields": [
      {
        "name": "name",
        "label": "Name",
        "type": "text",
        "required": true,
        "enumValues": []
      },
      {
        "name": "slug",
        "label": "Slug",
        "type": "text",
        "required": true,
        "enumValues": []
      },
      {
        "name": "status",
        "label": "Status",
        "type": "enum",
        "required": true,
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
        "label": "Summary",
        "type": "longtext",
        "required": false,
        "enumValues": []
      },
      {
        "name": "workspacePath",
        "label": "Workspace Path",
        "type": "text",
        "required": false,
        "enumValues": []
      },
      {
        "name": "previewUrl",
        "label": "Preview Url",
        "type": "text",
        "required": false,
        "enumValues": []
      },
      {
        "name": "githubRepoFullName",
        "label": "Github Repo Full Name",
        "type": "text",
        "required": false,
        "enumValues": []
      },
      {
        "name": "lastPushedSha",
        "label": "Last Pushed Sha",
        "type": "text",
        "required": false,
        "enumValues": []
      }
    ]
  },
  {
    "resource": "agent_events",
    "table": "agent_events",
    "fields": [
      {
        "name": "type",
        "label": "Type",
        "type": "text",
        "required": true,
        "enumValues": []
      },
      {
        "name": "payload",
        "label": "Payload",
        "type": "json",
        "required": false,
        "enumValues": []
      }
    ]
  }
] as const;

export const resourceFormsByName = Object.fromEntries(resourceFormDefinitions.map(form => [form.resource, form]));
