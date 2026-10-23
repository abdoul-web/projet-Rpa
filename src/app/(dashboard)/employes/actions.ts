"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/profile";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function ensureAdmin() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    throw new Error("Accès réservé aux administrateurs.");
  }
  return profile;
}

export async function inviterEmploye(formData: FormData) {
  await ensureAdmin();

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const prenom = String(formData.get("prenom") ?? "").trim();
  const nom = String(formData.get("nom") ?? "").trim();
  const poste = String(formData.get("poste") ?? "").trim();
  const service = String(formData.get("service") ?? "").trim();
  const role = formData.get("role") === "admin" ? "admin" : "employe";

  if (!email || !prenom || !nom) {
    throw new Error("Courriel, prénom et nom sont requis.");
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const admin = createAdminClient();

  const { error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { prenom, nom, poste, service, role },
    redirectTo: `${siteUrl}/auth/confirm?next=${encodeURIComponent("/auth/definir-mot-de-passe")}`,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/employes");
}

export async function changerRole(formData: FormData) {
  await ensureAdmin();

  const userId = String(formData.get("userId") ?? "");
  const role = formData.get("role") === "admin" ? "admin" : "employe";

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);

  if (error) throw new Error(error.message);

  revalidatePath("/employes");
}

export async function changerStatut(formData: FormData) {
  await ensureAdmin();

  const userId = String(formData.get("userId") ?? "");
  const statut = formData.get("statut") === "inactif" ? "inactif" : "actif";

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ statut })
    .eq("id", userId);

  if (error) throw new Error(error.message);

  revalidatePath("/employes");
}
