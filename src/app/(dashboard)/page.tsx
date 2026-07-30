import Link from "next/link";
import {
  CalendarDays,
  ClipboardList,
  FileText,
  Megaphone,
  Repeat,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { getCurrentProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import type { Annonce } from "@/lib/babillard";

type Carte = {
  href: string;
  label: string;
  description: string;
  Icon: LucideIcon;
};

const CARTES: Carte[] = [
  {
    href: "/babillard",
    label: "Babillard",
    description: "Annonces de la direction pour toute l'équipe.",
    Icon: Megaphone,
  },
  {
    href: "/rapports",
    label: "Rapports interservices",
    description: "Notes par résident pour chaque quart (jour/soir/nuit).",
    Icon: ClipboardList,
  },
  {
    href: "/echanges",
    label: "Échanges de quarts",
    description: "Proposez ou prenez un quart de travail.",
    Icon: Repeat,
  },
  {
    href: "/menu",
    label: "Menu du jour",
    description: "Le menu de chaque unité, entré par la cuisine.",
    Icon: UtensilsCrossed,
  },
  {
    href: "/plan-travail",
    label: "Plan de travail",
    description: "Les tâches de votre quart, à cocher au fur et à mesure.",
    Icon: ClipboardList,
  },
  {
    href: "/conges",
    label: "Demandes de congé",
    description: "Maladie, vacances, congé parental — soumettez une demande.",
    Icon: CalendarDays,
  },
  {
    href: "/documents",
    label: "Documents",
    description: "Politiques, formulaires et procédures de la résidence.",
    Icon: FileText,
  },
];

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
              className="block rounded-xl border border-amber-200 bg-amber-50 p-4 hover:border-amber-300 hover:shadow-sm"
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
        {CARTES.map(({ href, label, description, Icon }) => (
          <Link
            key={href}
            href={href}
            className="group rounded-xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent transition group-hover:bg-accent group-hover:text-accent-foreground">
              <Icon className="h-5 w-5" />
            </span>
            <h2 className="mt-3 font-medium text-slate-900">{label}</h2>
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
