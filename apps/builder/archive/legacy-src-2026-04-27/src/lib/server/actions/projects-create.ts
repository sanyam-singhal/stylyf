import { action } from "@solidjs/router";
import { bootstrapProjectWorkspace, slugify } from "@depths/stylyf-builder-core";
import { createSupabaseServerClient } from "~/lib/supabase";
import { requireViewerIdentity } from "~/lib/server/resource-policy";
import { recordTelemetry } from "~/lib/server/telemetry";

type ProjectsInput = Record<string, unknown>;

function githubBootstrapConfig() {
  const disabled = process.env.STYLYF_BUILDER_CREATE_GITHUB_REPOS === "false";
  if (disabled) return { enabled: false };
  return {
    enabled: true,
    org: process.env.STYLYF_BUILDER_GITHUB_ORG ?? process.env.STYLYF_GITHUB_ORG ?? "Depths-AI",
    private: process.env.STYLYF_BUILDER_GITHUB_VISIBILITY !== "public",
  };
}

export async function createBuilderProject(input: { name: string }) {
  const { userId } = await requireViewerIdentity();
  const name = input.name.trim();
  if (!name) throw new Error("Project name is required.");

  const supabase = createSupabaseServerClient();
  const uniqueSlug = `${slugify(name)}-${Date.now().toString(36).slice(-4)}`;
  const nextInput = {
    owner_id: userId,
    name,
    slug: uniqueSlug,
    status: "generating",
  };
  const { data, error } = await supabase.from("projects").insert(nextInput).select("*").single();
  if (error) throw error;

  try {
    const bootstrap = await bootstrapProjectWorkspace({
      projectId: String(data.id),
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

    const { data: updated, error: updateError } = await supabase
      .from("projects")
      .update({
        status: "draft",
        "workspacePath": bootstrap.workspace.root,
        "githubRepoFullName": bootstrap.repoFullName ?? null,
      })
      .eq("id", data.id)
      .select("*")
      .single();
    if (updateError) throw updateError;

    await recordTelemetry({
      projectId: String(data.id),
      userId,
      kind: "project.created",
      summary: `Project workspace bootstrapped: ${name}`,
    });
    return updated ?? data;
  } catch (error) {
    await supabase.from("projects").update({ status: "error" }).eq("id", data.id);
    await supabase.from("agent_events").insert({
      project_id: data.id,
      owner_id: userId,
      type: "project.bootstrap_failed",
      summary: error instanceof Error ? error.message.slice(0, 500) : "Project bootstrap failed.",
    });
    throw error;
  }
}

export const createProjects = action(async (input: ProjectsInput) => {
  "use server";
  return await createBuilderProject({ name: String(input.name ?? "") });
}, "projects.create");
