import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile(path: string) {
  if (!existsSync(path)) return;
  const source = readFileSync(path, "utf8");
  for (const line of source.split(/\r?\n/g)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [name, ...rawParts] = trimmed.split("=");
    if (!name || process.env[name] !== undefined) continue;
    process.env[name] = rawParts.join("=").replace(/^["']|["']$/g, "");
  }
}

for (const candidate of [".env.local", ".env", "../../.env"]) {
  loadEnvFile(resolve(process.cwd(), candidate));
}

const requiredTables = [
  {
    table: "projects",
    select: "id,owner_id,name,slug,status,summary,workspacePath,previewUrl,preview_port,githubRepoFullName,lastPushedSha,created_at,updated_at",
  },
  {
    table: "agent_events",
    select: "id,project_id,owner_id,session_id,type,summary,role,status,content,artifact_path,content_path,created_at",
  },
  {
    table: "agent_sessions",
    select: "id,project_id,provider,status,thread_id,created_by,created_at,updated_at",
  },
  {
    table: "stylyf_spec_chunks",
    select: "id,project_id,name,kind,spec_text,spec_path,version,is_active,created_by,created_at",
  },
  {
    table: "commands",
    select: "id,project_id,command,cwd,status,exit_code,stdout_path,stderr_path,started_at,completed_at",
  },
  {
    table: "build_runs",
    select: "id,project_id,command_id,kind,status,summary,artifact_path,started_at,completed_at",
  },
  {
    table: "preview_processes",
    select: "id,project_id,port,pid,preview_url,status,started_at,stopped_at,updated_at",
  },
  {
    table: "webknife_runs",
    select: "id,project_id,kind,artifact_path,summary,created_at",
  },
  {
    table: "projects_assets",
    select: "id,resource_id,storage_provider,bucket_name,attachment_name,bucket_alias,object_key,file_name,content_type,file_size,kind,status,metadata_path,replaced_by_asset_id,deleted_at,created_at,updated_at",
  },
] as const;

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SECRET_KEY;

if (!url || !serviceKey) {
  console.error("Builder schema check failed: SUPABASE_URL and SUPABASE_SECRET_KEY are required.");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false },
});

const failures: string[] = [];

for (const required of requiredTables) {
  const { error } = await supabase.from(required.table).select(required.select).limit(0);
  if (error) {
    const hint =
      error.code === "42P01"
        ? "table is missing"
        : error.code === "42703"
          ? "column is missing"
          : error.message;
    failures.push(`${required.table}: ${hint} (${error.message})`);
  }
}

if (failures.length > 0) {
  console.error([
    "Builder schema check failed. Apply apps/builder/supabase/schema.sql and apps/builder/supabase/policies.sql to the Supabase project.",
    ...failures.map(failure => `- ${failure}`),
  ].join("\n"));
  process.exit(1);
}

console.log("Builder schema check passed. Required table/column contract is present.");
