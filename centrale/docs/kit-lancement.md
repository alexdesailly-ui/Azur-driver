# Kit de lancement — lancement réduit des vacances de Noël 2026

Objectif : 2 conciergeries de Vars ou de Risoul qui diffusent le lien, 1 à 2 chauffeurs partenaires avec un van, et la prévente des samedis 19 et 26 décembre. Azur Driver est le premier partenaire.

## La mise en place, pas à pas
1. **Choisir le nom** parmi les trois propositions (Clé en Van, Dernier Virage, Haut Relais), après une recherche d'antériorité sur data.inpi.fr et la disponibilité du nom de domaine.
2. **Décider qui vend la place** (voir les décisions ouvertes dans le dossier). Si c'est la société d'Alex : déclaration de centrale de réservation et devis de RC professionnelle.
3. **Appeler 5 conciergeries** de Vars et de Risoul (liste : `cibles.csv`), en priorité celles fermées le samedi. Script ci-dessous.
4. **Trouver 1 à 2 chauffeurs** avec un van de 8 places équipé pour l'hiver. Message ci-dessous.
5. **Mettre en ligne la page de réservation** (prototype dans `../preuve/`) avec un moyen de paiement d'acompte.
6. **Envoyer le lien** aux conciergeries partenaires et ouvrir la prévente.
7. **Sept jours avant chaque samedi** : confirmer les vans qui atteignent 6 places sur 8 ; rendre l'acompte ou proposer un transfert privé pour les autres.

## Grille de prix voyageurs
| Trajet | Prix par place, aller simple |
|---|---|
| Aix-en-Provence TGV > Vars ou Risoul | 55 € |
| Aéroport de Marseille > Vars ou Risoul | 55 € |
| Vars ou Risoul > Aix-en-Provence TGV ou aéroport de Marseille | 55 € |

Repères de marché : transfert privé aéroport de Marseille > Risoul, berline 428 € et van 463 € en moyenne observée (montransport.com, octobre 2026).

## Script d'appel aux conciergeries (vouvoiement)
> Bonjour, je suis Alex, chauffeur VTC dans la région d'Aix. Je lance pour cet hiver un transfert en van depuis Aix-en-Provence TGV et l'aéroport de Marseille jusqu'à la porte des locations de Vars et de Risoul, calé sur l'heure de remise des clés, au prix d'une place. Vos voyageurs arrivent-ils souvent sans voiture le samedi ? Je vous propose d'ajouter un lien à votre message d'avant l'arrivée : vous n'avez rien à gérer et vous touchez une commission sur chaque place. Pourrais-je vous envoyer la page de démonstration ?

## Message aux chauffeurs avec un van (vouvoiement, non envoyé)
> Bonjour, je recherche pour les samedis de cet hiver 1 à 2 chauffeurs VTC avec un van de 8 places équipé pour la neige, pour des journées « montée et descente » entre Aix-en-Provence TGV ou l'aéroport de Marseille et Vars ou Risoul. Vous fixez vous-même le prix de votre journée ; elle n'est confirmée que si ce prix est couvert par les places vendues, une semaine à l'avance. Pas d'exclusivité. Seriez-vous intéressé ?

## Message de pré-arrivée à fournir aux conciergeries
> Vous arrivez en train ou en avion ? Un van vous dépose à la porte de votre location, depuis Aix-en-Provence TGV ou l'aéroport de Marseille, à l'heure de la remise des clés : 55 € la place. Réservez ici : [lien].
