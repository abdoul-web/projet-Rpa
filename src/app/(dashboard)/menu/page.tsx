import { UtensilsCrossed } from "lucide-react";
import { getCurrentProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import { LIBELLES_REPAS, ORDRE_REPAS, type MenuJour } from "@/lib/menu";
import type { Resident, Unite } from "@/lib/rapports";
import { ajouterUnite, changerStatutUnite, mettreAJourMenu } from "./actions";

export default async function MenuPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const params = await searchParams;
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const date = params.date ?? new Date().toISOString().slice(0, 10);
  const supabase = await createClient();

  const [{ data: unites }, { data: menus }, { data: residents }] = await Promise.all([
    supabase.from("unites").select("*").eq("statut", "actif").order("nom"),
    supabase.from("menus_jour").select("*").eq("date", date),
    supabase
      .from("residents")
      .select("*")
      .eq("statut", "actif")
      .neq("allergies", ""),
  ]);

  const menuParCle = new Map<string, MenuJour>();
  for (const menu of (menus ?? []) as MenuJour[]) {
    menuParCle.set(`${menu.unite_id}:${menu.repas}`, menu);
  }

  const allergiesParUnite = new Map<string, Resident[]>();
  for (const resident of (residents ?? []) as Resident[]) {
    const cle = resident.unite_id ?? "aucune";
    const liste = allergiesParUnite.get(cle) ?? [];
    liste.push(resident);
    allergiesParUnite.set(cle, liste);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-light tracking-tight text-slate-900">
          <UtensilsCrossed className="h-6 w-6 text-accent/70" />
          Menu du jour
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Le menu de chaque unité, entré par la cuisine.
        </p>
      </div>

      <form method="get" className="flex items-center gap-2">
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

      <div className="space-y-4">
        {(unites as Unite[] | null)?.map((unite) => {
          const allergiesUnite = allergiesParUnite.get(unite.id) ?? [];
          return (
            <section
              key={unite.id}
              className="rounded-xl border border-slate-100 bg-white p-5"
            >
              <h2 className="font-medium text-slate-900">{unite.nom}</h2>

              {allergiesUnite.length > 0 && (
                <p className="mt-1 text-sm text-red-700">
                  ⚠ Allergies à surveiller :{" "}
                  {allergiesUnite
                    .map((r) => `${r.prenom} ${r.nom} (${r.allergies})`)
                    .join(" · ")}
                </p>
              )}

              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                {ORDRE_REPAS.map((repas) => {
                  const menu = menuParCle.get(`${unite.id}:${repas}`);
                  return (
                    <form key={repas} action={mettreAJourMenu} className="space-y-2">
                      <input type="hidden" name="unite_id" value={unite.id} />
                      <input type="hidden" name="date" value={date} />
                      <input type="hidden" name="repas" value={repas} />
                      <label className="block text-sm font-medium text-slate-700">
                        {LIBELLES_REPAS[repas]}
                      </label>
                      <textarea
                        name="description"
                        rows={3}
                        defaultValue={menu?.description ?? ""}
                        placeholder="Menu..."
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                      />
                      <button className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100">
                        Enregistrer
                      </button>
                    </form>
                  );
                })}
              </div>
            </section>
          );
        })}
        {!unites?.length && (
          <p className="text-sm text-slate-400">
            Aucune unité active. {profile.role === "admin" ? "Ajoutez-en une ci-dessous." : ""}
          </p>
        )}
      </div>

      {profile.role === "admin" && (
        <section className="rounded-xl border border-slate-100 bg-white p-5">
          <h2 className="font-medium text-slate-900">Gérer les unités</h2>
          <form action={ajouterUnite} className="mt-3 flex gap-3">
            <input
              name="nom"
              placeholder="Nom de l'unité (ex: Unité 1)"
              required
              className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <button className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
              Ajouter
            </button>
          </form>

          <ul className="mt-4 divide-y divide-slate-100">
            {(unites as Unite[] | null)?.map((unite) => (
              <li key={unite.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span>{unite.nom}</span>
                <form action={changerStatutUnite}>
                  <input type="hidden" name="uniteId" value={unite.id} />
                  <input type="hidden" name="statut" value="inactif" />
                  <button className="rounded-md border border-slate-300 px-3 py-1 text-xs text-slate-700 hover:bg-slate-100">
                    Marquer inactive
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
