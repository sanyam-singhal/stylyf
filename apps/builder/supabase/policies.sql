-- Stylyf Builder Supabase RLS policies
-- Apply after apps/builder/supabase/schema.sql.
-- The service-role key bypasses RLS for trusted worker operations. Browser/server user clients remain scoped.

create or replace function public.current_profile_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = (select auth.uid())
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_profile_role() = 'admin', false)
$$;

create or replace function public.is_project_member(target_project_id uuid, allowed_roles text[] default array['owner', 'editor', 'viewer'])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.project_members pm
    where pm.project_id = target_project_id
      and pm.user_id = (select auth.uid())
      and pm.role = any(allowed_roles)
  )
$$;

create or replace function public.can_read_project(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select (select auth.uid()) is not null
    and (public.is_admin() or public.is_project_member(target_project_id, array['owner', 'editor', 'viewer']))
$$;

create or replace function public.can_edit_project(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select (select auth.uid()) is not null
    and (public.is_admin() or public.is_project_member(target_project_id, array['owner', 'editor']))
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    nullif(coalesce(new.raw_user_meta_data ->> 'display_name', ''), ''),
    case
      when exists (select 1 from public.profiles where role = 'admin') then 'builder'
      else 'admin'
    end
  )
  on conflict (id) do update
  set email = excluded.email,
      updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

insert into public.profiles (id, email, display_name, role)
select
  users.id,
  coalesce(users.email, ''),
  nullif(coalesce(users.raw_user_meta_data ->> 'display_name', ''), ''),
  case
    when not exists (select 1 from public.profiles where role = 'admin') then 'admin'
    else 'builder'
  end
from auth.users as users
on conflict (id) do update
set email = excluded.email,
    updated_at = timezone('utc'::text, now());

create or replace function public.add_project_owner_member()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.project_members (project_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict (project_id, user_id) do update set role = 'owner';
  return new;
end;
$$;

drop trigger if exists on_project_created_add_owner on public.projects;
create trigger on_project_created_add_owner
after insert on public.projects
for each row execute function public.add_project_owner_member();

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.stylyf_spec_chunks enable row level security;
alter table public.agent_sessions enable row level security;
alter table public.agent_events enable row level security;
alter table public.commands enable row level security;
alter table public.build_runs enable row level security;
alter table public.preview_processes enable row level security;
alter table public.webknife_runs enable row level security;
alter table public.git_events enable row level security;
alter table public.asset_pointers enable row level security;
alter table public.projects_assets enable row level security;

drop policy if exists profiles_select_self_or_admin on public.profiles;
create policy profiles_select_self_or_admin
on public.profiles for select
to authenticated
using (id = (select auth.uid()) or public.is_admin());

drop policy if exists profiles_update_self_or_admin on public.profiles;
create policy profiles_update_self_or_admin
on public.profiles for update
to authenticated
using (id = (select auth.uid()) or public.is_admin())
with check (id = (select auth.uid()) or public.is_admin());

drop policy if exists projects_select_member_or_admin on public.projects;
create policy projects_select_member_or_admin
on public.projects for select
to authenticated
using (public.can_read_project(id));

drop policy if exists projects_insert_authenticated_owner on public.projects;
create policy projects_insert_authenticated_owner
on public.projects for insert
to authenticated
with check (owner_id = (select auth.uid()) or public.is_admin());

drop policy if exists projects_update_editor_or_admin on public.projects;
create policy projects_update_editor_or_admin
on public.projects for update
to authenticated
using (public.can_edit_project(id))
with check (public.can_edit_project(id));

drop policy if exists projects_delete_owner_or_admin on public.projects;
create policy projects_delete_owner_or_admin
on public.projects for delete
to authenticated
using (public.is_admin() or public.is_project_member(id, array['owner']));

drop policy if exists project_members_select_member_or_admin on public.project_members;
create policy project_members_select_member_or_admin
on public.project_members for select
to authenticated
using (public.can_read_project(project_id));

drop policy if exists project_members_write_owner_or_admin on public.project_members;
create policy project_members_write_owner_or_admin
on public.project_members for all
to authenticated
using (public.is_admin() or public.is_project_member(project_id, array['owner']))
with check (public.is_admin() or public.is_project_member(project_id, array['owner']));

drop policy if exists stylyf_spec_chunks_select_project_member on public.stylyf_spec_chunks;
create policy stylyf_spec_chunks_select_project_member
on public.stylyf_spec_chunks for select
to authenticated
using (public.can_read_project(project_id));

drop policy if exists stylyf_spec_chunks_write_project_editor on public.stylyf_spec_chunks;
create policy stylyf_spec_chunks_write_project_editor
on public.stylyf_spec_chunks for all
to authenticated
using (public.can_edit_project(project_id))
with check (public.can_edit_project(project_id));

drop policy if exists agent_sessions_select_project_member on public.agent_sessions;
create policy agent_sessions_select_project_member
on public.agent_sessions for select
to authenticated
using (public.can_read_project(project_id));

drop policy if exists agent_sessions_write_project_editor on public.agent_sessions;
create policy agent_sessions_write_project_editor
on public.agent_sessions for all
to authenticated
using (public.can_edit_project(project_id))
with check (public.can_edit_project(project_id));

drop policy if exists agent_events_select_project_member on public.agent_events;
create policy agent_events_select_project_member
on public.agent_events for select
to authenticated
using (public.can_read_project(project_id));

drop policy if exists agent_events_insert_project_editor on public.agent_events;
create policy agent_events_insert_project_editor
on public.agent_events for insert
to authenticated
with check ((owner_id = (select auth.uid()) or public.is_admin()) and public.can_edit_project(project_id));

drop policy if exists agent_events_update_project_editor on public.agent_events;
create policy agent_events_update_project_editor
on public.agent_events for update
to authenticated
using (public.can_edit_project(project_id))
with check (public.can_edit_project(project_id));

drop policy if exists commands_select_project_member on public.commands;
create policy commands_select_project_member
on public.commands for select
to authenticated
using (public.can_read_project(project_id));

drop policy if exists commands_write_project_editor on public.commands;
create policy commands_write_project_editor
on public.commands for all
to authenticated
using (public.can_edit_project(project_id))
with check (public.can_edit_project(project_id));

drop policy if exists build_runs_select_project_member on public.build_runs;
create policy build_runs_select_project_member
on public.build_runs for select
to authenticated
using (public.can_read_project(project_id));

drop policy if exists build_runs_write_project_editor on public.build_runs;
create policy build_runs_write_project_editor
on public.build_runs for all
to authenticated
using (public.can_edit_project(project_id))
with check (public.can_edit_project(project_id));

drop policy if exists preview_processes_select_project_member on public.preview_processes;
create policy preview_processes_select_project_member
on public.preview_processes for select
to authenticated
using (public.can_read_project(project_id));

drop policy if exists preview_processes_write_project_editor on public.preview_processes;
create policy preview_processes_write_project_editor
on public.preview_processes for all
to authenticated
using (public.can_edit_project(project_id))
with check (public.can_edit_project(project_id));

drop policy if exists webknife_runs_select_project_member on public.webknife_runs;
create policy webknife_runs_select_project_member
on public.webknife_runs for select
to authenticated
using (public.can_read_project(project_id));

drop policy if exists webknife_runs_insert_project_editor on public.webknife_runs;
create policy webknife_runs_insert_project_editor
on public.webknife_runs for insert
to authenticated
with check (public.can_edit_project(project_id));

drop policy if exists git_events_select_project_member on public.git_events;
create policy git_events_select_project_member
on public.git_events for select
to authenticated
using (public.can_read_project(project_id));

drop policy if exists git_events_insert_project_editor on public.git_events;
create policy git_events_insert_project_editor
on public.git_events for insert
to authenticated
with check (public.can_edit_project(project_id));

drop policy if exists asset_pointers_select_project_member on public.asset_pointers;
create policy asset_pointers_select_project_member
on public.asset_pointers for select
to authenticated
using (public.can_read_project(project_id));

drop policy if exists asset_pointers_insert_project_editor on public.asset_pointers;
create policy asset_pointers_insert_project_editor
on public.asset_pointers for insert
to authenticated
with check (public.can_edit_project(project_id));

drop policy if exists projects_assets_select_project_member on public.projects_assets;
create policy projects_assets_select_project_member
on public.projects_assets for select
to authenticated
using (exists (select 1 from public.projects p where p.id = resource_id and public.can_read_project(p.id)));

drop policy if exists projects_assets_write_project_editor on public.projects_assets;
create policy projects_assets_write_project_editor
on public.projects_assets for all
to authenticated
using (exists (select 1 from public.projects p where p.id = resource_id and public.can_edit_project(p.id)))
with check (exists (select 1 from public.projects p where p.id = resource_id and public.can_edit_project(p.id)));
