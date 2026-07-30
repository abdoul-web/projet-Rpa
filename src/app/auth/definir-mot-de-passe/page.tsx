import { definirMotDePasse } from "./actions";

export default async function DefinirMotDePassePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <span className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-orange-500" />
        <h1 className="mb-1 text-xl font-semibold text-slate-900">
          Bienvenue !
        </h1>
        <p className="mb-6 text-sm text-slate-500">
          Choisissez votre mot de passe pour accéder à l&apos;espace employés.
        </p>

        {error && (
          <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <form action={definirMotDePasse} className="space-y-4">
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
              Nouveau mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="confirmation" className="mb-1 block text-sm font-medium text-slate-700">
              Confirmer le mot de passe
            </label>
            <input
              id="confirmation"
              name="confirmation"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Confirmer
          </button>
        </form>
      </div>
    </div>
  );
}
