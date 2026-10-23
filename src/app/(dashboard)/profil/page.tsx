import { User } from "lucide-react";
import { getCurrentProfile } from "@/lib/profile";
import { mettreAJourProfil } from "./actions";

const ROLES: Record<string, string> = {
  admin: "Administrateur",
  employe: "Employé",
};

export default async function ProfilPage() {
  const profile = await getCurrentProfile();

  if (!profile) return null;

  return (
    <div className="max-w-lg">
      <h1 className="flex items-center gap-2 text-2xl font-light tracking-tight text-slate-900">
        <User className="h-6 w-6 text-accent/70" />
        Mon profil
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Les informations d&apos;emploi (nom, poste, service, rôle) sont
        gérées par l&apos;administration. Vous pouvez mettre à jour votre
        numéro de téléphone.
      </p>

      <dl className="mt-6 grid grid-cols-3 gap-y-3 text-sm">
        <dt className="text-slate-500">Nom</dt>
        <dd className="col-span-2 text-slate-900">
          {profile.prenom} {profile.nom}
        </dd>
        <dt className="text-slate-500">Courriel</dt>
        <dd className="col-span-2 text-slate-900">{profile.courriel}</dd>
        <dt className="text-slate-500">Poste</dt>
        <dd className="col-span-2 text-slate-900">{profile.poste || "—"}</dd>
        <dt className="text-slate-500">Service</dt>
        <dd className="col-span-2 text-slate-900">{profile.service || "—"}</dd>
        <dt className="text-slate-500">Rôle</dt>
        <dd className="col-span-2 text-slate-900">{ROLES[profile.role]}</dd>
      </dl>

      <form action={mettreAJourProfil} className="mt-6 space-y-4">
        <div>
          <label
            htmlFor="telephone"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Téléphone
          </label>
          <input
            id="telephone"
            name="telephone"
            type="tel"
            defaultValue={profile.telephone}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Enregistrer
        </button>
      </form>
    </div>
  );
}
