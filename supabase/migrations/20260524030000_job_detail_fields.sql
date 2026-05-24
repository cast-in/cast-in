alter table public.jobs
  add column if not exists fee_text text,
  add column if not exists shooting_schedule text,
  add column if not exists media_urls text[] not null default '{}';

update public.jobs
set
  fee_text = coalesce(fee_text, '협의'),
  shooting_schedule = coalesce(shooting_schedule, '일정 협의'),
  media_urls = coalesce(media_urls, '{}')
where fee_text is null
  or shooting_schedule is null
  or media_urls is null;
