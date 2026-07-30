import { NextResponse, type NextRequest } from "next/server";
import webpush, { WebPushError } from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

type TacheDue = {
  id: string;
  plan_id: string;
  libelle: string;
};

type RappelDue = {
  id: string;
  description: string;
  resident: { prenom: string; nom: string } | { prenom: string; nom: string }[] | null;
};

type Subscription = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth_key: string;
};

// Déclenché chaque minute par un service de cron externe (ex: cron-job.org)
// avec ?secret=CRON_SECRET. Envoie une notification push pour :
// - chaque tâche du plan de travail dont l'heure vient d'arriver, aux
//   employés abonnés au plan correspondant ;
// - chaque rappel résident (rendez-vous, etc.) dont l'heure vient d'arriver,
//   à tous les employés ayant activé les rappels sur leur appareil.
export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT;

  if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
    return NextResponse.json(
      { error: "Notifications non configurées (clés VAPID manquantes)." },
      { status: 500 },
    );
  }

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

  const fuseauHoraire = process.env.APP_TIMEZONE ?? "America/Toronto";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: fuseauHoraire,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(new Date());
  const partie = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const date = `${partie("year")}-${partie("month")}-${partie("day")}`;
  const heure = `${partie("hour")}:${partie("minute")}`;
  const heureBd = `${heure}:00`;

  const supabase = createAdminClient();

  async function envoyer(subscriptions: Subscription[], payload: string) {
    let envoyees = 0;
    for (const abonnement of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: abonnement.endpoint,
            keys: { p256dh: abonnement.p256dh, auth: abonnement.auth_key },
          },
          payload,
        );
        envoyees++;
      } catch (err) {
        if (err instanceof WebPushError && (err.statusCode === 404 || err.statusCode === 410)) {
          await supabase.from("push_subscriptions").delete().eq("id", abonnement.id);
        }
      }
    }
    return envoyees;
  }

  let notificationsEnvoyees = 0;

  // --- Tâches du plan de travail ---
  const { data: plansActifs } = await supabase
    .from("plans_travail")
    .select("id, nom")
    .eq("statut", "actif");

  if (plansActifs?.length) {
    const planIds = plansActifs.map((p) => p.id as string);
    const nomParPlan = new Map(plansActifs.map((p) => [p.id as string, p.nom as string]));

    const { data: tachesData } = await supabase
      .from("plans_travail_taches")
      .select("id, plan_id, libelle")
      .eq("heure", heureBd)
      .in("plan_id", planIds);

    const tachesDeCeCreneau = (tachesData ?? []) as TacheDue[];

    if (tachesDeCeCreneau.length) {
      const tacheIds = tachesDeCeCreneau.map((t) => t.id);

      const [{ data: completions }, { data: dejaEnvoyees }] = await Promise.all([
        supabase.from("taches_completees").select("tache_id").eq("date", date).in("tache_id", tacheIds),
        supabase.from("notifications_taches").select("tache_id").eq("date", date).in("tache_id", tacheIds),
      ]);

      const completeesIds = new Set((completions ?? []).map((c) => c.tache_id as string));
      const envoyeesIds = new Set((dejaEnvoyees ?? []).map((n) => n.tache_id as string));

      const tachesAEnvoyer = tachesDeCeCreneau.filter(
        (t) => !completeesIds.has(t.id) && !envoyeesIds.has(t.id),
      );

      if (tachesAEnvoyer.length) {
        const parPlan = new Map<string, TacheDue[]>();
        for (const tache of tachesAEnvoyer) {
          const liste = parPlan.get(tache.plan_id) ?? [];
          liste.push(tache);
          parPlan.set(tache.plan_id, liste);
        }

        for (const [planId, tachesPlan] of parPlan) {
          const { data: abonnements } = await supabase
            .from("abonnements_plan")
            .select("employe_id")
            .eq("plan_id", planId);

          const employeIds = (abonnements ?? []).map((a) => a.employe_id as string);
          if (!employeIds.length) continue;

          const { data: subscriptions } = await supabase
            .from("push_subscriptions")
            .select("id, endpoint, p256dh, auth_key")
            .in("employe_id", employeIds);

          if (!subscriptions?.length) continue;

          const payload = JSON.stringify({
            title: `${nomParPlan.get(planId) ?? "Plan de travail"} — ${heure}`,
            body: tachesPlan.map((t) => t.libelle).join(" · "),
            url: `/plan-travail?planId=${planId}`,
          });

          notificationsEnvoyees += await envoyer(subscriptions as Subscription[], payload);
        }

        await supabase
          .from("notifications_taches")
          .upsert(
            tachesAEnvoyer.map((t) => ({ tache_id: t.id, date })),
            { onConflict: "tache_id,date" },
          );
      }
    }
  }

  // --- Rappels résidents (rendez-vous, demandes familiales, etc.) ---
  const { data: rappelsData } = await supabase
    .from("rappels_residents")
    .select("id, description, resident:residents!rappels_residents_resident_id_fkey(prenom,nom)")
    .eq("date", date)
    .eq("heure", heureBd)
    .eq("complete", false)
    .is("notifie_a", null);

  const rappelsDus = (rappelsData ?? []) as RappelDue[];

  if (rappelsDus.length) {
    const { data: subscriptions } = await supabase
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth_key");

    if (subscriptions?.length) {
      for (const rappel of rappelsDus) {
        const resident = Array.isArray(rappel.resident) ? rappel.resident[0] : rappel.resident;
        const payload = JSON.stringify({
          title: `Rappel — ${resident ? `${resident.prenom} ${resident.nom}` : "Résident"} (${heure})`,
          body: rappel.description,
          url: "/rapports",
        });
        notificationsEnvoyees += await envoyer(subscriptions as Subscription[], payload);
      }
    }

    await supabase
      .from("rappels_residents")
      .update({ notifie_a: new Date().toISOString() })
      .in("id", rappelsDus.map((r) => r.id));
  }

  return NextResponse.json({ envoyees: notificationsEnvoyees });
}
