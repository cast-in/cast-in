-- Open jobs are only visible to authenticated users, owners, or existing applicants.

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
    or exists (
      select 1
      from public.applications a
      where a.job_id = target_job_id
        and a.actor_id = auth.uid()
    )
    or (
      auth.role() = 'authenticated'
      and public.is_open_job(target_status, target_deadline)
    )
$$;

revoke all on function public.can_read_job(uuid, uuid, public.job_status, timestamptz) from public;
grant execute on function public.can_read_job(uuid, uuid, public.job_status, timestamptz) to authenticated;

