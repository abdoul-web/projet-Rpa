import { getCurrentProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import type { Annonce } from "@/lib/babillard";
import { basculerEpingle, publierAnnonce, supprimerAnnonce } from "./actions";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("fr-CA", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function BabillardPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const supabase = await createClient();
  const { data: annonces } = await supabase
    .from("annonces")
    .select("*, auteur:profiles!annonces_auteur_id_fkey(id,prenom,nom)")
    .order("epingle", { ascending: false })
    .order("created_at", { ascending: false });

  const listeAnnonces = (annonces ?? []) as Annonce[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Babillard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Annonces de la direction pour toute l&apos;équipe.
        </p>
      </div>

      {profile.role === "admin" && (
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-medium text-slate-900">Publier une annonce</h2>
          <form action={publierAnnonce} className="mt-3 space-y-3">
            <input
              name="titre"
              placeholder="Titre"
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <textarea
              name="contenu"
              rows={3}
              placeholder="Message..."
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" name="epingle" className="rounded border-slate-300" />
              Épingler en haut du babillard
            </label>
            <button className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
              Publier
            </button>
          </form>
        </section>
      )}

      <div className="space-y-3">
        {listeAnnonces.map((annonce) => (
          <section
            key={annonce.id}
            className={`rounded-xl border p-5 ${
              annonce.epingle ? "border-amber-300 bg-amber-50" : "border-slate-200 bg-white"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-medium text-slate-900">
                  {annonce.epingle && "📌 "}
                  {annonce.titre}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {annonce.auteur.prenom} {annonce.auteur.nom} · {formatDate(annonce.created_at)}
                </p>
              </div>
              {profile.role === "admin" && (
                <div className="flex gap-2">
                  <form action={basculerEpingle}>
                    <input type="hidden" name="annonceId" value={annonce.id} />
                    <input type="hidden" name="epingle" value={String(annonce.epingle)} />
                    <button className="rounded-md border border-slate-300 px-3 py-1 text-xs text-slate-700 hover:bg-slate-100">
                      {annonce.epingle ? "Désépingler" : "Épingler"}
                    </button>
                  </form>
                  <form action={supprimerAnnonce}>
                    <input type="hidden" name="annonceId" value={annonce.id} />
                    <button className="rounded-md border border-slate-300 px-3 py-1 text-xs text-slate-700 hover:bg-slate-100">
                      Supprimer
                    </button>
                  </form>
                </div>
              )}
            </div>
            {annonce.contenu && (
              <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{annonce.contenu}</p>
            )}
          </section>
        ))}
        {!listeAnnonces.length && (
          <p className="text-sm text-slate-400">Aucune annonce pour le moment.</p>
        )}
      </div>
    </div>
  );
}
