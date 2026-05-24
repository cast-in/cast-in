-- Actor profile showcase data for the redesigned actor profile page.

alter table public.actor_profiles
  add column if not exists image_tags text[] not null default '{}',
  add column if not exists weight_kg int,
  add column if not exists affiliation text not null default '프리랜서';

create table if not exists public.actor_profile_views (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.actor_profiles(user_id) on delete cascade,
  viewer_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists actor_profile_views_actor_idx
  on public.actor_profile_views(actor_id, created_at desc);

create table if not exists public.actor_credits (
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

create index if not exists actor_credits_actor_idx
  on public.actor_credits(actor_id, sort_order, year desc, created_at desc);

create table if not exists public.actor_awards (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.actor_profiles(user_id) on delete cascade,
  year int,
  title text not null,
  organization text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists actor_awards_actor_idx
  on public.actor_awards(actor_id, sort_order, year desc, created_at desc);

alter table public.actor_profile_views enable row level security;
alter table public.actor_credits enable row level security;
alter table public.actor_awards enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'actor_profile_views'
      and policyname = 'actor_profile_views insert authenticated'
  ) then
    create policy "actor_profile_views insert authenticated"
      on public.actor_profile_views for insert
      with check (auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'actor_credits'
      and policyname = 'actor_credits readable by all'
  ) then
    create policy "actor_credits readable by all"
      on public.actor_credits for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'actor_credits'
      and policyname = 'actor_credits insert self'
  ) then
    create policy "actor_credits insert self"
      on public.actor_credits for insert with check (auth.uid() = actor_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'actor_credits'
      and policyname = 'actor_credits update self'
  ) then
    create policy "actor_credits update self"
      on public.actor_credits for update using (auth.uid() = actor_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'actor_credits'
      and policyname = 'actor_credits delete self'
  ) then
    create policy "actor_credits delete self"
      on public.actor_credits for delete using (auth.uid() = actor_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'actor_awards'
      and policyname = 'actor_awards readable by all'
  ) then
    create policy "actor_awards readable by all"
      on public.actor_awards for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'actor_awards'
      and policyname = 'actor_awards insert self'
  ) then
    create policy "actor_awards insert self"
      on public.actor_awards for insert with check (auth.uid() = actor_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'actor_awards'
      and policyname = 'actor_awards update self'
  ) then
    create policy "actor_awards update self"
      on public.actor_awards for update using (auth.uid() = actor_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'actor_awards'
      and policyname = 'actor_awards delete self'
  ) then
    create policy "actor_awards delete self"
      on public.actor_awards for delete using (auth.uid() = actor_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'actor_credits_updated_at'
      and tgrelid = 'public.actor_credits'::regclass
  ) then
    create trigger actor_credits_updated_at before update on public.actor_credits
      for each row execute function public.set_updated_at();
  end if;

  if not exists (
    select 1 from pg_trigger
    where tgname = 'actor_awards_updated_at'
      and tgrelid = 'public.actor_awards'::regclass
  ) then
    create trigger actor_awards_updated_at before update on public.actor_awards
      for each row execute function public.set_updated_at();
  end if;
end $$;

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
