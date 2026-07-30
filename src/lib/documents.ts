export type DocumentFichier = {
  id: string;
  titre: string;
  description: string;
  chemin: string;
  televerse_par_id: string;
  created_at: string;
  televerse_par: { id: string; prenom: string; nom: string };
};
