-- =======================================================================
-- actor_profiles: age(int) → birth_date(date)
-- =======================================================================
-- 나이는 매년 낡는 숫자라, 생일을 저장하고 화면에서 자동 계산하도록 변경.

alter table public.actor_profiles
  add column birth_date date;

alter table public.actor_profiles
  drop column age;
