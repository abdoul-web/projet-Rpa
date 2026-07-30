-- Babillard : annonces de la direction visibles par tous les employés.

create table if not exists public.annonces (
  id uuid primary key default gen_random_uuid(),
  titre text not null,
  contenu text not null default '',
  auteur_id uuid not null references public.profiles (id),
  epingle boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.annonces enable row level security;

create policy "Annonces visibles par les employés connectés"
  on public.annonces for select
  to authenticated
  using (true);

create policy "Un administrateur gère les annonces"
  on public.annonces for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create index if not exists annonces_epingle_idx on public.annonces (epingle, created_at desc);
