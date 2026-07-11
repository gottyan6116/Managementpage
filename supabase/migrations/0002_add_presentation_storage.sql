create table if not exists public.presentation_files (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 255),
  storage_path text not null unique,
  mime_type text not null check (mime_type in (
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  )),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 104857600),
  created_at timestamptz not null default now()
);

alter table public.presentation_files enable row level security;
revoke all on table public.presentation_files from anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'presentations',
  'presentations',
  false,
  104857600,
  array[
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- No storage.objects policies are created. The bucket is accessed only by the
-- server-side service role after the application session is verified.
