-- First-class fields for actor job discovery filters.

alter table public.jobs
  add column role_type text,
  add column target_genders text[] not null default '{}',
  add column target_age_groups text[] not null default '{}',
  add column platforms text[] not null default '{}';

update public.jobs
set
  role_type = case
    when title ilike '%주연%' or description ilike '%주연%' then '주연'
    when title ilike '%조연%' or description ilike '%조연%' then '조연'
    when title ilike '%단역%' or description ilike '%단역%' then '단역'
    when title ilike '%엑스트라%' or description ilike '%엑스트라%' then '엑스트라'
    when title ilike '%내레이션%' or description ilike '%내레이션%' then '더빙 / 내레이션'
    when title ilike '%내레이터%' or description ilike '%내레이터%' then '더빙 / 내레이션'
    else role_type
  end,
  target_genders = case
    when title ilike '%여주%' or description ilike '%여배우%' or description ilike '%여성%' then array['female']
    when title ilike '%남주%' or description ilike '%남자%' or description ilike '%남성%' then array['male']
    when target_genders = '{}' then array['female', 'male']
    else target_genders
  end,
  target_age_groups = case
    when title ilike '%10대%' or description ilike '%10대%' then array['10s']
    when title ilike '%20대%' or description ilike '%20대%' then array['20s']
    when title ilike '%30대%' or description ilike '%30대%' then array['30s']
    when title ilike '%40대%' or description ilike '%40대%' then array['40s']
    when title ilike '%50대%' or description ilike '%50대%' then array['50s_plus']
    when target_age_groups = '{}' then array['20s', '30s']
    else target_age_groups
  end,
  platforms = case
    when title ilike '%넷플릭스%' or description ilike '%넷플릭스%' then array['넷플릭스']
    when title ilike '%디즈니%' or description ilike '%디즈니%' then array['디즈니+']
    when title ilike '%티빙%' or description ilike '%티빙%' then array['티빙']
    when title ilike '%웨이브%' or description ilike '%웨이브%' then array['웨이브']
    when title ilike '%독립영화%' or description ilike '%독립영화%' or genre = '영화' then array['독립 영화']
    when platforms = '{}' then array['티빙']
    else platforms
  end;

alter table public.jobs
  add constraint jobs_role_type_check
    check (
      role_type is null
      or role_type in ('주연', '조연', '단역', '엑스트라', '더빙 / 내레이션')
    ),
  add constraint jobs_target_genders_check
    check (target_genders <@ array['female', 'male']::text[]),
  add constraint jobs_target_age_groups_check
    check (target_age_groups <@ array['10s', '20s', '30s', '40s', '50s_plus']::text[]),
  add constraint jobs_platforms_check
    check (platforms <@ array['넷플릭스', '디즈니+', '티빙', '웨이브', '독립 영화']::text[]);

create index jobs_role_type_idx on public.jobs(role_type);
create index jobs_target_genders_idx on public.jobs using gin(target_genders);
create index jobs_target_age_groups_idx on public.jobs using gin(target_age_groups);
create index jobs_platforms_idx on public.jobs using gin(platforms);
create index jobs_requirements_idx on public.jobs using gin(requirements);
