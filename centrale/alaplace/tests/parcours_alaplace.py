"""Parcours Playwright de la page « À la place ». Usage : python3 tests/parcours_alaplace.py <url> <dossier_captures>"""
import asyncio, sys
from playwright.async_api import async_playwright

URL, CAPT = sys.argv[1], sys.argv[2]
ok, ko = [], []
def v(c, q): (ok if c else ko).append(q)

async def parcours(b, w, h, theme, nom):
    ctx = await b.new_context(viewport={"width": w, "height": h}, color_scheme=theme, locale="fr-FR")
    page = await ctx.new_page(); err = []
    page.on("pageerror", lambda e: err.append(str(e)))
    await page.goto(URL); await page.wait_for_timeout(500)
    heure = await page.inner_text("#k-heure")
    v(heure.replace(" ", " ").startswith("85 €/h") or heure.startswith("85"), f"{nom} trajet ski : 85 €/h ({heure})")
    v(await page.locator("#plan .siege.vendu").count() == 6, f"{nom} 6 sièges vendus affichés")
    await page.select_option("#k-trajet", "nuit")
    v(await page.locator("#plan .siege").count() == 4, f"{nom} berline : 4 sièges")
    h2 = await page.inner_text("#k-heure")
    v(h2.startswith("68"), f"{nom} trajet nuit : 68 €/h ({h2})")
    await page.fill("#k-prix", "30")
    v(await page.input_value("#k-trajet") == "perso", f"{nom} modifier le prix sort du trajet type")
    await page.screenshot(path=f"{CAPT}/{nom}-calcul.png", full_page=False)
    gt = await page.inner_text("#t-gtfs")
    v("24:30:00" in gt, f"{nom} fenêtre après minuit écrite 24:30:00")
    v("arrival_time" not in gt and "departure_time" not in gt, f"{nom} aucun horaire fixe dans l'extrait")
    v(await page.locator("#t-controle li.ko").count() == 0, f"{nom} contrôle : aucune erreur sur l'exemple")
    await page.fill("#t-seuil", "9")
    v(await page.locator("#t-controle li.ko").count() == 1, f"{nom} contrôle : seuil 9 sur 8 places refusé")
    await page.fill("#t-seuil", "5")
    await page.locator("#ouvrir").scroll_into_view_if_needed()
    await page.screenshot(path=f"{CAPT}/{nom}-page.png", full_page=True)
    lw = await page.evaluate("document.documentElement.scrollWidth")
    v(lw <= w, f"{nom} pas de défilement horizontal ({lw}px)")
    v(not err, f"{nom} aucune erreur JavaScript {err[:2]}")
    await ctx.close()

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        await parcours(b, 1366, 900, "light", "bureau-clair")
        await parcours(b, 390, 844, "dark", "mobile-sombre")
        await b.close()
    for q in ok: print("ok  ", q)
    for q in ko: print("ÉCHEC", q)
    print(f"{len(ok)} vérifications réussies, {len(ko)} échecs")
    sys.exit(1 if ko else 0)
asyncio.run(main())
