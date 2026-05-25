-- Replace actor credits and awards in one database transaction.

create or replace function public.replace_my_actor_showcase(
  target_credits jsonb,
  target_awards jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'not authenticated';
  end if;

  if jsonb_typeof(coalesce(target_credits, '[]'::jsonb)) <> 'array' then
    raise exception 'target_credits must be an array';
  end if;

  if jsonb_typeof(coalesce(target_awards, '[]'::jsonb)) <> 'array' then
    raise exception 'target_awards must be an array';
  end if;

  delete from public.actor_credits
  where actor_id = current_user_id;

  insert into public.actor_credits (actor_id, year, title, role, href, sort_order)
  select
    current_user_id,
    c.year,
    btrim(c.title),
    nullif(btrim(coalesce(c.role, '')), ''),
    nullif(btrim(coalesce(c.href, '')), ''),
    coalesce(c.sort_order, 0)
  from jsonb_to_recordset(coalesce(target_credits, '[]'::jsonb))
    as c(year int, title text, role text, href text, sort_order int)
  where nullif(btrim(coalesce(c.title, '')), '') is not null;

  delete from public.actor_awards
  where actor_id = current_user_id;

  insert into public.actor_awards (actor_id, year, title, organization, sort_order)
  select
    current_user_id,
    a.year,
    btrim(a.title),
    nullif(btrim(coalesce(a.organization, '')), ''),
    coalesce(a.sort_order, 0)
  from jsonb_to_recordset(coalesce(target_awards, '[]'::jsonb))
    as a(year int, title text, organization text, sort_order int)
  where nullif(btrim(coalesce(a.title, '')), '') is not null;
end;
$$;

revoke all on function public.replace_my_actor_showcase(jsonb, jsonb) from public;
grant execute on function public.replace_my_actor_showcase(jsonb, jsonb) to authenticated;

