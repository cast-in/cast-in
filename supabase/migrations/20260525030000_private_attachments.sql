insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'attachments',
  'attachments',
  false,
  52428800,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'video/mp4',
    'video/quicktime'
  ]::text[]
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.try_uuid(value text)
returns uuid
language plpgsql
immutable
as $$
begin
  return value::uuid;
exception
  when others then
    return null;
end $$;

revoke all on function public.try_uuid(text) from public;
grant execute on function public.try_uuid(text) to authenticated;

create or replace function public.can_read_attachment_object(target_path text)
returns boolean
language plpgsql
stable
security definer
set search_path = public, storage
as $$
declare
  parts text[];
  target_kind text;
  target_id uuid;
  owner_id uuid;
begin
  parts := storage.foldername(target_path);
  target_kind := parts[1];

  if target_kind = 'messages' then
    target_id := public.try_uuid(parts[2]);
    if target_id is null then
      return false;
    end if;

    return exists (
      select 1
      from public.chat_rooms r
      where r.id = target_id
        and (r.actor_id = auth.uid() or r.casting_id = auth.uid())
    );
  end if;

  if target_kind = 'applications' then
    target_id := public.try_uuid(parts[2]);
    owner_id := public.try_uuid(parts[3]);
    if target_id is null or owner_id is null then
      return false;
    end if;

    if owner_id = auth.uid() then
      return true;
    end if;

    return exists (
      select 1
      from public.applications a
      join public.jobs j on j.id = a.job_id
      where a.job_id = target_id
        and a.actor_id = owner_id
        and j.casting_id = auth.uid()
    );
  end if;

  return false;
end $$;

create or replace function public.can_insert_attachment_object(target_path text)
returns boolean
language plpgsql
stable
security definer
set search_path = public, storage
as $$
declare
  parts text[];
  target_kind text;
  target_id uuid;
  owner_id uuid;
begin
  parts := storage.foldername(target_path);
  target_kind := parts[1];
  owner_id := public.try_uuid(parts[3]);

  if owner_id is null or owner_id <> auth.uid() then
    return false;
  end if;

  if target_kind = 'messages' then
    target_id := public.try_uuid(parts[2]);
    if target_id is null then
      return false;
    end if;

    return exists (
      select 1
      from public.chat_rooms r
      where r.id = target_id
        and (r.actor_id = auth.uid() or r.casting_id = auth.uid())
    );
  end if;

  if target_kind = 'applications' then
    target_id := public.try_uuid(parts[2]);
    if target_id is null then
      return false;
    end if;

    return exists (
      select 1
      from public.jobs j
      where j.id = target_id
        and j.status = 'open'
        and (j.deadline is null or j.deadline >= current_date)
    );
  end if;

  return false;
end $$;

create or replace function public.is_own_attachment_object(target_path text)
returns boolean
language plpgsql
stable
security definer
set search_path = public, storage
as $$
declare
  parts text[];
  target_kind text;
  owner_id uuid;
begin
  parts := storage.foldername(target_path);
  target_kind := parts[1];

  if target_kind <> 'messages' and target_kind <> 'applications' then
    return false;
  end if;

  owner_id := public.try_uuid(parts[3]);
  return owner_id = auth.uid();
end $$;

revoke all on function public.can_read_attachment_object(text) from public;
revoke all on function public.can_insert_attachment_object(text) from public;
revoke all on function public.is_own_attachment_object(text) from public;
grant execute on function public.can_read_attachment_object(text) to authenticated;
grant execute on function public.can_insert_attachment_object(text) to authenticated;
grant execute on function public.is_own_attachment_object(text) to authenticated;

drop policy if exists "attachments storage read scoped" on storage.objects;
drop policy if exists "attachments storage insert scoped" on storage.objects;
drop policy if exists "attachments storage delete own" on storage.objects;

create policy "attachments storage read scoped"
  on storage.objects for select
  using (
    bucket_id = 'attachments'
    and public.can_read_attachment_object(name)
  );

create policy "attachments storage insert scoped"
  on storage.objects for insert
  with check (
    bucket_id = 'attachments'
    and public.can_insert_attachment_object(name)
  );

create policy "attachments storage delete own"
  on storage.objects for delete
  using (
    bucket_id = 'attachments'
    and public.is_own_attachment_object(name)
  );

alter table public.messages
  drop constraint if exists messages_attachments_array_check,
  add constraint messages_attachments_array_check
    check (
      case
        when jsonb_typeof(attachments) = 'array'
          then jsonb_array_length(attachments) <= 5
        else false
      end
    );

alter table public.applications
  add column if not exists attachments jsonb not null default '[]'::jsonb,
  drop constraint if exists applications_attachments_array_check,
  add constraint applications_attachments_array_check
    check (
      case
        when jsonb_typeof(attachments) = 'array'
          then jsonb_array_length(attachments) <= 5
        else false
      end
    );

revoke insert on table public.messages from anon, authenticated;
grant insert (room_id, sender_id, body, attachments)
  on table public.messages to authenticated;

revoke insert on table public.applications from anon, authenticated;
grant insert (job_id, actor_id, memo, answers, attachments)
  on table public.applications to authenticated;
