# Vrai Compteur — démonstration

Le copilote du chauffeur VTC : quand une offre arrive, il lit l'écran et calcule **sur le téléphone** ce que la course rapporte vraiment (approche, frais au kilomètre, cotisations, retour en zone active), puis la compare à la **barre** : ce que le chauffeur gagne en moyenne s'il la refuse et attend la suivante. Il n'accepte et ne refuse jamais à la place du chauffeur, qui exerce son droit de refus (code des transports, art. L.1326-2). Nom de travail provisoire.

| Fichier | Rôle |
|---|---|
| `hypothese.json` | Hypothèses et critères, écrits avant la construction |
| `moteur.js` | Calcul du net par course, du temps immobilisé, du verdict par rapport à la barre ; compteur de la semaine |
| `strategie.js` | La barre (seuil d'acceptation optimal, arrêt optimal), le modèle d'offres calé sur les moyennes publiées, la simulation des façons de choisir |
| `lecteur.js` | Du texte lu sur la capture aux champs du moteur ; contrôle de vraisemblance (virgule perdue) |
| `index.html`, `app.js` | La page : compteur, lecture de capture sur l'appareil, saisie, profil, semaine, droit, abonnement |
| `manifest.webmanifest`, `sw.js` | Installation sur le téléphone et usage hors ligne (version hébergée) |
| `exemples/` | 6 captures fictives et génériques de mise au point, 6 de contrôle, et leurs vérités terrain |
| `outils/` | Génération des captures, copie des fichiers de lecture hors ligne, simulation des politiques (`simuler_politiques.js`), calibration (`calibrer.js`) |
| `calibration/` | Kit pour mesurer le lecteur sur de vraies captures, sur l'ordinateur du chauffeur (`LISEZMOI.md`) |
| `tests/` | Tests du moteur, de la barre et du lecteur (node), parcours complet, jeu de contrôle et approximation d'un téléphone lent (Playwright) |
| `docs/` | Dossier commercial, juridique et technique ; résultats de simulation ; spécification de l'appli Android |

## Lancer
```
npm install && npm run vendor     # lecture hors ligne (Tesseract, WebAssembly, français)
npm test                          # 30 tests : moteur, barre et simulation, lecteur
node outils/simuler_politiques.js # docs/simulation.json
python3 tests/verifier_simulation.py  # contre-vérification indépendante en Python (formules exactes)
cd .. && python3 -m http.server 8765
# http://localhost:8765/vraicompteur/index.html
python3 vraicompteur/tests/parcours.py http://localhost:8765/vraicompteur/index.html /tmp/captures
python3 vraicompteur/tests/controle.py http://localhost:8765/vraicompteur/index.html
```
Sans `npm run vendor`, la page charge le moteur de lecture depuis jsDelivr au premier usage.
