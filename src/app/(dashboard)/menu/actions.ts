"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";

export async function mettreAJourMenu(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié.");

  const unite_id = String(formData.get("unite_id") ?? "");
  const date = String(formData.get("date") ?? "");
  const repas = String(formData.get("repas") ?? "");
  const description = String(formData.get("description") ?? "").trim();

  if (!unite_id || !date || !repas) {
    throw new Error("Unité, date et repas sont requis.");
  }

  const { error } = await supabase.from("menus_jour").upsert(
    {
      unite_id,
      date,
      repas,
      description,
      modifie_par_id: user.id,
    },
    { onConflict: "unite_id,date,repas" },
  );

  if (error) throw new Error(error.message);
  revalidatePath("/menu");
}

export async function ajouterUnite(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    throw new Error("Accès réservé aux administrateurs.");
  }

  const nom = String(formData.get("nom") ?? "").trim();
  if (!nom) throw new Error("Le nom de l'unité est requis.");

  const supabase = await createClient();
  const { error } = await supabase.from("unites").insert({ nom });

  if (error) throw new Error(error.message);
  revalidatePath("/menu");
  revalidatePath("/rapports");
}

export async function changerStatutUnite(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    throw new Error("Accès réservé aux administrateurs.");
  }

  const uniteId = String(formData.get("uniteId") ?? "");
  const statut = formData.get("statut") === "inactif" ? "inactif" : "actif";

  const supabase = await createClient();
  const { error } = await supabase
    .from("unites")
    .update({ statut })
    .eq("id", uniteId);

  if (error) throw new Error(error.message);
  revalidatePath("/menu");
  revalidatePath("/rapports");
}
