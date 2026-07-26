create table if not exists public.kaleido_storefront_documents (
  owner_key text not null,
  doc_key text not null,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (owner_key, doc_key)
);

alter table public.kaleido_storefront_documents enable row level security;

drop policy if exists "kaleido storefront public read" on public.kaleido_storefront_documents;
create policy "kaleido storefront public read"
on public.kaleido_storefront_documents
for select
to anon, authenticated
using (true);

drop policy if exists "kaleido storefront public publish" on public.kaleido_storefront_documents;
create policy "kaleido storefront public publish"
on public.kaleido_storefront_documents
for all
to anon, authenticated
using (owner_key = 'charles-kaleido-prod')
with check (owner_key = 'charles-kaleido-prod');
