"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  CalendarDays,
  ClipboardList,
  FileText,
  Home,
  Megaphone,
  MessageCircle,
  Repeat,
  Sparkles,
  User,
  UtensilsCrossed,
  Users,
} from "lucide-react";

const ICONES: Record<string, React.ComponentType<{ className?: string }>> = {
  "/": Home,
  "/babillard": Megaphone,
  "/clavardage": MessageCircle,
  "/rapports": ClipboardList,
  "/echanges": Repeat,
  "/menu": UtensilsCrossed,
  "/plan-travail": Bell,
  "/conges": CalendarDays,
  "/documents": FileText,
  "/aide": Sparkles,
  "/profil": User,
  "/employes": Users,
};

export function Nav({ links }: { links: { href: string; label: string }[] }) {
  const pathname = usePathname();

  return (
    <nav className="mx-auto flex max-w-5xl gap-5 overflow-x-auto px-4 pb-3 text-sm">
      {links.map((link) => {
        const actif = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
        const Icone = ICONES[link.href] ?? Home;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 pb-1 ${
              actif
                ? "border-accent font-medium text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <Icone className={`h-4 w-4 ${actif ? "text-accent" : "text-slate-400"}`} />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
