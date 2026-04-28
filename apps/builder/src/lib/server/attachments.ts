import { revalidate } from "@solidjs/router";
import { requireSession } from "~/lib/auth";
import { createPresignedDownload, createPresignedUpload, deleteObject, readObjectMetadata, storageBucket, storagePolicy } from "~/lib/storage";
import { createSupabaseServerClient } from "~/lib/supabase";
import { getTimeline } from "~/lib/server/studio";

type ProjectAssetRecord = {
  id: string;
  resource_id: string;
  object_key: string;
  file_name: string | null;
  content_type: string | null;
  file_size: number | null;
  status: string;
};

export type ReferenceAsset = {
  id: string;
  fileName: string | null;
  contentType: string | null;
  fileSize: number | null;
  status: string;
  createdAt: string;
};

export type ReferenceUploadIntentInput = {
  projectId: string;
  fileName: string;
  contentType: string;
  fileSize: number;
};

function cleanFileName(fileName: string) {
  const fallback = "reference";
  const safe = fileName
    .trim()
    .replace(/[/\\?%*:|"<>]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 90);
  return safe || fallback;
}

async function getUserId() {
  const session = await requireSession();
  return session.user.id;
}

async function requireOwnedProject(projectId: string, userId: string) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, owner_id, name")
    .eq("id", projectId)
    .eq("owner_id", userId)
    .single();
  if (error) throw error;
  return data as { id: string; owner_id: string; name: string };
}

async function requireOwnedAsset(input: { projectId: string; assetId: string; userId: string }) {
  await requireOwnedProject(input.projectId, input.userId);
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("projects_assets")
    .select("id, resource_id, object_key, file_name, content_type, file_size, status")
    .eq("id", input.assetId)
    .eq("resource_id", input.projectId)
    .single();
  if (error) throw error;
  return data as ProjectAssetRecord;
}

export async function listReferenceAssets(projectId: string): Promise<ReferenceAsset[]> {
  if (projectId === "demo") return [];
  const userId = await getUserId();
  await requireOwnedProject(projectId, userId);
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("projects_assets")
    .select("id, file_name, content_type, file_size, status, created_at")
    .eq("resource_id", projectId)
    .eq("attachment_name", "reference")
    .eq("status", "attached")
    .order("created_at", { ascending: false })
    .limit(12);
  if (error) throw error;

  return (data ?? []).map(asset => ({
    id: String(asset.id),
    fileName: typeof asset.file_name === "string" ? asset.file_name : null,
    contentType: typeof asset.content_type === "string" ? asset.content_type : null,
    fileSize: typeof asset.file_size === "number" ? asset.file_size : null,
    status: typeof asset.status === "string" ? asset.status : "unknown",
    createdAt: typeof asset.created_at === "string" ? asset.created_at : "",
  }));
}

export async function createReferenceUploadIntent(input: ReferenceUploadIntentInput) {
  const userId = await getUserId();
  const project = await requireOwnedProject(input.projectId, userId);
  const fileName = cleanFileName(input.fileName);
  const contentType = input.contentType || "application/octet-stream";
  if (!Number.isFinite(input.fileSize) || input.fileSize <= 0) {
    throw new Error("Choose a non-empty reference file.");
  }
  if (input.fileSize > storagePolicy.maxFileSizeBytes) {
    throw new Error("Reference file is too large for the builder upload policy.");
  }

  const assetId = crypto.randomUUID();
  const objectKey = `${storagePolicy.keyPrefix}/projects/${project.id}/references/${assetId}-${fileName}`;
  const upload = await createPresignedUpload({
    key: objectKey,
    contentType,
    fileSize: input.fileSize,
  });

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("projects_assets").insert({
    id: assetId,
    resource_id: project.id,
    storage_provider: "tigris",
    bucket_name: storageBucket(),
    attachment_name: "reference",
    bucket_alias: "uploads",
    object_key: objectKey,
    file_name: fileName,
    content_type: contentType,
    file_size: input.fileSize,
    kind: "file",
    status: "pending",
  });
  if (error) throw error;

  return {
    assetId,
    upload,
  };
}

export async function confirmReferenceUpload(input: { projectId: string; assetId: string }) {
  const userId = await getUserId();
  await requireOwnedProject(input.projectId, userId);
  const supabase = createSupabaseServerClient();

  const { data: asset, error: assetError } = await supabase
    .from("projects_assets")
    .select("id, resource_id, object_key, file_name, content_type, file_size, status")
    .eq("id", input.assetId)
    .eq("resource_id", input.projectId)
    .single();
  if (assetError) throw assetError;
  const record = asset as ProjectAssetRecord;

  if (record.status !== "pending" && record.status !== "attached") {
    throw new Error("Reference upload is not in an attachable state.");
  }
  const objectMetadata = await readObjectMetadata(record.object_key);
  if (record.file_size !== null && objectMetadata.fileSize !== null && objectMetadata.fileSize !== record.file_size) {
    throw new Error("Reference upload size does not match the upload intent.");
  }

  const { error: updateError } = await supabase
    .from("projects_assets")
    .update({ status: "attached" })
    .eq("id", record.id);
  if (updateError) throw updateError;

  const { error: pointerError } = await supabase.from("asset_pointers").upsert(
    {
      project_id: input.projectId,
      owner_id: userId,
      storage_provider: "tigris",
      bucket_name: storageBucket(),
      object_key: record.object_key,
      purpose: "media",
      content_type: record.content_type,
      file_size: record.file_size,
      summary: record.file_name ? `Reference: ${record.file_name}` : "Reference file",
    },
    { onConflict: "object_key" },
  );
  if (pointerError) throw pointerError;

  await supabase.from("agent_events").insert({
    project_id: input.projectId,
    owner_id: userId,
    type: "reference.attached",
    summary: record.file_name ? `Attached ${record.file_name}.` : "Attached reference file.",
  });
  await revalidate(getTimeline.keyFor(input.projectId));

  return {
    ok: true,
    assetId: record.id,
    fileName: record.file_name,
  };
}

export async function createReferenceDownload(input: { projectId: string; assetId: string }) {
  const userId = await getUserId();
  const asset = await requireOwnedAsset({ projectId: input.projectId, assetId: input.assetId, userId });
  if (asset.status !== "attached") {
    throw new Error("Reference file is not available for download.");
  }
  const download = await createPresignedDownload({ key: asset.object_key });
  return {
    ok: true,
    assetId: asset.id,
    fileName: asset.file_name,
    download,
  };
}

export async function deleteReferenceAsset(input: { projectId: string; assetId: string }) {
  const userId = await getUserId();
  const asset = await requireOwnedAsset({ projectId: input.projectId, assetId: input.assetId, userId });
  if (asset.status === "deleted") {
    return { ok: true, assetId: asset.id };
  }

  if (asset.status === "attached" || asset.status === "pending") {
    await deleteObject(asset.object_key);
  }
  const supabase = createSupabaseServerClient();
  const { error: assetError } = await supabase
    .from("projects_assets")
    .update({ status: "deleted", deleted_at: new Date().toISOString() })
    .eq("id", asset.id);
  if (assetError) throw assetError;

  const { error: pointerError } = await supabase.from("asset_pointers").delete().eq("object_key", asset.object_key);
  if (pointerError) throw pointerError;

  await supabase.from("agent_events").insert({
    project_id: input.projectId,
    owner_id: userId,
    type: "reference.deleted",
    summary: asset.file_name ? `Deleted ${asset.file_name}.` : "Deleted reference file.",
  });
  await revalidate(getTimeline.keyFor(input.projectId));
  return { ok: true, assetId: asset.id };
}
