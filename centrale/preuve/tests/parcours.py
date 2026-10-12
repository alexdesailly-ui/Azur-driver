"""Parcours de bout en bout de la démonstration (Playwright). Usage : python3 tests/parcours.py <url_de_preuve/index.html> <dossier_captures>
Vérifie le parcours conciergerie -> voyageur -> samedi, les trois retards, la lecture IA, l'absence d'erreur JS et de défilement horizontal."""
import asyncio, sys
from playwright.async_api import async_playwright

URL, CAPT = sys.argv[1], sys.argv[2]
echecs, ok = [], []


def verifier(cond, quoi):
    (ok if cond else echecs).append(quoi)


async def texte(page, sel):
    return await page.locator(sel).inner_text()


async def parcours(navigateur, largeur, hauteur, theme, prefixe):
    ctx = await navigateur.new_context(viewport={"width": largeur, "height": hauteur}, color_scheme=theme, locale="fr-FR")
    page = await ctx.new_page()
    erreurs = []
    page.on("pageerror", lambda e: erreurs.append(str(e)))
    await page.goto(URL)
    await page.wait_for_timeout(400)
    verifier("Risoul" in await texte(page, "#m-texte"), f"{prefixe} message conciergerie mentionne la station")
    verifier("DEMO-RISOUL-1912" in await texte(page, "#m-lien"), f"{prefixe} lien porte le code de la conciergerie")
    await page.screenshot(path=f"{CAPT}/{prefixe}-1-conciergerie.png", full_page=True)

    await page.click("#ouvrir-lien")
    verifier(await page.locator("#vue-2").is_visible(), f"{prefixe} le lien ouvre la vue voyageur")
    verifier("DEMO-RISOUL-1912" in await texte(page, "#source"), f"{prefixe} la source de la réservation est suivie")
    await page.click("#form-voyageur button[type=submit]")
    res = await texte(page, "#resultat")
    verifier("fait passer ce van à 6 places payées" in res, f"{prefixe} la réservation fait franchir le seuil")
    verifier("220 €" in res, f"{prefixe} prix 4 x 55 €")
    await page.screenshot(path=f"{CAPT}/{prefixe}-2-voyageur.png", full_page=True)

    await page.click("text=Voir le samedi complet")
    verifier(await page.locator("#vue-3").is_visible(), f"{prefixe} vue samedi visible")
    verifier(await page.locator("#t-corps .depart").count() == 6, f"{prefixe} 6 vans au tableau à J-10")
    verifier("interventions humaines : 0" in await texte(page, "#t-compteur"), f"{prefixe} compteur d'interventions à 0")
    await page.click("[data-phase=j7]")
    verifier("Sans acompte versé" in await texte(page, "#envois"), f"{prefixe} J-7 : place sans acompte libérée")
    verifier(await page.locator("#t-corps .etat.annule").count() == 0, f"{prefixe} J-7 : aucun van annulé grâce à la réservation")
    await page.click("[data-phase=j]")
    verifier(await page.locator("#bloc-retards").is_visible(), f"{prefixe} jour J : retards proposés")
    await page.click("text=Le TGV de 13:10 arrive avec 2 h de retard")
    verifier("passe dans le van de 16:00" in await texte(page, "#envois"), f"{prefixe} retard 1 : voyageur replacé dans le van de 16:00")
    verifier("les voyageurs à l'heure ne bougent pas" in await texte(page, "#journal"), f"{prefixe} retard 1 : journal")
    await page.wait_for_timeout(900)   # laisser finir l'animation des heures qui changent
    await page.screenshot(path=f"{CAPT}/{prefixe}-3-samedi-retard.png", full_page=True)
    await page.click("text=Le vol de 16:05 arrive avec 20 min de retard")
    verifier("part comme prévu à 16:50" in await texte(page, "#envois"), f"{prefixe} retard 2 : absorbé")
    await page.click("text=Le TGV de 13:25 arrive avec 1 h 40 de retard")
    verifier("article 5" in await texte(page, "#envois"), f"{prefixe} retard 3 : message article 5")
    verifier("interventions humaines : 0" in await texte(page, "#t-compteur"), f"{prefixe} retard 3 : toujours 0 intervention")
    await page.wait_for_timeout(900)
    await page.screenshot(path=f"{CAPT}/{prefixe}-4-samedi-article5.png", full_page=True)

    await page.click("#onglet-2")
    await page.click("text=Ou laisser le modèle local lire un message de voyageur")
    await page.select_option("#v-message", index=4)   # m17 : heure absente
    verifier(await page.locator("#ch-heure.a-redemander").count() == 1, f"{prefixe} IA : heure absente marquée à redemander")
    verifier(await page.locator("#mesures tbody tr").count() == 5, f"{prefixe} tableau des mesures : 5 essais")

    # Clavier : flèches entre les onglets
    await page.focus("#onglet-2")
    await page.keyboard.press("ArrowRight")
    verifier(await page.locator("#vue-3").is_visible(), f"{prefixe} clavier : flèche droite change d'onglet")

    largeur_doc = await page.evaluate("document.documentElement.scrollWidth")
    verifier(largeur_doc <= largeur, f"{prefixe} pas de défilement horizontal ({largeur_doc}px)")
    verifier(not erreurs, f"{prefixe} aucune erreur JavaScript {erreurs[:2]}")
    await ctx.close()


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        await parcours(b, 1366, 900, "light", "bureau-clair")
        await parcours(b, 390, 844, "dark", "mobile-sombre")
        await b.close()
    for q in ok:
        print("ok  ", q)
    for q in echecs:
        print("ÉCHEC", q)
    print(f"{len(ok)} vérifications réussies, {len(echecs)} échecs")
    sys.exit(1 if echecs else 0)

asyncio.run(main())
