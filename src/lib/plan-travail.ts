export type PlanTravail = {
  id: string;
  nom: string;
  unite_id: string | null;
  heure_debut: string;
  heure_fin: string;
  regles_generales: string;
  statut: "actif" | "inactif";
};

export type TachePlan = {
  id: string;
  plan_id: string;
  heure: string;
  libelle: string;
  ordre: number;
};

export type TacheCompletee = {
  id: string;
  tache_id: string;
  date: string;
  complete_par_id: string;
  complete_a: string;
  complete_par: { id: string; prenom: string; nom: string };
};

export function formatHeure(heure: string) {
  return heure.slice(0, 5);
}
