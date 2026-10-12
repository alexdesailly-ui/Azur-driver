# Le format ouvert « À la place »

Un chauffeur VTC décrit son trajet dans un fichier JSON (`trajet.schema.json`). Le réseau assemble tous les fichiers en un seul flux GTFS-Flex (`gtfs_flex.py`), contrôlé à chaque publication (`flex_check.py`).

## Règle n°1 : aucun horaire fixe
Un départ est toujours **composé à partir des réservations** et confirmé quand le seuil de places payées est atteint. Le schéma n'a pas de champ pour un horaire, et le contrôle refuse tout `arrival_time` ou `departure_time`.

Pourquoi : un horaire fixe publié ferait ressembler le trajet à une ligne régulière, qui relève d'un autre régime. Le mode « à la demande », sur réservation préalable, est celui des VTC. **À faire valider** par le bureau des transports publics particuliers de personnes ou par un avocat avant toute ouverture.

Base de la vente à la place : la loi Grandguillaume « autorise dorénavant la vente à la place aux VTC et aux taxis en réservation préalable » (réponse ministérielle à la question écrite n° 4293, JO du 1er mai 2018).

## Ce que contient un trajet
| Champ | Rôle |
|---|---|
| `id` | `chauffeur.trajet` : deux chauffeurs ne peuvent pas entrer en collision |
| `operateur` | nom commercial et numéro d'inscription au registre VTC |
| `zones` | les zones de prise en charge et de dépose (rectangles pour la démonstration, polygones ensuite) |
| `trajets` | pour chaque sens : zone de départ, zone d'arrivée, fenêtre de prise en charge, fenêtre de dépose |
| `periode` | dates et jours de la semaine |
| `capacite`, `seuil` | 8 places au plus ; le départ est confirmé au seuil |
| `prix_place_eur` | prix d'une place, aller simple |
| `reservation` | délai, ouverture des réservations, lien |

## Ce que produit le flux GTFS-Flex
GTFS-Flex est l'extension de GTFS pour le transport à la demande, adoptée dans la spécification en mars 2024 (https://gtfs.org/extensions/flex/). Un trajet y devient :
- `locations.geojson` : les zones ;
- `stop_times.txt` : deux lignes par sens, avec des **fenêtres** (`start_pickup_drop_off_window`, `end_pickup_drop_off_window`) au lieu d'horaires, et `pickup_type=2` / `drop_off_type=2` (sur réservation) ;
- `booking_rules.txt` : délai de réservation et message « départ composé à partir des réservations, confirmé au seuil » ;
- `fare_attributes.txt` et `fare_rules.txt` : le prix de la place.

Des calculateurs d'itinéraires lisent GTFS-Flex (OpenTripPlanner depuis 2020 selon gtfs.org). La prise en compte par Google Maps est **à justifier**. Un service à la demande français est déjà publié en GTFS-Flex sur data.gouv.fr (TAD d'Orléans Métropole).

## Contrôles
- `python3 -m unittest discover -s tests` : 7 tests (deux chauffeurs dans un flux, aucun horaire fixe, horaire fixe refusé, collision refusée, règle de réservation incohérente détectée, seuil supérieur à la capacité refusé).
- `python3 flex_check.py flux/alaplace-gtfs.zip` : règles conditionnelles de `stop_times.txt`, `locations.geojson` et `booking_rules.txt` d'après la référence GTFS, plus la règle n°1.
- Le validateur officiel MobilityData n'a pas pu être téléchargé le 12/10/2026 (réseau) : **à lancer** sur le flux avant toute publication.

## Forker, c'est rejoindre
Licence prévue : GNU AGPL v3 (choix d'Alex, 12/10/2026) ; le fichier de licence est à ajouter avant toute publication. Un chauffeur ou un développeur qui forke publie ses trajets dans le même format : ils s'assemblent dans le même flux sans collision. Ce qui a de la valeur ne se copie pas avec le code : le registre commun des trajets, les règles écrites une fois pour tous, et les données réelles de prévente.
