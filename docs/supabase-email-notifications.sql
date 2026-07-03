alter table public.kaleido_client_projects
add column if not exists client_message_emails_enabled boolean not null default true,
add column if not exists client_progress_emails_enabled boolean not null default true,
add column if not exists progress_changed_at timestamptz,
add column if not exists last_progress_email_sent_at timestamptz,
add column if not exists last_notified_progress integer not null default 0;

alter table public.kaleido_client_messages
add column if not exists email_notified_at timestamptz;
