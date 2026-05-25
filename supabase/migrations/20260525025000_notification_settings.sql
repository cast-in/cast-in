create table if not exists public.notification_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  application_notifications_enabled boolean not null default true,
  message_notifications_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.notification_settings (user_id)
select id
from public.profiles
on conflict (user_id) do nothing;

alter table public.notification_settings enable row level security;

drop policy if exists "notification settings select self" on public.notification_settings;
drop policy if exists "notification settings insert self" on public.notification_settings;
drop policy if exists "notification settings update self" on public.notification_settings;

create policy "notification settings select self"
  on public.notification_settings for select
  using (auth.uid() = user_id);

create policy "notification settings insert self"
  on public.notification_settings for insert
  with check (auth.uid() = user_id);

create policy "notification settings update self"
  on public.notification_settings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

revoke delete on table public.notification_settings from anon, authenticated;
grant select, insert, update on table public.notification_settings to authenticated;

drop trigger if exists notification_settings_updated_at on public.notification_settings;
create trigger notification_settings_updated_at
  before update on public.notification_settings
  for each row execute function public.set_updated_at();

create or replace function public.create_default_notification_settings()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notification_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end $$;

drop trigger if exists profiles_create_default_notification_settings on public.profiles;
create trigger profiles_create_default_notification_settings
  after insert on public.profiles
  for each row execute function public.create_default_notification_settings();

create or replace function public.notifications_enabled(
  target_user_id uuid,
  target_category text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when target_category = 'message' then coalesce(
      (
        select ns.message_notifications_enabled
        from public.notification_settings ns
        where ns.user_id = target_user_id
      ),
      true
    )
    when target_category = 'application' then coalesce(
      (
        select ns.application_notifications_enabled
        from public.notification_settings ns
        where ns.user_id = target_user_id
      ),
      true
    )
    else true
  end
$$;

revoke all on function public.notifications_enabled(uuid, text) from public;
grant execute on function public.notifications_enabled(uuid, text) to authenticated;

create or replace function public.notify_application_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recipient_id uuid;
begin
  select casting_id into recipient_id
  from public.jobs
  where id = new.job_id;

  if recipient_id is not null
    and public.notifications_enabled(recipient_id, 'application')
  then
    insert into public.notifications (user_id, type, payload)
    values (
      recipient_id,
      'application_created',
      jsonb_build_object(
        'application_id', new.id,
        'job_id', new.job_id,
        'actor_id', new.actor_id
      )
    );
  end if;

  return new;
end $$;

create or replace function public.notify_application_status_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status
    and public.notifications_enabled(new.actor_id, 'application')
  then
    insert into public.notifications (user_id, type, payload)
    values (
      new.actor_id,
      'application_status_updated',
      jsonb_build_object(
        'application_id', new.id,
        'job_id', new.job_id,
        'status', new.status
      )
    );
  end if;

  return new;
end $$;

create or replace function public.notify_application_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recipient_id uuid;
begin
  select casting_id into recipient_id
  from public.jobs
  where id = old.job_id;

  if recipient_id is not null
    and public.notifications_enabled(recipient_id, 'application')
  then
    insert into public.notifications (user_id, type, payload)
    values (
      recipient_id,
      'application_withdrawn',
      jsonb_build_object(
        'application_id', old.id,
        'job_id', old.job_id,
        'actor_id', old.actor_id
      )
    );
  end if;

  return old;
end $$;

create or replace function public.notify_message_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recipient_id uuid;
  room_job_id uuid;
begin
  select
    case
      when actor_id = new.sender_id then casting_id
      else actor_id
    end,
    job_id
  into recipient_id, room_job_id
  from public.chat_rooms
  where id = new.room_id;

  if recipient_id is not null
    and recipient_id <> new.sender_id
    and public.notifications_enabled(recipient_id, 'message')
  then
    insert into public.notifications (user_id, type, payload)
    values (
      recipient_id,
      'message_created',
      jsonb_build_object(
        'room_id', new.room_id,
        'message_id', new.id,
        'sender_id', new.sender_id,
        'job_id', room_job_id
      )
    );
  end if;

  return new;
end $$;
