-- Plans de jour PAB ailes A (06h00-14h00) et (6h30-15h00), transcrits
-- depuis le document réel de la résidence. Les deux PAB travaillent en
-- équipe à partir de 6h30 : la plupart des tâches sont donc communes aux
-- deux plans, seuls le début (arrivée) et la fin (relève) diffèrent.

with regles as (
  select E'Répondre aux cloches\nRépondre à la porte si quelqu''un sonne\nAvoir le téléphone sans fil sur soi en tout temps et répondre en tout temps\nFaire des tournées visuelles à toutes les heures\nToujours travailler en équipe\nSi une des deux PAB n''a pas sa loi 90 : la PAB avec la loi 90 doit donner la médication de tout le département\nTournées visuelles dans toutes les chambres obligatoires à toutes les heures' as texte
),
plan_0600 as (
  insert into public.plans_travail (nom, heure_debut, heure_fin, regles_generales)
  select 'PAB ailes A (06h00-14h00)', '06:00', '14:00', regles.texte from regles
  returning id
)
insert into public.plans_travail_taches (plan_id, heure, libelle, ordre)
select plan_0600.id, v.heure, v.libelle, v.ordre
from plan_0600, (values
  ('06:00'::time, 'Faire le décompte des narcotiques avec la PAB qui quitte à minuit.', 1),
  ('06:00', 'Lire l''interservice.', 2),
  ('06:00', 'Vérifier si un suivi post-chute est en cours, poursuivre et compléter selon les heures indiquées.', 3),
  ('06:00', 'Regarder le plan de soins et la feuille de tâches, et initialiser.', 4),
  ('06:00', 'Préparer la médication, préparer les Lax-A-Day.', 5),
  ('06:30', 'Débuter les toilettes partielles des résidents et les accompagner à la cuisine.', 1),
  ('06:30', 'Préparer les déjeuners et aider les résidents au déjeuner.', 2),
  ('06:30', 'Administrer la médication.', 3),
  ('06:30', 'Ramasser la vaisselle et le poste de travail.', 4),
  ('06:30', 'Aller porter les vêtements propres dans les chambres et les ranger.', 5),
  ('08:30', 'Faire les barbes.', 1),
  ('08:30', 'Terminer les toilettes partielles pour les derniers résidents qui se lèvent tard.', 2),
  ('09:30', 'Donner un bain.', 1),
  ('10:00', 'Vérifier les lits à défaire et les jours sans selle.', 1),
  ('10:00', 'Défaire les lits selon l''horaire de lavage et laver la literie.', 2),
  ('10:00', 'Faire la commande et aller la porter à la cuisine.', 3),
  ('10:00', 'Préparer la vaisselle du dîner (bols à soupe, assiette et assiette adaptée, tasse à café et bac à ustensiles).', 4),
  ('10:00', 'Mettre le savon dans le lave-vaisselle.', 5),
  ('10:00', 'Beurrer les biscuits soda dans une assiette.', 6),
  ('10:00', 'Préparer café, thé et verres d''eau.', 7),
  ('10:30', 'Emmener les résidents à la toilette, les installer à la table à manger.', 1),
  ('10:30', 'Mettre les tabliers aux résidents qui en ont besoin.', 2),
  ('10:50', 'Distribuer le thé et le café.', 1),
  ('11:00', 'Aller chercher le chariot du dîner et servir le repas.', 1),
  ('11:00', 'Administrer la médication.', 2),
  ('11:30', 'Débarrasser et laver les tables et chaises.', 1),
  ('12:00', 'Dîner — pause repas (PAB 6h00-14h00).', 1),
  ('12:30', 'Lavez les tabliers.', 1),
  ('12:30', 'Plier et serrer le lavage.', 2),
  ('12:30', 'Refaire les lits qui ont été lavés.', 3),
  ('12:30', 'Changer les sacs à poubelles.', 4),
  ('12:30', 'Passer le balai sous les tables.', 5),
  ('12:30', 'Vider le lave-vaisselle.', 6),
  ('12:30', 'Accompagner les gens à la toilette selon l''horaire.', 7),
  ('12:30', 'Coucher les résidents qui font une sieste.', 8),
  ('12:45', 'Laver la vaisselle et ramasser le poste de garde.', 1),
  ('12:45', 'Accompagner les résidents lorsqu''il y a des activités.', 2),
  ('13:30', 'Faire le décompte narco avec la PAB de soir.', 1),
  ('13:30', 'Compléter le rapport interservices, signer et compléter le plan de soins, les FADM et les suivis de selles.', 2),
  ('13:30', 'Faire un rapport verbal à la personne qui prend la relève du quart suivant.', 3),
  ('13:45', 'Préparer et distribuer la collation.', 1),
  ('14:00', 'Fin du quart.', 1)
) as v(heure, libelle, ordre);

