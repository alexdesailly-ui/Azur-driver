"""Contre-vérification indépendante de la barre et de la simulation : réécriture en Python, sans reprendre le code JavaScript.
Les offres sont exportées par le modèle JavaScript (mêmes offres), tout le reste est recalculé ici :
net et temps de chaque offre, barre par dichotomie, revenu exact de « tout accepter » et de la barre (théorie du renouvellement),
puis comparaison avec docs/simulation.json. Usage : python3 tests/verifier_simulation.py"""
import json, subprocess, sys
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
SURCOUT = {"centre": (0, 0), "peripherie": (10, 3), "isole": (25, 10)}
COUT_KM, COTIS = 0.15, 21

def offres(dispersion):
    js = f'const S=require("./strategie.js");console.log(JSON.stringify(S.genererOffres(20000,{{...S.MODELE_DEFAUT,dispersion:{dispersion}}},7)))'
    return json.loads(subprocess.run(["node", "-e", js], cwd=RACINE, capture_output=True, text=True, check=True).stdout)

def valeur_temps(o):
    smin, rkm = SURCOUT[o["destination"]]
    km = o["approcheKm"] + o["courseKm"] + rkm
    return o["prixNet"] * (1 - COTIS / 100) - COUT_KM * km, o["approcheMin"] + o["courseMin"] + smin

def barre(vt, intervalle):
    lam = 1 / intervalle
    f = lambda g: lam * sum(max(v - g * t, 0) for v, t in vt) / len(vt) - g
    lo, hi = 0.0, max(v / t for v, t in vt if t > 0)
    for _ in range(80):
        mid = (lo + hi) / 2
        lo, hi = (mid, hi) if f(mid) > 0 else (lo, mid)
    return (lo + hi) / 2

def taux_exact(vt, intervalle, accepter):
    # Renouvellement : chaque offre vue coûte en moyenne `intervalle` minutes d'attente ; une offre prise ajoute v et t.
    n = len(vt); pris = [(v, t) for v, t in vt if accepter(v, t)]
    gain = sum(v for v, _ in pris) / n; temps = intervalle + sum(t for _, t in pris) / n
    return gain / temps * 60

sim = json.loads((RACINE / "docs" / "simulation.json").read_text(encoding="utf-8"))
ecarts = 0
for d in (0.15, 0.3, 0.45):
    vt = [valeur_temps(o) for o in offres(d)]
    for iv in (4, 5.8, 7.5, 10, 15):
        g = barre(vt, iv)
        ligne = next(l for l in sim["resultats"] if l["dispersion"] == d and l["intervalleMin"] == iv)
        tout = taux_exact(vt, iv, lambda v, t: True)
        b = taux_exact(vt, iv, lambda v, t: v > 0 and v / t >= g)
        controles = [("barre", g * 60, ligne["barreHeure"], 0.01), ("tout accepter", tout, ligne["tout"]["parHeure"], 0.15),
                     ("politique de la barre", b, ligne["barre"]["parHeure"], 0.15), ("barre = revenu de sa politique", g * 60, b, 0.01)]
        for nom, a, attendu, tol in controles:
            ok = abs(a - attendu) <= tol
            ecarts += not ok
            if not ok or iv == 7.5:
                print(("ok   " if ok else "ÉCART"), f"écart {d} / {iv} min : {nom} recalculé {a:.2f}, attendu {attendu:.2f}")
print(f"{ecarts} écart(s) sur {3 * 5 * 4} contrôles")
sys.exit(1 if ecarts else 0)
