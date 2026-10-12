# Preuve de concept — Clé en Van

Hypothèse et critères écrits avant de construire : `hypothese.json`.

| Fichier | Rôle |
|---|---|
| `index.html` | Démonstration navigable : la conciergerie envoie le lien, le voyageur réserve, le samedi se compose (J-10, J-7, jour J avec trois retards) |
| `moteur.js` | Moteur de rotation : composition des vans, seuil de 6 places payées à J-7, places sans acompte libérées, appariement descente et montée, replacement des retardataires |
| `donnees-demo.js` | Le samedi fictif de la démonstration |
| `app.js` | Relie la page au moteur |
| `composer-csv.js` | Outil de la prévente : compose un samedi depuis un export CSV de paiements |
| `ia/` | Lecture des messages libres par un modèle local : jeux de messages fictifs, consignes v1 et v2, résultats jugés par le code |
| `tests/moteur.test.js` | 14 tests du moteur : `node --test tests/moteur.test.js` |
| `tests/parcours.py` | Parcours Playwright, ordinateur et téléphone : `python3 tests/parcours.py <url de index.html> <dossier de captures>` |
| `protocole-prevente.md` | La seule preuve de demande : seuils et décisions au 15/12/2026 |

## Lancer la démonstration
Depuis le dossier `centrale/` : `python3 -m http.server 8765`, puis ouvrir `http://localhost:8765/preuve/index.html`.

## Règles du moteur, en clair
- Un van compte 8 places. Une montée attend au plus 45 minutes après la première arrivée et part 20 minutes après la dernière.
- Une descente arrive en gare 45 minutes avant le train ou 1 h 30 avant le vol.
- À J-7, un van part s'il compte au moins 6 places payées ; sinon les acomptes sont rendus. Une place sans acompte est libérée.
- Le jour même, seul le voyageur en retard bouge : son van l'attend s'il le peut, sinon le van suivant qui a la place le prend, sinon le message de l'article 5 des CGV lui propose un transfert ou le remboursement.

Durées de trajet : Marseille-Risoul est relevée (237 km, 171 min) ; les trois autres sont des estimations à confirmer avec les chauffeurs.
