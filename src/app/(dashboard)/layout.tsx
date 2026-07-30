import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/profile";
import { logout } from "@/app/login/actions";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  const links = [
    { href: "/", label: "Accueil" },
    { href: "/babillard", label: "Babillard" },
    { href: "/rapports", label: "Rapports interservices" },
    { href: "/echanges", label: "Échanges de quarts" },
    { href: "/menu", label: "Menu du jour" },
    { href: "/plan-travail", label: "Plan de travail" },
    { href: "/conges", label: "Demandes de congé" },
    { href: "/profil", label: "Mon profil" },
  ];

  if (profile.role === "admin") {
    links.push({ href: "/employes", label: "Employés" });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <span className="font-semibold text-slate-900">
            Espace employés
          </span>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">
              {profile.prenom} {profile.nom}
            </span>
            <form action={logout}>
              <button
                type="submit"
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
              >
                Déconnexion
              </button>
            </form>
          </div>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 pb-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="whitespace-nowrap rounded-md px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
