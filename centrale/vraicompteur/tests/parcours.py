"""Parcours Playwright de Vrai Compteur : lecture réelle des 6 captures d'exemple dans le navigateur (OCR sur l'appareil),
précision champ par champ contre exemples/verite.json, temps de lecture, aucun appel réseau hors de la page pendant la lecture.
Usage : python3 tests/parcours.py <url de index.html> <dossier de captures> [--resultats chemin.json]"""
import asyncio, json, statistics, sys
from pathlib import Path
from urllib.parse import urlparse
from playwright.async_api import async_playwright

URL, CAPT = sys.argv[1], sys.argv[2]
SORTIE = sys.argv[sys.argv.index("--resultats") + 1] if "--resultats" in sys.argv else None
VERITE = json.loads((Path(__file__).resolve().parent.parent / "exemples" / "verite.json").read_text(encoding="utf-8"))
VERDICTS = {"offre-1": "vert", "offre-2": "rouge", "offre-3": "vert", "offre-4": "orange", "offre-5": "vert", "offre-6": "rouge"}
ok, ko, mesures = [], [], {}
def v(c, q): (ok if c else ko).append(q)


async def parcours(b, w, h, theme, nom, lire_tout):
    ctx = await b.new_context(viewport={"width": w, "height": h}, color_scheme=theme, locale="fr-FR")
    page = await ctx.new_page(); err, externes = [], []
    hote = urlparse(URL).netloc
    page.on("pageerror", lambda e: err.append(str(e)))
    page.on("request", lambda r: externes.append(r.url) if urlparse(r.url).netloc not in (hote, "") and not r.url.startswith(("data:", "blob:")) and "fonts.g" not in r.url else None)
    await page.goto(URL); await page.wait_for_timeout(500)
    v((await page.inner_text("#feu")).strip() in ("incomplet", "en attente"), f"{nom} compteur vide au départ")
    ids = list(VERITE["offres"]) if lire_tout else ["offre-2"]
    justes = total = 0
    for oid in ids:
        avant = len(externes)
        await page.click(f"#vignettes button[data-id='{oid}']")
        await page.wait_for_function("(n) => window.mesuresLecture.length >= n", arg=ids.index(oid) + 1, timeout=120000)
        m = await page.evaluate("window.mesuresLecture[window.mesuresLecture.length-1]")
        mesures.setdefault(nom, []).append({"id": oid, "ms": round(m["ms"]), "champs": m["champs"], "texte": m["texte"]})
        verite = VERITE["offres"][oid]
        for k, attendu in verite.items():
            lu = await page.input_value(f"#{k}")
            total += 1; justes += (lu != "" and abs(float(lu) - attendu) < 1e-6)
        feu = await page.get_attribute("#feu", "class")
        v(VERDICTS[oid] in feu, f"{nom} {oid} : verdict {VERDICTS[oid]} ({feu})")
        v(len(externes) == avant, f"{nom} {oid} : aucun appel réseau hors de la page pendant la lecture")
        if oid in ("offre-2", "offre-4"):
            await page.locator(".compteur").screenshot(path=f"{CAPT}/{nom}-{oid}.png")
    v(justes / total >= 0.9, f"{nom} précision de lecture {justes}/{total} champs (seuil 90 %)")
    temps = [x["ms"] for x in mesures[nom]]
    v(statistics.median(temps) < 3000, f"{nom} temps de lecture médian {statistics.median(temps):.0f} ms (seuil 3 000 ms)")
    # Saisie manuelle et semaine
    if lire_tout:
        v(any("virgule" in t for t in [await page.inner_text("#raisons")]), f"{nom} offre-6 : la virgule perdue est signalée")
    await page.click("#o-saisie")
    for k, val in {"prixNet": "12", "approcheMin": "4", "approcheKm": "1.5", "courseMin": "12", "courseKm": "5"}.items():
        await page.fill(f"#{k}", val)
    await page.select_option("#destination", "centre")
    v("vert" in (await page.get_attribute("#feu", "class")), f"{nom} la saisie recalcule le verdict (cas A : vert)")
    v((await page.inner_text("#s-net")).startswith("7"), f"{nom} semaine : 7 €/h net sur l'exemple")
    await page.screenshot(path=f"{CAPT}/{nom}-page.png", full_page=True)
    largeur = await page.evaluate("document.documentElement.scrollWidth")
    v(largeur <= w, f"{nom} pas de défilement horizontal ({largeur}px)")
    v(not err, f"{nom} aucune erreur JavaScript {err[:2]}")
    await ctx.close()


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        await parcours(b, 1366, 900, "dark", "bureau-sombre", True)
        await parcours(b, 390, 844, "light", "mobile-clair", True)
        await b.close()
    for q in ok: print("ok  ", q)
    for q in ko: print("ÉCHEC", q)
    print(f"{len(ok)} vérifications réussies, {len(ko)} échecs")
    if SORTIE:
        Path(SORTIE).write_text(json.dumps({"mesures": mesures, "reussies": ok, "echecs": ko}, ensure_ascii=False, indent=1), encoding="utf-8")
    sys.exit(1 if ko else 0)

asyncio.run(main())
