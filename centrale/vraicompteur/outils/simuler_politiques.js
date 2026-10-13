/* Faut-il être exigeant ? Simulation de longues périodes de travail, même flux d'offres et même tirage pour chaque politique.
   Usage : node outils/simuler_politiques.js [docs/simulation.json]
   Paramètres publiés : rapport ARPE 2026 cité par TPE Actu (26/04/2026). Le reste est une hypothèse (voir strategie.js). */
const fs = require("fs");
const path = require("path");
const S = require("../strategie.js");
const M = require("../moteur.js");

const PROFIL = { coutKm: 0.15, cotisations: 21 };
const INTERVALLES = [
  { min: 4, nom: "une offre toutes les 4 min (Uber 2021)" },
  { min: 5.8, nom: "toutes les 5,8 min (Bolt 2025)" },
  { min: 7.5, nom: "toutes les 7,5 min (Uber 2025)" },
  { min: 10, nom: "toutes les 10 min (Uber 2024)" },
  { min: 15, nom: "toutes les 15 min (heure creuse, hypothèse)" }
];
const DISPERSIONS = [0.15, 0.3, 0.45];
const GRILLE_KM = []; for (let y = 0.8; y <= 3.0001; y += 0.1) GRILLE_KM.push(Math.round(y * 10) / 10);
const MINUTES = 1500000, GRAINE = 2026;

function scenario(dispersion, intervalle, offres, kmRegle75) {
  const base = { offres, profil: PROFIL, valeur: M.valeurTemps, intervalleMin: intervalle, minutes: MINUTES, graine: GRAINE };
  // Meilleur filtre au kilomètre, réglé après coup pour ce scénario précis (avantage donné au filtre).
  const pol = {}; GRILLE_KM.forEach((y) => { pol["km" + y] = { type: "km", parKm: y }; });
  const grille = S.comparer({ ...base, politiques: pol });
  let meilleurKm = null;
  GRILLE_KM.forEach((y) => { const r = grille["km" + y]; if (!meilleurKm || r.parHeure > meilleurKm.parHeure) meilleurKm = { parKm: y, ...r }; });
  const r = S.comparer({ ...base, politiques: {
    tout: { type: "tout" },
    v1: { type: "v1", heure: 18 },
    objectif12: { type: "objectif", heure: 12 },
    objectif18: { type: "objectif", heure: 18 },
    objectif25: { type: "objectif", heure: 25 },
    objectif30: { type: "objectif", heure: 30 },
    kmRegle75: { type: "km", parKm: kmRegle75 || meilleurKm.parKm },
    barreSuppose75: { type: "barre", intervalleSuppose: 7.5 },
    barre: { type: "barre" }
  } });
  r.kmMeilleur = meilleurKm;
  return r;
}

const resultats = [];
DISPERSIONS.forEach((dispersion) => {
  const modele = { ...S.MODELE_DEFAUT, dispersion };
  const offres = S.genererOffres(20000, modele, 7);
  const ref = scenario(dispersion, 7.5, offres, null);
  const kmRegle75 = ref.kmMeilleur.parKm;
  INTERVALLES.forEach((iv) => {
    const r = iv.min === 7.5 ? scenario(dispersion, 7.5, offres, kmRegle75) : scenario(dispersion, iv.min, offres, kmRegle75);
    const g = (x) => Math.round(x * 100) / 100, pc = (x) => Math.round((x / r.tout.parHeure - 1) * 1000) / 10;
    const ligne = { dispersion, intervalleMin: iv.min, intervalle: iv.nom, barreHeure: g(r.barreHeure), parKmRegle75: kmRegle75 };
    ["tout", "v1", "objectif12", "objectif18", "objectif25", "objectif30", "kmRegle75", "kmMeilleur", "barreSuppose75", "barre"].forEach((k) => {
      ligne[k] = { parHeure: g(r[k].parHeure), gainVsTout: pc(r[k].parHeure), tauxRefus: Math.round(r[k].tauxRefus * 1000) / 10 };
      if (k === "kmMeilleur") ligne[k].parKm = r.kmMeilleur.parKm;
    });
    resultats.push(ligne);
  });
});

