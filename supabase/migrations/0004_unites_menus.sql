-- Unités de la résidence + menu du jour par unité

create table if not exists public.unites (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  statut text not null default 'actif' check (statut in ('actif', 'inactif')),
  created_at timestamptz not null default now()
);

alter table public.unites enable row level security;

create policy "Unités visibles par les employés connectés"
  on public.unites for select
  to authenticated
  using (true);

create policy "Un administrateur gère les unités"
  on public.unites for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Rattacher un résident à une unité et lui associer ses allergies
-- (utile pour croiser le menu du jour avec les allergies à surveiller).
alter table public.residents
  add column if not exists unite_id uuid references public.unites (id) on delete set null;

alter table public.residents
  add column if not exists allergies text not null default '';

create table if not exists public.menus_jour (
  id uuid primary key default gen_random_uuid(),
  unite_id uuid not null references public.unites (id) on delete cascade,
  date date not null,
  repas text not null check (repas in ('dejeuner', 'diner', 'souper')),
  description text not null default '',
  modifie_par_id uuid not null references public.profiles (id),
  updated_at timestamptz not null default now(),
  unique (unite_id, date, repas)
);

alter table public.menus_jour enable row level security;

create policy "Menus visibles par les employés connectés"
  on public.menus_jour for select
  to authenticated
  using (true);

create policy "Un employé écrit le menu du jour"
  on public.menus_jour for insert
  to authenticated
  with check (modifie_par_id = auth.uid());

create policy "Un employé modifie le menu du jour"
  on public.menus_jour for update
  to authenticated
  using (true)
  with check (modifie_par_id = auth.uid());

drop trigger if exists on_menus_jour_updated on public.menus_jour;
create trigger on_menus_jour_updated
  before update on public.menus_jour
  for each row execute function public.handle_updated_at();

create index if not exists menus_jour_date_idx on public.menus_jour (date);
create index if not exists residents_unite_id_idx on public.residents (unite_id);
