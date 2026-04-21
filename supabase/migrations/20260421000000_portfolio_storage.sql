-- 포트폴리오 버킷 생성. 공개 읽기·인증 사용자만 업로드/수정/삭제.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portfolio',
  'portfolio',
  true,
  52428800, -- 50MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/quicktime', 'video/webm']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 업로드 경로는 `<actor_user_id>/<uuid>.<ext>` 로 고정. 본인 폴더만 CRUD.
create policy "portfolio storage read"
  on storage.objects for select
  using (bucket_id = 'portfolio');

create policy "portfolio storage insert own"
  on storage.objects for insert
  with check (
    bucket_id = 'portfolio'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "portfolio storage update own"
  on storage.objects for update
  using (
    bucket_id = 'portfolio'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "portfolio storage delete own"
  on storage.objects for delete
  using (
    bucket_id = 'portfolio'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
