import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <span className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-orange-500" />
        <h1 className="mb-1 text-xl font-semibold text-slate-900">
          Espace employés
        </h1>
        <p className="mb-6 text-sm text-slate-500">
          Connectez-vous avec les identifiants fournis par votre résidence.
        </p>

        {error && (
          <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <form action={login} className="space-y-4">
          <input type="hidden" name="next" value={next ?? "/"} />
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
              Courriel
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Se connecter
          </button>
        </form>
      </div>
    </div>
  );
}
