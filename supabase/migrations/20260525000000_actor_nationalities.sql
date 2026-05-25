-- First-class actor nationality filter for casting talent discovery.

alter table public.actor_profiles
  add column if not exists nationalities text[] not null default array['Republic of Korea']::text[];

update public.actor_profiles
set nationalities = array['Republic of Korea']::text[]
where nationalities = '{}'::text[];

create index if not exists actor_profiles_nationalities_idx
  on public.actor_profiles using gin(nationalities);
