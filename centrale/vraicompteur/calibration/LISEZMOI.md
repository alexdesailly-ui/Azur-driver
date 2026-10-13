# Calibrer le lecteur sur de vraies offres

Les captures de la démonstration sont fictives. Avant toute bêta, il faut savoir si le lecteur lit les vraies offres des plateformes françaises. Ce kit le mesure sur ton ordinateur, sans réseau.

## Ce qu'il faut (environ 1 h, pendant tes séances habituelles)
1. Pendant une ou deux séances, fais une capture d'écran de **chaque** offre reçue **à l'arrêt** (pendant que tu attends), acceptée ou non, sur chaque plateforme que tu utilises. Jamais en roulant. Vise 20 captures par plateforme.
2. Copie les captures dans `calibration/captures/` (ce dossier n'est jamais envoyé sur GitHub).
3. Copie `exemple-verite.csv` en `verite.local.csv` et remplis une ligne par capture, avec les valeurs **affichées à l'écran** : prix net, approche (min et km), course (min et km). Laisse vide un champ que l'offre n'affiche pas. Colonne facultative `heure` (HH:MM) : l'heure d'arrivée de l'offre.
4. Une fois : `npm install`. Puis : `node outils/calibrer.js calibration/captures calibration/verite.local.csv`

## Lire le résultat
- Au moins 90 % des champs justes pour une plateforme : le lecteur est prêt pour elle.
- En dessous : relancer avec `--texte` (le texte lu est alors gardé dans le rapport local, à ne pas publier), régler `lecteur.js`, puis mesurer sur **10 nouvelles captures** jamais utilisées pour le réglage. Sans ce jeu de contrôle, la précision annoncée ne vaut rien.
- Si toutes les offres d'une séance ont une heure, le rapport donne aussi la fréquence des offres : c'est la première mesure réelle de ta barre.

## Confidentialité
- Une capture peut montrer le prénom d'un passager. Elle ne quitte pas ton ordinateur : le script n'utilise pas le réseau, et `captures/` et les fichiers `*.local.*` sont ignorés par git.
- Le rapport ne contient ni image ni texte lu (sauf avec `--texte`). Supprime les captures quand la calibration est faite.
