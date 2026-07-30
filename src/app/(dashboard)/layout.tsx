import { redirect } from "next/navigation";
import { Sunrise } from "lucide-react";
import { getCurrentProfile } from "@/lib/profile";
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
    { href: "/rapports", label: "Rapports interservices" },
    { href: "/echanges", label: "Échanges de quarts" },
    { href: "/menu", label: "Menu du jour" },
    { href: "/plan-travail", label: "Plan de travail" },
    { href: "/conges", label: "Demandes de congé" },
    { href: "/documents", label: "Documents" },
    { href: "/profil", label: "Mon profil" },
  ];

  if (profile.role === "admin") {
    links.push({ href: "/employes", label: "Employés" });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <span className="flex items-center gap-2 font-semibold text-slate-900">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <Sunrise className="h-4 w-4" />
            </span>
            Espace employés
          </span>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-500 sm:inline">
              {profile.prenom} {profile.nom}
            </span>
            <form action={logout}>
              <button
                type="submit"
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 hover:shadow-sm"
              >
                Déconnexion
              </button>
            </form>
          </div>
        </div>
        <Nav links={links} />
      </header>
      <main className="mx-auto max-w-5xl animate-fade-in px-4 py-8">{children}</main>
    </div>
  );
}
