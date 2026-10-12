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
- Ce qui manque : un calcul **à l'heure**, frais, cotisations, approche, attente et retour à vide compris, sur toutes les plateformes, au moment de décider.

## 3. Ce que fait Vrai Compteur
| Fonction | Gratuit | Copilote (9,90 €/mois, prix de bêta) |
|---|---|---|
| Ta semaine à l'euro près (revenu net réel à l'heure, charges fixes comprises) | oui | oui |
| Verdict sur une offre saisie ou sur une capture d'écran (lue sur le téléphone) | oui | oui |
| Repères des accords de la profession (9 €, 1 €/km, 30 €/h d'activité) | oui | oui |
| Lecture de l'offre à l'écran au moment où elle arrive (Android) | — | oui |
| Attentes après dépose par zone et par heure, calibrées par les chauffeurs | — | oui |
Le copilote **n'accepte et ne refuse jamais** : il calcule et affiche. C'est le chauffeur qui appuie.

## 4. Pourquoi les chauffeurs viendraient (les 6 tests d'Alex)
| Test | Réponse |
|---|---|
| Pourquoi un client vient vers moi | Le client est le chauffeur : savoir en 2 secondes ce qu'une offre lui laisse vraiment |
| Ce qu'il tape dans Google | « rentabilité course VTC », « revenu réel chauffeur Uber », « calcul taux horaire VTC » : aujourd'hui des pages de comptables, pas d'outil |
| Sujet télé | Revenu horaire réel en baisse (ARPE), droit de refus méconnu, bras de fer avec les plateformes : aux États-Unis, Uber et Lyft menacent de désactiver les utilisateurs d'applis équivalentes ; au Brésil, Uber a perdu contre l'une d'elles (The Hustle, 28/07/2025) |
| Les devs forkent | Lecture et calcul sur l'appareil, code ouvert ; ce qui ne se copie pas : les lecteurs d'offres tenus à jour pour chaque plateforme française et les attentes agrégées par zone, apportées par les chauffeurs |
| Les chauffeurs coupent les mauvaises courses | Refuser ce qui fait perdre de l'argent est un droit ; les applis américaines revendiquent jusqu'à +30 % (à mesurer en France pendant la bêta) |
| Légende | Touche les 71 000 chauffeurs, pas une poignée ; « il m'a appris à dire non » |

## 5. Conquête : 0 € de publicité
| Canal | Pourquoi | Premier geste |
|---|---|---|
| Groupes Facebook et WhatsApp de chauffeurs | Alex est chauffeur : il parle de l'intérieur | Publication du compteur de la semaine gratuit, avec son propre chiffre |
| Organisations représentatives (AVF, CFTC, UNSA, FO, Union-Indépendants, Union des VTC Sud…) | Elles ont signé les accords : l'outil montre s'ils sont respectés | Démonstration, puis diffusion à leurs adhérents |
| Loueurs de véhicules VTC | Un chauffeur qui gagne plus paie son loyer : le copilote offert réduit les impayés | Offre « copilote inclus » pour leurs chauffeurs |
| Centres de formation VTC | Les nouveaux chauffeurs n'ont aucun repère de rentabilité | Module de 30 minutes avec l'outil |
| Créateurs de vidéos VTC | Contenu tout trouvé : « j'ai calculé ma vraie heure » | Accès bêta |
| Presse régionale puis nationale | Les chiffres de l'ARPE et le droit de refus | Dossier de presse avec des mesures de la bêta, pas avant |

## 6. Calendrier
| Quand | Quoi | Temps d'Alex |
|---|---|---|
| Semaines 1-2 | Captures réelles de ses propres offres pour calibrer le lecteur ; publication du compteur gratuit dans 3 groupes ; liste d'attente | 2 h/sem |
| Semaines 3-6 | Bêta de 30 chauffeurs : compteur de la semaine avant / après, saisie ou capture des offres | 2 h/sem |
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
