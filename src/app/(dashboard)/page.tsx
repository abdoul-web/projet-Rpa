import { getCurrentProfile } from "@/lib/profile";

export default async function AccueilPage() {
  const profile = await getCurrentProfile();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">
        Bonjour {profile?.prenom} 👋
      </h1>
      <p className="mt-2 text-slate-600">
        Bienvenue dans l&apos;espace employés de la résidence.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-medium text-slate-900">Rapports interservices</h2>
          <p className="mt-1 text-sm text-slate-500">Bientôt disponible.</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-medium text-slate-900">Échanges de quarts</h2>
          <p className="mt-1 text-sm text-slate-500">Bientôt disponible.</p>
        </div>
      </div>
    </div>
  );
}
