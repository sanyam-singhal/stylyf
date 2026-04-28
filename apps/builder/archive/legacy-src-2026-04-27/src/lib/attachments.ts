export const attachmentCatalog = [
  {
    "resource": "projects",
    "table": "projects_assets",
    "attachments": [
      {
        "name": "upload",
        "kind": "file",
        "bucketAlias": "uploads"
      }
    ]
  },
  {
    "resource": "agent_events",
    "table": "agent_events_assets",
    "attachments": [
      {
        "name": "upload",
        "kind": "file",
        "bucketAlias": "uploads"
      }
    ]
  }
] as const;

export function getAttachmentEntry(resourceName: string) {
  const entry = (attachmentCatalog.find(item => item.resource === resourceName) ?? null) as any;
  if (!entry) throw new Error(`Resource ${resourceName} does not declare any attachments.`);
  return entry;
}

export function getAttachmentDefinition(resourceName: string, attachmentName: string) {
  const entry = getAttachmentEntry(resourceName);
  const attachment = (entry.attachments.find((item: any) => item.name === attachmentName) ?? null) as any;
  if (!attachment) throw new Error(`Unknown attachment ${attachmentName} on resource ${resourceName}.`);
  return attachment;
}
