# Projet RPA — Application pour résidence privée

Application interne pour la résidence : espace employés, rapports
interservices, échanges de quarts, et plus à venir.

Construite avec [Next.js](https://nextjs.org) et [Supabase](https://supabase.com)
(base de données, authentification) — hébergement gratuit possible pour démarrer
(Vercel + palier gratuit Supabase).

## État actuel

- ✅ Espace employés : connexion, invitations par courriel, profils, rôles
  (admin / employé), gestion des employés par un administrateur
- ⏳ Rapports interservices — à venir
- ⏳ Échanges de quarts — à venir

## Mise en place

### 1. Créer un projet Supabase

1. Créez un compte gratuit sur [supabase.com](https://supabase.com) et un
   nouveau projet.
2. Dans **SQL Editor**, exécutez le contenu de
   `supabase/migrations/0001_init.sql` (crée la table `profiles`, les rôles
   et les règles de sécurité).
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
