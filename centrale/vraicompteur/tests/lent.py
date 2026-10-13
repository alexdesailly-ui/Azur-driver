"""Approximation d'un téléphone d'entrée de gamme : processeur ralenti 4 et 6 fois (Chrome DevTools), écran de téléphone.
Mesure la lecture des 6 captures d'exemple, la simulation de la page et la réaction au réglage de fréquence.
Ce n'est PAS une mesure sur un vrai téléphone : à refaire sur un appareil réel.
Attention : le ralentissement de Chrome s'applique à la page, pas au travailleur qui fait la lecture des captures ;
les temps de lecture sous ralenti ne sont donc PAS valables (ils sont gardés pour le montrer). Valables : simulation et réglage.
Usage : python3 tests/lent.py <url de index.html> [--resultats chemin.json]"""
import asyncio, json, statistics, sys
from pathlib import Path
from playwright.async_api import async_playwright

URL = sys.argv[1]
SORTIE = sys.argv[sys.argv.index("--resultats") + 1] if "--resultats" in sys.argv else None
IDS = ["offre-1", "offre-2", "offre-3", "offre-4", "offre-5", "offre-6"]


async def mesurer(b, ralenti):
    ctx = await b.new_context(viewport={"width": 390, "height": 844}, locale="fr-FR", is_mobile=True, has_touch=True)
    page = await ctx.new_page()
    cdp = await ctx.new_cdp_session(page)
    await cdp.send("Emulation.setCPUThrottlingRate", {"rate": ralenti})
    await page.goto(URL)
    await page.wait_for_function("document.getElementById('sim-note').textContent.length > 0", timeout=120000)
    sim = await page.inner_text("#sim-note")
    ms_sim = int("".join(c for c in sim.split(" en ")[-1] if c.isdigit()))
    lectures = []
    for i, oid in enumerate(IDS):
        await page.click(f"#vignettes button[data-id='{oid}']")
        await page.wait_for_function("(n) => window.mesuresLecture.length >= n", arg=i + 1, timeout=180000)
        m = await page.evaluate("window.mesuresLecture[window.mesuresLecture.length-1]")
        lectures.append(round(m["ms"]))
    reaction = await page.evaluate("""() => { const t0 = performance.now(); const e = document.getElementById('intervalle');
        e.value = 12; e.dispatchEvent(new Event('input', { bubbles: true })); return Math.round(performance.now() - t0); }""")
    await page.wait_for_function("(a) => document.getElementById('sim-note').textContent !== a", arg=sim, timeout=60000)
    sim2 = await page.inner_text("#sim-note")
    ms_resim = int("".join(c for c in sim2.split(" en ")[-1] if c.isdigit()))
    await ctx.close()
    return {"resimulation_apres_reglage_ms": ms_resim, "ralenti": ralenti, "lecture_ms": lectures, "lecture_mediane_ms": statistics.median(lectures),
            "premiere_lecture_ms": lectures[0], "simulation_page_ms": ms_sim, "reaction_reglage_ms": reaction}


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        res = [await mesurer(b, r) for r in (1, 4, 6)]
        await b.close()
    for r in res:
        print(f"ralenti ×{r['ralenti']} : lecture médiane {r['lecture_mediane_ms']:.0f} ms (6 captures ; non valable sous ralenti), simulation au chargement {r['simulation_page_ms']} ms, nouvelle simulation après réglage {r['resimulation_apres_reglage_ms']} ms, réglage {r['reaction_reglage_ms']} ms")
    if SORTIE:
        Path(SORTIE).write_text(json.dumps({"note": __doc__.split("Usage")[0].strip(), "mesures": res}, ensure_ascii=False, indent=1), encoding="utf-8")

asyncio.run(main())
