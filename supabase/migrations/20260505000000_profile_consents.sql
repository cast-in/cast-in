-- 회원가입 시점의 개인정보 수집 및 마케팅 수신 동의 시간을 저장한다.

alter table public.profiles
  add column if not exists privacy_consent_at timestamptz,
  add column if not exists marketing_consent_at timestamptz;
