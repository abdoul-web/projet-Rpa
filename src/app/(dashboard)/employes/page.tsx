import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { getCurrentProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import { changerRole, changerStatut, inviterEmploye } from "./actions";
import { EmployeRow } from "./EmployeRow";
import type { Profile } from "@/lib/profile";

export default async function EmployesPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "admin") redirect("/");

  const supabase = await createClient();
  const { data: employes } = await supabase
    .from("profiles")
    .select("*")
    .order("nom", { ascending: true });

  return (
    <div>
      <h1 className="flex items-center gap-2 text-2xl font-light tracking-tight text-slate-900">
        <Users className="h-6 w-6 text-accent/70" />
        Employés
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Invitez de nouveaux employés et gérez les rôles et statuts.
      </p>

      <section className="mt-6 rounded-xl border border-slate-100 bg-white p-5">
        <h2 className="font-medium text-slate-900">Inviter un employé</h2>
        <form action={inviterEmploye} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            name="prenom"
            placeholder="Prénom"
            required
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            name="nom"
            placeholder="Nom"
            required
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            name="email"
            type="email"
            placeholder="Courriel"
            required
            className="rounded-md border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
          />
          <input
            name="poste"
            placeholder="Poste (ex: Préposé aux bénéficiaires)"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            name="service"
            placeholder="Service (ex: Soins, Cuisine, Entretien)"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <select
            name="role"
            defaultValue="employe"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="employe">Employé</option>
            <option value="admin">Administrateur</option>
          </select>
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 sm:col-span-2"
          >
            Envoyer l&apos;invitation
          </button>
        </form>
      </section>

      <section className="mt-6 overflow-x-auto rounded-xl border border-slate-100 bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-slate-100 text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Nom</th>
              <th className="px-4 py-3 font-medium">Poste</th>
              <th className="px-4 py-3 font-medium">Service</th>
              <th className="px-4 py-3 font-medium">Rôle</th>
              <th className="px-4 py-3 font-medium">Statut</th>
            </tr>
          </thead>
          <tbody>
            {(employes as Profile[] | null)?.map((employe) => (
              <EmployeRow
                key={employe.id}
                employe={employe}
                isSelf={employe.id === profile.id}
                changerRole={changerRole}
                changerStatut={changerStatut}
              />
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
