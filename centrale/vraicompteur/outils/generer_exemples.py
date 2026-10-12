"""Génère des captures d'offre FICTIVES et génériques (aucune charte de plateforme réelle imitée) pour tester la lecture.
Chaque image a sa vérité terrain dans exemples/verite.json. Usage : python3 outils/generer_exemples.py"""
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ICI = Path(__file__).resolve().parent.parent
SORTIE = ICI / "exemples"
INTER = "/usr/share/fonts/opentype/inter/Inter-{}.otf"
DEJAVU = "/usr/share/fonts/truetype/dejavu/DejaVuSans{}.ttf"


def police(famille, graisse, taille):
    try:
        return ImageFont.truetype((INTER if famille == "inter" else DEJAVU).format(graisse), taille)
    except OSError:
        return ImageFont.truetype(DEJAVU.format("" if graisse in ("Regular", "") else "-Bold"), taille)


EXEMPLES = [
    {"id": "offre-1", "theme": "clair", "famille": "inter", "lignes": ["Nouvelle course", "12,00 €", "Prise en charge : 4 min (1,5 km)", "Trajet : 12 min (5,0 km)", "Vers : Aix-en-Provence, centre"],
     "verite": {"prixNet": 12.0, "approcheMin": 4, "approcheKm": 1.5, "courseMin": 12, "courseKm": 5.0}},
    {"id": "offre-2", "theme": "sombre", "famille": "inter", "lignes": ["Nouvelle course", "9,00 €", "Prise en charge : 14 min (7,0 km)", "Trajet : 9 min (4,0 km)", "Vers : Marseille, Vieux-Port"],
     "verite": {"prixNet": 9.0, "approcheMin": 14, "approcheKm": 7.0, "courseMin": 9, "courseKm": 4.0}},
    {"id": "offre-3", "theme": "clair", "famille": "dejavu", "lignes": ["Course proposée", "38,00 €", "Approche 6 min · 3,0 km", "Course 32 min · 30,0 km", "Vers : Pertuis"],
     "verite": {"prixNet": 38.0, "approcheMin": 6, "approcheKm": 3.0, "courseMin": 32, "courseKm": 30.0}},
    {"id": "offre-4", "theme": "sombre", "famille": "dejavu", "lignes": ["Course proposée", "Prix net : 18,00 €", "Approche 8 min · 4,0 km", "Course 20 min · 12,0 km", "Vers : Vitrolles"],
     "verite": {"prixNet": 18.0, "approcheMin": 8, "approcheKm": 4.0, "courseMin": 20, "courseKm": 12.0}},
    {"id": "offre-5", "theme": "clair", "famille": "inter", "lignes": ["Nouvelle course", "64,50 €", "Prise en charge : 3 min (0,9 km)", "Trajet : 1 h 05 min (62,3 km)", "Vers : Aéroport Marseille Provence"],
     "verite": {"prixNet": 64.5, "approcheMin": 3, "approcheKm": 0.9, "courseMin": 65, "courseKm": 62.3}},
    {"id": "offre-6", "theme": "sombre", "famille": "inter", "flou": True, "lignes": ["Nouvelle course", "7,80 €", "Prise en charge : 11 min (5,6 km)", "Trajet : 7 min (2,4 km)", "Vers : Aix, Jas de Bouffan"],
     "verite": {"prixNet": 7.8, "approcheMin": 11, "approcheKm": 5.6, "courseMin": 7, "courseKm": 2.4}},
]


