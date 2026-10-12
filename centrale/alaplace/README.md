# À la place — démonstration

Un réseau ouvert où chaque chauffeur VTC vend des places sur des trajets réservés à l'avance, là où le transport public lâche. Clé en Van (`../`) est le trajet n°1. Nom de travail provisoire.

| Fichier | Rôle |
|---|---|
| `index.html`, `app.js` | Page des chauffeurs : combien rapporte un trajet à la place, fiche de trajet en format ouvert |
| `hypothese.json` | Hypothèses et critères de réussite, écrits avant la construction |
| `trajet.schema.json` | Le format ouvert d'un trajet (aucun champ d'horaire) |
| `corridors/` | Deux trajets de deux chauffeurs (Clé en Van, et un trajet fictif de nuit) |
| `gtfs_flex.py` | Assemble les trajets en un flux GTFS-Flex |
| `flex_check.py` | Contrôle écrit des règles Flex et de la règle « aucun horaire fixe » |
| `flux/alaplace-gtfs.zip` | Le flux produit |
| `tests/` | Tests du format (unittest) et parcours de la page (Playwright) |
| `protocole.md` | Le format expliqué, la règle juridique, ce qui reste à valider |

Lancer : depuis `centrale/`, `python3 -m http.server 8765`, puis `http://localhost:8765/alaplace/index.html`.
Régénérer le flux : `python3 gtfs_flex.py corridors/*.json -o flux/alaplace-gtfs.zip && python3 flex_check.py flux/alaplace-gtfs.zip`.
