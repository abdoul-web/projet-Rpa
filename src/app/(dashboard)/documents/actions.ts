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

function nomFichierSecuritaire(nom: string) {
  return nom
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-");
}

export async function televerserDocument(formData: FormData) {
  const admin = await requireAdmin();

  const fichier = formData.get("fichier") as File | null;
  const titre = String(formData.get("titre") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!fichier || fichier.size === 0) {
    throw new Error("Un fichier est requis.");
  }
  if (!titre) {
    throw new Error("Le titre est requis.");
  }

  const supabase = await createClient();
  const chemin = `${Date.now()}-${nomFichierSecuritaire(fichier.name)}`;

  const { error: erreurUpload } = await supabase.storage
    .from("documents")
    .upload(chemin, fichier, { contentType: fichier.type || undefined });

  if (erreurUpload) throw new Error(erreurUpload.message);

  const { error } = await supabase.from("documents").insert({
    titre,
    description,
    chemin,
    televerse_par_id: admin.id,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/documents");
}

export async function supprimerDocument(formData: FormData) {
  await requireAdmin();

  const documentId = String(formData.get("documentId") ?? "");
  const chemin = String(formData.get("chemin") ?? "");

  const supabase = await createClient();
  await supabase.storage.from("documents").remove([chemin]);

  const { error } = await supabase.from("documents").delete().eq("id", documentId);
  if (error) throw new Error(error.message);
  revalidatePath("/documents");
}
