export type Periode = "jour" | "soir" | "nuit";

export const LIBELLES_PERIODE: Record<Periode, string> = {
  jour: "Jour",
  soir: "Soir",
  nuit: "Nuit",
};

export const ORDRE_PERIODES: Periode[] = ["jour", "soir", "nuit"];

export type Unite = {
  id: string;
  nom: string;
  statut: "actif" | "inactif";
};

export type Resident = {
  id: string;
  prenom: string;
  nom: string;
  chambre: string;
  statut: "actif" | "inactif";
  unite_id: string | null;
  allergies: string;
};

export type ToiletteStatut = "fait" | "non_fait" | "refuse";

export const LIBELLES_TOILETTE: Record<ToiletteStatut, string> = {
  fait: "Faite",
  non_fait: "Non faite",
  refuse: "Refusée",
};

export type NoteResident = {
  id: string;
  resident_id: string;
  auteur_id: string;
  date: string;
  quart: Periode;
  note: string;
  toilette: ToiletteStatut | null;
  created_at: string;
  auteur: { id: string; prenom: string; nom: string };
};

export function periodeSelonHeure(date = new Date()): Periode {
  const heure = date.getHours();
  if (heure >= 7 && heure < 15) return "jour";
  if (heure >= 15 && heure < 23) return "soir";
  return "nuit";
}

export function periodePrecedente(
  date: string,
  quart: Periode,
): { date: string; quart: Periode } {
  if (quart === "soir") return { date, quart: "jour" };
  if (quart === "nuit") return { date, quart: "soir" };
  const veille = new Date(`${date}T00:00:00`);
  veille.setDate(veille.getDate() - 1);
  return { date: veille.toISOString().slice(0, 10), quart: "nuit" };
}
