# Azur Driver

Site vitrine et de réservation pour un service VTC haut de gamme basé à Aix-en-Provence,
opérant dans le bassin Aix–Marseille (courses privées et trajets longue distance).

## Caractéristiques

- Design sombre & or, typographies *Cormorant Garamond* + *Inter*, animations fluides
- Sections : héro, services, galerie, présentation générique du véhicule, formulaire de réservation, contact
- Réservation en ligne validée côté client (minimum 24 h à l'avance)
- Soumission du formulaire via **WhatsApp** (message pré-rempli) — aucun backend nécessaire
- Bouton WhatsApp flottant et liens d'appel direct
- Responsive (mobile, tablette, desktop), accessible (aria, reduced-motion)

## Images

Les visuels (galerie + photo véhicule) utilisent par défaut des hotlinks Unsplash
(`https://images.unsplash.com/photo-XXXX`). Pour les remplacer par vos propres
photos :

1. Placer les fichiers dans `images/` (créer le dossier si besoin)
2. Remplacer dans `index.html` les `src="https://images.unsplash.com/..."`
   par `src="images/votre-photo.jpg"`
3. Conserver l'attribut `loading="lazy"` pour les performances

## Personnalisation

Dans `script.js`, modifier l'objet `CONFIG` :

```js
const CONFIG = {
  whatsappNumber: '33600000000', // votre numéro au format international, sans + ni espaces
  phoneNumber: '+33 6 00 00 00 00',
  minBookingHours: 24,
};
```

## Déploiement

Site 100 % statique. Hébergement possible sur :

- GitHub Pages
- Netlify (drag & drop du dossier)
- Vercel
- Tout serveur web standard

## Aperçu local

```sh
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```
