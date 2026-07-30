"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    throw new Error("Accès réservé aux administrateurs.");
  }
  return profile;
}

export async function basculerTache(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié.");

  const tacheId = String(formData.get("tacheId") ?? "");
  const date = String(formData.get("date") ?? "");
  const completeeId = String(formData.get("completeeId") ?? "");

  if (completeeId) {
    const { error } = await supabase
      .from("taches_completees")
      .delete()
      .eq("id", completeeId);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("taches_completees").insert({
      tache_id: tacheId,
      date,
      complete_par_id: user.id,
    });
    if (error) throw new Error(error.message);
  }

  revalidatePath("/plan-travail");
}

export async function creerPlan(formData: FormData) {
  await requireAdmin();

  const nom = String(formData.get("nom") ?? "").trim();
  const heure_debut = String(formData.get("heure_debut") ?? "");
  const heure_fin = String(formData.get("heure_fin") ?? "");
  const unite_id = String(formData.get("unite_id") ?? "") || null;
  const regles_generales = String(formData.get("regles_generales") ?? "").trim();

  if (!nom || !heure_debut || !heure_fin) {
    throw new Error("Nom, heure de début et heure de fin sont requis.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("plans_travail").insert({
    nom,
    heure_debut,
    heure_fin,
    unite_id,
    regles_generales,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/plan-travail");
}

export async function changerStatutPlan(formData: FormData) {
  await requireAdmin();

  const planId = String(formData.get("planId") ?? "");
  const statut = formData.get("statut") === "inactif" ? "inactif" : "actif";

  const supabase = await createClient();
  const { error } = await supabase
    .from("plans_travail")
    .update({ statut })
    .eq("id", planId);

  if (error) throw new Error(error.message);
  revalidatePath("/plan-travail");
}

export async function ajouterTache(formData: FormData) {
  await requireAdmin();

  const plan_id = String(formData.get("plan_id") ?? "");
  const heure = String(formData.get("heure") ?? "");
  const libelle = String(formData.get("libelle") ?? "").trim();

  if (!plan_id || !heure || !libelle) {
    throw new Error("Heure et libellé de la tâche sont requis.");
  }

  const supabase = await createClient();
  const { count } = await supabase
    .from("plans_travail_taches")
    .select("id", { count: "exact", head: true })
    .eq("plan_id", plan_id)
    .eq("heure", heure);

  const { error } = await supabase.from("plans_travail_taches").insert({
    plan_id,
    heure,
    libelle,
    ordre: (count ?? 0) + 1,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/plan-travail");
}

export async function supprimerTache(formData: FormData) {
  await requireAdmin();

  const tacheId = String(formData.get("tacheId") ?? "");
  const supabase = await createClient();
  const { error } = await supabase
    .from("plans_travail_taches")
    .delete()
    .eq("id", tacheId);

  if (error) throw new Error(error.message);
  revalidatePath("/plan-travail");
}
