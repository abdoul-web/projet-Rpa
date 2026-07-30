-- Rappels de rendez-vous / demandes familiales par résident
-- (ex: "être prêt à 14h pour un rendez-vous à l'hôpital").
-- Réutilise l'infrastructure de notifications push du plan de travail.

create table if not exists public.rappels_residents (
  id uuid primary key default gen_random_uuid(),
  resident_id uuid not null references public.residents (id) on delete cascade,
  date date not null,
  heure time not null,
  description text not null,
  cree_par_id uuid not null references public.profiles (id),
  complete boolean not null default false,
  complete_par_id uuid references public.profiles (id),
  complete_a timestamptz,
  notifie_a timestamptz,
  created_at timestamptz not null default now()
);

alter table public.rappels_residents enable row level security;

create policy "Rappels résidents visibles par les employés connectés"
  on public.rappels_residents for select
  to authenticated
  using (true);

create policy "Un employé ajoute un rappel en son propre nom"
  on public.rappels_residents for insert
  to authenticated
  with check (cree_par_id = auth.uid());

create policy "Un employé peut compléter ou modifier un rappel"
  on public.rappels_residents for update
  to authenticated
  using (true)
  with check (true);

create policy "Un administrateur peut supprimer un rappel"
  on public.rappels_residents for delete
  to authenticated
  using (public.is_admin());

create index if not exists rappels_residents_date_heure_idx
  on public.rappels_residents (date, heure);
create index if not exists rappels_residents_resident_idx
  on public.rappels_residents (resident_id);
