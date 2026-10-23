-- Échanges de quarts : quarts de travail + offres d'échange entre employés

create table if not exists public.quarts (
  id uuid primary key default gen_random_uuid(),
  employe_id uuid not null references public.profiles (id) on delete cascade,
  date date not null,
  heure_debut time not null,
  heure_fin time not null,
  service text not null default '',
  created_at timestamptz not null default now()
);

alter table public.quarts enable row level security;

create policy "Quarts visibles par les utilisateurs connectés"
  on public.quarts for select
  to authenticated
  using (true);

create policy "Un employé ajoute ses propres quarts"
  on public.quarts for insert
  to authenticated
  with check (employe_id = auth.uid() or public.is_admin());

create policy "Un employé modifie ses propres quarts"
  on public.quarts for update
  to authenticated
  using (employe_id = auth.uid() or public.is_admin())
  with check (employe_id = auth.uid() or public.is_admin());

create policy "Un employé supprime ses propres quarts"
  on public.quarts for delete
  to authenticated
  using (employe_id = auth.uid() or public.is_admin());

create table if not exists public.echanges_quarts (
  id uuid primary key default gen_random_uuid(),
  quart_id uuid not null references public.quarts (id) on delete cascade,
  employe_offrant_id uuid not null references public.profiles (id) on delete cascade,
  employe_preneur_id uuid references public.profiles (id) on delete set null,
  statut text not null default 'disponible'
    check (statut in ('disponible', 'en_attente_approbation', 'approuve', 'refuse', 'annule')),
  message text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.echanges_quarts enable row level security;

create policy "Échanges visibles par les utilisateurs connectés"
  on public.echanges_quarts for select
  to authenticated
  using (true);

create policy "Un employé offre un de ses quarts en échange"
  on public.echanges_quarts for insert
  to authenticated
  with check (
    statut = 'disponible'
    and employe_preneur_id is null
    and employe_offrant_id = auth.uid()
    and exists (
      select 1 from public.quarts
      where id = quart_id and employe_id = auth.uid()
    )
  );

-- Les transitions de statut (prise, annulation, approbation, refus) sont
-- entièrement validées par le trigger ci-dessous : la policy autorise la
-- tentative de mise à jour, le trigger décide si la transition est légale.
create policy "Mise à jour d'un échange (validée par trigger)"
  on public.echanges_quarts for update
  to authenticated
  using (true)
  with check (true);

drop trigger if exists on_echanges_quarts_updated on public.echanges_quarts;
create trigger on_echanges_quarts_updated
  before update on public.echanges_quarts
  for each row execute function public.handle_updated_at();

create or replace function public.enforce_echange_transitions()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_admin boolean := public.is_admin();
begin
  if old.statut in ('approuve', 'refuse', 'annule') and not v_is_admin then
    raise exception 'Cette demande d''échange est déjà close.';
  end if;

  if new.statut = 'annule' then
    if old.employe_offrant_id <> auth.uid() and not v_is_admin then
      raise exception 'Seul l''employé offrant peut annuler son offre.';
    end if;
    if old.statut <> 'disponible' and not v_is_admin then
      raise exception 'Seule une offre disponible peut être annulée.';
    end if;
    return new;
  end if;

  if old.statut = 'disponible' and new.statut = 'en_attente_approbation' then
    if new.employe_preneur_id is null then
      raise exception 'Un preneur doit être précisé.';
    end if;
    if new.employe_preneur_id <> auth.uid() and not v_is_admin then
      raise exception 'Vous ne pouvez prendre un quart que pour vous-même.';
    end if;
    if new.employe_preneur_id = old.employe_offrant_id then
      raise exception 'Vous ne pouvez pas prendre votre propre quart.';
    end if;
    return new;
  end if;

  if old.statut = 'en_attente_approbation' and new.statut in ('approuve', 'refuse') then
    if not v_is_admin then
      raise exception 'Seul un administrateur peut approuver ou refuser un échange.';
    end if;
    return new;
  end if;

  if new.statut = old.statut then
    if old.employe_offrant_id <> auth.uid() and not v_is_admin then
      raise exception 'Modification non autorisée.';
    end if;
    return new;
  end if;

  raise exception 'Transition de statut non autorisée (% -> %).', old.statut, new.statut;
end;
$$;

drop trigger if exists on_echanges_quarts_transition on public.echanges_quarts;
create trigger on_echanges_quarts_transition
  before update on public.echanges_quarts
  for each row execute function public.enforce_echange_transitions();

-- Quand un échange est approuvé, le quart change officiellement de titulaire.
create or replace function public.sync_quart_on_approval()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.statut = 'approuve' and old.statut <> 'approuve' then
    update public.quarts
    set employe_id = new.employe_preneur_id
    where id = new.quart_id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_echanges_quarts_approval on public.echanges_quarts;
create trigger on_echanges_quarts_approval
  after update on public.echanges_quarts
  for each row execute function public.sync_quart_on_approval();

-- Empêche la suppression d'un quart tant qu'un échange le concernant
-- est en attente ou approuvé (on garde la traçabilité).
create or replace function public.prevent_delete_quart_actif()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1 from public.echanges_quarts
    where quart_id = old.id and statut in ('en_attente_approbation', 'approuve')
  ) then
    raise exception 'Impossible de supprimer un quart avec un échange actif ou approuvé.';
  end if;
  return old;
end;
$$;

drop trigger if exists on_quarts_prevent_delete on public.quarts;
create trigger on_quarts_prevent_delete
  before delete on public.quarts
  for each row execute function public.prevent_delete_quart_actif();

create index if not exists quarts_employe_id_idx on public.quarts (employe_id);
create index if not exists quarts_date_idx on public.quarts (date);
create index if not exists echanges_quarts_statut_idx on public.echanges_quarts (statut);
create index if not exists echanges_quarts_quart_id_idx on public.echanges_quarts (quart_id);
