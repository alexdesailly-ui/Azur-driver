/* Kit de calibration : mesure la précision du lecteur sur TES vraies captures d'offres, sur ton ordinateur, sans réseau.
   Usage : node outils/calibrer.js <dossier des captures> <tableau de vérité .csv> [--rapport chemin.json] [--texte]
   Tableau (séparateur ; virgule décimale acceptée) : fichier;plateforme;prixNet;approcheMin;approcheKm;courseMin;courseKm;note
   Confidentialité : les captures et le tableau restent sur ta machine (dossier calibration/captures/ et fichiers *.local.*
   ignorés par git). Le rapport ne contient ni le texte lu ni l'image, sauf avec --texte (pour régler le lecteur, à ne pas publier). */
const fs = require("fs");
const path = require("path");
const os = require("os");
const { createWorker } = require("tesseract.js");
const L = require("../lecteur.js");

const CHAMPS = ["prixNet", "approcheMin", "approcheKm", "courseMin", "courseKm"];
const args = process.argv.slice(2);
if (args.length < 2) { console.error("Usage : node outils/calibrer.js <dossier des captures> <verite.csv> [--rapport chemin.json] [--texte]"); process.exit(2); }
const [DOSSIER, CSV] = args;
const RAPPORT = args.includes("--rapport") ? args[args.indexOf("--rapport") + 1] : path.join(__dirname, "..", "calibration", "rapport.local.json");
const AVEC_TEXTE = args.includes("--texte");

function lireCsv(f) {
  const lignes = fs.readFileSync(f, "utf-8").replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim() && !l.startsWith("#"));
  const tetes = lignes[0].split(";").map((x) => x.trim());
  return lignes.slice(1).map((l) => {
    const c = l.split(";"), o = {};
    tetes.forEach((t, i) => { o[t] = (c[i] || "").trim(); });
    CHAMPS.forEach((k) => { o[k] = o[k] === "" ? null : parseFloat(o[k].replace(",", ".")); });
    return o;
  });
}

(async () => {
  const verite = lireCsv(CSV);
  const worker = await createWorker("fra", 1, {
    langPath: path.join(__dirname, "..", "node_modules", "@tesseract.js-data", "fra", "4.0.0_best_int"),
    cachePath: fs.mkdtempSync(path.join(os.tmpdir(), "vc-")), gzip: true, logger: () => {}
  });
  const parChamp = {}, parPlateforme = {}, ecarts = [], details = [], temps = [];
  CHAMPS.forEach((k) => { parChamp[k] = { justes: 0, total: 0 }; });
  for (const v of verite) {
    const image = path.join(DOSSIER, v.fichier);
    if (!fs.existsSync(image)) { ecarts.push({ fichier: v.fichier, erreur: "capture introuvable" }); continue; }
    const t0 = Date.now();
    const { data } = await worker.recognize(image);
    const ms = Date.now() - t0; temps.push(ms);
    const lu = L.lire(data.text);
    const pf = v.plateforme || "non précisée";
    parPlateforme[pf] = parPlateforme[pf] || { justes: 0, total: 0, captures: 0 };
    parPlateforme[pf].captures++;
    const d = { fichier: v.fichier, plateforme: pf, ms, champsLus: lu.champsTrouves, alertes: lu.alertes || [] };
    CHAMPS.forEach((k) => {
      if (v[k] === null || Number.isNaN(v[k])) return;              // champ absent de l'offre réelle : non compté
      const obtenu = lu.offre[k], juste = obtenu !== null && obtenu !== undefined && Math.abs(obtenu - v[k]) < 1e-6;
      parChamp[k].total++; parPlateforme[pf].total++;
      if (juste) { parChamp[k].justes++; parPlateforme[pf].justes++; } else ecarts.push({ fichier: v.fichier, champ: k, attendu: v[k], lu: obtenu === undefined ? null : obtenu });
    });
    if (AVEC_TEXTE) d.texte = data.text;
    details.push(d);
  }
  await worker.terminate();
  const somme = CHAMPS.reduce((a, k) => ({ j: a.j + parChamp[k].justes, t: a.t + parChamp[k].total }), { j: 0, t: 0 });
  temps.sort((a, b) => a - b);
  // Colonne facultative « heure » (HH:MM, heure d'arrivée de l'offre) : si TOUTES les offres d'une séance sont capturées,
  // l'écart entre deux offres consécutives donne la fréquence des offres, donc ta barre. Écarts de plus de 60 min ignorés (pause).
  const minutes = verite.map((v) => /^(\d{1,2})[:h](\d{2})$/.exec(v.heure || "")).filter(Boolean).map((m) => +m[1] * 60 + +m[2]).sort((a, b) => a - b);
  const intervalles = []; for (let i = 1; i < minutes.length; i++) { const d = minutes[i] - minutes[i - 1]; if (d > 0 && d <= 60) intervalles.push(d); }
  const frequence = intervalles.length >= 5 ? { offres: minutes.length, intervalleMoyenMin: Math.round(intervalles.reduce((a, b) => a + b, 0) / intervalles.length * 10) / 10,
    note: "valable seulement si toutes les offres de la séance ont été capturées ; temps d'approche et de course à déduire si tu étais en course" } : null;
  const rapport = {
    genere_le: new Date().toISOString(), captures: details.length,
    precision: { justes: somme.j, total: somme.t, taux: somme.t ? Math.round(somme.j / somme.t * 1000) / 10 : null },
    seuil_de_reussite: "au moins 90 % des champs justes par plateforme (hypothese.json) ; en dessous, régler lecteur.js avec --texte puis rejouer sur un jeu de contrôle distinct",
    tempsMedianMs: temps.length ? temps[Math.floor(temps.length / 2)] : null,
    frequence, parChamp, parPlateforme, ecarts, details
  };
  fs.mkdirSync(path.dirname(RAPPORT), { recursive: true });
  fs.writeFileSync(RAPPORT, JSON.stringify(rapport, null, 1));
  console.log(`${details.length} captures, ${somme.j}/${somme.t} champs justes (${rapport.precision.taux} %), lecture médiane ${rapport.tempsMedianMs} ms`);
  if (frequence) console.log(`  une offre toutes les ${frequence.intervalleMoyenMin} min en moyenne sur ${frequence.offres} offres horodatées`);
  Object.entries(parPlateforme).forEach(([k, x]) => console.log(`  ${k} : ${x.justes}/${x.total} sur ${x.captures} captures`));
  ecarts.slice(0, 20).forEach((e) => console.log("  écart", JSON.stringify(e)));
  console.log("→ " + RAPPORT);
})().catch((e) => { console.error(e); process.exit(1); });
