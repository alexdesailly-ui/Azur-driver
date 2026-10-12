"""Lecture du jeu de contrôle (jamais utilisé pour régler le lecteur) par le chemin réel « Choisir une capture d'écran ».
Usage : python3 tests/controle.py <url de index.html> [--resultats chemin.json]"""
import asyncio, json, statistics, sys
from pathlib import Path
from playwright.async_api import async_playwright

URL = sys.argv[1]
SORTIE = sys.argv[sys.argv.index("--resultats") + 1] if "--resultats" in sys.argv else None
ICI = Path(__file__).resolve().parent.parent
CONTROLE = json.loads((ICI / "exemples" / "controle.json").read_text(encoding="utf-8"))["offres"]

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); page = await (await b.new_context(viewport={"width": 390, "height": 844}, locale="fr-FR")).new_page()
        await page.goto(URL); await page.wait_for_timeout(400)
        lignes, justes, total = [], 0, 0
        for i, (oid, verite) in enumerate(CONTROLE.items()):
            await page.set_input_files("#capture", str(ICI / "exemples" / f"{oid}.png"))
            await page.wait_for_function("(n) => window.mesuresLecture.length >= n", arg=i + 1, timeout=120000)
            m = await page.evaluate("window.mesuresLecture[window.mesuresLecture.length-1]")
            ok_champs = {}
            for k, attendu in verite.items():
                lu = await page.input_value(f"#{k}")
                bon = lu != "" and abs(float(lu) - attendu) < 1e-6
                ok_champs[k] = {"attendu": attendu, "lu": lu, "juste": bon}
                total += 1; justes += bon
            lignes.append({"id": oid, "ms": round(m["ms"]), "champs": ok_champs, "texte": m["texte"]})
        await b.close()
    med = statistics.median(x["ms"] for x in lignes)
    print(f"contrôle : {justes}/{total} champs justes ({100*justes/total:.0f} %), lecture médiane {med:.0f} ms")
    for l in lignes:
        faux = {k: (c["lu"], c["attendu"]) for k, c in l["champs"].items() if not c["juste"]}
        if faux: print(" ", l["id"], faux, "|", l["texte"].replace("\n", " / ")[:140])
    if SORTIE:
        Path(SORTIE).write_text(json.dumps({"justes": justes, "total": total, "mediane_ms": med, "detail": lignes}, ensure_ascii=False, indent=1), encoding="utf-8")

asyncio.run(main())
