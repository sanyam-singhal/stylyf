-- Stylyf Builder Supabase schema
-- Apply this once in the Supabase SQL editor for the internal builder project.
-- It is intentionally builder-owned and stricter than the generic scaffold schema.
-- Postgres stores scalar records, text fields, and pointers only.
-- Variable-sized media, screenshots, logs, large metadata, and handoff artifacts belong in Tigris/S3-compatible object storage or the project filesystem.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

-- Remove stale scaffold-era tables that are not part of the current builder runtime.
drop table if exists public.agent_events_assets cascade;
drop table if exists public.approvals cascade;
drop table if exists public.previews cascade;
drop table if exists public.stylyf_specs cascade;
drop table if exists public.briefs cascade;
drop table if exists public.project_briefs cascade;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  role text not null default 'builder' check (role in ('admin', 'builder', 'viewer')),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  slug text not null unique,
  status text not null default 'draft' check (status in ('draft', 'generating', 'ready', 'error', 'archived')),
  summary text,
  "workspacePath" text,
  preview_port integer,
  "previewUrl" text,
  "githubRepoFullName" text,
  github_default_branch text not null default 'main',
  "lastPushedSha" text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists projects_owner_id_idx on public.projects(owner_id);
create index if not exists projects_status_idx on public.projects(status);

drop trigger if exists set_projects_updated_at on public.projects;
create trigger set_projects_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

create table if not exists public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'viewer' check (role in ('owner', 'editor', 'viewer')),
  created_at timestamptz not null default timezone('utc'::text, now()),
  primary key (project_id, user_id)
);

create index if not exists project_members_user_id_idx on public.project_members(user_id);

create table if not exists public.stylyf_spec_chunks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('brief', 'style', 'routes', 'data', 'api', 'media', 'raw', 'generated')),
  spec_text text not null default '{}',
  spec_path text,
  version integer not null default 1,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists stylyf_spec_chunks_project_id_idx on public.stylyf_spec_chunks(project_id);
create index if not exists stylyf_spec_chunks_kind_idx on public.stylyf_spec_chunks(kind);

create table if not exists public.agent_sessions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  provider text not null default 'codex',
  thread_id text,
  status text not null default 'idle' check (status in ('idle', 'running', 'waiting_approval', 'completed', 'error', 'cancelled')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists agent_sessions_project_id_idx on public.agent_sessions(project_id);

drop trigger if exists set_agent_sessions_updated_at on public.agent_sessions;
create trigger set_agent_sessions_updated_at
before update on public.agent_sessions
for each row execute function public.set_updated_at();

create table if not exists public.agent_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  session_id uuid references public.agent_sessions(id) on delete set null,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  role text check (role in ('system', 'builder', 'user', 'assistant', 'tool')),
  status text not null default 'completed' check (status in ('queued', 'running', 'completed', 'failed', 'cancelled')),
  summary text,
  content text,
  artifact_path text,
  content_path text,
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.agent_events
  add column if not exists session_id uuid references public.agent_sessions(id) on delete set null,
  add column if not exists owner_id uuid references public.profiles(id) on delete cascade,
  add column if not exists role text check (role in ('system', 'builder', 'user', 'assistant', 'tool')),
  add column if not exists status text not null default 'completed' check (status in ('queued', 'running', 'completed', 'failed', 'cancelled')),
  add column if not exists content text,
  add column if not exists content_path text;

update public.agent_events
set owner_id = projects.owner_id
from public.projects
where public.agent_events.project_id = projects.id
  and public.agent_events.owner_id is null;

create index if not exists agent_events_project_id_idx on public.agent_events(project_id);
create index if not exists agent_events_owner_id_idx on public.agent_events(owner_id);
create index if not exists agent_events_type_idx on public.agent_events(type);

create table if not exists public.commands (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  session_id uuid references public.agent_sessions(id) on delete set null,
  command text not null,
  cwd text not null,
  summary text,
  status text not null default 'queued' check (status in ('queued', 'running', 'completed', 'failed', 'cancelled')),
  exit_code integer,
  stdout_path text,
  stderr_path text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists commands_project_id_idx on public.commands(project_id);
create index if not exists commands_status_idx on public.commands(status);

create table if not exists public.build_runs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  command_id uuid references public.commands(id) on delete set null,
  kind text not null check (kind in ('compose', 'validate', 'plan', 'generate', 'install', 'typecheck', 'build', 'preview', 'webknife')),
  status text not null default 'queued' check (status in ('queued', 'running', 'completed', 'failed', 'cancelled')),
  summary text,
  artifact_path text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists build_runs_project_id_idx on public.build_runs(project_id);
create index if not exists build_runs_status_idx on public.build_runs(status);

drop trigger if exists set_build_runs_updated_at on public.build_runs;
create trigger set_build_runs_updated_at
before update on public.build_runs
for each row execute function public.set_updated_at();

create table if not exists public.preview_processes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  port integer not null,
  pid integer,
  preview_url text,
  status text not null default 'stopped' check (status in ('starting', 'running', 'stopped', 'crashed', 'stale')),
  log_path text,
  started_at timestamptz,
  stopped_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists preview_processes_project_id_idx on public.preview_processes(project_id);

drop trigger if exists set_preview_processes_updated_at on public.preview_processes;
create trigger set_preview_processes_updated_at
before update on public.preview_processes
for each row execute function public.set_updated_at();

create table if not exists public.webknife_runs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  kind text not null,
  artifact_path text,
  summary text,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists webknife_runs_project_id_idx on public.webknife_runs(project_id);

create table if not exists public.git_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  kind text not null check (kind in ('repo_created', 'commit_created', 'push_completed', 'push_failed', 'handoff_ready')),
  repo_full_name text,
  branch text,
  commit_sha text,
  summary text,
  payload_path text,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists git_events_project_id_idx on public.git_events(project_id);
create index if not exists git_events_kind_idx on public.git_events(kind);

create table if not exists public.asset_pointers (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  owner_id uuid references public.profiles(id) on delete set null,
  storage_provider text not null default 'tigris',
  bucket_name text not null,
  object_key text unique not null,
  purpose text not null check (purpose in ('media', 'screenshot', 'log', 'metadata', 'handoff')),
  content_type text,
  file_size integer,
  summary text,
  created_at timestamptz not null default timezone('utc'::text, now())
);

comment on table public.asset_pointers is 'Scalar object-storage pointers only. Raw media, screenshots, logs, and large metadata must stay outside Postgres.';

create index if not exists asset_pointers_project_id_idx on public.asset_pointers(project_id);
create index if not exists asset_pointers_purpose_idx on public.asset_pointers(purpose);

create table if not exists public.projects_assets (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.projects(id) on delete cascade,
  storage_provider text not null default 'tigris',
  bucket_name text not null,
  attachment_name text not null,
  bucket_alias text not null,
  object_key text unique not null,
  file_name text,
  content_type text,
  file_size integer,
  kind text not null,
  status text not null,
  metadata_path text,
  replaced_by_asset_id uuid references public.projects_assets(id) on delete set null,
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

comment on table public.projects_assets is 'Reference asset records for projects. Store object keys and scalar metadata only; put variable-sized metadata behind metadata_path.';

create index if not exists projects_assets_resource_id_idx on public.projects_assets(resource_id);

drop trigger if exists set_projects_assets_updated_at on public.projects_assets;
create trigger set_projects_assets_updated_at
before update on public.projects_assets
for each row execute function public.set_updated_at();
