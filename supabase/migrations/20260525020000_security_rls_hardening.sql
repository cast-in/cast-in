-- Tighten public read surfaces and align RLS with Server Action rules.

-- Keep sensitive profile columns out of browser-readable PostgREST selects.
revoke select on table public.profiles from anon, authenticated;
grant select (id, role, name, avatar_url, created_at, updated_at)
  on table public.profiles to anon, authenticated;

revoke select on table public.casting_profiles from anon, authenticated;
grant select (user_id, company_name, intro, updated_at)
  on table public.casting_profiles to anon, authenticated;

create or replace function public.get_my_casting_profile_private()
returns table (
  company_name text,
  contact text,
  intro text,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select cp.company_name, cp.contact, cp.intro, cp.updated_at
  from public.casting_profiles cp
  where cp.user_id = auth.uid()
$$;

revoke all on function public.get_my_casting_profile_private() from public;
grant execute on function public.get_my_casting_profile_private() to authenticated;

create or replace function public.is_open_job(
  target_status public.job_status,
  target_deadline timestamptz
)
returns boolean
language sql
stable
as $$
  select target_status = 'open'::public.job_status
    and (target_deadline is null or target_deadline >= now())
$$;

create or replace function public.can_read_job(
  target_job_id uuid,
  target_casting_id uuid,
  target_status public.job_status,
  target_deadline timestamptz
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() = target_casting_id
    or public.is_open_job(target_status, target_deadline)
    or exists (
      select 1
      from public.applications a
      where a.job_id = target_job_id
        and a.actor_id = auth.uid()
    )
$$;

create or replace function public.can_read_job_application_questions(
  target_job_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.jobs j
    where j.id = target_job_id
      and public.can_read_job(j.id, j.casting_id, j.status, j.deadline)
  )
$$;

create or replace function public.application_answers_satisfy_required(
  target_job_id uuid,
  target_answers jsonb
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (
    select 1
    from public.job_application_questions q
    where q.job_id = target_job_id
      and q.required
      and coalesce(btrim(target_answers ->> q.id::text), '') = ''
  )
$$;

create or replace function public.can_apply_to_job(
  target_job_id uuid,
  target_actor_id uuid,
  target_answers jsonb
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select target_actor_id = auth.uid()
    and exists (
      select 1
      from public.actor_profiles ap
      where ap.user_id = target_actor_id
    )
    and exists (
      select 1
      from public.jobs j
      where j.id = target_job_id
        and public.is_open_job(j.status, j.deadline)
    )
    and public.application_answers_satisfy_required(
      target_job_id,
      coalesce(target_answers, '{}'::jsonb)
    )
$$;

create or replace function public.can_create_chat_room(
  target_job_id uuid,
  target_actor_id uuid,
  target_casting_id uuid
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  target_job public.jobs%rowtype;
begin
  if auth.uid() is null then
    return false;
  end if;

  if target_actor_id is null or target_casting_id is null then
    return false;
  end if;

  if auth.uid() <> target_actor_id and auth.uid() <> target_casting_id then
    return false;
  end if;

  if not exists (
    select 1
    from public.actor_profiles ap
    where ap.user_id = target_actor_id
      and (ap.visibility = 'public' or ap.user_id = auth.uid())
  ) then
    return false;
  end if;

  if not exists (
    select 1
    from public.casting_profiles cp
    where cp.user_id = target_casting_id
  ) then
    return false;
  end if;

  if target_job_id is null then
    return true;
  end if;

  select *
  into target_job
  from public.jobs j
  where j.id = target_job_id
    and j.casting_id = target_casting_id;

  if not found then
    return false;
  end if;

  if auth.uid() = target_actor_id then
    return exists (
      select 1
      from public.applications a
      where a.job_id = target_job_id
        and a.actor_id = target_actor_id
    );
  end if;

  if auth.uid() = target_casting_id then
    return public.is_open_job(target_job.status, target_job.deadline)
      or exists (
        select 1
        from public.applications a
        where a.job_id = target_job_id
          and a.actor_id = target_actor_id
      );
  end if;

  return false;
end;
$$;

revoke all on function public.can_read_job(uuid, uuid, public.job_status, timestamptz) from public;
revoke all on function public.can_read_job_application_questions(uuid) from public;
revoke all on function public.application_answers_satisfy_required(uuid, jsonb) from public;
revoke all on function public.can_apply_to_job(uuid, uuid, jsonb) from public;
revoke all on function public.can_create_chat_room(uuid, uuid, uuid) from public;
grant execute on function public.can_read_job(uuid, uuid, public.job_status, timestamptz) to authenticated;
grant execute on function public.can_read_job_application_questions(uuid) to authenticated;
grant execute on function public.application_answers_satisfy_required(uuid, jsonb) to authenticated;
grant execute on function public.can_apply_to_job(uuid, uuid, jsonb) to authenticated;
grant execute on function public.can_create_chat_room(uuid, uuid, uuid) to authenticated;

drop policy if exists "profiles readable by all" on public.profiles;
drop policy if exists "profiles readable self or public profile" on public.profiles;
create policy "profiles readable self or public profile"
  on public.profiles for select
  using (
    auth.uid() = id
    or exists (
      select 1
      from public.actor_profiles ap
      where ap.user_id = profiles.id
        and ap.visibility = 'public'
    )
    or exists (
      select 1
      from public.casting_profiles cp
      where cp.user_id = profiles.id
    )
  );

drop policy if exists "actor_profiles readable by all" on public.actor_profiles;
drop policy if exists "actor_profiles readable self or public" on public.actor_profiles;
create policy "actor_profiles readable self or public"
  on public.actor_profiles for select
  using (auth.uid() = user_id or visibility = 'public');

drop policy if exists "casting_profiles readable by all" on public.casting_profiles;
drop policy if exists "casting_profiles readable self or public" on public.casting_profiles;
create policy "casting_profiles readable self or public"
  on public.casting_profiles for select
  using (auth.uid() = user_id or auth.role() = 'authenticated');

drop policy if exists "portfolio readable by all" on public.portfolio_items;
drop policy if exists "portfolio readable self or public actor" on public.portfolio_items;
create policy "portfolio readable self or public actor"
  on public.portfolio_items for select
  using (
    auth.uid() = actor_id
    or exists (
      select 1
      from public.actor_profiles ap
      where ap.user_id = portfolio_items.actor_id
        and ap.visibility = 'public'
    )
  );

drop policy if exists "jobs readable by authenticated" on public.jobs;
drop policy if exists "jobs readable owner open or applicant" on public.jobs;
create policy "jobs readable owner open or applicant"
  on public.jobs for select
  using (public.can_read_job(id, casting_id, status, deadline));

drop policy if exists "job application questions readable by authenticated"
  on public.job_application_questions;
drop policy if exists "job application questions readable for visible job"
  on public.job_application_questions;
create policy "job application questions readable for visible job"
  on public.job_application_questions for select
  using (public.can_read_job_application_questions(job_id));

drop policy if exists "applications insert actor self" on public.applications;
drop policy if exists "applications insert actor open job" on public.applications;
create policy "applications insert actor open job"
  on public.applications for insert
  with check (public.can_apply_to_job(job_id, actor_id, answers));

drop policy if exists "applications update casting owner" on public.applications;
drop policy if exists "applications update casting owner status memo" on public.applications;
create policy "applications update casting owner status memo"
  on public.applications for update
  using (
    exists (
      select 1
      from public.jobs j
      where j.id = applications.job_id
        and j.casting_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.jobs j
      where j.id = applications.job_id
        and j.casting_id = auth.uid()
    )
  );

revoke insert, update on table public.applications from anon, authenticated;
grant insert (job_id, actor_id, memo, answers)
  on table public.applications to authenticated;
grant update (status, casting_memo)
  on table public.applications to authenticated;

drop policy if exists "chat_rooms insert participant" on public.chat_rooms;
drop policy if exists "chat_rooms insert domain participant" on public.chat_rooms;
create policy "chat_rooms insert domain participant"
  on public.chat_rooms for insert
  with check (public.can_create_chat_room(job_id, actor_id, casting_id));

drop policy if exists "chat_rooms update participant" on public.chat_rooms;
revoke update on table public.chat_rooms from anon, authenticated;

create or replace function public.touch_chat_room_last_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.chat_rooms
    set last_message_at = new.created_at
    where id = new.room_id;
  return new;
end; $$;

drop policy if exists "messages update recipient (read_at)" on public.messages;
drop policy if exists "messages update recipient read_at" on public.messages;
create policy "messages update recipient read_at"
  on public.messages for update
  using (
    sender_id <> auth.uid()
    and exists (
      select 1
      from public.chat_rooms r
      where r.id = messages.room_id
        and (r.actor_id = auth.uid() or r.casting_id = auth.uid())
    )
  )
  with check (
    sender_id <> auth.uid()
    and exists (
      select 1
      from public.chat_rooms r
      where r.id = messages.room_id
        and (r.actor_id = auth.uid() or r.casting_id = auth.uid())
    )
  );

revoke insert, update on table public.messages from anon, authenticated;
grant insert (room_id, sender_id, body) on table public.messages to authenticated;
grant update (read_at) on table public.messages to authenticated;
