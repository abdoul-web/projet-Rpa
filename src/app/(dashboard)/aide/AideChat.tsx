"use client";

import { useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import type { MessageAide } from "@/lib/aide";
import { poserQuestion } from "./actions";

const SUGGESTIONS = [
  "Comment activer les rappels du plan de travail ?",
  "Comment proposer un échange de quart ?",
  "Comment soumettre une demande de congé ?",
];

export function AideChat() {
  const [historique, setHistorique] = useState<MessageAide[]>([]);
  const [question, setQuestion] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const finRef = useRef<HTMLDivElement>(null);

  async function envoyer(texte: string) {
    const q = texte.trim();
    if (!q || enCours) return;

    setErreur(null);
    setQuestion("");
    setEnCours(true);
    const historiquePourEnvoi = historique;
    setHistorique((prev) => [...prev, { role: "user", contenu: q }]);

    const resultat = await poserQuestion(historiquePourEnvoi, q);
    setEnCours(false);

    if ("erreur" in resultat) {
      setErreur(resultat.erreur);
      return;
    }

    setHistorique((prev) => [...prev, { role: "assistant", contenu: resultat.reponse }]);
    requestAnimationFrame(() => finRef.current?.scrollIntoView({ behavior: "smooth" }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    envoyer(question);
  }

  return (
    <div className="space-y-6">
      {historique.length === 0 && (
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Quelques exemples de questions :</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => envoyer(s)}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 hover:border-accent/50 hover:text-slate-900"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {historique.length > 0 && (
        <div className="space-y-6">
          {historique.map((m, i) =>
            m.role === "user" ? (
              <p key={i} className="text-lg font-light text-slate-900">
                {m.contenu}
              </p>
            ) : (
              <p key={i} className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                {m.contenu}
              </p>
            ),
          )}
          {enCours && <p className="text-sm text-slate-400">L&apos;assistant réfléchit…</p>}
          <div ref={finRef} />
        </div>
      )}

      {erreur && <p className="text-sm text-red-600">{erreur}</p>}

      <form onSubmit={onSubmit} className="flex items-center gap-2 border-t border-slate-100 pt-4">
        <Sparkles className="h-4 w-4 shrink-0 text-accent/70" />
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Posez votre question…"
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={enCours || !question.trim()}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          Envoyer
        </button>
      </form>
    </div>
  );
}
