/* Vrai Compteur — moteur de calcul. Tourne sur le téléphone (navigateur) ou sous Node ; aucun appel réseau.
   Décision marginale : pour choisir une course, seuls comptent ce qu'elle rapporte net (après cotisations et frais au kilomètre)
   et le temps qu'elle immobilise (approche + course + surcoût de la zone de dépose). Les charges fixes de la semaine
   ne changent pas d'une course à l'autre : elles sont dans le compteur de la semaine, pas dans le verdict d'une offre.
   v2 (13/10, 03:07) : l'offre est comparée à la « barre », le revenu net moyen par minute que le chauffeur peut espérer
   en refusant et en attendant la suivante (calculée par strategie.js à partir du flux d'offres). Refuser n'est pas gratuit. */
(function (racine, fabrique) {
  if (typeof module === "object" && module.exports) module.exports = fabrique();
  else racine.VraiCompteur = fabrique();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  // Après la dépose : temps et kilomètres EN PLUS de l'attente ordinaire pour revenir dans une zone active.
  // L'attente ordinaire entre deux offres est déjà dans la barre. Valeurs d'exemple, réglables ; à terme mesurées par les chauffeurs.
  var DESTINATIONS = {
    centre: { surcoutMin: 0, retourKm: 0, nom: "centre" },
    peripherie: { surcoutMin: 10, retourKm: 3, nom: "périphérie" },
    isole: { surcoutMin: 25, retourKm: 10, nom: "lieu isolé" }
  };
  // barreHeure : la barre en €/h (60 × g) ; plancherHeure : un minimum personnel facultatif ; bandeOrange : en dessous de la barre,
  // jusqu'à 90 % on dit « limite » (prendre ou refuser change peu de chose).
  var PROFIL_DEFAUT = { coutKm: 0.15, cotisations: 21, barreHeure: 18, plancherHeure: 0, bandeOrange: 0.9 };
  var CHAMPS = ["prixNet", "approcheMin", "approcheKm", "courseMin", "courseKm"];

  function nombre(x) { return typeof x === "number" && isFinite(x) && x >= 0; }
  function euros(x) { return (Math.round(x * 100) / 100).toFixed(2).replace(".", ","); }

  // Ce que l'offre rapporte net (v, en €) et le temps qu'elle immobilise (tau, en minutes).
  function valeurTemps(offre, profil) {
    var p = Object.assign({}, PROFIL_DEFAUT, profil || {});
    var d = DESTINATIONS[offre.destination] || DESTINATIONS.centre;
    var surcout = nombre(offre.surcoutMin) ? offre.surcoutMin : d.surcoutMin;
    var retourKm = nombre(offre.retourKm) ? offre.retourKm : d.retourKm;
    var kmTotal = offre.approcheKm + offre.courseKm + retourKm;
    var frais = p.coutKm * kmTotal, cotis = offre.prixNet * p.cotisations / 100;
    return { v: offre.prixNet - cotis - frais, tau: offre.approcheMin + offre.courseMin + surcout,
      kmTotal: kmTotal, frais: frais, cotisations: cotis, surcoutMin: surcout, retourKm: retourKm, zone: d.nom };
  }

  function evaluerOffre(offre, profil) {
    var p = Object.assign({}, PROFIL_DEFAUT, profil || {});
    var manque = CHAMPS.filter(function (k) { return !nombre(offre[k]); });
    if (manque.length) return { verdict: "incomplet", manque: manque, raisons: ["Il manque : " + manque.join(", ") + "."] };
    var vt = valeurTemps(offre, p);
    var netCourse = vt.v, minutes = vt.tau;
    var netHeure = minutes > 0 ? netCourse / minutes * 60 : 0;
    var barre = p.barreHeure, seuil = Math.max(barre, p.plancherHeure || 0);
    var verdict = netCourse <= 0 ? "rouge" : netHeure >= seuil ? "vert" : netHeure >= p.bandeOrange * seuil ? "orange" : "rouge";
    // Ce que prendre la course rapporte de plus (ou de moins) que la refuser et attendre la suivante, en moyenne.
    var gainVsRefus = netCourse - barre / 60 * minutes;

    var raisons = [];
    if (netCourse <= 0) raisons.push("Tu perds de l'argent : les frais et les cotisations dépassent le prix.");
    if (netCourse > 0 && netHeure >= barre && netHeure < seuil)
      raisons.push("Au-dessus de ta barre du moment mais sous ton plancher : si tu restes connecté, la refuser te coûte environ " + euros(gainVsRefus) + " €.");
    var partApproche = offre.approcheMin / minutes;
    if (partApproche >= 0.35) raisons.push("Approche longue : " + offre.approcheMin + " min non payées, " + Math.round(partApproche * 100) + " % du temps.");
    if (vt.surcoutMin + offre.approcheMin > offre.courseMin) raisons.push("Plus de temps à vide (" + (vt.surcoutMin + offre.approcheMin) + " min) qu'avec un client (" + offre.courseMin + " min).");
    var parKm = offre.prixNet / Math.max(0.1, offre.courseKm + offre.approcheKm);
    if (parKm < 1) raisons.push("Moins de 1 € par kilomètre parcouru, approche comprise.");
    if (vt.surcoutMin > 0 || vt.retourKm > 0) raisons.push("Dépose en " + vt.zone + " : " + vt.surcoutMin + " min et " + vt.retourKm + " km de plus comptés pour revenir dans une zone active.");
    if (!raisons.length) raisons.push("Approche courte et bon prix au kilomètre.");
    return {
      verdict: verdict, netCourse: netCourse, netHeure: netHeure, minutesTotales: minutes, kmTotal: vt.kmTotal,
      detail: { prix: offre.prixNet, cotisations: vt.cotisations, frais: vt.frais, surcoutMin: vt.surcoutMin, retourKm: vt.retourKm },
      barreHeure: barre, plancherHeure: p.plancherHeure || 0, seuilHeure: seuil, gainVsRefus: gainVsRefus, raisons: raisons
    };
  }

  // Repères des accords homologués par l'ARPE (chauffeurs indépendants passant par une plateforme) :
  // 9 € net minimum par course (depuis 2024), 1 € minimum par kilomètre, 30 € net minimum par heure d'activité (approche comprise).
  // La garantie horaire s'apprécie sur une période, pas course par course : ici, c'est un repère, pas un contrôle.
  var ACCORD = { parCourse: 9, parKm: 1, parHeureActivite: 30 };
  function reperesAccord(offre) {
    var km = offre.courseKm + offre.approcheKm, minutes = offre.approcheMin + offre.courseMin;
    return [
      { repere: "9 € net minimum par course", valeur: offre.prixNet, respecte: offre.prixNet >= ACCORD.parCourse },
      { repere: "1 € minimum par kilomètre (approche comprise ici, définition à vérifier)", valeur: km > 0 ? offre.prixNet / km : null, respecte: km > 0 && offre.prixNet / km >= ACCORD.parKm },
      { repere: "30 € net par heure d'activité, approche comprise (s'apprécie sur une période)", valeur: minutes > 0 ? offre.prixNet / minutes * 60 : null, respecte: minutes > 0 && offre.prixNet / minutes * 60 >= ACCORD.parHeureActivite }
    ];
  }

  // Le vrai revenu de la semaine, charges fixes comprises.
  function semaine(s) {
    var heures = Math.max(1, s.heures), cot = s.revenus * s.cotisations / 100, fkm = s.km * s.coutKm;
    var net = s.revenus - cot - fkm - s.fixes;
    return { brutHeure: s.revenus / heures, net: net, netHeure: net / heures, cotisations: cot, fraisKm: fkm, fixes: s.fixes };
  }

  return { evaluerOffre: evaluerOffre, valeurTemps: valeurTemps, semaine: semaine, reperesAccord: reperesAccord, ACCORD: ACCORD, DESTINATIONS: DESTINATIONS, PROFIL_DEFAUT: PROFIL_DEFAUT };
});
