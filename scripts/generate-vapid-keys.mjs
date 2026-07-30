// Génère une paire de clés VAPID pour les notifications web push.
// Usage : node scripts/generate-vapid-keys.mjs
import webpush from "web-push";

const { publicKey, privateKey } = webpush.generateVAPIDKeys();

console.log("Ajoutez ces valeurs à .env.local (et dans les variables");
console.log("d'environnement de votre hébergeur en production) :\n");
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${privateKey}`);
