# Vrai Compteur — démonstration

Le copilote du chauffeur VTC : quand une offre arrive, il lit l'écran et calcule **sur le téléphone** ce que la course rapporte vraiment à l'heure (approche, frais au kilomètre, cotisations, attente après la dépose). Il n'accepte et ne refuse jamais à la place du chauffeur, qui exerce son droit de refus (code des transports, art. L.1326-2). Nom de travail provisoire.

| Fichier | Rôle |
|---|---|
| `hypothese.json` | Hypothèses et critères, écrits avant la construction |
| `moteur.js` | Calcul du net par course, du net à l'heure et du verdict ; compteur de la semaine |
| `lecteur.js` | Du texte lu sur la capture aux champs du moteur ; contrôle de vraisemblance (virgule perdue) |
| `index.html`, `app.js` | La page : compteur, lecture de capture sur l'appareil, saisie, profil, semaine, droit, abonnement |
| `manifest.webmanifest`, `sw.js` | Installation sur le téléphone et usage hors ligne (version hébergée) |
| `exemples/` | 6 captures fictives et génériques de mise au point, 6 de contrôle, et leurs vérités terrain |
| `outils/` | Génération des captures, copie des fichiers de lecture hors ligne |
| `tests/` | Tests du moteur et du lecteur (node), parcours complet et jeu de contrôle (Playwright) |
| `docs/` | Dossier commercial, juridique et technique |

## Lancer
```
npm install && npm run vendor     # lecture hors ligne (Tesseract, WebAssembly, français)
npm test                          # 15 tests du moteur et du lecteur
cd .. && python3 -m http.server 8765
# http://localhost:8765/vraicompteur/index.html
python3 vraicompteur/tests/parcours.py http://localhost:8765/vraicompteur/index.html /tmp/captures
python3 vraicompteur/tests/controle.py http://localhost:8765/vraicompteur/index.html
```
Sans `npm run vendor`, la page charge le moteur de lecture depuis jsDelivr au premier usage.
