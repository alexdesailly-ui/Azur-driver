# Azur Driver — consignes pour les agents

Lu à chaque exécution par les agents (revue de PR, correctifs `@claude`). Rester court.

## Le produit

Site vitrine et de réservation d'un service VTC haut de gamme (Aix-en-Provence, Marseille, longue distance). Site 100 % statique : `index.html`, `styles.css`, `script.js` ; la réservation part en message WhatsApp pré-rempli, aucune donnée n'est stockée.

## Commandes

| But | Commande |
|---|---|
| Aperçu local | `python3 -m http.server 8000` |
| Syntaxe du JavaScript | `node --check script.js` |
| Vérification avant de pousser | relire son diff : aucun lint, test ni build dans ce dépôt |

## Règles non négociables

1. **Aucun backend, aucune collecte.** Le formulaire `#bookingForm` ne fait que construire un message WhatsApp ; ne jamais l'envoyer à un service tiers ni stocker les données saisies.
2. **Aucun secret dans le dépôt.** Tout fichier est servi publiquement. Le numéro et le lien WhatsApp de `CONFIG` sont publics et voulus.
3. **Aucun traqueur.** La bannière cookies promet « aucun cookie publicitaire, aucun traqueur tiers » : pas d'analytics ni de pixel sans mise à jour du texte et du consentement.
4. **Réservation 24 h à l'avance** : la règle `CONFIG.minBookingHours` reste vérifiée avant l'ouverture de WhatsApp.
5. **Accessibilité** : chaque champ a son `label`, chaque image son `alt`, chaque animation respecte `prefers-reduced-motion`.
6. **SEO** : un seul `h1`, `<title>` et `meta description` renseignés et cohérents avec la zone desservie.

## Conventions

- Interface, messages de commit et documentation en français.
- Pas de dépendance ni de framework : HTML, CSS et JavaScript natifs.
- Ne jamais fusionner sur la branche par défaut, ne jamais déployer, ne jamais toucher à .github/workflows/ sans demande explicite d'Alex.
