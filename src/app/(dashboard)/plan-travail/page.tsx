import Link from "next/link";
import { ListChecks } from "lucide-react";
import { getCurrentProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import {
  formatHeure,
  type PlanTravail,
  type TacheCompletee,
  type TachePlan,
} from "@/lib/plan-travail";
import type { Unite } from "@/lib/rapports";
import {
  ajouterTache,
  basculerAbonnementPlan,
  basculerTache,
  changerStatutPlan,
  creerPlan,
  supprimerTache,
} from "./actions";
import { RappelsToggle } from "./RappelsToggle";

function heureActuelle() {
  const maintenant = new Date();
  return `${String(maintenant.getHours()).padStart(2, "0")}:${String(
    maintenant.getMinutes(),
  ).padStart(2, "0")}`;
}

export default async function PlanTravailPage({
  searchParams,
}: {
  searchParams: Promise<{ planId?: string; date?: string }>;
}) {
  const params = await searchParams;
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const date = params.date ?? new Date().toISOString().slice(0, 10);
  const supabase = await createClient();

  const [{ data: plans }, { data: unites }, { data: abonnements }] = await Promise.all([
    supabase
      .from("plans_travail")
      .select("*")
      .eq("statut", "actif")
      .order("heure_debut"),
    supabase.from("unites").select("*").eq("statut", "actif").order("nom"),
    supabase.from("abonnements_plan").select("plan_id").eq("employe_id", profile.id),
  ]);

  const planIdsAbonnes = new Set((abonnements ?? []).map((a) => a.plan_id as string));

  const listePlans = (plans as PlanTravail[] | null) ?? [];
  const maintenant = heureActuelle();

  const planSelectionne =
    listePlans.find((p) => p.id === params.planId) ??
    listePlans.find((p) => p.heure_debut <= maintenant && maintenant < p.heure_fin) ??
    listePlans[0];

  let taches: TachePlan[] = [];
  let completions: TacheCompletee[] = [];

  if (planSelectionne) {
    const [{ data: tachesData }, { data: completionsData }] = await Promise.all([
      supabase
        .from("plans_travail_taches")
        .select("*")
        .eq("plan_id", planSelectionne.id)
        .order("heure")
        .order("ordre"),
      supabase
        .from("taches_completees")
        .select("*, complete_par:profiles!taches_completees_complete_par_id_fkey(id,prenom,nom)")
        .eq("date", date),
    ]);
    taches = (tachesData ?? []) as TachePlan[];
    const idsTaches = new Set(taches.map((t) => t.id));
    completions = ((completionsData ?? []) as TacheCompletee[]).filter((c) =>
      idsTaches.has(c.tache_id),
    );
  }

  const completionParTache = new Map(completions.map((c) => [c.tache_id, c]));

  const blocs = new Map<string, TachePlan[]>();
  for (const tache of taches) {
    const liste = blocs.get(tache.heure) ?? [];
    liste.push(tache);
    blocs.set(tache.heure, liste);
  }
  const heuresBlocs = [...blocs.keys()].sort();
  const blocActuel = [...heuresBlocs].reverse().find((h) => h <= maintenant);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-light tracking-tight text-slate-900">
          <ListChecks className="h-6 w-6 text-accent/70" />
          Plan de travail
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Les tâches à faire pendant votre quart, à cocher au fur et à mesure.
        </p>
        <div className="mt-3">
          <RappelsToggle employeId={profile.id} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-100 bg-white p-4">
        <div className="flex flex-wrap gap-4">
          {listePlans.map((plan) => (
            <Link
              key={plan.id}
              href={`/plan-travail?planId=${plan.id}&date=${date}`}
              className={`border-b-2 pb-0.5 text-sm ${
                planSelectionne?.id === plan.id
                  ? "border-accent font-medium text-slate-900"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              {plan.nom}
            </Link>
          ))}
        </div>

        <form method="get" className="ml-auto flex items-center gap-2">
          {planSelectionne && (
            <input type="hidden" name="planId" value={planSelectionne.id} />
          )}
          <input
            type="date"
            name="date"
            defaultValue={date}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
          />
          <button className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100">
            Aller
          </button>
        </form>
      </div>

      {!listePlans.length && (
        <p className="text-sm text-slate-400">
          Aucun plan de travail actif.{" "}
          {profile.role === "admin" ? "Créez-en un ci-dessous." : ""}
        </p>
      )}

      {planSelectionne && (
        <>
          <form action={basculerAbonnementPlan} className="flex items-center gap-2">
            <input type="hidden" name="planId" value={planSelectionne.id} />
            <input
              type="hidden"
              name="abonne"
              value={planIdsAbonnes.has(planSelectionne.id) ? "true" : "false"}
            />
            <button className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100">
              {planIdsAbonnes.has(planSelectionne.id)
                ? `🔔 Rappels activés pour « ${planSelectionne.nom} » — désactiver`
                : `🔕 Recevoir un rappel pour chaque tâche de « ${planSelectionne.nom} »`}
            </button>
          </form>

          {planSelectionne.regles_generales && (
            <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
              <h2 className="font-medium text-slate-900">
                En tout temps (sauf lors de votre repas)
              </h2>
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-700">
                {planSelectionne.regles_generales.split("\n").map((ligne, i) => (
                  <li key={i}>{ligne}</li>
                ))}
              </ul>
            </section>
          )}

          <div className="space-y-3">
            {heuresBlocs.map((heure) => {
              const tachesBloc = blocs.get(heure) ?? [];
              const toutesFaites = tachesBloc.every((t) =>
                completionParTache.has(t.id),
              );
              const enRetard = heure < maintenant && !toutesFaites;
              const estActuel = heure === blocActuel;

              return (
                <section
                  key={heure}
                  className={`rounded-xl border p-5 ${
                    enRetard
                      ? "border-red-200 bg-red-50"
                      : estActuel
                        ? "border-accent bg-white"
                        : "border-slate-100 bg-white"
                  }`}
                >
                  <h3 className="font-medium text-slate-900">
                    {formatHeure(heure)}
                    {estActuel && (
                      <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-xs text-white">
                        En cours
                      </span>
                    )}
                    {enRetard && (
                      <span className="ml-2 rounded-full bg-red-600 px-2 py-0.5 text-xs text-white">
                        À faire
                      </span>
                    )}
                  </h3>
                  <ul className="mt-3 space-y-2">
                    {tachesBloc.map((tache) => {
                      const completee = completionParTache.get(tache.id);
                      const peutDecocher =
                        completee &&
                        (completee.complete_par_id === profile.id ||
                          profile.role === "admin");
                      const peutInteragir = !completee || peutDecocher;

                      return (
                        <li key={tache.id} className="flex items-start gap-3 text-sm">
                          {peutInteragir ? (
                            <form action={basculerTache}>
                              <input type="hidden" name="tacheId" value={tache.id} />
                              <input type="hidden" name="date" value={date} />
                              <input
                                type="hidden"
                                name="completeeId"
                                value={completee?.id ?? ""}
                              />
                              <button
                                type="submit"
                                aria-label={completee ? "Décocher" : "Cocher"}
                                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs ${
                                  completee
                                    ? "border-accent bg-accent text-white"
                                    : "border-slate-300 bg-white"
                                }`}
                              >
                                {completee ? "✓" : ""}
                              </button>
                            </form>
                          ) : (
                            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-accent bg-accent text-xs text-white">
                              ✓
                            </span>
                          )}
                          <div>
                            <p
                              className={
                                completee ? "text-slate-500 line-through" : "text-slate-800"
                              }
                            >
                              {tache.libelle}
                            </p>
                            {completee && (
                              <p className="text-xs text-slate-400">
                                {completee.complete_par.prenom}{" "}
                                {completee.complete_par.nom} à{" "}
                                {new Date(completee.complete_a).toLocaleTimeString("fr-CA", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </div>
        </>
      )}

      {profile.role === "admin" && (
        <section className="rounded-xl border border-slate-100 bg-white p-5">
          <h2 className="font-medium text-slate-900">Gérer les plans de travail</h2>

          <form action={creerPlan} className="mt-3 grid gap-3 sm:grid-cols-2">
            <input
              name="nom"
              placeholder="Nom (ex: PAB ailes A (06h00-14h00))"
              required
              className="rounded-md border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
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
            <select
              name="unite_id"
              defaultValue=""
              className="rounded-md border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
            >
              <option value="">Aucune unité en particulier</option>
              {(unites as Unite[] | null)?.map((unite) => (
                <option key={unite.id} value={unite.id}>
                  {unite.nom}
                </option>
              ))}
            </select>
            <textarea
              name="regles_generales"
              rows={3}
              placeholder="Règles générales (une par ligne)"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
            />
            <button className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 sm:col-span-2">
              Créer le plan
            </button>
          </form>

          <ul className="mt-4 divide-y divide-slate-100">
            {listePlans.map((plan) => (
              <li key={plan.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span>
                  {plan.nom} ({formatHeure(plan.heure_debut)}–{formatHeure(plan.heure_fin)})
                </span>
                <form action={changerStatutPlan}>
                  <input type="hidden" name="planId" value={plan.id} />
                  <input type="hidden" name="statut" value="inactif" />
                  <button className="rounded-md border border-slate-300 px-3 py-1 text-xs text-slate-700 hover:bg-slate-100">
                    Désactiver
                  </button>
                </form>
              </li>
            ))}
          </ul>

          {planSelectionne && (
            <div className="mt-6 border-t border-slate-100 pt-4">
              <h3 className="font-medium text-slate-900">
                Tâches de « {planSelectionne.nom} »
              </h3>
              <form
                action={ajouterTache}
                className="mt-3 flex flex-wrap items-center gap-2"
              >
                <input type="hidden" name="plan_id" value={planSelectionne.id} />
                <input
                  name="heure"
                  type="time"
                  required
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
                <input
                  name="libelle"
                  placeholder="Tâche à faire"
                  required
                  className="min-w-[240px] flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
                <button className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100">
                  Ajouter
                </button>
              </form>

              <ul className="mt-3 divide-y divide-slate-100">
                {taches.map((tache) => (
                  <li
                    key={tache.id}
                    className="flex items-center justify-between gap-3 py-2 text-sm"
                  >
                    <span>
                      {formatHeure(tache.heure)} — {tache.libelle}
                    </span>
                    <form action={supprimerTache}>
                      <input type="hidden" name="tacheId" value={tache.id} />
                      <button className="rounded-md border border-slate-300 px-3 py-1 text-xs text-slate-700 hover:bg-slate-100">
                        Supprimer
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
