# Projet RPA — Application pour résidence privée

Application interne pour la résidence : espace employés, rapports
interservices, échanges de quarts, et plus à venir.

Construite avec [Next.js](https://nextjs.org) et [Supabase](https://supabase.com)
(base de données, authentification) — hébergement gratuit possible pour démarrer
(Vercel + palier gratuit Supabase).

## État actuel

- ✅ Espace employés : connexion, invitations par courriel, profils, rôles
  (admin / employé), gestion des employés par un administrateur
- ✅ Échanges de quarts : ajout de ses quarts, mise en échange, prise d'un
  quart offert par un collègue, approbation finale par un administrateur
- ✅ Rapports interservices : notes par résident pour chaque quart
  (jour/soir/nuit), avec suivi structuré des soins d'hygiène
- ✅ Menu du jour : menu par unité (déjeuner/dîner/souper) entré par la
  cuisine, avec rappel des allergies des résidents de chaque unité
- ✅ Plan de travail : tâches par bloc horaire (comme le plan papier),
  à cocher pendant le quart — chaque case garde qui l'a cochée et à
  quelle heure. Les 5 plans réels de l'aile A sont déjà configurés
  comme exemples (nuit 00h-08h, jour 6h-14h, jour 6h30-15h, soir
  14h-22h, soir 15h30-00h) ; les autres ailes se créent depuis l'écran
  d'administration
- ⏳ Disponibilités + horaire — à venir
- ⏳ Notifications programmées (rappel au moment prévu) — à venir, une
  fois le plan de travail éprouvé

La résidence peut être divisée en une ou plusieurs unités (configurable
par un administrateur dans **Menu du jour > Gérer les unités**) — chaque
résident peut être rattaché à une unité.

## Mise en place

### 1. Créer un projet Supabase

1. Créez un compte gratuit sur [supabase.com](https://supabase.com) et un
   nouveau projet.
2. Dans **SQL Editor**, exécutez dans l'ordre les fichiers du dossier
   `supabase/migrations/` (`0001_init.sql` crée `profiles` et les rôles,
   `0002_echanges_quarts.sql` ajoute les quarts et les échanges,
   `0003_rapports_interservices.sql` ajoute les résidents et leurs notes,
   `0004_unites_menus.sql` ajoute les unités et le menu du jour,
   `0005_plan_travail.sql` ajoute le plan de travail (avec un exemple réel),
   `0006_plan_travail_soir.sql` ajoute les plans de soir (14h-22h et 15h30-00h),
   `0007_plan_travail_jour.sql` ajoute les plans de jour (6h-14h et 6h30-15h)).
3. Dans **Authentication > Emails**, configurez le modèle d'invitation
   ("Invite user") pour qu'il pointe vers `/auth/confirm` (voir
   [documentation Supabase SSR](https://supabase.com/docs/guides/auth/server-side/nextjs))
   — remplacez le lien du modèle par :
   `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite&next=/auth/definir-mot-de-passe`
4. Dans **Authentication > URL Configuration**, ajoutez l'URL de votre
   application (ex: `http://localhost:3000`, puis votre domaine une fois
   déployé) dans "Redirect URLs".

### 2. Configurer les variables d'environnement

Copiez `.env.example` vers `.env.local` et remplissez les valeurs trouvées
dans **Réglages > API** de votre projet Supabase :

```bash
cp .env.example .env.local
```

⚠️ `SUPABASE_SERVICE_ROLE_KEY` est une clé secrète (elle contourne les
règles de sécurité) — ne jamais la commiter ni l'exposer côté navigateur.

### 3. Créer le premier administrateur

Aucune inscription publique n'est possible (les comptes sont créés par
invitation). Pour créer le tout premier administrateur :

1. Dans le tableau de bord Supabase, **Authentication > Users**, cliquez sur
   "Invite user" et entrez votre courriel.
2. Une fois le compte créé, dans **Table Editor > profiles**, modifiez la
   ligne correspondante pour mettre `role` à `admin`.
3. Suivez le lien reçu par courriel pour définir votre mot de passe.

Ensuite, vous pourrez inviter les autres employés directement depuis
l'application (page **Employés**).

### 4. Lancer en local

```bash
npm install
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000).

## Déploiement gratuit

- Déployez sur [Vercel](https://vercel.com) (palier gratuit) en connectant
  ce dépôt GitHub.
- Ajoutez les mêmes variables d'environnement dans les réglages du projet
  Vercel.
- Mettez à jour `NEXT_PUBLIC_SITE_URL` et les "Redirect URLs" Supabase avec
  votre domaine de production.
