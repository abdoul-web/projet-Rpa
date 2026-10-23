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

export async function publierAnnonce(formData: FormData) {
  const profile = await requireAdmin();

  const titre = String(formData.get("titre") ?? "").trim();
  const contenu = String(formData.get("contenu") ?? "").trim();
  const epingle = formData.get("epingle") === "on";

  if (!titre) {
    throw new Error("Le titre est requis.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("annonces").insert({
    titre,
    contenu,
    epingle,
    auteur_id: profile.id,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/babillard");
}

export async function supprimerAnnonce(formData: FormData) {
  await requireAdmin();

  const annonceId = String(formData.get("annonceId") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.from("annonces").delete().eq("id", annonceId);

  if (error) throw new Error(error.message);
  revalidatePath("/babillard");
}

export async function basculerEpingle(formData: FormData) {
  await requireAdmin();

  const annonceId = String(formData.get("annonceId") ?? "");
  const epingle = String(formData.get("epingle") ?? "") === "true";

  const supabase = await createClient();
  const { error } = await supabase
    .from("annonces")
    .update({ epingle: !epingle })
    .eq("id", annonceId);

  if (error) throw new Error(error.message);
  revalidatePath("/babillard");
}
