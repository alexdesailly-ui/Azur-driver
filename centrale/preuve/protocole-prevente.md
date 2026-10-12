# Protocole de prévente — la seule preuve de demande

La démonstration de `preuve/index.html` montre que le service **tourne** sans intervention le samedi. Elle ne dit rien de la question qui compte : **des inconnus paieront-ils une place ?** Ce protocole y répond en décembre 2026, avec de vrais acomptes, pour un coût fixe quasi nul.

L'hypothèse et les critères ont été écrits avant la construction de la démonstration (`hypothese.json`, 12/10/2026 à 21:41).

## Ce qui compte comme preuve

| Compte | Ne compte pas |
|---|---|
| Une place payée (acompte) par un voyageur arrivé par le lien d'une conciergerie | Une place achetée par un proche, un ami ou un client existant d'Azur Driver |
| Une conciergerie qui a réellement ajouté le lien à son message d'avant l'arrivée | Une conciergerie qui « trouve l'idée intéressante » |
| Le temps réellement passé, noté chaque semaine | Une estimation après coup |

Chaque conciergerie a son propre code de lien (`DEMO-RISOUL-1912` dans la démonstration). Les places payées sont comptées par code : on sait quel canal vend et lequel ne vend pas.

## Calendrier (créneaux du mercredi à 12:30 de `docs/reste-a-faire.md`)

| Date | Étape | Mesure |
|---|---|---|
| jusqu'au 18/11 | Prérequis légaux, CGV relues, 1 à 2 chauffeurs partenaires, moyen de paiement d'acompte ouvert | prérequis cochés dans `docs/checklist-legale.md` |
| 4/11 au 25/11 | Proposer le lien aux conciergeries de Vars et de Risoul (organisations de `docs/cibles.csv`) | conciergeries qui diffusent le lien |
| 25/11 | Ouverture de la prévente des samedis 19 et 26 décembre | — |
| 12/12 | J-7 du 19/12 : seuil appliqué (`node composer-csv.js export.csv --j7`) | vans confirmés, acomptes rendus |
| **15/12** | **Point de décision** | **places payées au 15/12** |
| 19/12 | J-7 du 26/12 et premier samedi réel | retards, temps passé |

## Seuils de décision au 15/12

| Places payées pour le 19 et le 26/12 | Conciergeries actives | Décision |
|---|---|---|
| 12 ou plus | 2 ou plus | **Continuer** : ouvrir les samedis de janvier et des vacances de février |
| 6 à 11 | au moins 1 | **Corriger le canal** : ajouter la vente directe (plan B, navette vendue en direct) et garder les conciergeries |
| moins de 6 | — | **Arrêter** proprement : tous les acomptes rendus, bilan écrit, actifs gardés (moteur, CGV, contrats) |

Deux règles de garde :
- au-delà de **2 heures par semaine** de gestion en décembre, le modèle ne tient pas, même si la demande est là : il faut alors automatiser davantage avant de continuer ;
- **aucune publicité payante** pendant le test : elle mesurerait le budget, pas la demande du canal conciergerie.

## Outillage minimal, sans base de données

1. Un lien de paiement d'acompte par conciergerie, avec les champs du formulaire de la démonstration (trajet, gare ou aéroport, heure, nombre de personnes, station). Le prestataire de paiement est choisi et ouvert par Alex.
2. L'export CSV des paiements, une fois par semaine.
3. `node preuve/composer-csv.js export.csv` : tableau du samedi, places payées par lien, réservations à corriger ; `--j7` le jour du seuil ; `--retard ID MINUTES` le jour même.
4. Les messages aux voyageurs sont copiés depuis la sortie de l'outil. Rien n'est envoyé automatiquement pendant la prévente.

## Ce que la démonstration a déjà établi (12/10/2026)

- Moteur : 14 tests automatiques passent (capacité, seuil, libération des places sans acompte, appariement descente et montée, retards, export CSV).
- Parcours conciergerie, voyageur, samedi : 44 vérifications Playwright réussies sur ordinateur et sur téléphone, sans erreur.
- Lecture des messages libres par un modèle local : 98/100 champs justes sur le jeu de mise au point, 57/60 sur 12 messages de contrôle écrits avant les résultats, réponse en moins de 7 secondes. Une erreur sur 12 messages de contrôle passe le contrôle du code : le voyageur relit toujours son récapitulatif avant de payer.
