import { CalendarDays } from "lucide-react";
import { getCurrentProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import {
  LIBELLES_MOTIF,
  LIBELLES_STATUT_CONGE,
  type DemandeConge,
} from "@/lib/conges";
import {
  accepterDemande,
  annulerDemande,
  refuserDemande,
  soumettreDemande,
} from "./actions";

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("fr-CA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function CongesPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const supabase = await createClient();
  // La RLS limite déjà les résultats aux propres demandes de l'employé
  // (un administrateur voit celles de toute l'équipe).
  const { data } = await supabase
    .from("demandes_conge")
    .select("*, employe:profiles!demandes_conge_employe_id_fkey(id,prenom,nom)")
    .order("created_at", { ascending: false });

  const demandes = (data ?? []) as DemandeConge[];
  const mesDemandes = demandes.filter((d) => d.employe_id === profile.id);
  const aTraiter = demandes.filter((d) => d.statut === "en_attente");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-light tracking-tight text-slate-900">
          <CalendarDays className="h-6 w-6 text-accent/70" />
          Demandes de congé
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Maladie, congé parental, vacances, anniversaire — soumettez votre
          demande, la direction l&apos;approuve ou la refuse.
        </p>
      </div>

      {profile.role === "admin" && aTraiter.length > 0 && (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="font-medium text-slate-900">
            À traiter ({aTraiter.length})
          </h2>
          <ul className="mt-3 space-y-3">
            {aTraiter.map((demande) => (
              <li
                key={demande.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-white p-3 text-sm"
              >
                <div>
                  <span className="font-medium text-slate-900">
                    {demande.employe.prenom} {demande.employe.nom}
                  </span>{" "}
                  — {LIBELLES_MOTIF[demande.motif]} : du{" "}
                  {formatDate(demande.date_debut)} au {formatDate(demande.date_fin)}
                  {demande.note && (
                    <p className="mt-1 text-xs text-slate-500">« {demande.note} »</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <form action={accepterDemande}>
                    <input type="hidden" name="demandeId" value={demande.id} />
                    <button className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700">
                      Accepter
                    </button>
                  </form>
                  <form action={refuserDemande}>
                    <input type="hidden" name="demandeId" value={demande.id} />
                    <button className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100">
                      Refuser
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-xl border border-slate-100 bg-white p-5">
        <h2 className="font-medium text-slate-900">Nouvelle demande</h2>
        <form action={soumettreDemande} className="mt-3 grid gap-3 sm:grid-cols-4">
          <select
            name="motif"
            required
            defaultValue=""
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="" disabled>
              Motif
            </option>
            {Object.entries(LIBELLES_MOTIF).map(([valeur, libelle]) => (
              <option key={valeur} value={valeur}>
                {libelle}
              </option>
            ))}
          </select>
          <input
            name="date_debut"
            type="date"
            required
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            name="date_fin"
            type="date"
            required
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            name="note"
            placeholder="Note (optionnel)"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <button className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 sm:col-span-4">
            Soumettre la demande
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-slate-100 bg-white p-5">
        <h2 className="font-medium text-slate-900">Mes demandes</h2>
        <ul className="mt-3 divide-y divide-slate-100">
          {mesDemandes.map((demande) => (
            <li
              key={demande.id}
              className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
            >
              <span>
                {LIBELLES_MOTIF[demande.motif]} : du {formatDate(demande.date_debut)}{" "}
                au {formatDate(demande.date_fin)}
                <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  {LIBELLES_STATUT_CONGE[demande.statut]}
                </span>
              </span>
              {demande.statut === "en_attente" && (
                <form action={annulerDemande}>
                  <input type="hidden" name="demandeId" value={demande.id} />
                  <button className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100">
                    Annuler
                  </button>
                </form>
              )}
            </li>
          ))}
          {!mesDemandes.length && (
            <li className="py-3 text-sm text-slate-400">Aucune demande pour le moment.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
