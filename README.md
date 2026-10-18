# Chrono Piste

Chronométrage de plusieurs karts en même temps, avec un téléphone. Gratuit, sans matériel.

## Comment ça marche

1. Le téléphone filme la ligne d'arrivée, de côté. Une ligne orange virtuelle est placée sur la ligne d'arrivée.
2. Quand un kart traverse la ligne, l'app note l'heure exacte et prend une photo.
3. L'opérateur touche le numéro du kart sous la photo (pas besoin de se dépêcher, l'heure est déjà notée).
4. Le premier passage d'un kart part son chrono. Chaque passage suivant termine un tour.
5. Le classement se fait au meilleur tour. Le gagnant est affiché en haut.

Les boutons « Passage manuel » permettent aussi de chronométrer sans caméra, ou d'ajouter un passage manqué.

## Ouvrir l'app sur un téléphone

La caméra ne fonctionne que si la page est ouverte depuis une adresse `https://`. Avec GitHub Pages :

1. Sur GitHub, va dans **Settings → Pages** du dépôt.
2. Dans **Source**, choisis « Deploy from a branch », la branche voulue et le dossier `/ (root)`.
3. Après une minute, l'app est en ligne à `https://<ton-compte>.github.io/projet-rpa/`.
4. Ouvre cette adresse sur le téléphone et accepte l'accès à la caméra.

## Conseils sur la piste

- Mets le téléphone sur un trépied ou bien appuyé, sans bouger, à environ 2–4 m de la piste.
- Filme de côté pour que les karts passent de gauche à droite dans l'image.
- Pendant un essai, ajuste la **sensibilité** : la barre en bas de l'image doit dépasser le trait blanc quand un kart passe, et rester en dessous le reste du temps.
- Le **tour minimum** (dans Réglages) écarte les doubles détections : un tour plus court ne compte pas.
- Demande la permission au propriétaire de la piste avant d'installer le téléphone.

## Fichiers

- `src/chrono-piste.html` : le code de l'app.
- `index.html` : la page complète, générée par `./build.sh` à partir de `src/`. Relance `./build.sh` après chaque modification.
