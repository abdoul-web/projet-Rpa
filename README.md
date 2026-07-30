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
- ✅ Notifications programmées : rappel push envoyé à l'heure de chaque
  tâche du plan de travail (aux employés qui s'y sont abonnés) et de
  chaque rappel résident, tant qu'ils ne sont pas déjà cochés/complétés.
  Fonctionne sur téléphone (Android directement, iPhone via "Ajouter à
  l'écran d'accueil")
- ✅ Rappels &amp; rendez-vous résidents : sur la page Rapports
  interservices, noter qu'un résident doit être prêt à une heure
  précise (rendez-vous, sortie familiale...) — notification envoyée
  à l'heure prévue
- ✅ Babillard : annonces de la direction visibles par tous les employés,
  avec option "épingler"
- ✅ Demandes de congé : maladie, parental, vacances, anniversaire —
  calqué sur le formulaire papier de la résidence. L'employé soumet
  (et peut annuler tant que c'est en attente), la direction accepte
  ou refuse
- ✅ Documents/procédures : bibliothèque de fichiers (politiques,
  formulaires) téléversés par un administrateur, consultables par tous
- ⏳ Disponibilités + horaire — délibérément laissé de côté pour l'instant
  (une seule personne fait l'horaire chaque semaine)
- ⏳ Feuille de temps (heures créditées/débitées, entrée/sortie) — mis
  de côté pour l'instant, gros morceau distinct des demandes de congé

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
   `0007_plan_travail_jour.sql` ajoute les plans de jour (6h-14h et 6h30-15h),
   `0008_notifications.sql` ajoute les abonnements aux rappels,
   `0009_rappels_residents.sql` ajoute les rappels de rendez-vous résidents,
   `0010_babillard.sql` ajoute les annonces,
   `0011_demandes_conge.sql` ajoute les demandes de congé,
   `0012_documents.sql` ajoute la bibliothèque de documents (et le bucket
   de stockage associé)).
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

### 4. Activer les notifications programmées

Cette étape est optionnelle — le reste de l'application fonctionne sans elle.

1. Générez votre paire de clés VAPID (une seule fois, à conserver) :
   ```bash
   node scripts/generate-vapid-keys.mjs
   ```
   Ajoutez `NEXT_PUBLIC_VAPID_PUBLIC_KEY` et `VAPID_PRIVATE_KEY` à `.env.local`,
   ainsi que `VAPID_SUBJECT` (ex: `mailto:vous@exemple.com`).
2. Générez une valeur aléatoire pour `CRON_SECRET` (ex: `openssl rand -hex 32`)
   et ajoutez-la à `.env.local`. C'est le mot de passe qui protège la route
   qui envoie les rappels.
3. Une fois déployée (voir ci-dessous), configurez un service de cron
   **gratuit** — par exemple [cron-job.org](https://cron-job.org) — pour
   appeler cette URL **chaque minute** :
   ```
   https://votre-domaine.com/api/rappels/executer?secret=VOTRE_CRON_SECRET
   ```
4. Dans l'application, chaque employé doit :
   - Sur la page **Plan de travail**, cliquer sur « Activer les rappels sur
     cet appareil » (une fois par appareil).
   - Cliquer sur « Recevoir un rappel pour chaque tâche » sur le(s) plan(s)
     qui le concernent.
   - **Sur iPhone** : Safari n'autorise les notifications que pour une page
     "ajoutée à l'écran d'accueil" (bouton Partager → Sur l'écran d'accueil).
     Ouvrez ensuite l'application depuis cette icône avant d'activer les
     rappels. Sur Android/Chrome, ça fonctionne directement dans le
     navigateur.

Le fuseau horaire utilisé pour comparer l'heure des tâches est
`America/Toronto` par défaut (variable `APP_TIMEZONE`).

### 5. Lancer en local

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
