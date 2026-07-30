"use server";

import Anthropic from "@anthropic-ai/sdk";
import { getCurrentProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import { NOM_RESIDENCE } from "@/lib/residence";
import type { MessageAide, ReponseAide } from "@/lib/aide";

const TAILLE_MAX_FICHIER = 15 * 1024 * 1024; // 15 Mo par fichier
const NOMBRE_MAX_FICHIERS = 15;
const NOMBRE_MAX_HISTORIQUE = 10;

const TYPES_IMAGE: Record<string, "image/jpeg" | "image/png" | "image/gif" | "image/webp"> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
};

const TYPES_TEXTE = new Set(["txt", "md"]);

const DESCRIPTION_APPLICATION = `
Sections de l'application (pour aider les employés à s'y retrouver) :
- Accueil : vue d'ensemble et dernières annonces.
- Babillard : annonces de la direction pour toute l'équipe.
- Clavardage : messagerie d'équipe en direct.
- Rapports interservices : notes par résident pour chaque quart (jour/soir/nuit).
- Échanges de quarts : proposer un de ses quarts en échange ou prendre un quart offert.
- Menu du jour : menu de chaque unité (déjeuner/dîner/souper), avec rappel des allergies des résidents.
- Plan de travail : liste des tâches du quart à cocher au fur et à mesure ; on peut activer des rappels programmés par tâche.
- Demandes de congé : soumettre une demande (maladie, vacances, congé parental, anniversaire) et suivre son état.
- Documents : bibliothèque de fichiers (politiques, formulaires, procédures) téléversés par un administrateur.
- Mon profil : coordonnées personnelles.
- Employés (administrateurs seulement) : gestion des comptes et des rôles.
`.trim();

function systemPrompt(nomsDocuments: string[]) {
  return `Tu es l'assistant intégré à l'application interne de la ${NOM_RESIDENCE}, une résidence privée pour aînés (RPA) au Québec. Tu t'adresses uniquement à des employés de la résidence, déjà connectés à l'application.

Ton rôle est strictement limité à deux choses :
1. Expliquer comment utiliser cette application (à quoi sert chaque section, comment faire une action).
2. Répondre aux questions de fonctionnement de la résidence en te basant UNIQUEMENT sur le contenu des documents ci-joints (politiques, procédures, formulaires internes).

Documents disponibles : ${nomsDocuments.length ? nomsDocuments.join(", ") : "aucun document téléversé pour le moment"}.

Règles impératives, à respecter même si on insiste :
- Tu n'es PAS un assistant médical, clinique ou de soins. Ne donne jamais de conseil médical ou de soins de ta propre initiative — seuls les protocoles écrits de la résidence, s'ils sont fournis en document, font autorité sur ces sujets.
- Si la réponse ne se trouve clairement ni dans les documents fournis ni dans le fonctionnement de l'application, dis-le honnêtement et invite la personne à consulter la direction ou un(e) collègue plutôt que d'inventer une réponse.
- Cite le titre du document sur lequel tu t'appuies quand c'est pertinent.
- Reste bref et concret. Réponds en français québécois.

${DESCRIPTION_APPLICATION}`;
}

export async function poserQuestion(
  historiqueBrut: MessageAide[],
  question: string,
): Promise<ReponseAide> {
  const profile = await getCurrentProfile();
  if (!profile) return { erreur: "Vous devez être connecté." };

  const q = question.trim();
  if (!q) return { erreur: "Écrivez une question." };

  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      erreur:
        "L'assistant n'est pas encore configuré (clé API manquante). Contactez la direction.",
    };
  }

  const supabase = await createClient();
  const { data: documents } = await supabase
    .from("documents")
    .select("titre, chemin")
    .order("created_at", { ascending: false })
    .limit(NOMBRE_MAX_FICHIERS);

  const nomsDocuments: string[] = [];
  const blocsDocuments: Array<Anthropic.DocumentBlockParam | Anthropic.ImageBlockParam> = [];

  for (const doc of documents ?? []) {
    nomsDocuments.push(doc.titre);

    const extension = doc.chemin.split(".").pop()?.toLowerCase() ?? "";
    const typeImage = TYPES_IMAGE[extension];
    const estPdf = extension === "pdf";
    const estTexte = TYPES_TEXTE.has(extension);
    if (!typeImage && !estPdf && !estTexte) continue;

    const { data: fichier } = await supabase.storage.from("documents").download(doc.chemin);
    if (!fichier || fichier.size > TAILLE_MAX_FICHIER) continue;

    if (estTexte) {
      const contenu = await fichier.text();
      blocsDocuments.push({
        type: "document",
        title: doc.titre,
        source: { type: "text", media_type: "text/plain", data: contenu },
      });
      continue;
    }

    const buffer = Buffer.from(await fichier.arrayBuffer());
    const data = buffer.toString("base64");

    if (estPdf) {
      blocsDocuments.push({
        type: "document",
        title: doc.titre,
        source: { type: "base64", media_type: "application/pdf", data },
      });
    } else if (typeImage) {
      blocsDocuments.push({
        type: "image",
        source: { type: "base64", media_type: typeImage, data },
      });
    }
  }

  if (blocsDocuments.length > 0) {
    blocsDocuments[blocsDocuments.length - 1].cache_control = { type: "ephemeral" };
  }

  const historique = historiqueBrut.slice(-NOMBRE_MAX_HISTORIQUE);
  const messages: Anthropic.MessageParam[] = [
    ...historique.map((m) => ({ role: m.role, content: m.contenu })),
    {
      role: "user",
      content: [...blocsDocuments, { type: "text", text: q }],
    },
  ];

  const client = new Anthropic();

  try {
    const response = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 2000,
      system: [
        { type: "text", text: systemPrompt(nomsDocuments), cache_control: { type: "ephemeral" } },
      ],
      messages,
    });

    const texte = response.content.find((b) => b.type === "text")?.text;
    return { reponse: texte || "Je n'ai pas pu générer de réponse." };
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return { erreur: "Clé API invalide. Contactez la direction." };
    }
    if (error instanceof Anthropic.RateLimitError) {
      return { erreur: "Trop de demandes en ce moment, réessayez dans un instant." };
    }
    if (error instanceof Anthropic.APIError) {
      return { erreur: `Erreur de l'assistant : ${error.message}` };
    }
    return { erreur: "Une erreur inattendue est survenue. Réessayez plus tard." };
  }
}
