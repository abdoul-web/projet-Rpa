export type Quart = {
  id: string;
  employe_id: string;
  date: string;
  heure_debut: string;
  heure_fin: string;
  service: string;
};

export type Personne = {
  id: string;
  prenom: string;
  nom: string;
};

export type StatutEchange =
  | "disponible"
  | "en_attente_approbation"
  | "approuve"
  | "refuse"
  | "annule";

export type EchangeQuart = {
  id: string;
  quart_id: string;
  employe_offrant_id: string;
  employe_preneur_id: string | null;
  statut: StatutEchange;
  message: string;
  created_at: string;
  quart: Quart;
  offrant: Personne;
  preneur: Personne | null;
};

export const LIBELLES_STATUT: Record<StatutEchange, string> = {
  disponible: "Disponible",
  en_attente_approbation: "En attente d'approbation",
  approuve: "Approuvé",
  refuse: "Refusé",
  annule: "Annulé",
};
