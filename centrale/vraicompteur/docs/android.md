# Vrai Compteur sur Android : spécification d'architecture

Statut : spécification, pas de code. On ne construit l'appli qu'après les critères de terrain de `hypothese.json` (300 inscriptions en 21 jours, +10 % mesurés en bêta). C'est la condition du « tapis » choisi par Alex.

## Ce que l'appli doit faire
Quand une offre de course s'affiche dans l'appli d'une plateforme, Vrai Compteur la lit, calcule le net, la compare à la barre du chauffeur, et affiche le verdict dans une petite bulle, en moins de 1,5 s. Il ne touche jamais à l'appli de la plateforme : il n'accepte rien, ne refuse rien, ne clique nulle part.

## Les deux façons de lire l'offre
| | A. Service d'accessibilité | B. Capture d'écran autorisée |
|---|---|---|
| Principe | Lire le texte des éléments affichés par l'appli de la plateforme | Capturer l'écran (MediaProjection), puis reconnaissance de texte sur l'appareil |
| Avantage | Pas de reconnaissance de texte : rapide, exact si le texte est exposé | Marche même si l'appli ne fournit pas de texte lisible |
| Contrainte | Google Play : déclaration, information visible et consentement explicite ; actions autonomes interdites (page « Use of the AccessibilityService API ») | Depuis Android 14, consentement à chaque séance de capture ; notification permanente |
| À vérifier | Que les applis des plateformes exposent le prix et les durées dans leurs éléments | Précision de la reconnaissance sur de vraies offres (kit `calibration/`) |

Choix : construire B d'abord (il dépend moins de chaque plateforme), garder A en option par plateforme si elle expose son texte. Reconnaissance de texte : un moteur qui tourne sur l'appareil (par exemple ML Kit, reconnaissance de texte latin sur l'appareil), jamais un service distant.

## La bulle
- Fenêtre par-dessus les autres applis (autorisation « Afficher par-dessus d'autres applis »).
- Petite, en haut d'écran, **jamais au-dessus des boutons de l'offre**, et traversée par les touchers : depuis Android 12, les touchers qui traversent une fenêtre d'une autre appli sont bloqués si elle est trop opaque ; la bulle ne doit gêner aucun geste.
- Un coup d'œil suffit : la couleur, un mot (« rentable », « limite », « sous ta barre »), un chiffre (« +3,70 € par rapport à attendre »). Aucune manipulation en conduisant. Option voix à étudier.

## Le calcul
- Même moteur que la démonstration : `moteur.js` (net, temps immobilisé, verdict), `strategie.js` (barre), `lecteur.js` (lecture du texte).
- Deux options : embarquer ces fichiers dans un petit moteur JavaScript, ou les réécrire en Kotlin. Dans les deux cas, les cas de test écrits à la main (`tests/*.test.js`) deviennent un fichier de vecteurs partagé que les deux versions doivent passer à l'identique.

## La barre apprise sur l'appareil
- Chaque offre lue est gardée **sur le téléphone** : prix, durées, kilomètres, zone de dépose, heure. Ni nom de passager, ni adresse.
- Fréquence des offres estimée par heure de la semaine et par zone, à partir des écarts entre offres quand le chauffeur attend.
- La barre est recalculée après chaque offre (même calcul que la démonstration : `seuilOptimal`).
- Partage facultatif, sur choix explicite : des moyennes par zone et par heure, publiées seulement quand assez de chauffeurs y contribuent pour qu'aucun ne soit reconnaissable (seuil à fixer, par exemple 20). C'est ce qui ne se copie pas avec le code.

## Ce qu'on mesure avant de publier l'appli
| Mesure | Seuil | Comment |
|---|---|---|
| Champs justes sur de vraies offres | 90 % par plateforme, sur un jeu de contrôle | Kit `calibration/` |
| Délai entre l'affichage de l'offre et le verdict | moins de 1,5 s, médiane | Enregistrement d'écran horodaté |
| Batterie | à mesurer sur une séance de 4 h | Statistiques Android |
| Gain réel | +10 % de net par heure connectée en bêta | Compteur de la semaine avant et après |
| Effet des refus sur la fréquence des offres | gain détruit si les offres arrivent environ 30 % moins souvent (`docs/simulation.json`) | Écarts entre offres avant et après, pendant la bêta |

## iPhone
Une appli ne peut pas lire l'écran d'une autre appli. Restent : le compteur de la semaine, la saisie, et la lecture d'une capture partagée vers Vrai Compteur.

## Coût
À chiffrer avec un développeur Android à partir de cette page, une fois les critères de terrain atteints. Aucun chiffre n'est avancé ici.
