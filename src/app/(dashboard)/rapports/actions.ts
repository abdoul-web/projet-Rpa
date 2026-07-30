"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";

export async function ajouterNote(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié.");

  const resident_id = String(formData.get("resident_id") ?? "");
  const date = String(formData.get("date") ?? "");
  const quart = String(formData.get("quart") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  const toiletteBrut = String(formData.get("toilette") ?? "");
  const toilette = ["fait", "non_fait", "refuse"].includes(toiletteBrut)
    ? toiletteBrut
    : null;

  if (!resident_id || !date || !quart || (!note && !toilette)) {
    throw new Error("Une note ou un statut de soins est requis.");
  }

  const { error } = await supabase.from("notes_residents").insert({
    resident_id,
    date,
    quart,
    note,
    toilette,
    auteur_id: user.id,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/rapports");
}

export async function ajouterRappel(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié.");

  const resident_id = String(formData.get("resident_id") ?? "");
  const date = String(formData.get("date") ?? "");
  const heure = String(formData.get("heure") ?? "");
  const description = String(formData.get("description") ?? "").trim();

  if (!resident_id || !date || !heure || !description) {
    throw new Error("Résident, date, heure et description sont requis.");
  }

  const { error } = await supabase.from("rappels_residents").insert({
    resident_id,
    date,
    heure,
    description,
    cree_par_id: user.id,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/rapports");
}

export async function completerRappel(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié.");

  const rappelId = String(formData.get("rappelId") ?? "");

  const { error } = await supabase
    .from("rappels_residents")
    .update({ complete: true, complete_par_id: user.id, complete_a: new Date().toISOString() })
    .eq("id", rappelId);

  if (error) throw new Error(error.message);
  revalidatePath("/rapports");
}

export async function ajouterResident(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    throw new Error("Accès réservé aux administrateurs.");
  }

  const prenom = String(formData.get("prenom") ?? "").trim();
  const nom = String(formData.get("nom") ?? "").trim();
  const chambre = String(formData.get("chambre") ?? "").trim();
  const allergies = String(formData.get("allergies") ?? "").trim();
  const unite_id = String(formData.get("unite_id") ?? "") || null;

  if (!prenom || !nom) {
    throw new Error("Prénom et nom du résident sont requis.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("residents")
    .insert({ prenom, nom, chambre, allergies, unite_id });

  if (error) throw new Error(error.message);
  revalidatePath("/rapports");
  revalidatePath("/menu");
}

export async function changerStatutResident(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    throw new Error("Accès réservé aux administrateurs.");
  }

  const residentId = String(formData.get("residentId") ?? "");
  const statut = formData.get("statut") === "inactif" ? "inactif" : "actif";

  const supabase = await createClient();
  const { error } = await supabase
    .from("residents")
    .update({ statut })
    .eq("id", residentId);

  if (error) throw new Error(error.message);
  revalidatePath("/rapports");
  revalidatePath("/menu");
}
