-- Rapports interservices : notes par résident, par quart (jour/soir/nuit)

create table if not exists public.residents (
  id uuid primary key default gen_random_uuid(),
  prenom text not null,
  nom text not null,
  chambre text not null default '',
  statut text not null default 'actif' check (statut in ('actif', 'inactif')),
  created_at timestamptz not null default now()
);

alter table public.residents enable row level security;

create policy "Résidents visibles par les employés connectés"
  on public.residents for select
  to authenticated
  using (true);

create policy "Un administrateur gère la liste des résidents"
  on public.residents for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Journal de notes par résident et par quart. Volontairement append-only
-- (pas de policy update) : comme en santé, on corrige en ajoutant une
-- nouvelle note plutôt qu'en modifiant l'historique. Seul un administrateur
-- peut supprimer une note en cas d'erreur.
create table if not exists public.notes_residents (
  id uuid primary key default gen_random_uuid(),
  resident_id uuid not null references public.residents (id) on delete cascade,
  auteur_id uuid not null references public.profiles (id),
  date date not null,
  quart text not null check (quart in ('jour', 'soir', 'nuit')),
  note text not null default '',
  toilette text check (toilette in ('fait', 'non_fait', 'refuse')),
  created_at timestamptz not null default now()
);

alter table public.notes_residents enable row level security;

create policy "Notes visibles par les employés connectés"
  on public.notes_residents for select
  to authenticated
  using (true);

create policy "Un employé ajoute une note en son propre nom"
  on public.notes_residents for insert
  to authenticated
  with check (auteur_id = auth.uid());

create policy "Un administrateur peut supprimer une note"
  on public.notes_residents for delete
  to authenticated
  using (public.is_admin());

create index if not exists notes_residents_resident_date_quart_idx
  on public.notes_residents (resident_id, date, quart);
create index if not exists residents_statut_idx on public.residents (statut);
