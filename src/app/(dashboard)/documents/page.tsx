import { getCurrentProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import type { DocumentFichier } from "@/lib/documents";
import { supprimerDocument, televerserDocument } from "./actions";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-CA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function DocumentsPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("documents")
    .select("*, televerse_par:profiles!documents_televerse_par_id_fkey(id,prenom,nom)")
    .order("created_at", { ascending: false });

  const documents = (data ?? []) as DocumentFichier[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Documents &amp; procédures</h1>
        <p className="mt-1 text-sm text-slate-500">
          Politiques, formulaires et procédures de la résidence.
        </p>
      </div>

      {profile.role === "admin" && (
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-medium text-slate-900">Ajouter un document</h2>
          <form action={televerserDocument} className="mt-3 grid gap-3 sm:grid-cols-2">
            <input
              name="titre"
              placeholder="Titre (ex: Politique de lutte contre la maltraitance)"
              required
              className="rounded-md border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
            />
            <input
              name="description"
              placeholder="Description (optionnel)"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
            />
            <input
              name="fichier"
              type="file"
              required
              className="rounded-md border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
            />
            <button className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 sm:col-span-2">
              Téléverser
            </button>
          </form>
        </section>
      )}

      <ul className="space-y-2">
        {documents.map((document) => {
          const url = supabase.storage.from("documents").getPublicUrl(document.chemin)
            .data.publicUrl;
          return (
            <li
              key={document.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm"
            >
              <div>
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-slate-900 hover:underline"
                >
                  📄 {document.titre}
                </a>
                {document.description && (
                  <p className="mt-1 text-slate-600">{document.description}</p>
                )}
                <p className="mt-1 text-xs text-slate-400">
                  Ajouté par {document.televerse_par.prenom} {document.televerse_par.nom} le{" "}
                  {formatDate(document.created_at)}
                </p>
              </div>
              {profile.role === "admin" && (
                <form action={supprimerDocument}>
                  <input type="hidden" name="documentId" value={document.id} />
                  <input type="hidden" name="chemin" value={document.chemin} />
                  <button className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100">
                    Supprimer
                  </button>
                </form>
              )}
            </li>
          );
        })}
        {!documents.length && (
          <p className="text-sm text-slate-400">Aucun document pour le moment.</p>
        )}
      </ul>
    </div>
  );
}
