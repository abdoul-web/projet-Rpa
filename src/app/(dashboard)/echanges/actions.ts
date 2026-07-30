"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";

async function requireUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié.");
  return { supabase, userId: user.id };
}

export async function ajouterQuart(formData: FormData) {
  const { supabase, userId } = await requireUserId();

  const date = String(formData.get("date") ?? "");
  const heure_debut = String(formData.get("heure_debut") ?? "");
  const heure_fin = String(formData.get("heure_fin") ?? "");
  const service = String(formData.get("service") ?? "").trim();

  if (!date || !heure_debut || !heure_fin) {
    throw new Error("Date, heure de début et heure de fin sont requises.");
  }

  const { error } = await supabase.from("quarts").insert({
    employe_id: userId,
    date,
    heure_debut,
    heure_fin,
    service,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/echanges");
}

export async function supprimerQuart(formData: FormData) {
  const { supabase } = await requireUserId();
  const quartId = String(formData.get("quartId") ?? "");

  const { error } = await supabase.from("quarts").delete().eq("id", quartId);
  if (error) throw new Error(error.message);
  revalidatePath("/echanges");
}

export async function proposerEchange(formData: FormData) {
  const { supabase, userId } = await requireUserId();
  const quartId = String(formData.get("quartId") ?? "");
  const message = String(formData.get("message") ?? "").trim();

  const { error } = await supabase.from("echanges_quarts").insert({
    quart_id: quartId,
    employe_offrant_id: userId,
    message,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/echanges");
}

export async function annulerOffre(formData: FormData) {
  const { supabase } = await requireUserId();
  const echangeId = String(formData.get("echangeId") ?? "");

  const { error } = await supabase
    .from("echanges_quarts")
    .update({ statut: "annule" })
    .eq("id", echangeId);

  if (error) throw new Error(error.message);
  revalidatePath("/echanges");
}

export async function prendreQuart(formData: FormData) {
  const { supabase, userId } = await requireUserId();
  const echangeId = String(formData.get("echangeId") ?? "");

  const { error } = await supabase
    .from("echanges_quarts")
    .update({ statut: "en_attente_approbation", employe_preneur_id: userId })
    .eq("id", echangeId);

  if (error) throw new Error(error.message);
  revalidatePath("/echanges");
}

async function requireAdmin() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    throw new Error("Accès réservé aux administrateurs.");
  }
  return profile;
}

export async function approuverEchange(formData: FormData) {
  await requireAdmin();
  const { supabase } = await requireUserId();
  const echangeId = String(formData.get("echangeId") ?? "");

  const { error } = await supabase
    .from("echanges_quarts")
    .update({ statut: "approuve" })
    .eq("id", echangeId);

  if (error) throw new Error(error.message);
  revalidatePath("/echanges");
}

export async function refuserEchange(formData: FormData) {
  await requireAdmin();
  const { supabase } = await requireUserId();
  const echangeId = String(formData.get("echangeId") ?? "");

  const { error } = await supabase
    .from("echanges_quarts")
    .update({ statut: "refuse" })
    .eq("id", echangeId);

  if (error) throw new Error(error.message);
  revalidatePath("/echanges");
}
