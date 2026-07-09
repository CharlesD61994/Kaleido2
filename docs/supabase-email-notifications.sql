alter table public.kaleido_client_projects
add column if not exists client_message_emails_enabled boolean not null default true,
add column if not exists client_progress_emails_enabled boolean not null default true,
add column if not exists progress_changed_at timestamptz,
add column if not exists last_progress_email_sent_at timestamptz,
add column if not exists progress_email_claimed_at timestamptz,
add column if not exists last_notified_progress integer not null default 0,
add column if not exists client_last_seen_at timestamptz,
add column if not exists client_message_email_pending boolean not null default false,
add column if not exists last_client_message_email_sent_at timestamptz;

alter table public.kaleido_client_messages
add column if not exists email_notified_at timestamptz;

alter table public.kaleido_client_messages enable row level security;

drop policy if exists "kaleido client messages owner access" on public.kaleido_client_messages;

create policy "kaleido client messages owner access"
on public.kaleido_client_messages
for all
to authenticated
using (
  exists (
    select 1
    from public.kaleido_client_projects p
    where p.share_token = kaleido_client_messages.share_token
      and p.owner_key = auth.uid()::text
  )
)
with check (
  sender = 'owner'
  and exists (
    select 1
    from public.kaleido_client_projects p
    where p.share_token = kaleido_client_messages.share_token
      and p.owner_key = auth.uid()::text
  )
);
