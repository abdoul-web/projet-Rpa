import { MessageCircle } from "lucide-react";
import { getCurrentProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import type { MessageAffichable } from "@/lib/chat";
import { ChatFeed } from "./ChatFeed";

export default async function ClavardagePage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("messages_chat")
    .select("*, auteur:profiles!messages_chat_auteur_id_fkey(prenom,nom)")
    .order("created_at", { ascending: true })
    .limit(200);

  const messages = (data ?? []) as MessageAffichable[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-light tracking-tight text-slate-900">
          <MessageCircle className="h-6 w-6 text-accent/70" />
          Clavardage
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Discussion d&apos;équipe en direct — pour remplacer le groupe Messenger.
        </p>
      </div>

      <ChatFeed
        messagesInitiaux={messages}
        profil={{ id: profile.id, prenom: profile.prenom, nom: profile.nom }}
      />
    </div>
  );
}
