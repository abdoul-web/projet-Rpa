import { getCurrentProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import type { EchangeQuart, Quart } from "@/lib/echanges";
import { LIBELLES_STATUT } from "@/lib/echanges";
import {
  ajouterQuart,
  annulerOffre,
  approuverEchange,
  prendreQuart,
  proposerEchange,
  refuserEchange,
  supprimerQuart,
} from "./actions";

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("fr-CA", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default async function EchangesPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: mesQuarts }, { data: mesOffres }, { data: disponibles }, { data: mesDemandes }] =
    await Promise.all([
      supabase
        .from("quarts")
        .select("*")
        .eq("employe_id", profile.id)
        .gte("date", today)
        .order("date", { ascending: true }),
      supabase
        .from("echanges_quarts")
        .select("*")
        .eq("employe_offrant_id", profile.id)
        .in("statut", ["disponible", "en_attente_approbation"]),
      supabase
        .from("echanges_quarts")
        .select(
          "*, quart:quarts!echanges_quarts_quart_id_fkey(*), offrant:profiles!echanges_quarts_employe_offrant_id_fkey(id,prenom,nom)",
        )
        .eq("statut", "disponible")
        .neq("employe_offrant_id", profile.id)
        .order("created_at", { ascending: true }),
      supabase
        .from("echanges_quarts")
        .select(
          "*, quart:quarts!echanges_quarts_quart_id_fkey(*), offrant:profiles!echanges_quarts_employe_offrant_id_fkey(id,prenom,nom), preneur:profiles!echanges_quarts_employe_preneur_id_fkey(id,prenom,nom)",
        )
        .or(`employe_offrant_id.eq.${profile.id},employe_preneur_id.eq.${profile.id}`)
        .order("updated_at", { ascending: false })
        .limit(20),
    ]);

  const quartsAvecOffreActive = new Set(
    (mesOffres ?? []).map((o) => o.quart_id as string),
  );

  let enAttenteApprobation: EchangeQuart[] = [];
  if (profile.role === "admin") {
    const { data } = await supabase
      .from("echanges_quarts")
      .select(
        "*, quart:quarts!echanges_quarts_quart_id_fkey(*), offrant:profiles!echanges_quarts_employe_offrant_id_fkey(id,prenom,nom), preneur:profiles!echanges_quarts_employe_preneur_id_fkey(id,prenom,nom)",
      )
      .eq("statut", "en_attente_approbation")
      .order("updated_at", { ascending: true });
    enAttenteApprobation = (data ?? []) as EchangeQuart[];
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Échanges de quarts</h1>
        <p className="mt-1 text-sm text-slate-500">
          Ajoutez vos quarts, proposez-les en échange, et prenez un quart offert
          par un collègue.
        </p>
      </div>

      {profile.role === "admin" && enAttenteApprobation.length > 0 && (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="font-medium text-slate-900">
            À approuver ({enAttenteApprobation.length})
          </h2>
          <ul className="mt-3 space-y-3">
            {enAttenteApprobation.map((echange) => (
              <li
                key={echange.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-white p-3 text-sm"
              >
                <div>
                  <span className="font-medium text-slate-900">
                    {echange.offrant.prenom} {echange.offrant.nom}
                  </span>{" "}
                  cède son quart du {formatDate(echange.quart.date)} (
                  {echange.quart.heure_debut}–{echange.quart.heure_fin}
                  {echange.quart.service ? `, ${echange.quart.service}` : ""}) à{" "}
                  <span className="font-medium text-slate-900">
                    {echange.preneur?.prenom} {echange.preneur?.nom}
                  </span>
                </div>
                <div className="flex gap-2">
                  <form action={approuverEchange}>
                    <input type="hidden" name="echangeId" value={echange.id} />
                    <button className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700">
                      Approuver
                    </button>
                  </form>
                  <form action={refuserEchange}>
                    <input type="hidden" name="echangeId" value={echange.id} />
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

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-medium text-slate-900">Mes quarts à venir</h2>

        <form action={ajouterQuart} className="mt-4 grid gap-3 sm:grid-cols-4">
          <input
            name="date"
            type="date"
            required
            min={today}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            name="heure_debut"
            type="time"
            required
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            name="heure_fin"
            type="time"
            required
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            name="service"
            placeholder="Service (ex: Soins)"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 sm:col-span-4"
          >
            Ajouter ce quart
          </button>
        </form>

        <ul className="mt-5 divide-y divide-slate-100">
          {(mesQuarts as Quart[] | null)?.map((quart) => {
            const offreActive = quartsAvecOffreActive.has(quart.id);
            return (
              <li key={quart.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                <span>
                  {formatDate(quart.date)} · {quart.heure_debut}–{quart.heure_fin}
                  {quart.service ? ` · ${quart.service}` : ""}
                </span>
                <div className="flex gap-2">
                  {offreActive ? (
                    <span className="rounded-md bg-slate-100 px-3 py-1.5 text-xs text-slate-500">
                      Déjà proposé en échange
                    </span>
                  ) : (
                    <form action={proposerEchange}>
                      <input type="hidden" name="quartId" value={quart.id} />
                      <button className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100">
                        Proposer en échange
                      </button>
                    </form>
                  )}
                  {!offreActive && (
                    <form action={supprimerQuart}>
                      <input type="hidden" name="quartId" value={quart.id} />
                      <button className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100">
                        Supprimer
                      </button>
                    </form>
                  )}
                </div>
              </li>
            );
          })}
          {!mesQuarts?.length && (
            <li className="py-3 text-sm text-slate-400">Aucun quart à venir.</li>
          )}
        </ul>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-medium text-slate-900">Quarts disponibles à l&apos;échange</h2>
        <ul className="mt-3 divide-y divide-slate-100">
          {(disponibles as EchangeQuart[] | null)?.map((echange) => (
            <li key={echange.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
              <div>
                <span className="font-medium text-slate-900">
                  {echange.offrant.prenom} {echange.offrant.nom}
                </span>{" "}
                offre son quart du {formatDate(echange.quart.date)} (
                {echange.quart.heure_debut}–{echange.quart.heure_fin}
                {echange.quart.service ? `, ${echange.quart.service}` : ""})
                {echange.message && (
                  <p className="mt-1 text-xs text-slate-500">« {echange.message} »</p>
                )}
              </div>
              <form action={prendreQuart}>
                <input type="hidden" name="echangeId" value={echange.id} />
                <button className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700">
                  Prendre ce quart
                </button>
              </form>
            </li>
          ))}
          {!disponibles?.length && (
            <li className="py-3 text-sm text-slate-400">Aucun quart disponible pour le moment.</li>
          )}
        </ul>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-medium text-slate-900">Mes demandes</h2>
        <ul className="mt-3 divide-y divide-slate-100">
          {(mesDemandes as EchangeQuart[] | null)?.map((echange) => (
            <li key={echange.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
              <div>
                Quart du {formatDate(echange.quart.date)} (
                {echange.quart.heure_debut}–{echange.quart.heure_fin}) ·{" "}
                {echange.offrant.prenom} {echange.offrant.nom}
                {echange.preneur ? ` → ${echange.preneur.prenom} ${echange.preneur.nom}` : ""}
                <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  {LIBELLES_STATUT[echange.statut]}
                </span>
              </div>
              {echange.statut === "disponible" && echange.employe_offrant_id === profile.id && (
                <form action={annulerOffre}>
                  <input type="hidden" name="echangeId" value={echange.id} />
                  <button className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100">
                    Annuler
                  </button>
                </form>
              )}
            </li>
          ))}
          {!mesDemandes?.length && (
            <li className="py-3 text-sm text-slate-400">Aucune demande pour le moment.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
