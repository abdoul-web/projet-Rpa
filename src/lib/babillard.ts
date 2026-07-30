export type Annonce = {
  id: string;
  titre: string;
  contenu: string;
  auteur_id: string;
  epingle: boolean;
  created_at: string;
  auteur: { id: string; prenom: string; nom: string };
};
