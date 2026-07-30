-- Notifications programmées : abonnement push par appareil, et suivi des
-- plans de travail pour lesquels un employé veut recevoir des rappels.

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  employe_id uuid not null references public.profiles (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth_key text not null,
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

create policy "Un employé gère ses propres abonnements push"
  on public.push_subscriptions for all
  to authenticated
  using (employe_id = auth.uid())
  with check (employe_id = auth.uid());

-- Quels plans de travail un employé veut suivre (recevoir des rappels).
create table if not exists public.abonnements_plan (
  employe_id uuid not null references public.profiles (id) on delete cascade,
  plan_id uuid not null references public.plans_travail (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (employe_id, plan_id)
);

alter table public.abonnements_plan enable row level security;

create policy "Un employé gère ses propres abonnements de plan"
  on public.abonnements_plan for all
  to authenticated
  using (employe_id = auth.uid())
  with check (employe_id = auth.uid());

-- Empêche de renvoyer deux fois le rappel d'une même tâche le même jour.
-- Écrite uniquement par la route serveur (clé de service), donc pas de
-- policy d'écriture pour les utilisateurs normaux.
create table if not exists public.notifications_taches (
  tache_id uuid not null references public.plans_travail_taches (id) on delete cascade,
  date date not null,
  envoyee_a timestamptz not null default now(),
  primary key (tache_id, date)
);

alter table public.notifications_taches enable row level security;

create policy "Journal des notifications visible par les employés connectés"
  on public.notifications_taches for select
  to authenticated
  using (true);

create index if not exists push_subscriptions_employe_idx on public.push_subscriptions (employe_id);
create index if not exists abonnements_plan_plan_idx on public.abonnements_plan (plan_id);
