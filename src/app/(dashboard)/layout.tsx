import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/profile";
import { NOM_RESIDENCE } from "@/lib/residence";
import { logout } from "@/app/login/actions";
import { Nav } from "./Nav";

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
    { href: "/clavardage", label: "Clavardage" },
    { href: "/rapports", label: "Rapports interservices" },
    { href: "/echanges", label: "Échanges de quarts" },
    { href: "/menu", label: "Menu du jour" },
    { href: "/plan-travail", label: "Plan de travail" },
    { href: "/conges", label: "Demandes de congé" },
    { href: "/documents", label: "Documents" },
    { href: "/aide", label: "Aide" },
    { href: "/profil", label: "Mon profil" },
  ];

  if (profile.role === "admin") {
    links.push({ href: "/employes", label: "Employés" });
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-10 border-b border-slate-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <span className="flex items-center gap-2 text-sm font-medium tracking-wide text-slate-900">
            <span className="h-2 w-2 rounded-full bg-gradient-to-br from-amber-300 to-orange-500" />
            {NOM_RESIDENCE.toUpperCase()}
          </span>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-slate-400 sm:inline">
              {profile.prenom} {profile.nom}
            </span>
            <form action={logout}>
              <button
                type="submit"
                className="text-sm text-slate-500 underline decoration-slate-300 underline-offset-4 hover:text-slate-900"
              >
                Déconnexion
              </button>
            </form>
          </div>
        </div>
        <Nav links={links} />
      </header>
      <main className="mx-auto max-w-5xl animate-fade-in px-4 py-10 sm:px-6">{children}</main>
    </div>
  );
}
