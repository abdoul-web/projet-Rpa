export type MessageChat = {
  id: string;
  auteur_id: string;
  contenu: string;
  created_at: string;
};

export type MessageAffichable = MessageChat & {
  auteur: { prenom: string; nom: string };
};
