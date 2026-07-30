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
import { SunriseBanner } from "./SunriseBanner";

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

function formatDateAujourdhui() {
  const texte = new Date().toLocaleDateString("fr-CA", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return texte.charAt(0).toUpperCase() + texte.slice(1);
}

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
      <SunriseBanner />

      <p className="mt-6 text-sm text-slate-400">{formatDateAujourdhui()}</p>
      <h1 className="mt-1 text-4xl font-light tracking-tight text-slate-900">
        Bonjour, {profile?.prenom}.
      </h1>
      <p className="mt-3 text-slate-500">
        Bienvenue dans l&apos;espace employés de la résidence.
      </p>

      {dernieresAnnonces.length > 0 && (
        <div className="mt-8 space-y-3">
          {dernieresAnnonces.map((annonce) => (
            <Link
              key={annonce.id}
              href="/babillard"
              className="flex items-start gap-3 border-l-2 border-accent pl-4 hover:border-accent/70"
            >
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {annonce.epingle && "📌 "}
                  {annonce.titre}
                </p>
                {annonce.contenu && (
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500">{annonce.contenu}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-14 grid gap-x-8 gap-y-10 sm:grid-cols-3">
        {CARTES.map(({ href, label, description, Icon }) => (
          <Link key={href} href={href} className="group block">
            <Icon className="h-6 w-6 text-accent/70 transition group-hover:text-accent" />
            <h2 className="mt-4 text-lg text-slate-900">{label}</h2>
            <p className="mt-1 text-sm text-slate-400">{description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
