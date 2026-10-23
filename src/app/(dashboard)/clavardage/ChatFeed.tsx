"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { MessageAffichable, MessageChat } from "@/lib/chat";

export function ChatFeed({
  messagesInitiaux,
  profil,
}: {
  messagesInitiaux: MessageAffichable[];
  profil: { id: string; prenom: string; nom: string };
}) {
  const [messages, setMessages] = useState<MessageAffichable[]>(messagesInitiaux);
  const [texte, setTexte] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const finRef = useRef<HTMLDivElement>(null);
  const auteursConnus = useRef(new Map<string, { prenom: string; nom: string }>());

  useEffect(() => {
    for (const m of messagesInitiaux) {
      auteursConnus.current.set(m.auteur_id, m.auteur);
    }
  }, [messagesInitiaux]);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("messages_chat_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages_chat" },
        (payload) => {
          const nouveau = payload.new as MessageChat;

          setMessages((prev) => {
            if (prev.some((m) => m.id === nouveau.id)) return prev;
            const auteurConnu = auteursConnus.current.get(nouveau.auteur_id);
            return [...prev, { ...nouveau, auteur: auteurConnu ?? { prenom: "…", nom: "" } }];
          });

          if (!auteursConnus.current.has(nouveau.auteur_id)) {
            supabase
              .from("profiles")
              .select("prenom, nom")
              .eq("id", nouveau.auteur_id)
              .single()
              .then(({ data }) => {
                if (!data) return;
                auteursConnus.current.set(nouveau.auteur_id, data);
                setMessages((prev) =>
                  prev.map((m) => (m.id === nouveau.id ? { ...m, auteur: data } : m)),
                );
              });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    const contenu = texte.trim();
    if (!contenu) return;

    setEnvoi(true);
    const supabase = createClient();
    const { error } = await supabase.from("messages_chat").insert({
      auteur_id: profil.id,
      contenu,
    });
    setEnvoi(false);
    if (!error) setTexte("");
  }

  return (
    <div className="flex h-[70vh] flex-col rounded-xl border border-slate-100 bg-white">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((m) => {
          const estMoi = m.auteur_id === profil.id;
          return (
            <div key={m.id} className={`flex ${estMoi ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                  estMoi ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-800"
                }`}
              >
                {!estMoi && (
                  <p className="mb-0.5 text-xs font-medium text-slate-500">
                    {m.auteur.prenom} {m.auteur.nom}
                  </p>
                )}
                <p className="whitespace-pre-wrap">{m.contenu}</p>
                <p className={`mt-1 text-[10px] ${estMoi ? "text-white/60" : "text-slate-400"}`}>
                  {new Date(m.created_at).toLocaleTimeString("fr-CA", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          );
        })}
        {!messages.length && (
          <p className="text-sm text-slate-400">Aucun message pour le moment. Dites bonjour !</p>
        )}
        <div ref={finRef} />
      </div>
      <form onSubmit={envoyer} className="flex items-center gap-2 border-t border-slate-100 p-3">
        <input
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          placeholder="Écrire un message..."
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={envoi || !texte.trim()}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          Envoyer
        </button>
      </form>
    </div>
  );
}
