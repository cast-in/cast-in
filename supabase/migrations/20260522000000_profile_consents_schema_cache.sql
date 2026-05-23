-- Re-assert profile consent columns for environments that missed the earlier
-- migration, then refresh PostgREST's schema cache.

alter table public.profiles
  add column if not exists privacy_consent_at timestamptz,
  add column if not exists marketing_consent_at timestamptz;

update public.profiles as p
set
  privacy_consent_at = coalesce(
    p.privacy_consent_at,
    nullif(u.raw_user_meta_data ->> 'privacy_consent_at', '')::timestamptz
  ),
  marketing_consent_at = coalesce(
    p.marketing_consent_at,
    nullif(u.raw_user_meta_data ->> 'marketing_consent_at', '')::timestamptz
  )
from auth.users as u
where u.id = p.id
  and (
    (
      p.privacy_consent_at is null
      and nullif(u.raw_user_meta_data ->> 'privacy_consent_at', '') is not null
    )
    or (
      p.marketing_consent_at is null
      and nullif(u.raw_user_meta_data ->> 'marketing_consent_at', '') is not null
    )
  );

notify pgrst, 'reload schema';
