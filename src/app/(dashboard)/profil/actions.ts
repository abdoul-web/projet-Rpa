"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function mettreAJourProfil(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const telephone = String(formData.get("telephone") ?? "");

  await supabase.from("profiles").update({ telephone }).eq("id", user.id);

  revalidatePath("/profil");
}
