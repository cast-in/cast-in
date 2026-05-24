-- Actor profile showcase data for the redesigned actor profile page.

alter table public.actor_profiles
  add column image_tags text[] not null default '{}',
  add column weight_kg int,
  add column affiliation text not null default '프리랜서';

create table public.actor_profile_views (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.actor_profiles(user_id) on delete cascade,
  viewer_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index actor_profile_views_actor_idx
  on public.actor_profile_views(actor_id, created_at desc);

create table public.actor_credits (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.actor_profiles(user_id) on delete cascade,
  year int,
  title text not null,
  role text,
  href text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index actor_credits_actor_idx
  on public.actor_credits(actor_id, sort_order, year desc, created_at desc);

create table public.actor_awards (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.actor_profiles(user_id) on delete cascade,
  year int,
  title text not null,
  organization text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index actor_awards_actor_idx
  on public.actor_awards(actor_id, sort_order, year desc, created_at desc);

alter table public.actor_profile_views enable row level security;
alter table public.actor_credits enable row level security;
alter table public.actor_awards enable row level security;

create policy "actor_profile_views insert authenticated"
  on public.actor_profile_views for insert
  with check (auth.role() = 'authenticated');

create policy "actor_credits readable by all"
  on public.actor_credits for select using (true);

create policy "actor_credits insert self"
  on public.actor_credits for insert with check (auth.uid() = actor_id);

create policy "actor_credits update self"
  on public.actor_credits for update using (auth.uid() = actor_id);

create policy "actor_credits delete self"
  on public.actor_credits for delete using (auth.uid() = actor_id);

create policy "actor_awards readable by all"
  on public.actor_awards for select using (true);

create policy "actor_awards insert self"
  on public.actor_awards for insert with check (auth.uid() = actor_id);

create policy "actor_awards update self"
  on public.actor_awards for update using (auth.uid() = actor_id);

create policy "actor_awards delete self"
  on public.actor_awards for delete using (auth.uid() = actor_id);

create trigger actor_credits_updated_at before update on public.actor_credits
  for each row execute function public.set_updated_at();

create trigger actor_awards_updated_at before update on public.actor_awards
  for each row execute function public.set_updated_at();

create or replace function public.get_actor_profile_metrics(target_actor_id uuid)
returns table (
  view_count bigint,
  save_count bigint,
  offer_count bigint
)
language sql
security definer
set search_path = public
as $$
  select
    (select count(*) from public.actor_profile_views v where v.actor_id = target_actor_id) as view_count,
    (select count(*) from public.bookmarks b where b.target_type = 'actor' and b.target_id = target_actor_id) as save_count,
    (select count(*) from public.chat_rooms r where r.actor_id = target_actor_id) as offer_count;
$$;

grant execute on function public.get_actor_profile_metrics(uuid) to authenticated;
