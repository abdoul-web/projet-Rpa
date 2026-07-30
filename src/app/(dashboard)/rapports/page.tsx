import Link from "next/link";
import { getCurrentProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import {
  LIBELLES_PERIODE,
  LIBELLES_TOILETTE,
  ORDRE_PERIODES,
  periodePrecedente,
  periodeSelonHeure,
  type NoteResident,
  type Periode,
  type Resident,
} from "@/lib/rapports";
import { ajouterNote, ajouterResident, changerStatutResident } from "./actions";

function estPeriode(valeur: string | undefined): valeur is Periode {
  return valeur === "jour" || valeur === "soir" || valeur === "nuit";
}

function formatHeure(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-CA", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function RapportsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; quart?: string }>;
}) {
  const params = await searchParams;
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const date = params.date ?? new Date().toISOString().slice(0, 10);
  const quart = estPeriode(params.quart) ? params.quart : periodeSelonHeure();
  const precedent = periodePrecedente(date, quart);

  const supabase = await createClient();

  const [{ data: residents }, { data: notes }] = await Promise.all([
    supabase
      .from("residents")
      .select("*")
      .eq("statut", "actif")
      .order("chambre", { ascending: true }),
    supabase
      .from("notes_residents")
      .select("*, auteur:profiles!notes_residents_auteur_id_fkey(id,prenom,nom)")
      .eq("date", date)
      .eq("quart", quart)
      .order("created_at", { ascending: true }),
  ]);

  const notesParResident = new Map<string, NoteResident[]>();
  for (const note of (notes ?? []) as NoteResident[]) {
    const liste = notesParResident.get(note.resident_id) ?? [];
    liste.push(note);
    notesParResident.set(note.resident_id, liste);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Rapports interservices
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Notes par résident pour que le quart suivant sache comment ça s&apos;est
          passé.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <form method="get" className="flex items-center gap-2">
          <input type="hidden" name="quart" value={quart} />
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

        <div className="flex gap-1">
          {ORDRE_PERIODES.map((p) => (
            <Link
              key={p}
              href={`/rapports?date=${date}&quart=${p}`}
              className={`rounded-md px-3 py-1.5 text-sm ${
                p === quart
                  ? "bg-slate-900 text-white"
                  : "border border-slate-300 text-slate-700 hover:bg-slate-100"
              }`}
            >
              {LIBELLES_PERIODE[p]}
            </Link>
          ))}
        </div>

        <Link
          href={`/rapports?date=${precedent.date}&quart=${precedent.quart}`}
          className="ml-auto text-sm text-slate-500 hover:text-slate-900"
        >
          ← Voir le quart précédent ({LIBELLES_PERIODE[precedent.quart]} du{" "}
          {precedent.date})
        </Link>
      </div>

      <div className="space-y-4">
        {(residents as Resident[] | null)?.map((resident) => {
          const notesResident = notesParResident.get(resident.id) ?? [];
          return (
            <section
              key={resident.id}
              className="rounded-xl border border-slate-200 bg-white p-5"
            >
              <h2 className="font-medium text-slate-900">
                {resident.prenom} {resident.nom}
                {resident.chambre && (
                  <span className="ml-2 text-sm font-normal text-slate-400">
                    Chambre {resident.chambre}
                  </span>
                )}
              </h2>

              <ul className="mt-3 space-y-2">
                {notesResident.map((note) => (
                  <li key={note.id} className="rounded-lg bg-slate-50 p-3 text-sm">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span>{formatHeure(note.created_at)}</span>
                      <span>·</span>
                      <span>
                        {note.auteur.prenom} {note.auteur.nom}
                      </span>
                      {note.toilette && (
                        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-slate-700">
                          Toilette : {LIBELLES_TOILETTE[note.toilette]}
                        </span>
                      )}
                    </div>
                    {note.note && <p className="mt-1 text-slate-800">{note.note}</p>}
                  </li>
                ))}
                {!notesResident.length && (
                  <li className="text-sm text-slate-400">Aucune note pour ce quart.</li>
                )}
              </ul>

              <form action={ajouterNote} className="mt-4 space-y-2">
                <input type="hidden" name="resident_id" value={resident.id} />
                <input type="hidden" name="date" value={date} />
                <input type="hidden" name="quart" value={quart} />
                <textarea
                  name="note"
                  rows={2}
                  placeholder="Note utile pour le prochain quart..."
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
                <div className="flex flex-wrap items-center gap-3">
                  <select
                    name="toilette"
                    defaultValue=""
                    className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                  >
                    <option value="">Toilette : non précisé</option>
                    <option value="fait">Toilette faite</option>
                    <option value="non_fait">Toilette non faite</option>
                    <option value="refuse">Toilette refusée</option>
                  </select>
                  <button className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700">
                    Ajouter la note
                  </button>
                </div>
              </form>
            </section>
          );
        })}
        {!residents?.length && (
          <p className="text-sm text-slate-400">Aucun résident actif enregistré.</p>
        )}
      </div>

      {profile.role === "admin" && (
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-medium text-slate-900">Gérer les résidents</h2>
          <form action={ajouterResident} className="mt-3 grid gap-3 sm:grid-cols-4">
            <input
              name="prenom"
              placeholder="Prénom"
              required
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              name="nom"
              placeholder="Nom"
              required
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              name="chambre"
              placeholder="Chambre"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <button className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
              Ajouter
            </button>
          </form>

          <ul className="mt-4 divide-y divide-slate-100">
            {(residents as Resident[] | null)?.map((resident) => (
              <li
                key={resident.id}
                className="flex items-center justify-between gap-3 py-2 text-sm"
              >
                <span>
                  {resident.prenom} {resident.nom}
                  {resident.chambre ? ` — Chambre ${resident.chambre}` : ""}
                </span>
                <form action={changerStatutResident}>
                  <input type="hidden" name="residentId" value={resident.id} />
                  <input type="hidden" name="statut" value="inactif" />
                  <button className="rounded-md border border-slate-300 px-3 py-1 text-xs text-slate-700 hover:bg-slate-100">
                    Marquer inactif
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
