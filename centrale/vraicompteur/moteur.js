/* Vrai Compteur — moteur de calcul. Tourne sur le téléphone (navigateur) ou sous Node ; aucun appel réseau.
   Décision marginale : pour choisir une course, seuls comptent ce qu'elle rapporte net (après cotisations et frais au kilomètre)
   et le temps qu'elle immobilise (approche + course + attente probable après la dépose). Les charges fixes de la semaine
   ne changent pas d'une course à l'autre : elles sont dans le compteur de la semaine, pas dans le verdict d'une offre. */
(function (racine, fabrique) {
  if (typeof module === "object" && module.exports) module.exports = fabrique();
  else racine.VraiCompteur = fabrique();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  // Après la dépose : temps d'attente probable avant la course suivante, et kilomètres à vide pour revenir en zone.
  // Valeurs d'exemple, réglables par le chauffeur ; à terme calibrées par les données agrégées des chauffeurs.
  var DESTINATIONS = {
    centre: { attenteMin: 5, retourKm: 0, nom: "centre" },
    peripherie: { attenteMin: 15, retourKm: 3, nom: "périphérie" },
    isole: { attenteMin: 30, retourKm: 10, nom: "lieu isolé" }
  };
  var PROFIL_DEFAUT = { coutKm: 0.15, cotisations: 21, objectifHeure: 18, seuilOrange: 0.75 };
  var CHAMPS = ["prixNet", "approcheMin", "approcheKm", "courseMin", "courseKm"];

  function nombre(x) { return typeof x === "number" && isFinite(x) && x >= 0; }

  function evaluerOffre(offre, profil) {
    var p = Object.assign({}, PROFIL_DEFAUT, profil || {});
    var manque = CHAMPS.filter(function (k) { return !nombre(offre[k]); });
    if (manque.length) return { verdict: "incomplet", manque: manque, raisons: ["Il manque : " + manque.join(", ") + "."] };
    var d = DESTINATIONS[offre.destination] || DESTINATIONS.centre;
    var attente = nombre(offre.attenteMin) ? offre.attenteMin : d.attenteMin;
    var retourKm = nombre(offre.retourKm) ? offre.retourKm : d.retourKm;
    var kmTotal = offre.approcheKm + offre.courseKm + retourKm;
    var frais = p.coutKm * kmTotal;
    var cotis = offre.prixNet * p.cotisations / 100;
    var netCourse = offre.prixNet - cotis - frais;
    var minutes = offre.approcheMin + offre.courseMin + attente;
    var netHeure = minutes > 0 ? netCourse / minutes * 60 : 0;
    var verdict = netCourse <= 0 ? "rouge" : netHeure >= p.objectifHeure ? "vert" : netHeure >= p.seuilOrange * p.objectifHeure ? "orange" : "rouge";

    var raisons = [];
    if (netCourse <= 0) raisons.push("Tu perds de l'argent : les frais et les cotisations dépassent le prix.");
    var partApproche = offre.approcheMin / minutes;
    if (partApproche >= 0.35) raisons.push("Approche longue : " + offre.approcheMin + " min non payées, " + Math.round(partApproche * 100) + " % du temps.");
    if (attente + offre.approcheMin > offre.courseMin) raisons.push("Plus de temps à vide (" + (attente + offre.approcheMin) + " min) qu'avec un client (" + offre.courseMin + " min).");
    var parKm = offre.prixNet / Math.max(0.1, offre.courseKm + offre.approcheKm);
    if (parKm < 1) raisons.push("Moins de 1 € par kilomètre parcouru, approche comprise.");
    if (retourKm > 0) raisons.push("Dépose en " + d.nom + " : " + attente + " min d'attente probable et " + retourKm + " km à vide comptés.");
    if (!raisons.length) raisons.push("Approche courte et bon prix au kilomètre.");
    return {
      verdict: verdict, netCourse: netCourse, netHeure: netHeure, minutesTotales: minutes, kmTotal: kmTotal,
      detail: { prix: offre.prixNet, cotisations: cotis, frais: frais, attenteMin: attente, retourKm: retourKm },
      objectifHeure: p.objectifHeure, raisons: raisons
    };
  }

  // Le vrai revenu de la semaine, charges fixes comprises.
  function semaine(s) {
    var heures = Math.max(1, s.heures), cot = s.revenus * s.cotisations / 100, fkm = s.km * s.coutKm;
    var net = s.revenus - cot - fkm - s.fixes;
    return { brutHeure: s.revenus / heures, net: net, netHeure: net / heures, cotisations: cot, fraisKm: fkm, fixes: s.fixes };
  }

  return { evaluerOffre: evaluerOffre, semaine: semaine, DESTINATIONS: DESTINATIONS, PROFIL_DEFAUT: PROFIL_DEFAUT };
});
