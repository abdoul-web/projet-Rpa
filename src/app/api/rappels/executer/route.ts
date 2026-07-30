import { NextResponse, type NextRequest } from "next/server";
import webpush, { WebPushError } from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

type TacheDue = {
  id: string;
  plan_id: string;
  libelle: string;
};

// Déclenché chaque minute par un service de cron externe (ex: cron-job.org)
// avec ?secret=CRON_SECRET. Envoie une notification push pour chaque tâche
// dont l'heure vient d'arriver, aux employés abonnés au plan correspondant.
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

  const supabase = createAdminClient();

  const { data: plansActifs } = await supabase
    .from("plans_travail")
    .select("id, nom")
    .eq("statut", "actif");

  if (!plansActifs?.length) {
    return NextResponse.json({ envoyees: 0, taches: 0 });
  }

  const planIds = plansActifs.map((p) => p.id as string);
  const nomParPlan = new Map(plansActifs.map((p) => [p.id as string, p.nom as string]));

  const { data: tachesData } = await supabase
    .from("plans_travail_taches")
    .select("id, plan_id, libelle")
    .eq("heure", `${heure}:00`)
    .in("plan_id", planIds);

  const tachesDeCeCreneau = (tachesData ?? []) as TacheDue[];
  if (!tachesDeCeCreneau.length) {
    return NextResponse.json({ envoyees: 0, taches: 0 });
  }

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

  if (!tachesAEnvoyer.length) {
    return NextResponse.json({ envoyees: 0, taches: 0 });
  }

  const parPlan = new Map<string, TacheDue[]>();
  for (const tache of tachesAEnvoyer) {
    const liste = parPlan.get(tache.plan_id) ?? [];
    liste.push(tache);
    parPlan.set(tache.plan_id, liste);
  }

  let notificationsEnvoyees = 0;

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

    for (const abonnement of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: abonnement.endpoint as string,
            keys: {
              p256dh: abonnement.p256dh as string,
              auth: abonnement.auth_key as string,
            },
          },
          payload,
        );
        notificationsEnvoyees++;
      } catch (err) {
        if (err instanceof WebPushError && (err.statusCode === 404 || err.statusCode === 410)) {
          await supabase.from("push_subscriptions").delete().eq("id", abonnement.id);
        }
      }
    }
  }

  await supabase
    .from("notifications_taches")
    .upsert(
      tachesAEnvoyer.map((t) => ({ tache_id: t.id, date })),
      { onConflict: "tache_id,date" },
    );

  return NextResponse.json({ envoyees: notificationsEnvoyees, taches: tachesAEnvoyer.length });
}
