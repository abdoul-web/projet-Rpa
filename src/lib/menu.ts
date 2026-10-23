export type Repas = "dejeuner" | "diner" | "souper";

export const ORDRE_REPAS: Repas[] = ["dejeuner", "diner", "souper"];

export const LIBELLES_REPAS: Record<Repas, string> = {
  dejeuner: "Déjeuner",
  diner: "Dîner",
  souper: "Souper",
};

export type MenuJour = {
  id: string;
  unite_id: string;
  date: string;
  repas: Repas;
  description: string;
  modifie_par_id: string;
  updated_at: string;
};
