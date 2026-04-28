-- 배우 프로필에 외부 SNS/웹 링크 목록을 저장한다.

alter table public.actor_profiles
  add column if not exists social_links jsonb not null default '[]'::jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'actor_profiles_social_links_is_array'
      and conrelid = 'public.actor_profiles'::regclass
  ) then
    alter table public.actor_profiles
      add constraint actor_profiles_social_links_is_array
      check (jsonb_typeof(social_links) = 'array');
  end if;
end $$;
