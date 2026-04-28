-- =======================================================================
-- Cast-In initial schema + RLS
-- =======================================================================
-- 참고: Supabase는 auth.users 를 기본 유저 테이블로 제공.
-- 여기서는 public.profiles 가 auth.users(id) 에 1:1 연결되는 도메인 프로필.

-- ─────────────────── 1. profiles (공통) ───────────────────
create type public.user_role as enum ('actor', 'casting');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null,
  name text not null,
  email text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_role_idx on public.profiles(role);

-- ─────────────────── 2. actor_profiles ───────────────────
create table public.actor_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  age int,
  gender text,
  region text,
  height_cm int,
  genres text[] not null default '{}',
  skills text[] not null default '{}',
  social_links jsonb not null default '[]'::jsonb check (jsonb_typeof(social_links) = 'array'),
  bio text,
  visibility text not null default 'public' check (visibility in ('public','connections','private')),
  updated_at timestamptz not null default now()
);

create table public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.actor_profiles(user_id) on delete cascade,
  type text not null check (type in ('image','video')),
  url text not null,
  caption text,
  created_at timestamptz not null default now()
);

create index portfolio_items_actor_idx on public.portfolio_items(actor_id);

-- ─────────────────── 3. casting_profiles ───────────────────
create table public.casting_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  company_name text not null,
  biz_number text,
  contact text,
  intro text,
  updated_at timestamptz not null default now()
);

-- ─────────────────── 4. jobs (공고) ───────────────────
create type public.job_status as enum ('open','closed','draft');

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  casting_id uuid not null references public.casting_profiles(user_id) on delete cascade,
  title text not null,
  description text,
  requirements text[] not null default '{}',
  genre text,
  region text,
  deadline timestamptz,
  status public.job_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index jobs_casting_idx on public.jobs(casting_id);
create index jobs_status_idx on public.jobs(status);
create index jobs_deadline_idx on public.jobs(deadline);

-- ─────────────────── 5. applications (지원) ───────────────────
create type public.application_status as enum ('pending','reviewing','pass','hold','reject');

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  actor_id uuid not null references public.actor_profiles(user_id) on delete cascade,
  memo text,
  status public.application_status not null default 'pending',
  casting_memo text, -- 캐스팅 내부 메모
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(job_id, actor_id)
);

create index applications_job_idx on public.applications(job_id);
create index applications_actor_idx on public.applications(actor_id);
create index applications_status_idx on public.applications(status);

-- ─────────────────── 6. bookmarks (보관함, 양방향) ───────────────────
create table public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('actor','job')),
  target_id uuid not null,
  list_name text, -- 브랜드별/드라마별 분류
  created_at timestamptz not null default now(),
  unique(user_id, target_type, target_id, list_name)
);

create index bookmarks_user_idx on public.bookmarks(user_id);
create index bookmarks_target_idx on public.bookmarks(target_type, target_id);

-- ─────────────────── 7. chat_rooms + messages ───────────────────
create table public.chat_rooms (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.jobs(id) on delete set null,
  actor_id uuid not null references public.actor_profiles(user_id) on delete cascade,
  casting_id uuid not null references public.casting_profiles(user_id) on delete cascade,
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  unique(job_id, actor_id, casting_id)
);

