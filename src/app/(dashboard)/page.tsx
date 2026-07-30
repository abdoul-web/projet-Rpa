import Link from "next/link";
import { getCurrentProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import type { Annonce } from "@/lib/babillard";

export default async function AccueilPage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const { data: annonces } = await supabase
    .from("annonces")
    .select("*, auteur:profiles!annonces_auteur_id_fkey(id,prenom,nom)")
    .order("epingle", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(2);

  const dernieresAnnonces = (annonces ?? []) as Annonce[];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">
        Bonjour {profile?.prenom} 👋
      </h1>
      <p className="mt-2 text-slate-600">
        Bienvenue dans l&apos;espace employés de la résidence.
      </p>

      {dernieresAnnonces.length > 0 && (
        <div className="mt-6 space-y-2">
          {dernieresAnnonces.map((annonce) => (
            <Link
              key={annonce.id}
              href="/babillard"
              className="block rounded-xl border border-amber-200 bg-amber-50 p-4 hover:border-amber-300"
            >
              <p className="text-sm font-medium text-slate-900">
                {annonce.epingle && "📌 "}
                {annonce.titre}
              </p>
              {annonce.contenu && (
                <p className="mt-1 line-clamp-2 text-sm text-slate-600">{annonce.contenu}</p>
              )}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Link
          href="/babillard"
          className="rounded-xl border border-slate-200 bg-white p-5 hover:border-slate-300"
        >
          <h2 className="font-medium text-slate-900">Babillard</h2>
          <p className="mt-1 text-sm text-slate-500">
            Annonces de la direction pour toute l&apos;équipe.
          </p>
        </Link>
        <Link
          href="/rapports"
          className="rounded-xl border border-slate-200 bg-white p-5 hover:border-slate-300"
        >
          <h2 className="font-medium text-slate-900">Rapports interservices</h2>
          <p className="mt-1 text-sm text-slate-500">
            Notes par résident pour chaque quart (jour/soir/nuit).
          </p>
        </Link>
        <Link
          href="/echanges"
          className="rounded-xl border border-slate-200 bg-white p-5 hover:border-slate-300"
        >
          <h2 className="font-medium text-slate-900">Échanges de quarts</h2>
          <p className="mt-1 text-sm text-slate-500">
            Proposez ou prenez un quart de travail.
          </p>
        </Link>
        <Link
          href="/menu"
          className="rounded-xl border border-slate-200 bg-white p-5 hover:border-slate-300"
        >
          <h2 className="font-medium text-slate-900">Menu du jour</h2>
          <p className="mt-1 text-sm text-slate-500">
            Le menu de chaque unité, entré par la cuisine.
          </p>
        </Link>
        <Link
          href="/plan-travail"
          className="rounded-xl border border-slate-200 bg-white p-5 hover:border-slate-300"
        >
          <h2 className="font-medium text-slate-900">Plan de travail</h2>
          <p className="mt-1 text-sm text-slate-500">
            Les tâches de votre quart, à cocher au fur et à mesure.
          </p>
        </Link>
      </div>
    </div>
  );
}
