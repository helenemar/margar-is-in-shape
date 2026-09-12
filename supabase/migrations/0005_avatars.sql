-- Storage bucket for profile avatars
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880, -- 5 MB
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

create policy "avatars_public_select"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars_insert"
  on storage.objects for insert
  with check (bucket_id = 'avatars');

create policy "avatars_update"
  on storage.objects for update
  using (bucket_id = 'avatars');

create policy "avatars_delete"
  on storage.objects for delete
  using (bucket_id = 'avatars');
