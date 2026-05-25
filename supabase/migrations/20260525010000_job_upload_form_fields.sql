-- 공고 등록 폼에서 입력하는 상세 필드를 일급 데이터로 저장한다.

alter table public.jobs
  add column if not exists production_name text,
  add column if not exists role_name text,
  add column if not exists target_age_min int,
  add column if not exists target_age_max int,
  add column if not exists fee_type text not null default 'negotiable',
  add column if not exists fee_amount int,
  add constraint jobs_target_age_range_check
    check (
      (target_age_min is null or target_age_min between 0 and 120)
      and (target_age_max is null or target_age_max between 0 and 120)
      and (
        target_age_min is null
        or target_age_max is null
        or target_age_min <= target_age_max
      )
    ),
  add constraint jobs_fee_type_check
    check (fee_type in ('negotiable', 'per_episode', 'daily', 'flat', 'other')),
  add constraint jobs_fee_amount_check
    check (fee_amount is null or fee_amount >= 0);

create index if not exists jobs_target_age_min_idx on public.jobs(target_age_min);
create index if not exists jobs_target_age_max_idx on public.jobs(target_age_max);

create table if not exists public.job_application_questions (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  label text not null,
  required boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists job_application_questions_job_idx
  on public.job_application_questions(job_id, sort_order);

alter table public.job_application_questions enable row level security;

drop policy if exists "job application questions readable by authenticated"
  on public.job_application_questions;
create policy "job application questions readable by authenticated"
  on public.job_application_questions for select
  using (auth.role() = 'authenticated');

drop policy if exists "job application questions insert own job"
  on public.job_application_questions;
create policy "job application questions insert own job"
  on public.job_application_questions for insert
  with check (
    exists (
      select 1 from public.jobs j
      where j.id = job_application_questions.job_id
        and j.casting_id = auth.uid()
    )
  );

drop policy if exists "job application questions update own job"
  on public.job_application_questions;
create policy "job application questions update own job"
  on public.job_application_questions for update
  using (
    exists (
      select 1 from public.jobs j
      where j.id = job_application_questions.job_id
        and j.casting_id = auth.uid()
    )
  );

drop policy if exists "job application questions delete own job"
  on public.job_application_questions;
create policy "job application questions delete own job"
  on public.job_application_questions for delete
  using (
    exists (
      select 1 from public.jobs j
      where j.id = job_application_questions.job_id
        and j.casting_id = auth.uid()
    )
  );

alter table public.applications
  add column if not exists answers jsonb not null default '{}'::jsonb
    check (jsonb_typeof(answers) = 'object');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'job-media',
  'job-media',
  true,
  104857600,
  array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "job media storage read"
  on storage.objects for select
  using (bucket_id = 'job-media');

create policy "job media storage insert own"
  on storage.objects for insert
  with check (
    bucket_id = 'job-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "job media storage update own"
  on storage.objects for update
  using (
    bucket_id = 'job-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "job media storage delete own"
  on storage.objects for delete
  using (
    bucket_id = 'job-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