create index chat_rooms_actor_idx on public.chat_rooms(actor_id);
create index chat_rooms_casting_idx on public.chat_rooms(casting_id);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.chat_rooms(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  attachments jsonb not null default '[]'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index messages_room_idx on public.messages(room_id, created_at desc);

-- ─────────────────── 8. notifications ───────────────────
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on public.notifications(user_id, read_at);

-- =======================================================================
-- RLS 활성화
-- =======================================================================
alter table public.profiles enable row level security;
alter table public.actor_profiles enable row level security;
alter table public.casting_profiles enable row level security;
alter table public.portfolio_items enable row level security;
alter table public.jobs enable row level security;
alter table public.applications enable row level security;
alter table public.bookmarks enable row level security;
alter table public.chat_rooms enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;

-- ─────────────────── profiles ───────────────────
-- 모두 공개 조회 (배우/캐스팅 탐색을 위해). 편집은 본인만.
create policy "profiles readable by all"
  on public.profiles for select using (true);

create policy "profiles insert self"
  on public.profiles for insert with check (auth.uid() = id);

create policy "profiles update self"
  on public.profiles for update using (auth.uid() = id);

-- ─────────────────── actor_profiles / casting_profiles ───────────────────
create policy "actor_profiles readable by all"
  on public.actor_profiles for select using (true);

create policy "actor_profiles upsert self"
  on public.actor_profiles for insert with check (auth.uid() = user_id);
create policy "actor_profiles update self"
  on public.actor_profiles for update using (auth.uid() = user_id);

create policy "casting_profiles readable by all"
  on public.casting_profiles for select using (true);
create policy "casting_profiles upsert self"
  on public.casting_profiles for insert with check (auth.uid() = user_id);
create policy "casting_profiles update self"
  on public.casting_profiles for update using (auth.uid() = user_id);

-- ─────────────────── portfolio_items ───────────────────
create policy "portfolio readable by all"
  on public.portfolio_items for select using (true);
create policy "portfolio insert self"
  on public.portfolio_items for insert with check (auth.uid() = actor_id);
create policy "portfolio update self"
  on public.portfolio_items for update using (auth.uid() = actor_id);
create policy "portfolio delete self"
  on public.portfolio_items for delete using (auth.uid() = actor_id);

-- ─────────────────── jobs ───────────────────
-- 공개 조회 (모든 로그인 유저). 편집은 본인 공고만.
create policy "jobs readable by authenticated"
  on public.jobs for select using (auth.role() = 'authenticated');
create policy "jobs insert own"
  on public.jobs for insert with check (auth.uid() = casting_id);
create policy "jobs update own"
  on public.jobs for update using (auth.uid() = casting_id);
create policy "jobs delete own"
  on public.jobs for delete using (auth.uid() = casting_id);

-- ─────────────────── applications ───────────────────
-- 배우: 자기 application만 조회/생성/취소
-- 캐스팅: 자기 job의 application만 조회/상태변경
create policy "applications select actor self"
  on public.applications for select
  using (auth.uid() = actor_id);
create policy "applications select casting owner"
  on public.applications for select
  using (exists (
    select 1 from public.jobs j
    where j.id = applications.job_id and j.casting_id = auth.uid()
  ));
create policy "applications insert actor self"
  on public.applications for insert
  with check (auth.uid() = actor_id);
create policy "applications update casting owner"
  on public.applications for update
  using (exists (
    select 1 from public.jobs j
    where j.id = applications.job_id and j.casting_id = auth.uid()
  ));
create policy "applications delete actor self"
  on public.applications for delete
  using (auth.uid() = actor_id);

-- ─────────────────── bookmarks ───────────────────
create policy "bookmarks self all"
  on public.bookmarks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─────────────────── chat_rooms ───────────────────
create policy "chat_rooms select participant"
  on public.chat_rooms for select
  using (auth.uid() = actor_id or auth.uid() = casting_id);
create policy "chat_rooms insert participant"
  on public.chat_rooms for insert
  with check (auth.uid() = actor_id or auth.uid() = casting_id);
create policy "chat_rooms update participant"
  on public.chat_rooms for update
  using (auth.uid() = actor_id or auth.uid() = casting_id);

-- ─────────────────── messages ───────────────────
create policy "messages select participant"
  on public.messages for select
  using (exists (
    select 1 from public.chat_rooms r
    where r.id = messages.room_id
      and (r.actor_id = auth.uid() or r.casting_id = auth.uid())
  ));
create policy "messages insert participant as sender"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.chat_rooms r
      where r.id = messages.room_id
        and (r.actor_id = auth.uid() or r.casting_id = auth.uid())
    )
  );
create policy "messages update recipient (read_at)"
  on public.messages for update
  using (exists (
    select 1 from public.chat_rooms r
    where r.id = messages.room_id
      and (r.actor_id = auth.uid() or r.casting_id = auth.uid())
  ));

-- ─────────────────── notifications ───────────────────
create policy "notifications self read"
  on public.notifications for select using (auth.uid() = user_id);
create policy "notifications self update"
  on public.notifications for update using (auth.uid() = user_id);

-- =======================================================================
-- 트리거: updated_at 자동 갱신
-- =======================================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger actor_profiles_updated_at before update on public.actor_profiles
  for each row execute function public.set_updated_at();
create trigger casting_profiles_updated_at before update on public.casting_profiles
  for each row execute function public.set_updated_at();
create trigger jobs_updated_at before update on public.jobs
  for each row execute function public.set_updated_at();
create trigger applications_updated_at before update on public.applications
  for each row execute function public.set_updated_at();

-- chat_rooms.last_message_at 자동 갱신
create or replace function public.touch_chat_room_last_message()
returns trigger language plpgsql as $$
begin
  update public.chat_rooms
    set last_message_at = new.created_at
    where id = new.room_id;
  return new;
end $$;

create trigger messages_touch_room after insert on public.messages
  for each row execute function public.touch_chat_room_last_message();

-- =======================================================================
-- Realtime publication — 메시지 테이블만 구독 대상
-- =======================================================================
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.applications;
