-- Exemple réel additionnel : plans de soir PAB aile A
-- (14h00-22h00) et (15h30-00h00), fournis par la résidence.

with regles as (
  select E'Répondre aux cloches\nRépondre à la porte si quelqu''un sonne\nAvoir le téléphone sans fil sur soi en tout temps et répondre en tout temps\nFaire des tournées visuelles à toutes les heures\nToujours travailler en équipe\nSi une des deux PAB n''a pas sa loi 90 : la PAB avec la loi 90 doit donner la médication de tout le département, et la PAB sans la loi 90 doit distribuer la collation de 19h00\nTournée visuelle à toutes les heures dans toutes les chambres obligatoire' as texte
),
plan_1400 as (
  insert into public.plans_travail (nom, heure_debut, heure_fin, regles_generales)
  select 'PAB aile A (14h00-22h00)', '14:00', '22:00', regles.texte from regles
  returning id
)
insert into public.plans_travail_taches (plan_id, heure, libelle, ordre)
select plan_1400.id, v.heure, v.libelle, v.ordre
from plan_1400, (values
  ('14:00'::time, 'Faire le décompte narco avec la PAB de jour.', 1),
  ('14:00', 'Lire l''interservice.', 2),
  ('14:00', 'Vérifier le plan de soins.', 3),
  ('14:00', 'Vérifier si un suivi post-chute est en cours, poursuivre et compléter selon les heures indiquées.', 4),
  ('14:15', 'Faire le remplissage dans les chambres : papier, toilette, serviette/débarbouillette, sac poubelle, culotte.', 1),
  ('15:00', 'Préparer le matériel du souper.', 1),
  ('15:00', 'Préparer café et thé.', 2),
  ('15:30', 'Préparer la médication du souper.', 1),
  ('15:30', 'Accompagner les résidents à la toilette puis à la salle à manger.', 2),
  ('16:00', 'Aller chercher le chariot du souper et débuter le souper.', 1),
  ('16:00', 'Débuter l''administration de la médication.', 2),
  ('17:15', 'Vider et nettoyer les tables et chaises, apporter les tabliers au lavage.', 1),
  ('17:30', 'Souper PAB (14h00-22h00) (30 minutes).', 1),
  ('18:00', 'Laver la vaisselle et nettoyer le poste de garde.', 1),
  ('18:15', 'Débuter la tournée de toilette partielle selon les plans de soins : vider les poubelles après chaque toilette partielle ; enlever les dentiers, les nettoyer et les mettre dans le boîtier du résident avec pastille de Polident, puis les mettre au poste de garde.', 1),
  ('18:30', 'Donner un bain selon l''horaire.', 1),
  ('19:00', 'Collation (plateau de collation, galette, protéines, jus, pêche, eau, verre, cuillère et napkins).', 1),
  ('20:00', 'Donner la médication.', 1),
  ('20:30', 'Coucher les résidents selon leur routine.', 1),
  ('21:00', 'Faire le lavage du matériel des toilettes partielles.', 1),
  ('21:30', 'Effectuer une tournée de toutes les chambres afin de retirer toute nourriture, vaisselle et ustensiles.', 1),
  ('21:45', 'Compléter le rapport interservices, signer et compléter le plan de soins, les FADM et les suivis de selles.', 1),
  ('22:00', 'Départ — fin du quart.', 1)
) as v(heure, libelle, ordre);

with regles as (
  select E'Répondre aux cloches\nRépondre à la porte si quelqu''un sonne\nAvoir le téléphone sans fil sur soi en tout temps et répondre en tout temps\nFaire des tournées visuelles à toutes les heures\nToujours travailler en équipe\nSi une des deux PAB n''a pas sa loi 90 : la PAB avec la loi 90 doit donner la médication de tout le département, et la PAB sans la loi 90 doit distribuer la collation de 19h00\nTournée visuelle à toutes les heures dans toutes les chambres obligatoire' as texte
),
plan_1530 as (
  insert into public.plans_travail (nom, heure_debut, heure_fin, regles_generales)
  -- heure_fin stockée à 23:59 (plutôt que 00:00) pour que la comparaison
  -- "quart en cours" fonctionne correctement malgré le passage de minuit.
  select 'PAB aile A (15h30-00h00)', '15:30', '23:59', regles.texte from regles
  returning id
)
insert into public.plans_travail_taches (plan_id, heure, libelle, ordre)
select plan_1530.id, v.heure, v.libelle, v.ordre
from plan_1530, (values
  ('15:30'::time, 'Lire l''interservice.', 1),
  ('15:30', 'Vérifier le plan de soins.', 2),
  ('15:30', 'Vérifier si un suivi post-chute est en cours, poursuivre et compléter selon les heures indiquées.', 3),
  ('17:15', 'Vider et nettoyer les tables et chaises, apporter les tabliers au lavage.', 1),
  ('18:00', 'Souper PAB (15h30-00h00) (30 minutes).', 1),
  ('18:15', 'Débuter la tournée de toilette partielle selon les plans de soins : vider les poubelles après chaque toilette partielle ; enlever les dentiers, les nettoyer et les mettre dans le boîtier du résident avec pastille de Polident, puis les mettre au poste de garde.', 1),
  ('18:30', 'Donner un bain selon l''horaire.', 1),
  ('19:00', 'Collation (plateau de collation, galette, protéines, jus, pêche, eau, verre, cuillère et napkins).', 1),
  ('20:00', 'Donner la médication.', 1),
  ('20:30', 'Coucher les résidents selon leur routine.', 1),
  ('21:00', 'Faire le lavage du matériel des toilettes partielles.', 1),
  ('21:30', 'Effectuer une tournée de toutes les chambres afin de retirer toute nourriture, vaisselle et ustensiles.', 1),
  ('22:15', 'Laver à la main avec savon personnel les bas supports, et les étendre.', 1),
  ('22:30', 'Plier et ranger le lavage du matériel de toilette partielle.', 1),
  ('23:00', 'Tournée de culotte selon le plan de soins.', 1),
  ('23:45', 'Compléter le rapport interservices, signer et compléter le plan de soins, les FADM et les suivis de selles.', 1),
  ('23:50', 'Faire le décompte de narcotiques avec la PAB de nuit, et valider les FADM.', 1),
  ('23:50', 'Faire un rapport verbal à la personne qui prend la relève du quart suivant. Fin du quart (00h00).', 2)
) as v(heure, libelle, ordre);
