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
  Repeat,
  User,
  UtensilsCrossed,
  Users,
} from "lucide-react";

const ICONES: Record<string, React.ComponentType<{ className?: string }>> = {
  "/": Home,
  "/babillard": Megaphone,
  "/rapports": ClipboardList,
  "/echanges": Repeat,
  "/menu": UtensilsCrossed,
  "/plan-travail": Bell,
  "/conges": CalendarDays,
  "/documents": FileText,
  "/profil": User,
  "/employes": Users,
};

export function Nav({ links }: { links: { href: string; label: string }[] }) {
  const pathname = usePathname();

  return (
    <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 pb-2">
      {links.map((link) => {
        const actif = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
        const Icone = ICONES[link.href] ?? Home;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm ${
              actif
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Icone className="h-4 w-4" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
