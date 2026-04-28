import { action, query, redirect } from "@solidjs/router";
import { bootstrapProjectWorkspace, slugify } from "@depths/stylyf-builder-core";
import { requireSession } from "~/lib/auth";
import { createSupabaseServerClient } from "~/lib/supabase";

export type ProjectRecord = {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  status: "draft" | "generating" | "ready" | "error" | "archived";
  summary: string | null;
  workspacePath: string | null;
  previewUrl: string | null;
  githubRepoFullName: string | null;
  lastPushedSha: string | null;
  created_at: string;
  updated_at: string;
};

export const demoProject = {
  id: "demo",
  owner_id: "demo",
  name: "ContentRank",
  slug: "contentrank",
  status: "draft",
  summary: "A public rating site for user-submitted social posts.",
  workspacePath: null,
  previewUrl: null,
  githubRepoFullName: null,
  lastPushedSha: null,
  created_at: new Date(0).toISOString(),
  updated_at: new Date(0).toISOString(),
} satisfies ProjectRecord;

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function githubBootstrapConfig() {
  const disabled = process.env.STYLYF_BUILDER_CREATE_GITHUB_REPOS === "false";
  if (disabled) return { enabled: false };
  return {
    enabled: true,
    org: process.env.STYLYF_BUILDER_GITHUB_ORG ?? process.env.STYLYF_GITHUB_ORG ?? "Depths-AI",
    private: process.env.STYLYF_BUILDER_GITHUB_VISIBILITY !== "public",
  };
}

async function getUserId() {
  const session = await requireSession();
  return session.user.id;
}

export const listProjects = query(async (): Promise<ProjectRecord[]> => {
  "use server";
  await getUserId();
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, owner_id, name, slug, status, summary, workspacePath, previewUrl, githubRepoFullName, lastPushedSha, created_at, updated_at")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ProjectRecord[];
}, "builder.projects.list");

export const getProject = query(async (id: string): Promise<ProjectRecord | null> => {
  "use server";
  if (!isUuid(id)) return id === "demo" ? demoProject : null;
  await getUserId();
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, owner_id, name, slug, status, summary, workspacePath, previewUrl, githubRepoFullName, lastPushedSha, created_at, updated_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as ProjectRecord | null;
}, "builder.projects.detail");

export const createProject = action(async (formData: FormData) => {
  "use server";
  const userId = await getUserId();
  const nameValue = formData.get("name");
  const name = typeof nameValue === "string" ? nameValue.trim() : "";
  if (!name) throw new Error("Name the app before opening the studio.");

  const supabase = createSupabaseServerClient();
  const uniqueSlug = `${slugify(name)}-${Date.now().toString(36).slice(-4)}`;
  const { data: created, error: createError } = await supabase
    .from("projects")
    .insert({
      owner_id: userId,
      name,
      slug: uniqueSlug,
      status: "generating",
      summary: "New app draft.",
    })
    .select("id, owner_id, name, slug, status, summary, workspacePath, previewUrl, githubRepoFullName, lastPushedSha, created_at, updated_at")
    .single();
  if (createError) throw createError;

  try {
    const bootstrap = await bootstrapProjectWorkspace({
      projectId: String(created.id),
      name,
      description: "Created from the internal Stylyf Builder.",
      github: {
        ...githubBootstrapConfig(),
        repoName: uniqueSlug,
      },
      git: {
        userName: process.env.STYLYF_BUILDER_GIT_USER_NAME ?? "Depths AI Builder",
        userEmail: process.env.STYLYF_BUILDER_GIT_USER_EMAIL ?? "builder@depthsai.com",
      },
    });

    const { error: updateError } = await supabase
      .from("projects")
      .update({
        status: "draft",
        workspacePath: bootstrap.workspace.root,
        githubRepoFullName: bootstrap.repoFullName ?? null,
      })
      .eq("id", created.id);
    if (updateError) throw updateError;

    await supabase.from("agent_events").insert({
      project_id: created.id,
      owner_id: userId,
      type: "project.created",
      summary: `Created ${name}.`,
    });
  } catch (error) {
    await supabase.from("projects").update({ status: "error" }).eq("id", created.id);
    await supabase.from("agent_events").insert({
      project_id: created.id,
      owner_id: userId,
      type: "project.bootstrap_failed",
      summary: error instanceof Error ? error.message.slice(0, 500) : "Project bootstrap failed.",
    });
    throw error;
  }

  throw redirect(`/projects/${String(created.id)}`);
}, "builder.projects.create");
