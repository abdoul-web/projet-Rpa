"use client";

import type { Profile } from "@/lib/profile";

type ServerAction = (formData: FormData) => void | Promise<void>;

export function EmployeRow({
  employe,
  isSelf,
  changerRole,
  changerStatut,
}: {
  employe: Profile;
  isSelf: boolean;
  changerRole: ServerAction;
  changerStatut: ServerAction;
}) {
  return (
    <tr className="border-b border-slate-100 last:border-0">
      <td className="px-4 py-3">
        {employe.prenom} {employe.nom}
        <div className="text-xs text-slate-400">{employe.courriel}</div>
      </td>
      <td className="px-4 py-3">{employe.poste || "—"}</td>
      <td className="px-4 py-3">{employe.service || "—"}</td>
      <td className="px-4 py-3">
        <form action={changerRole}>
          <input type="hidden" name="userId" value={employe.id} />
          <select
            name="role"
            defaultValue={employe.role}
            onChange={(e) => e.currentTarget.form?.requestSubmit()}
            disabled={isSelf}
            className="rounded-md border border-slate-300 px-2 py-1 text-sm disabled:opacity-50"
          >
            <option value="employe">Employé</option>
            <option value="admin">Administrateur</option>
          </select>
        </form>
      </td>
      <td className="px-4 py-3">
        <form action={changerStatut}>
          <input type="hidden" name="userId" value={employe.id} />
          <select
            name="statut"
            defaultValue={employe.statut}
            onChange={(e) => e.currentTarget.form?.requestSubmit()}
            disabled={isSelf}
            className="rounded-md border border-slate-300 px-2 py-1 text-sm disabled:opacity-50"
          >
            <option value="actif">Actif</option>
            <option value="inactif">Inactif</option>
          </select>
        </form>
      </td>
    </tr>
  );
}
