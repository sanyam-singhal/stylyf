import { getSession, requireSession } from "~/lib/server/guards";

function extractUserId(session: unknown) {
  if (!session || typeof session !== "object") return null;
  const record = session as { user?: { id?: string | null }; session?: { userId?: string | null } };
  return record.user?.id ?? record.session?.userId ?? null;
}

export const resourcePolicies = [
  {
    "name": "projects",
    "table": "projects",
    "visibility": "private",
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
    }
  },
  {
    "name": "agent_events",
    "table": "agent_events",
    "visibility": "private",
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
    }
  }
] as const;

export const rolePolicies = [
  {
    "name": "admin",
    "description": "Full privileged operator role. Generated code requires an explicit membership row before this grants access."
  },
  {
    "name": "editor",
    "description": "Content/editorial operator role. Generated code requires an explicit membership row before this grants access."
  },
  {
    "name": "member",
    "description": "Default workspace member role."
  }
] as const;

export const membershipPolicies = [
  {
    "name": "workspace",
    "table": "workspace_memberships",
    "userField": "user_id",
    "workspaceField": "workspace_id",
    "roleField": "role",
    "roles": [
      "admin",
      "editor",
      "member"
    ]
  }
] as const;

export const actorPolicies = [
  {
    "actor": "admin",
    "role": "admin",
    "membership": "workspace"
  },
  {
    "actor": "editor",
    "role": "editor",
    "membership": "workspace"
  },
  {
    "actor": "member",
    "role": "member",
    "membership": "workspace"
  }
] as const;

export async function getViewerIdentity() {
  const session = await getSession();
  return { session, userId: extractUserId(session) };
}

export async function requireViewerIdentity() {
  const session = await requireSession();
  const userId = extractUserId(session);
  if (!userId) {
    throw new Error("Authenticated session is missing a user id.");
  }
  return { session, userId };
}

export async function requireWorkspaceMember(_workspaceId: string, _membershipName?: string) {
  await requireViewerIdentity();
  throw new Error("Workspace membership helpers require a generated membership policy table.");
}

export async function requireRole(role: string, _options?: { workspaceId?: string; membership?: string }) {
  await requireViewerIdentity();
  throw new Error(`Role ${role} is not wired to a generated membership policy table.`);
}

export async function requireOwner(ownerId: string | null | undefined) {
  const { userId } = await requireViewerIdentity();
  if (!ownerId || ownerId !== userId) throw new Error("Resource ownership is required for this action.");
  return { userId };
}
