"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function definirMotDePasse(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");

  if (password.length < 8) {
    redirect(
      "/auth/definir-mot-de-passe?error=" +
        encodeURIComponent("Le mot de passe doit contenir au moins 8 caractères."),
    );
  }

  if (password !== confirmation) {
    redirect(
      "/auth/definir-mot-de-passe?error=" +
        encodeURIComponent("Les mots de passe ne correspondent pas."),
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect(
      "/auth/definir-mot-de-passe?error=" + encodeURIComponent(error.message),
    );
  }

  redirect("/");
}
