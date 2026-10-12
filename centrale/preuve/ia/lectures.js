/* Mesures et lectures enregistrées du modèle local (Qwen3-4B, OpenVINO, ordinateur portable), 12/10/2026. Généré par ia/generer_lectures.py. */
window.LecturesIA = {
 "mesures": [
  {
   "essai": "Consigne v1, 20 messages (1er passage)",
   "fichier": "ia/resultats/v1_jeu20_passage1.json",
   "champs": "89/100",
   "precision": 0.89,
   "entiers": "11/20",
   "inventions": 2,
   "fauxAcceptes": 8,
   "latence": [
    4.7,
    11.0
   ]
  },
  {
   "essai": "Consigne v1, 20 messages (2e passage)",
   "fichier": "ia/resultats/v1_jeu20_passage2.json",
   "champs": "87/100",
   "precision": 0.87,
   "entiers": "10/20",
   "inventions": 2,
   "fauxAcceptes": 9,
   "latence": [
    4.65,
    4.9
   ]
  },
  {
   "essai": "Consigne v1, 12 messages de contrôle",
   "fichier": "ia/resultats/v1_controle12.json",
   "champs": "52/60",
   "precision": 0.867,
   "entiers": "5/12",
   "inventions": 1,
   "fauxAcceptes": 6,
   "latence": [
    4.55,
    5.4
   ]
  },
  {
   "essai": "Consigne v2, 20 messages",
   "fichier": "ia/resultats/v2_jeu20.json",
   "champs": "98/100",
   "precision": 0.98,
   "entiers": "18/20",
   "inventions": 0,
   "fauxAcceptes": 1,
   "latence": [
    5.65,
    6.2
   ]
  },
  {
   "essai": "Consigne v2, 12 messages de contrôle",
   "fichier": "ia/resultats/v2_controle12.json",
   "champs": "57/60",
   "precision": 0.95,
   "entiers": "9/12",
   "inventions": 1,
   "fauxAcceptes": 1,
   "latence": [
    5.5,
    6.9
   ]
  }
 ],
 "exemples": [
  {
   "id": "m01",
   "texte": "Bonjour, nous arrivons samedi en TGV à Aix-en-Provence à 14h10, nous sommes 4 et nous louons à Vars. Merci !",
   "lu": {
    "voyageur": "arrive",
    "mode": "avion",
    "lieu": "Aix-en-Provence",
    "station": "Vars",
    "heure": "14:10",
    "personnes": 4
   },
   "secondes": 5.8,
   "retenu": {
    "sens": "montee",
    "origine": "aix",
    "station": "vars",
    "heure": "14:10",
    "places": 4
   },
   "attendu": {
    "sens": "montee",
    "origine": "aix",
    "station": "vars",
    "heure": "14:10",
    "places": 4
   },
   "aRedemander": [],
   "fauxAcceptes": []
  },
  {
   "id": "m15",
   "texte": "Mon fils et moi arrivons en train à Aix TGV à 16h12, location à Vars.",
   "lu": {
    "voyageur": "arrive",
    "mode": "train",
    "lieu": "Aix TGV",
    "station": "Vars",
    "heure": "16:12",
    "personnes": 2
   },
   "secondes": 5.5,
   "retenu": {
    "sens": "montee",
    "origine": "aix",
    "station": "vars",
    "heure": "16:12",
    "places": 2
   },
   "attendu": {
    "sens": "montee",
    "origine": "aix",
    "station": "vars",
    "heure": "16:12",
    "places": 2
   },
   "aRedemander": [],
   "fauxAcceptes": []
  },
  {
   "id": "c10",
   "texte": "Mon mari, mes deux filles et moi arrivons par le vol de 16h20 à Marseille Provence, chalet à Risoul.",
   "lu": {
    "voyageur": "arrive",
    "mode": "avion",
    "lieu": "Marseille Provence",
    "station": "Risoul",
    "heure": "16:20",
    "personnes": 4
   },
   "secondes": 5.7,
   "retenu": {
    "sens": "montee",
    "origine": "mrs",
    "station": "risoul",
    "heure": "16:20",
    "places": 4
   },
   "attendu": {
    "sens": "montee",
    "origine": "mrs",
    "station": "risoul",
    "heure": "16:20",
    "places": 4
   },
   "aRedemander": [],
   "fauxAcceptes": []
  },
  {
   "id": "m17",
   "texte": "Bonjour, on arrive samedi à Aix TGV, 3 personnes, pour Risoul. Je vous confirme l'heure plus tard.",
   "lu": {
    "voyageur": "arrive",
    "mode": "train",
    "lieu": "Aix TGV",
    "station": "Risoul",
    "heure": null,
    "personnes": 3
   },
   "secondes": 5.2,
   "retenu": {
    "sens": "montee",
    "origine": "aix",
    "station": "risoul",
    "heure": null,
    "places": 3
   },
   "attendu": {
    "sens": "montee",
    "origine": "aix",
    "station": "risoul",
    "heure": null,
    "places": 3
   },
   "aRedemander": [
    "heure"
   ],
   "fauxAcceptes": []
  },
  {
   "id": "m07",
   "texte": "Deux adultes et deux enfants, on arrive à Aix TGV vers 2h de l'après-midi, on va à Vars",
   "lu": {
    "voyageur": "arrive",
    "mode": "train",
    "lieu": "Aix TGV",
    "station": "Vars",
    "heure": "2h",
    "personnes": 4
   },
   "secondes": 5.2,
   "retenu": {
    "sens": "montee",
    "origine": "aix",
    "station": "vars",
    "heure": "invalide",
    "places": 4
   },
   "attendu": {
    "sens": "montee",
    "origine": "aix",
    "station": "vars",
    "heure": "14:00",
    "places": 4
   },
   "aRedemander": [
    "heure"
   ],
   "fauxAcceptes": []
  },
  {
   "id": "m10",
   "texte": "Bonjour, nous arrivons à la gare de Nice à 13h, 2 personnes, pour Isola 2000.",
   "lu": {
    "voyageur": "arrive",
    "mode": "train",
    "lieu": "gare de Nice",
    "station": "Isola 2000",
    "heure": "13:00",
    "personnes": 2
   },
   "secondes": 6.0,
   "retenu": {
    "sens": "montee",
    "origine": null,
    "station": null,
    "heure": "13:00",
    "places": 2
   },
   "attendu": {
    "sens": "montee",
    "origine": null,
    "station": null,
    "heure": "13:00",
    "places": 2
   },
   "aRedemander": [
    "origine",
    "station"
   ],
   "fauxAcceptes": []
  },
  {
   "id": "m13",
   "texte": "Bonsoir, notre vol pour Paris décolle de Marseille Provence à 19h05, nous sommes 4, logement à Risoul.",
   "lu": {
    "voyageur": "arrive",
    "mode": "avion",
    "lieu": "Marseille Provence",
    "station": "Risoul",
    "heure": "19:05",
    "personnes": 4
   },
   "secondes": 5.8,
   "retenu": {
    "sens": "montee",
    "origine": "mrs",
    "station": "risoul",
    "heure": "19:05",
    "places": 4
   },
   "attendu": {
    "sens": "descente",
    "origine": "mrs",
    "station": "risoul",
    "heure": "19:05",
    "places": 4
   },
   "aRedemander": [],
   "fauxAcceptes": [
    "sens"
   ]
  }
 ],
 "note": "Le jeu de 20 messages a servi à corriger la consigne (v1 puis v2) ; les 12 messages de contrôle ont été écrits avant de voir les résultats de la v2. Un champ « à redemander » n'est pas une erreur : le voyageur reçoit la question. Une erreur acceptée par le code est le vrai risque : c'est pourquoi le voyageur confirme toujours le récapitulatif avant de payer."
};
