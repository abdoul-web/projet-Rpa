import { createClient } from "@/lib/supabase/server";

export type Profile = {
  id: string;
  prenom: string;
  nom: string;
  courriel: string;
  telephone: string;
  poste: string;
  service: string;
  role: "admin" | "employe";
  statut: "actif" | "inactif";
  date_embauche: string | null;
};

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile as Profile | null;
}
