-- 랜딩/브랜드 로고 전용 공개 버킷.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'brand-logos',
  'brand-logos',
  true,
  5242880, -- 5MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "brand logos storage read"
  on storage.objects for select
  using (bucket_id = 'brand-logos');
