-- Plan de travail : modèles de tâches par bloc horaire, avec case à cocher
-- signée (qui, quand) pour chaque tâche complétée dans la journée.

create table if not exists public.plans_travail (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  unite_id uuid references public.unites (id) on delete set null,
  heure_debut time not null,
  heure_fin time not null,
  regles_generales text not null default '',
  statut text not null default 'actif' check (statut in ('actif', 'inactif')),
  created_at timestamptz not null default now()
);

alter table public.plans_travail enable row level security;

create policy "Plans de travail visibles par les employés connectés"
  on public.plans_travail for select
  to authenticated
  using (true);

create policy "Un administrateur gère les plans de travail"
  on public.plans_travail for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create table if not exists public.plans_travail_taches (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans_travail (id) on delete cascade,
  heure time not null,
  libelle text not null,
  ordre integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.plans_travail_taches enable row level security;

create policy "Tâches visibles par les employés connectés"
  on public.plans_travail_taches for select
  to authenticated
  using (true);

create policy "Un administrateur gère les tâches d'un plan"
  on public.plans_travail_taches for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Une "coche" par tâche et par jour : qui l'a faite, à quelle heure.
create table if not exists public.taches_completees (
  id uuid primary key default gen_random_uuid(),
  tache_id uuid not null references public.plans_travail_taches (id) on delete cascade,
  date date not null,
  complete_par_id uuid not null references public.profiles (id),
  complete_a timestamptz not null default now(),
  unique (tache_id, date)
);

alter table public.taches_completees enable row level security;

create policy "Complétions visibles par les employés connectés"
  on public.taches_completees for select
  to authenticated
  using (true);

create policy "Un employé signe une tâche en son propre nom"
  on public.taches_completees for insert
  to authenticated
  with check (complete_par_id = auth.uid());

create policy "Décocher : seulement l'auteur ou un administrateur"
  on public.taches_completees for delete
  to authenticated
  using (complete_par_id = auth.uid() or public.is_admin());

create index if not exists plans_travail_taches_plan_heure_idx
  on public.plans_travail_taches (plan_id, heure, ordre);
create index if not exists taches_completees_date_idx on public.taches_completees (date);

-- Exemple réel fourni par la résidence : plan de nuit PAB ailes A (00h00-08h00).
-- Les plans de jour peuvent être ajoutés ensuite via l'écran d'administration.
with plan as (
  insert into public.plans_travail (nom, heure_debut, heure_fin, regles_generales)
  values (
    'PAB ailes A (00h00-08h00)',
    '00:00',
    '08:00',
    E'Répondre aux cloches\nRépondre à la porte si quelqu''un sonne\nAvoir le téléphone sans fil sur soi en tout temps et répondre en tout temps\nFaire des tournées visuelles à toutes les heures\nToujours travailler en équipe\nSi une des deux PAB n''a pas sa loi 90 : la PAB avec la loi 90 doit donner la médication de tout le département\nTournées visuelles dans toutes les chambres obligatoires à toutes les heures entre 00h00 et 8h00'
  )
  returning id
)
insert into public.plans_travail_taches (plan_id, heure, libelle, ordre)
select plan.id, v.heure, v.libelle, v.ordre
from plan, (values
  ('00:00'::time, 'Faire le décompte des narcotiques avec la PAB qui quitte à minuit.', 1),
  ('00:00', 'Lire l''interservice.', 2),
  ('00:00', 'Vérifier si un suivi post-chute est en cours, poursuivre et compléter selon les heures indiquées.', 3),
  ('00:00', 'Regarder le plan de soins et la feuille de tâches, et initialiser.', 4),
  ('01:00', 'Monter les tables de la salle à dîner du D/E conjointement avec la PAB du C si 2 PAB.', 1),
  ('01:30', 'Faire le lavage selon le calendrier (un panier à la fois).', 1),
  ('01:30', 'Faire les tournées pour les changements de culotte selon le calendrier.', 2),
  ('01:30', 'Préparer le matériel pour les déjeuners.', 3),
  ('01:30', 'Plier tous les lavages effectués.', 4),
  ('01:30', 'Faire les filtres à café (2 chaudières).', 5),
  ('01:30', 'Remplir sucrier, sel, poivre.', 6),
  ('01:30', 'Remplir les pots de céréales.', 7),
  ('01:30', 'Laver le réfrigérateur (une fois par semaine) ainsi que les portes d''armoires.', 8),
  ('01:30', 'Laver les rampes et les poignées de portes (une fois par semaine).', 9),
  ('01:30', 'Laver les chambres à air des pompes (une fois par semaine).', 10),
  ('05:00', 'Ouvrir les rideaux du salon et les lumières.', 1),
  ('05:00', 'Changer la date du calendrier.', 2),
  ('05:00', 'Partir les filtres de café.', 3),
  ('06:00', 'Faire le décompte des narcotiques avec la PAB qui arrive à 6h00.', 1),
  ('06:00', 'Faire un rapport verbal à la personne qui prend la relève du quart suivant.', 2),
  ('06:00', 'Débuter la toilette partielle en suivant les plans de soins (bas support).', 3),
  ('06:00', 'Faire un minimum de 4 toilettes partielles avant de quitter (vérifier l''horaire de bain).', 4),
  ('07:45', 'Compléter le rapport interservices, signer et compléter le plan de soins, les FADM et les suivis de selles.', 1),
  ('08:00', 'Fin du quart.', 1)
) as v(heure, libelle, ordre);
