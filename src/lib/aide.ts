export type MessageAide = {
  role: "user" | "assistant";
  contenu: string;
};

export type ReponseAide = { reponse: string } | { erreur: string };