// Point mort : si refuser faisait venir les offres moins souvent, à partir de quel intervalle la stratégie de la barre
// ne rapporterait plus que « tout accepter » à 7,5 min ? Calcul exact : la barre g est le revenu par minute de cette stratégie.
const pointsMorts = DISPERSIONS.map((dispersion) => {
  const offres = S.genererOffres(20000, { ...S.MODELE_DEFAUT, dispersion }, 7);
  const vt = offres.map((o) => M.valeurTemps(o, PROFIL));
  const ev = vt.reduce((a, x) => a + x.v, 0) / vt.length, et = vt.reduce((a, x) => a + x.tau, 0) / vt.length;
  const tout75 = ev / (7.5 + et);                        // tout accepter : revenu par cycle / durée du cycle
  let lo = 7.5, hi = 60;
  for (let k = 0; k < 60; k++) { const mid = (lo + hi) / 2; if (S.seuilOptimal(vt, 1 / mid) > tout75) lo = mid; else hi = mid; }
  const im = (lo + hi) / 2;
  return { dispersion, toutAccepter75Heure: Math.round(tout75 * 6000) / 100, intervallePointMortMin: Math.round(im * 10) / 10,
    baisseFrequenceToleree: Math.round((1 - 7.5 / im) * 1000) / 10 };
});

const sortie = {
  genere_le: new Date().toISOString(),
  commande: "node outils/simuler_politiques.js",
  profil: PROFIL, minutes_simulees_par_cas: MINUTES, graine: GRAINE, offres_par_modele: 20000,
  sources: ["Rapport ARPE 2026 sur l'activité des plateformes VTC, cité par TPE Actu le 26/04/2026 : Uber 2025, 17,3 € par course, 21,8 min par prestation, 7,5 min entre deux propositions de course (4 min en 2021, 10 min en 2024) ; Bolt 2025, 15,9 € par course, 5,8 min entre deux propositions."],
  hypotheses: ["21,8 min comprennent l'approche", "approche uniforme 2 à 12 min", "vitesse 18 à 36 km/h", "tarif 1 € + 0,90 €/km + 0,35 €/min mis à l'échelle de 17,3 € en moyenne", "écart de prix autour du tarif : 15, 30 ou 45 % (inconnu : c'est ce que la bêta doit mesurer)", "zones de dépose 60/30/10 %, surcoût 0, 10 et 25 min", "refuser ne change pas la fréquence des offres (à vérifier sur le terrain)"],
  lecture: "parHeure = revenu net par heure connectée (après cotisations et frais au kilomètre, avant charges fixes). gainVsTout en %. tauxRefus = part des offres refusées.",
  resultats,
  points_morts: pointsMorts
};
const fichier = process.argv[2] || path.join(__dirname, "..", "docs", "simulation.json");
fs.writeFileSync(fichier, JSON.stringify(sortie, null, 1));
const c = (x) => `${x.parHeure.toFixed(1)} (${x.gainVsTout > 0 ? "+" : ""}${x.gainVsTout}%)`.padEnd(14);
console.log("disp  interv | tout  " + ["v1-18att", "obj12", "obj18", "obj25", "obj30", "km@7,5", "kmMeilleur", "barre@7,5", "barre"].map((x) => x.padEnd(14)).join("") + "refus");
resultats.forEach((l) => console.log(`${l.dispersion.toFixed(2)}  ${String(l.intervalleMin).padEnd(6)} | ${l.tout.parHeure.toFixed(1)}  ` +
  [l.v1, l.objectif12, l.objectif18, l.objectif25, l.objectif30, l.kmRegle75, l.kmMeilleur, l.barreSuppose75, l.barre].map(c).join("") + l.barre.tauxRefus + "%"));
console.log("points morts", JSON.stringify(pointsMorts));
console.log("→ " + fichier);
