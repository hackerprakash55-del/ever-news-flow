create table public.youtube_credentials (
  id text primary key default 'default',
  refresh_token text not null,
  channel_id text,
  channel_title text,
  connected_by uuid,
  connected_at timestamptz not null default now()
);
alter table public.youtube_credentials enable row level security;
revoke all on public.youtube_credentials from anon, authenticated;
grant all on public.youtube_credentials to service_role;

create table public.youtube_publish_queue (
  id uuid primary key default gen_random_uuid(),
  article_id text not null unique,
  title text not null,
  script text not null,
  source_name text,
  source_url text,
  language text not null default 'en-IN',
  status text not null default 'queued',
  attempts integer not null default 0,
  youtube_video_id text,
  youtube_url text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  uploaded_at timestamptz
);
alter table public.youtube_publish_queue enable row level security;
revoke all on public.youtube_publish_queue from anon;
grant select on public.youtube_publish_queue to authenticated;
grant all on public.youtube_publish_queue to service_role;
create policy "Admins can view youtube queue" on public.youtube_publish_queue
  for select to authenticated using (public.has_role(auth.uid(), 'admin'::public.app_role));