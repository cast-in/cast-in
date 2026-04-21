-- 알림 생성은 클라이언트가 직접 INSERT 하지 않고 DB 트리거에서 처리한다.
-- RLS는 기존처럼 본인 조회/읽음 업데이트만 허용한다.

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

  if recipient_id is not null then
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

drop trigger if exists applications_notify_insert on public.applications;
create trigger applications_notify_insert
  after insert on public.applications
  for each row execute function public.notify_application_insert();

create or replace function public.notify_application_status_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status then
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

drop trigger if exists applications_notify_status_update on public.applications;
create trigger applications_notify_status_update
  after update of status on public.applications
  for each row execute function public.notify_application_status_update();

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

  if recipient_id is not null and recipient_id <> new.sender_id then
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

drop trigger if exists messages_notify_insert on public.messages;
create trigger messages_notify_insert
  after insert on public.messages
  for each row execute function public.notify_message_insert();

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;
