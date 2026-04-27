-- Stylyf Builder Supabase schema
-- Apply this once in the Supabase SQL editor for the internal builder project.
-- It is intentionally builder-owned and stricter than the generic scaffold schema.

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

create table if not exists public.briefs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  content jsonb not null default '{}'::jsonb,
  version integer not null default 1,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists briefs_project_id_idx on public.briefs(project_id);

create table if not exists public.stylyf_specs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  kind text not null default 'full',
  spec jsonb not null,
  version integer not null default 1,
  is_active boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create unique index if not exists stylyf_specs_one_active_per_project_idx
on public.stylyf_specs(project_id)
where is_active;

create index if not exists stylyf_specs_project_id_idx on public.stylyf_specs(project_id);

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
  summary text,
  artifact_path text,
  created_at timestamptz not null default timezone('utc'::text, now())
);

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

create table if not exists public.previews (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  port integer not null,
  pid integer,
  status text not null default 'stopped' check (status in ('starting', 'running', 'stopped', 'error')),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists previews_project_id_idx on public.previews(project_id);

drop trigger if exists set_previews_updated_at on public.previews;
create trigger set_previews_updated_at
before update on public.previews
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

create table if not exists public.approvals (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  session_id uuid references public.agent_sessions(id) on delete set null,
  type text not null,
  requested_by text not null,
  summary text,
  payload_path text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'denied', 'expired')),
  decided_by uuid references public.profiles(id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists approvals_project_id_idx on public.approvals(project_id);
create index if not exists approvals_status_idx on public.approvals(status);

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

create index if not exists projects_assets_resource_id_idx on public.projects_assets(resource_id);

drop trigger if exists set_projects_assets_updated_at on public.projects_assets;
create trigger set_projects_assets_updated_at
before update on public.projects_assets
for each row execute function public.set_updated_at();

create table if not exists public.agent_events_assets (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.agent_events(id) on delete cascade,
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
  replaced_by_asset_id uuid references public.agent_events_assets(id) on delete set null,
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists agent_events_assets_resource_id_idx on public.agent_events_assets(resource_id);

drop trigger if exists set_agent_events_assets_updated_at on public.agent_events_assets;
create trigger set_agent_events_assets_updated_at
before update on public.agent_events_assets
for each row execute function public.set_updated_at();
