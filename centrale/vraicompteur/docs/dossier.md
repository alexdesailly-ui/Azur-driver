# Vrai Compteur — dossier (version publique)

Nom de travail provisoire. Version publique : ni chiffre d'affaires prévisionnel, ni marge.

## 1. Le problème, chiffré
- Plus de 71 000 chauffeurs VTC actifs sur les plateformes en 2024, dont 74 % en Île-de-France (rapport 2026 de l'Observatoire national des T3P, SDES).
- Revenu horaire brut réel 2021-2025 : -9,3 % chez Uber, -11,3 % chez Bolt, une fois l'inflation déduite (rapport ARPE 2026, cité par TPE Actu le 26/04/2026). Ces chiffres excluent cotisations, carburant, assurance, entretien.
- 15 chauffeurs Uber étudiés à Paris de 2019 à 2022 : 10 à 34 € de l'heure brut sur tout le temps de travail ; depuis avril 2020, autant ou plus de kilomètres à vide qu'en charge (étude digipower, PersonalData.IO avec l'INV).
- Le chauffeur a quelques secondes pour accepter une offre. Il voit un prix et des distances, pas ce qu'il lui restera à l'heure.

## 2. Le droit est déjà là
- La plateforme doit afficher la distance et le prix minimal garanti, après commission, quand elle propose une course ; le chauffeur peut refuser sans pénalité, et aucun refus ne peut motiver une rupture (code des transports, art. L.1326-2, loi d'orientation des mobilités).
- Accords homologués par l'ARPE : 9 € net minimum par course, 1 € minimum par kilomètre, 30 € net par heure d'activité, et la possibilité pour le chauffeur de fixer un revenu minimum par kilomètre (Legisocial, 02/04/2024 ; page « dialogue social » d'Uber, mai 2024).
- Ce qui manque : un calcul **à l'heure**, frais, cotisations, approche et retour à vide compris, comparé à ce que rapporte un refus, sur toutes les plateformes, au moment de décider.

## 2 bis. La règle : refuser n'est pas gratuit
Prendre une course si elle rapporte, pendant qu'elle occupe le chauffeur, plus que sa moyenne par heure connectée. Cette moyenne, la « barre », se calcule à partir de la fréquence et de la valeur des offres : c'est le problème classique de l'arrêt optimal (accepter si v/τ ≥ g, où g = λ·E[max(v − gτ, 0)]). Elle monte quand les offres pleuvent, elle baisse quand elles se font rares. Un objectif fixe ne suit pas : trop haut aux heures creuses, il fait perdre de l'argent.

Simulation (`outils/simuler_politiques.js`, résultats dans `docs/simulation.json`), revenu net par heure connectée, après cotisations et frais au kilomètre :
| Façon de choisir, une offre toutes les 7,5 min, écart de prix moyen | €/h | Par rapport à tout accepter | Offres refusées |
|---|---|---|---|
| Tout accepter | 20,6 | référence | 0 % |
| Filtre au kilomètre, le mieux réglé après coup | 20,8 | +1,3 % | — |
| Objectif fixe 30 €/h | 22,5 | +9,4 % | — |
| Objectif fixe 18 €/h | 23,0 | +11,9 % | — |
| Barre calculée | 23,5 | +14,4 % | 43 % |
- Selon l'écart de prix entre les offres (faible, moyen, fort) : +10,9 %, +14,4 %, +19,7 % pour la barre ; 0 %, +1,3 %, +5,7 % pour le meilleur filtre au kilomètre.
- Aux heures creuses (une offre toutes les 15 min), l'objectif fixe de 30 €/h fait **perdre** 8,4 % ; la barre gagne encore 6,4 %.
- Un objectif fixe bien choisi fait presque aussi bien que la barre ; tout l'enjeu est de le choisir, et de le changer avec l'heure. La barre le fait seule.
- En euros : sur une semaine de 45 h connectées, l'écart entre la barre et « tout accepter » vaut environ 130 € net dans ce scénario (45 × (23,52 − 20,56)), à comparer aux 9,90 € par mois du copilote.
- Paramètres publiés : rapport ARPE 2026 cité par TPE Actu le 26/04/2026 (Uber 2025 : 17,3 € par course, 21,8 min par prestation, une proposition toutes les 7,5 min ; 4 min en 2021, 10 min en 2024 ; Bolt 2025 : une toutes les 5,8 min). Le reste est une hypothèse affichée dans le fichier de résultats.
- Limites : les chauffeurs refusent déjà au jugé, le gain réel se mesure contre leur pratique (bêta) ; si refuser faisait venir les offres moins souvent, le gain disparaîtrait à partir d'environ 27 à 36 % d'offres en moins selon l'écart de prix ; l'écart de prix réel n'est pas publié.

## 2 ter. La règle de poche
Une offre tombe, le chauffeur a 15 secondes et ne doit pas manipuler son téléphone en roulant. La barre se traduit en une règle à apprendre : **prix minimum = 0,50 € par minute + 0,19 € par kilomètre**, approche, course et retour compris (barre de 23,5 €/h, une offre toutes les 7,5 min, 21 % de cotisations, 0,15 €/km de frais). Arrondie à « 50 centimes la minute, 20 centimes le kilomètre », elle fait presque aussi bien que la barre recalculée (+14,3 % contre +14,4 % à 7,5 min) et reste gagnante à tous les rythmes simulés (+1,3 % à +30,6 %, `docs/simulation.json`). Elle monte aux heures de pointe (0,60 € la minute à une offre toutes les 4 min) et descend aux heures creuses (0,38 € à 15 min).
Conséquence : la valeur se teste **sans appli Android**. Échelle du produit : la règle (gratuite, se partage), le barème personnalisé par heure et par zone (gratuit, sur la page), le copilote qui calcule à l'arrivée de l'offre (payant).

## 3. Ce que fait Vrai Compteur
| Fonction | Gratuit | Copilote (9,90 €/mois, prix de bêta) |
|---|---|---|
| Ta semaine à l'euro près (revenu net réel à l'heure, charges fixes comprises) | oui | oui |
| Verdict sur une offre saisie ou sur une capture d'écran (lue sur le téléphone), comparé à la barre | oui | oui |
| Repères des accords de la profession (9 €, 1 €/km, 30 €/h d'activité) | oui | oui |
| Lecture de l'offre à l'écran au moment où elle arrive (Android) | — | oui |
| Règle de poche personnalisée et barème par rythme d'offres | oui | oui |
| Barre apprise sur ses propres offres, par zone et par heure, et sur celles des chauffeurs qui partagent | — | oui |
Le copilote **n'accepte et ne refuse jamais** : il calcule et affiche. C'est le chauffeur qui appuie.

## 4. Pourquoi les chauffeurs viendraient (les 6 tests d'Alex)
| Test | Réponse |
|---|---|
| Pourquoi un client vient vers moi | Le client est le chauffeur : savoir en 2 secondes ce qu'une offre lui laisse vraiment |
| Ce qu'il tape dans Google | « rentabilité course VTC », « revenu réel chauffeur Uber », « calcul taux horaire VTC » : aujourd'hui des pages de comptables, pas d'outil |
| Sujet télé | « La règle des 50 centimes » : refuser 4 offres sur 10 pour gagner plus ; revenu horaire réel en baisse (ARPE), droit de refus méconnu, bras de fer avec les plateformes : aux États-Unis, Uber et Lyft menacent de désactiver les utilisateurs d'applis équivalentes ; au Brésil, Uber a perdu contre l'une d'elles (The Hustle, 28/07/2025) |
| Les devs forkent | Lecture et calcul sur l'appareil, code ouvert ; ce qui ne se copie pas : les lecteurs d'offres tenus à jour pour chaque plateforme française et la fréquence des offres par zone et par heure, mesurée par les chauffeurs, qui fixe la barre de chacun |
| Les chauffeurs coupent les mauvaises courses | Refuser ce qui rapporte moins qu'attendre la suivante est un droit ; simulation : +11 à +20 % de net par heure connectée par rapport à tout accepter (à mesurer en France pendant la bêta) |
| Légende | Touche les 71 000 chauffeurs, pas une poignée ; une règle qui se transmet de chauffeur à chauffeur : « il m'a appris à dire non » |

## 5. Conquête : 0 € de publicité
| Canal | Pourquoi | Premier geste |
|---|---|---|
| Groupes Facebook et WhatsApp de chauffeurs | Alex est chauffeur : il parle de l'intérieur | Publication du compteur de la semaine gratuit, avec son propre chiffre |
| Organisations représentatives (AVF, Union-Indépendants, ACIL, FO, FNAE, CFTC, UNSA : liste ARPE de 2022, `docs/cibles.csv`) | Elles négocient les accords : l'outil montre s'ils sont respectés | Démonstration, puis diffusion à leurs adhérents |
| Loueurs de véhicules VTC | Un chauffeur qui gagne plus paie son loyer : le copilote offert réduit les impayés | Offre « copilote inclus » pour leurs chauffeurs |
| Centres de formation VTC | Les nouveaux chauffeurs n'ont aucun repère de rentabilité | Module de 30 minutes avec l'outil |
| Créateurs de vidéos VTC | Contenu tout trouvé : « j'ai calculé ma vraie heure » | Accès bêta |
| Presse régionale puis nationale | Les chiffres de l'ARPE et le droit de refus | Dossier de presse avec des mesures de la bêta, pas avant |

## 5 bis. Stratégie nationale
Copiée de GigU au Brésil (verdict en couleur, gratuit puis abonnement, croissance par les chauffeurs et le conflit avec Uber) : `docs/strategie-nationale.md`. Ordre des villes : Aix et Marseille, Lyon, Île-de-France.

## 6. Calendrier
| Quand | Quoi | Temps d'Alex |
|---|---|---|
| Semaines 1-2 | Captures réelles de ses propres offres pour calibrer le lecteur ; publication du compteur gratuit dans 3 groupes ; liste d'attente | 2 h/sem |
| Semaines 3-6 | Bêta de 30 chauffeurs : compteur de la semaine 2 semaines avant, puis 2 semaines avec la règle de poche personnalisée (aucune manipulation en roulant) ; écarts entre offres notés à l'arrêt pour mesurer l'effet des refus | 2 h/sem |
| Fin de semaine 6 | Décision : critères ci-dessous ; si oui, « tapis » (choix d'Alex) sur l'appli Android | — |

## 7. Critères d'arrêt (écrits avant, voir hypothese.json)
- Demande : au moins 300 inscriptions en 21 jours ; échec sous 50.
- Valeur : bêta de 30 chauffeurs sur 4 semaines, au moins +10 % de revenu net à l'heure mesuré ; échec sous +3 %.
- Paiement : au moins 10 % des testeurs prennent l'abonnement à la fin de la bêta.

## 8. Juridique
- Droit de refus et information préalable : art. L.1326-2 du code des transports.
- Aucune action automatique dans l'appli de la plateforme : pas d'acceptation ni de refus à la place du chauffeur.
- Conditions d'utilisation des plateformes : risque de menace de désactivation (précédents américains). Parade : conseil seulement, aucun identifiant de plateforme demandé, aucune connexion à la plateforme.
- Google Play autorise l'API d'accessibilité hors outils d'accessibilité avec une information claire, un consentement explicite et une déclaration ; les actions autonomes sont interdites (page « Use of the AccessibilityService API » de Google Play). Alternative : capture d'écran autorisée par l'utilisateur.
- Données : tout est calculé sur l'appareil ; la capture n'est pas conservée ; le prénom du passager éventuellement visible n'est ni conservé ni utilisé. Partage d'agrégats anonymes seulement sur choix explicite.

## 9. Technique
- Démonstration (ce dossier) : moteur et lecteur en JavaScript, lecture des captures par Tesseract compilé en WebAssembly, dans le navigateur, sans appel réseau pendant la lecture.
- La barre : calcul exact par dichotomie, vérifié par simulation (tests sur des cas calculables à la main) ; dans la page, des milliers d'heures simulées sur le téléphone en quelques dixièmes de seconde.
- Accessibilité : audit automatique axe-core (WCAG 2.1 A et AA, bonnes pratiques), 0 violation sur ordinateur sombre et téléphone clair ; couleurs du verdict au moins 5,7:1 en thème clair, pour la lecture au soleil.
- Contre-vérification : une réécriture indépendante en Python (`tests/verifier_simulation.py`), avec les formules exactes au lieu du tirage au hasard, retrouve la barre et les revenus de `docs/simulation.json` sur les 15 scénarios (60 contrôles sur 60).
- Kit de calibration (`calibration/`) : mesure la précision du lecteur sur les vraies captures d'un chauffeur, sur son ordinateur, sans réseau, et la fréquence de ses offres.
- Appli Android : spécification dans `docs/android.md`.
- Téléphone lent, approché par un processeur ralenti 4 et 6 fois dans Chrome (`tests/lent.py`, `docs/mesures-appareil-lent.json`) : simulation de la page 0,9 et 1,4 s au chargement, 0,2 et 0,3 s après un réglage ; verdict recalculé en 0,1 et 0,25 s. Le ralentissement ne s'applique pas au travailleur qui lit les captures : la vitesse de lecture sur un vrai téléphone reste à mesurer.
- Mesures de la démonstration (12/10/2026, conteneur de test, navigateur Chromium) : 30 champs justes sur 30 sur 6 captures de mise au point, 30 sur 30 sur 6 captures de contrôle jamais utilisées pour régler le lecteur ; environ 0,2 s par lecture. Captures fictives et génériques : à refaire sur de vraies captures et sur un téléphone.
- Appli Android (après la preuve) : bulle flottante, lecture de l'écran à l'arrivée d'une offre (API d'accessibilité déclarée, ou capture autorisée), reconnaissance de texte sur l'appareil, même moteur.
- iPhone : la lecture de l'écran d'une autre appli n'est pas possible ; le compteur et la lecture de captures restent disponibles.

## 10. Risques
| Risque | Parade |
|---|---|
| Une plateforme bloque ou menace | Conseil seulement, droit de refus, organisations représentatives à bord ; le bras de fer devient le sujet télé |
| Formats d'offre qui changent | Lecteurs par plateforme, tenus par les chauffeurs eux-mêmes (captures partagées volontairement) |
| Les chauffeurs ne paient pas | Gratuit utile seul ; loueurs et organisations comme payeurs |
| Le gain mesuré est faible | Critère d'arrêt à +3 % : on arrête avant d'investir dans l'appli Android |
| Refuser fait venir moins d'offres | Mesurer les écarts entre offres pendant la bêta ; la loi interdit de pénaliser un refus ; point mort calculé (environ 30 % d'offres en moins) |
| Un taux de refus élevé (près de 4 offres sur 10) choque le chauffeur | Afficher l'écart en euros (« +3,70 € par rapport à attendre ») ; le chauffeur reste seul juge. En simulation, refuser 43 % des offres ne fait faire que 8 % de courses en moins (1,58 contre 1,72 par heure) : une mauvaise course acceptée bloque le chauffeur |
| Statut de fidélité de la plateforme | Uber Pro (France) compte le taux d'annulation après acceptation (5 % au plus pour monter, au-delà de 8 % retour au statut de base) et 1 point par course, pas les offres refusées (page « Uber Pro : statuts », consultée le 13/10/2026). Règle : décider avant d'accepter, ne jamais annuler ; moins de courses = un peu moins de points |