with regles as (
  select E'Répondre aux cloches\nRépondre à la porte si quelqu''un sonne\nAvoir le téléphone sans fil sur soi en tout temps et répondre en tout temps\nFaire des tournées visuelles à toutes les heures\nToujours travailler en équipe\nSi une des deux PAB n''a pas sa loi 90 : la PAB avec la loi 90 doit donner la médication de tout le département\nTournées visuelles dans toutes les chambres obligatoires à toutes les heures' as texte
),
plan_0630 as (
  insert into public.plans_travail (nom, heure_debut, heure_fin, regles_generales)
  select 'PAB ailes A (6h30-15h00)', '06:30', '15:00', regles.texte from regles
  returning id
)
insert into public.plans_travail_taches (plan_id, heure, libelle, ordre)
select plan_0630.id, v.heure, v.libelle, v.ordre
from plan_0630, (values
  ('06:30'::time, 'Faire le décompte des narcotiques avec la PAB qui quitte à minuit.', 1),
  ('06:30', 'Lire l''interservice.', 2),
  ('06:30', 'Vérifier si un suivi post-chute est en cours, poursuivre et compléter selon les heures indiquées.', 3),
  ('06:30', 'Regarder le plan de soins et la feuille de tâches, et initialiser.', 4),
  ('06:30', 'Vérifier avec la collègue de 6h00 et débuter les tâches en équipe.', 5),
  ('06:30', 'Débuter les toilettes partielles des résidents et les accompagner à la cuisine.', 6),
  ('06:30', 'Préparer les déjeuners et aider les résidents au déjeuner.', 7),
  ('06:30', 'Administrer la médication.', 8),
  ('06:30', 'Ramasser la vaisselle et le poste de travail.', 9),
  ('06:30', 'Aller porter les vêtements propres dans les chambres et les ranger.', 10),
  ('08:30', 'Faire les barbes.', 1),
  ('08:30', 'Terminer les toilettes partielles pour les derniers résidents qui se lèvent tard.', 2),
  ('09:30', 'Donner un bain.', 1),
  ('10:00', 'Vérifier les lits à défaire et les jours sans selle.', 1),
  ('10:00', 'Défaire les lits selon l''horaire de lavage et laver la literie.', 2),
  ('10:00', 'Faire la commande et aller la porter à la cuisine.', 3),
  ('10:00', 'Préparer la vaisselle du dîner (bols à soupe, assiette et assiette adaptée, tasse à café et bac à ustensiles).', 4),
  ('10:00', 'Mettre le savon dans le lave-vaisselle.', 5),
  ('10:00', 'Beurrer les biscuits soda dans une assiette.', 6),
  ('10:00', 'Préparer café, thé et verres d''eau.', 7),
  ('10:30', 'Emmener les résidents à la toilette, les installer à la table à manger.', 1),
  ('10:30', 'Mettre les tabliers aux résidents qui en ont besoin.', 2),
  ('10:50', 'Distribuer le thé et le café.', 1),
  ('11:00', 'Aller chercher le chariot du dîner et servir le repas.', 1),
  ('11:00', 'Administrer la médication.', 2),
  ('11:30', 'Débarrasser et laver les tables et chaises.', 1),
  ('12:30', 'Dîner — pause repas (PAB 6h30-15h00).', 1),
  ('12:30', 'Lavez les tabliers.', 2),
  ('12:30', 'Plier et serrer le lavage.', 3),
  ('12:30', 'Refaire les lits qui ont été lavés.', 4),
  ('12:30', 'Changer les sacs à poubelles.', 5),
  ('12:30', 'Passer le balai sous les tables.', 6),
  ('12:30', 'Vider le lave-vaisselle.', 7),
  ('12:30', 'Accompagner les gens à la toilette selon l''horaire.', 8),
  ('12:30', 'Coucher les résidents qui font une sieste.', 9),
  ('12:45', 'Laver la vaisselle et ramasser le poste de garde.', 1),
  ('12:45', 'Accompagner les résidents lorsqu''il y a des activités.', 2),
  ('13:45', 'Préparer et distribuer la collation.', 1),
  ('14:15', 'Donner un bain.', 1),
  ('14:50', 'Compléter le rapport interservices, signer et compléter le plan de soins, les FADM et les suivis de selles.', 1),
  ('14:50', 'Faire un rapport verbal à la personne qui prend la relève du quart suivant.', 2),
  ('15:00', 'Fin du quart.', 1)
) as v(heure, libelle, ordre);
