-- Espace employés : profils, rôles et sécurité au niveau des lignes (RLS)

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  prenom text not null default '',
  nom text not null default '',
  courriel text not null default '',
  telephone text not null default '',
  poste text not null default '',
  service text not null default '',
  role text not null default 'employe' check (role in ('admin', 'employe')),
  statut text not null default 'actif' check (statut in ('actif', 'inactif')),
  date_embauche date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Fonction utilitaire (security definer pour éviter la récursion RLS)
-- qui indique si l'utilisateur courant est administrateur.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Toute personne connectée peut voir les profils actifs de l'équipe
-- (nécessaire pour les échanges de quarts et l'annuaire employés).
create policy "Profils visibles par les utilisateurs connectés"
  on public.profiles for select
  to authenticated
  using (true);

-- Un employé peut modifier certains de ses champs (téléphone, etc.)
-- via son propre profil ; la modification du rôle/statut est bloquée
-- côté application (server actions admin) qui utilisent la clé de service.
create policy "Un employé peut modifier son propre profil"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Un administrateur peut modifier tous les profils"
  on public.profiles for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Création automatique du profil à l'inscription d'un utilisateur
-- (déclenchée par auth.admin.inviteUserByEmail côté admin).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, prenom, nom, courriel, poste, service, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'prenom', ''),
    coalesce(new.raw_user_meta_data->>'nom', ''),
    new.email,
    coalesce(new.raw_user_meta_data->>'poste', ''),
    coalesce(new.raw_user_meta_data->>'service', ''),
    coalesce(new.raw_user_meta_data->>'role', 'employe')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Défense en profondeur : même si la policy "propre profil" autorise un
-- employé à modifier sa ligne, il ne doit jamais pouvoir s'attribuer le
-- rôle admin ou se remettre "actif" lui-même via un appel direct à l'API.
-- Les changements de role/statut restent possibles pour un administrateur
-- ou pour la clé de service (utilisée par les server actions admin).
create or replace function public.prevent_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (new.role is distinct from old.role or new.statut is distinct from old.statut)
     and auth.role() <> 'service_role'
     and not public.is_admin() then
    new.role := old.role;
    new.statut := old.statut;
  end if;
  return new;
end;
$$;

drop trigger if exists on_profiles_prevent_escalation on public.profiles;
create trigger on_profiles_prevent_escalation
  before update on public.profiles
  for each row execute function public.prevent_privilege_escalation();

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_profiles_updated on public.profiles;
create trigger on_profiles_updated
  before update on public.profiles
  for each row execute function public.handle_updated_at();