def dessiner(ex):
    l, h = 720, 520
    fond, carte, texte, doux, accent = (("#f4f5f7", "#ffffff", "#15191f", "#5b6470", "#15191f") if ex["theme"] == "clair"
                                        else ("#0d1015", "#1a1f27", "#f1f3f6", "#a5adb8", "#f1f3f6"))
    im = Image.new("RGB", (l, h), fond)
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([30, 30, l - 30, h - 30], radius=28, fill=carte)
    y = 70
    tailles = [30, 64, 32, 32, 28]
    graisses = ["Regular", "Bold", "Regular", "Regular", "Regular"]
    for i, ligne in enumerate(ex["lignes"]):
        f = police(ex["famille"], graisses[i] if ex["famille"] == "inter" else ("-Bold" if graisses[i] == "Bold" else ""), tailles[i])
        d.text((70, y), ligne, font=f, fill=accent if i == 1 else (doux if i in (0, 4) else texte))
        y += tailles[i] + (34 if i == 1 else 28)
    d.rounded_rectangle([70, h - 120, l - 70, h - 60], radius=30, outline=doux, width=3)
    f = police(ex["famille"], "Bold" if ex["famille"] == "inter" else "-Bold", 26)
    d.text((l // 2 - 60, h - 105), "Accepter", font=f, fill=texte)
    if ex.get("flou"):
        im = im.resize((l // 2, h // 2)).resize((l, h)).filter(ImageFilter.GaussianBlur(0.6))
    return im


# Jeu de contrôle : écrit après la mise au point du lecteur sur EXEMPLES, jamais utilisé pour le régler.
CONTROLE = [
    {"id": "controle-1", "theme": "clair", "famille": "dejavu", "lignes": ["Offre", "Prix : 23,40 €", "Récupération 5 min (2,2 km)", "Trajet 18 min (9,8 km)", "Vers : Gardanne"],
     "verite": {"prixNet": 23.4, "approcheMin": 5, "approcheKm": 2.2, "courseMin": 18, "courseKm": 9.8}},
    {"id": "controle-2", "theme": "sombre", "famille": "inter", "flou": True, "lignes": ["Nouvelle course", "15,60 €", "Prise en charge : 9 min (4,8 km)", "Trajet : 16 min (8,1 km)", "Vers : Les Milles"],
     "verite": {"prixNet": 15.6, "approcheMin": 9, "approcheKm": 4.8, "courseMin": 16, "courseKm": 8.1}},
    {"id": "controle-3", "theme": "clair", "famille": "inter", "lignes": ["Course proposée", "112,00 €", "Approche 2 min · 0,6 km", "Course 1 h 40 min · 141,0 km", "Vers : Nice"],
     "verite": {"prixNet": 112.0, "approcheMin": 2, "approcheKm": 0.6, "courseMin": 100, "courseKm": 141.0}},
    {"id": "controle-4", "theme": "sombre", "famille": "dejavu", "lignes": ["Course proposée", "6,90 €", "Approche 12 min · 6,3 km", "Course 6 min · 2,1 km", "Vers : Plan-de-Cuques"],
     "verite": {"prixNet": 6.9, "approcheMin": 12, "approcheKm": 6.3, "courseMin": 6, "courseKm": 2.1}},
    {"id": "controle-5", "theme": "clair", "famille": "inter", "flou": True, "lignes": ["Nouvelle course", "31,20 €", "Prise en charge : 7 min (3,4 km)", "Trajet : 28 min (24,7 km)", "Vers : Aix TGV"],
     "verite": {"prixNet": 31.2, "approcheMin": 7, "approcheKm": 3.4, "courseMin": 28, "courseKm": 24.7}},
    {"id": "controle-6", "theme": "sombre", "famille": "inter", "lignes": ["Nouvelle course", "10,40 €", "Prise en charge : 6 min (2,9 km)", "Trajet : 10 min (4,6 km)", "Vers : Marseille, Castellane"],
     "verite": {"prixNet": 10.4, "approcheMin": 6, "approcheKm": 2.9, "courseMin": 10, "courseKm": 4.6}},
]

if __name__ == "__main__":
    SORTIE.mkdir(exist_ok=True)
    verite = {}
    controle = {}
    for ex in EXEMPLES + CONTROLE:
        dessiner(ex).save(SORTIE / f"{ex['id']}.png", optimize=True)
        (controle if ex["id"].startswith("controle") else verite)[ex["id"]] = ex["verite"]
    (SORTIE / "controle.json").write_text(json.dumps({"note": "Jeu de contrôle écrit après la mise au point du lecteur, jamais utilisé pour le régler.", "offres": controle}, ensure_ascii=False, indent=1), encoding="utf-8")
    (SORTIE / "verite.json").write_text(json.dumps({"note": "Captures fictives et génériques, générées par outils/generer_exemples.py ; aucune charte réelle imitée.", "offres": verite}, ensure_ascii=False, indent=1), encoding="utf-8")
    print(len(verite), "captures")
