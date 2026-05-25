update storage.buckets
set public = false
where id in ('avatars', 'portfolio', 'job-media');

drop policy if exists "avatars storage read" on storage.objects;
drop policy if exists "avatars storage read scoped" on storage.objects;
create policy "avatars storage read scoped"
  on storage.objects for select
  using (
    bucket_id = 'avatars'
    and (
      auth.uid()::text = (storage.foldername(name))[1]
      or exists (
        select 1
        from public.actor_profiles ap
        where ap.user_id::text = (storage.foldername(name))[1]
          and ap.visibility = 'public'
      )
      or (
        auth.role() = 'authenticated'
        and exists (
          select 1
          from public.casting_profiles cp
          where cp.user_id::text = (storage.foldername(name))[1]
        )
      )
    )
  );

drop policy if exists "avatars storage insert own" on storage.objects;
drop policy if exists "avatars storage update own" on storage.objects;
drop policy if exists "avatars storage delete own" on storage.objects;
create policy "avatars storage insert own"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
create policy "avatars storage update own"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
create policy "avatars storage delete own"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "portfolio storage read" on storage.objects;
drop policy if exists "portfolio storage read scoped" on storage.objects;
create policy "portfolio storage read scoped"
  on storage.objects for select
  using (
    bucket_id = 'portfolio'
    and (
      auth.uid()::text = (storage.foldername(name))[1]
      or exists (
        select 1
        from public.actor_profiles ap
        where ap.user_id::text = (storage.foldername(name))[1]
          and ap.visibility = 'public'
      )
    )
  );

drop policy if exists "portfolio storage insert own" on storage.objects;
drop policy if exists "portfolio storage update own" on storage.objects;
drop policy if exists "portfolio storage delete own" on storage.objects;
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
  )
  with check (
    bucket_id = 'portfolio'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
create policy "portfolio storage delete own"
  on storage.objects for delete
  using (
    bucket_id = 'portfolio'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "job media storage read" on storage.objects;
drop policy if exists "job media storage read scoped" on storage.objects;
create policy "job media storage read scoped"
  on storage.objects for select
  using (
    bucket_id = 'job-media'
    and (
      auth.uid()::text = (storage.foldername(name))[1]
      or auth.role() = 'authenticated'
    )
  );

drop policy if exists "job media storage insert own" on storage.objects;
drop policy if exists "job media storage update own" on storage.objects;
drop policy if exists "job media storage delete own" on storage.objects;
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
  )
  with check (
    bucket_id = 'job-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
create policy "job media storage delete own"
  on storage.objects for delete
  using (
    bucket_id = 'job-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
