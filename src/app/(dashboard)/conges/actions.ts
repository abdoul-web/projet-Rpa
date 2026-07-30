"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";

export async function soumettreDemande(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié.");

  const motif = String(formData.get("motif") ?? "");
  const date_debut = String(formData.get("date_debut") ?? "");
  const date_fin = String(formData.get("date_fin") ?? "");
  const note = String(formData.get("note") ?? "").trim();

  if (!motif || !date_debut || !date_fin) {
    throw new Error("Motif, date de début et date de fin sont requis.");
  }

  const { error } = await supabase.from("demandes_conge").insert({
    employe_id: user.id,
    motif,
    date_debut,
    date_fin,
    note,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/conges");
}

export async function annulerDemande(formData: FormData) {
  const supabase = await createClient();
  const demandeId = String(formData.get("demandeId") ?? "");

  const { error } = await supabase
    .from("demandes_conge")
    .update({ statut: "annulee" })
    .eq("id", demandeId);

  if (error) throw new Error(error.message);
  revalidatePath("/conges");
}

async function requireAdmin() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    throw new Error("Accès réservé aux administrateurs.");
  }
}

export async function accepterDemande(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const demandeId = String(formData.get("demandeId") ?? "");

  const { error } = await supabase
    .from("demandes_conge")
    .update({ statut: "acceptee" })
    .eq("id", demandeId);

  if (error) throw new Error(error.message);
  revalidatePath("/conges");
}

export async function refuserDemande(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const demandeId = String(formData.get("demandeId") ?? "");

  const { error } = await supabase
    .from("demandes_conge")
    .update({ statut: "refusee" })
    .eq("id", demandeId);

  if (error) throw new Error(error.message);
  revalidatePath("/conges");
}
