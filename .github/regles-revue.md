# Règles de revue d'Azur Driver

Référentiel lu par l'agent de revue à chaque PR. Alex l'enrichit à chaque faux positif ou oubli constaté : c'est ce fichier qui fait progresser la revue, pas le prompt.

Dépôt allégé : site vitrine statique (`index.html`, `styles.css`, `script.js`), sans backend, sans build, sans tests. La revue porte sur le contenu, le parcours de réservation, les liens, le SEO, l'accessibilité et les secrets.

## Ce que l'agent cherche, par ordre de gravité

| Gravité | Exemples propres à Azur Driver |
|---|---|
| **Bloquant** | Secret ou clé d'API dans `script.js` ou `index.html` (tout ce qui est dans le dépôt est public) ; formulaire `#bookingForm` qui envoie les données ailleurs que vers WhatsApp sans le dire ; message WhatsApp construit sans `encodeURIComponent` dans `buildWhatsappUrl` ; script tiers, pixel ou traqueur ajouté alors que la bannière cookies affirme « aucun traqueur tiers » ; liens `data-whatsapp` ou `#phoneLink` cassés (plus aucun moyen de réserver) |
| **Important** | Validation des 24 h (`CONFIG.minBookingHours`) contournée ou supprimée ; champ du formulaire ajouté sans `label for`, sans `name`, ou absent du message WhatsApp ; `<title>`, `meta description` ou `h1` supprimés, dupliqués ou vidés ; image sans `alt` ou sans `loading="lazy"` ; nouvelle animation qui ignore `prefers-reduced-motion` ; promesse commerciale non tenue (tarif, disponibilité, zone desservie) |
| **Mineur** | Incohérence de zone (Aix-en-Provence, Marseille, longue distance) entre sections ; coquille ou anglicisme évitable ; README non mis à jour alors que `CONFIG` change ; image lourde ajoutée sans compression |

## Ce que l'agent ne commente pas

- Les préférences de style CSS sans conséquence visible.
- Le code non modifié par la PR, sauf si le changement le casse.
- Il n'y a pas de CI : l'agent cite seulement ce qu'il a vérifié lui-même.

## Filtre anti faux positifs

Un constat n'est publié que si l'agent a :
1. relu le code autour du diff (section HTML liée, sélecteur CSS, fonction de `script.js`) ;
2. décrit un scénario concret de défaillance (« un client qui réserve depuis un iPhone arrive sur WhatsApp sans la destination… ») ;
3. vérifié qu'aucun autre élément de la page ne le couvre déjà.

Sinon, le constat est écarté ou reformulé en question.

## Faux positifs connus (à ne plus signaler)

- Numéro de téléphone et lien WhatsApp en clair dans `CONFIG` : coordonnées publiques voulues.
- `localStorage` pour mémoriser le choix cookies : seul stockage du site, voulu.
- Images Unsplash en hotlink : documenté dans le README, remplacement prévu.
