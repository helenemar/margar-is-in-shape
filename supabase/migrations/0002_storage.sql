-- ─────────────────────────────────────────────
-- Storage bucket for check-in photos
-- ─────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'checkin-photos',
  'checkin-photos',
  true,          -- public read via CDN URL
  10485760,      -- 10 MB per file
  array[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif'
  ]
)
on conflict (id) do nothing;

-- Public read (belt + suspenders alongside public=true)
create policy "checkin_photos_public_select"
  on storage.objects for select
  using (bucket_id = 'checkin-photos');

-- Uploads go through the server (service role bypasses RLS).
-- These policies exist for defence-in-depth only.
create policy "checkin_photos_insert"
  on storage.objects for insert
  with check (bucket_id = 'checkin-photos');

create policy "checkin_photos_update"
  on storage.objects for update
  using (bucket_id = 'checkin-photos');

create policy "checkin_photos_delete"
  on storage.objects for delete
  using (bucket_id = 'checkin-photos');
