drop policy if exists "applications delete actor self" on public.applications;
drop policy if exists "applications delete actor withdrawable" on public.applications;
create policy "applications delete actor withdrawable"
  on public.applications for delete
  using (
    auth.uid() = actor_id
    and status in ('pending', 'reviewing', 'hold')
  );

revoke delete on table public.applications from anon, authenticated;
grant delete on table public.applications to authenticated;

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

  if recipient_id is not null then
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

drop trigger if exists applications_notify_delete on public.applications;
create trigger applications_notify_delete
  after delete on public.applications
  for each row execute function public.notify_application_delete();
