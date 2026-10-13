"""Audit d'accessibilité automatique (axe-core, règles WCAG 2.1 A et AA + bonnes pratiques), ordinateur sombre et téléphone clair.
Usage : npm install, puis python3 tests/accessibilite.py <url de index.html>"""
import asyncio, sys
from pathlib import Path
from playwright.async_api import async_playwright

AXE = (Path(__file__).resolve().parent.parent / "node_modules" / "axe-core" / "axe.min.js").read_text(encoding="utf-8")


async def main():
    total = 0
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for theme, largeur in (("dark", 1366), ("light", 390)):
            page = await b.new_page(viewport={"width": largeur, "height": 900}, color_scheme=theme)
            await page.goto(sys.argv[1]); await page.wait_for_timeout(1500)
            await page.add_script_tag(content=AXE)
            r = await page.evaluate("axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] })")
            total += len(r["violations"])
            print(f"{theme} {largeur}px : {len(r['violations'])} violation(s), {len(r['passes'])} règles respectées")
            for v in r["violations"]:
                print("  ", v["id"], v["impact"], [n["target"] for n in v["nodes"][:3]])
            await page.close()
        await b.close()
    sys.exit(1 if total else 0)

asyncio.run(main())
