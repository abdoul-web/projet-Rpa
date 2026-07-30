-- Documents/procédures : bibliothèque de fichiers consultable par les
-- employés, gérée par un administrateur (remplace une partie du classeur
-- papier de politiques/procédures).

insert into storage.buckets (id, name, public)
values ('documents', 'documents', true)
on conflict (id) do nothing;

create policy "Documents (fichiers) visibles par les employés connectés"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'documents');

create policy "Un administrateur téléverse des documents"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'documents' and public.is_admin());

create policy "Un administrateur supprime des documents"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'documents' and public.is_admin());

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  titre text not null,
  description text not null default '',
  chemin text not null,
  televerse_par_id uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

alter table public.documents enable row level security;

create policy "Documents (métadonnées) visibles par les employés connectés"
  on public.documents for select
  to authenticated
  using (true);

create policy "Un administrateur gère les documents"
  on public.documents for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
