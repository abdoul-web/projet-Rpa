export type MotifConge = "maladie" | "parental" | "vacances" | "anniversaire";

export const LIBELLES_MOTIF: Record<MotifConge, string> = {
  maladie: "Maladie",
  parental: "Parental",
  vacances: "Vacances",
  anniversaire: "Anniversaire",
};

export type StatutConge = "en_attente" | "acceptee" | "refusee" | "annulee";

export const LIBELLES_STATUT_CONGE: Record<StatutConge, string> = {
  en_attente: "En attente",
  acceptee: "Acceptée",
  refusee: "Refusée",
  annulee: "Annulée",
};

export type DemandeConge = {
  id: string;
  employe_id: string;
  motif: MotifConge;
  date_debut: string;
  date_fin: string;
  note: string;
  statut: StatutConge;
  traite_par_id: string | null;
  traite_a: string | null;
  created_at: string;
  employe: { id: string; prenom: string; nom: string };
};
