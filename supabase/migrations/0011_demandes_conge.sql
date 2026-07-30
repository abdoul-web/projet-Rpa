-- Demandes de congé/absence, calquées sur le formulaire papier de la
-- résidence (motif, dates, approbation par la direction).

create table if not exists public.demandes_conge (
  id uuid primary key default gen_random_uuid(),
  employe_id uuid not null references public.profiles (id) on delete cascade,
  motif text not null check (motif in ('maladie', 'parental', 'vacances', 'anniversaire')),
  date_debut date not null,
  date_fin date not null,
  note text not null default '',
  statut text not null default 'en_attente'
    check (statut in ('en_attente', 'acceptee', 'refusee', 'annulee')),
  traite_par_id uuid references public.profiles (id),
  traite_a timestamptz,
  created_at timestamptz not null default now()
);

alter table public.demandes_conge enable row level security;

-- Une demande de congé touche à des motifs sensibles (maladie, etc.) :
-- seul l'employé concerné et un administrateur peuvent la consulter.
create policy "Un employé voit ses propres demandes, un admin voit tout"
  on public.demandes_conge for select
  to authenticated
  using (employe_id = auth.uid() or public.is_admin());

create policy "Un employé soumet sa propre demande"
  on public.demandes_conge for insert
  to authenticated
  with check (employe_id = auth.uid() and statut = 'en_attente');

create policy "Mise à jour d'une demande (validée par trigger)"
  on public.demandes_conge for update
  to authenticated
  using (employe_id = auth.uid() or public.is_admin())
  with check (employe_id = auth.uid() or public.is_admin());

create or replace function public.enforce_demande_conge_transitions()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_admin boolean := public.is_admin();
begin
  if old.statut <> 'en_attente' and not v_is_admin then
    raise exception 'Cette demande a déjà été traitée.';
  end if;

  if new.statut = 'annulee' then
    if old.employe_id <> auth.uid() and not v_is_admin then
      raise exception 'Seul l''employé peut annuler sa propre demande.';
    end if;
    return new;
  end if;

  if new.statut in ('acceptee', 'refusee') then
    if not v_is_admin then
      raise exception 'Seul un administrateur peut accepter ou refuser une demande.';
    end if;
    new.traite_par_id := auth.uid();
    new.traite_a := now();
    return new;
  end if;

  if new.statut = old.statut then
    return new;
  end if;

  raise exception 'Transition de statut non autorisée (% -> %).', old.statut, new.statut;
end;
$$;

drop trigger if exists on_demandes_conge_transition on public.demandes_conge;
create trigger on_demandes_conge_transition
  before update on public.demandes_conge
  for each row execute function public.enforce_demande_conge_transitions();

create index if not exists demandes_conge_employe_idx on public.demandes_conge (employe_id);
create index if not exists demandes_conge_statut_idx on public.demandes_conge (statut);
