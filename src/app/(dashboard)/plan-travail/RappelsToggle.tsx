"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { urlBase64ToUint8Array } from "@/lib/notifications";

type Etat = "verification" | "non-supporte" | "inactif" | "actif" | "erreur";

export function RappelsToggle({ employeId }: { employeId: string }) {
  const [etat, setEtat] = useState<Etat>("verification");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function verifier() {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setEtat("non-supporte");
        return;
      }
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        const subscription = await registration.pushManager.getSubscription();
        setEtat(subscription ? "actif" : "inactif");
      } catch {
        setEtat("non-supporte");
      }
    }
    verifier();
  }, []);

  async function activer() {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) {
      setMessage("Les notifications ne sont pas configurées sur ce serveur.");
      setEtat("erreur");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setMessage("Permission refusée. Activez les notifications dans les réglages du navigateur.");
        setEtat("inactif");
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      const json = subscription.toJSON();
      const supabase = createClient();
      const { error } = await supabase.from("push_subscriptions").upsert(
        {
          employe_id: employeId,
          endpoint: json.endpoint,
          p256dh: json.keys?.p256dh,
          auth_key: json.keys?.auth,
        },
        { onConflict: "endpoint" },
      );

      if (error) throw error;
      setEtat("actif");
      setMessage("");
    } catch {
      setMessage("Impossible d'activer les rappels sur cet appareil.");
      setEtat("erreur");
    }
  }

  async function desactiver() {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();
        const supabase = createClient();
        await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
      }
      setEtat("inactif");
    } catch {
      setMessage("Impossible de désactiver les rappels.");
      setEtat("erreur");
    }
  }

  if (etat === "verification") return null;

  if (etat === "non-supporte") {
    return (
      <p className="text-xs text-slate-400">
        Rappels non disponibles sur cet appareil/navigateur. Sur iPhone : ajoutez
        d&apos;abord cette page à l&apos;écran d&apos;accueil (partager → « Sur l&apos;écran
        d&apos;accueil »), puis ouvrez-la depuis l&apos;icône.
      </p>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {etat === "actif" ? (
        <button
          onClick={desactiver}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100"
        >
          🔔 Rappels activés sur cet appareil — désactiver
        </button>
      ) : (
        <button
          onClick={activer}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100"
        >
          🔕 Activer les rappels sur cet appareil
        </button>
      )}
      {message && <span className="text-xs text-red-600">{message}</span>}
    </div>
  );
}
