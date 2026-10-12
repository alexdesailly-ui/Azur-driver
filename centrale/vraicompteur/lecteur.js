/* Vrai Compteur — lecture du texte d'une capture d'offre (sortie de l'OCR, sur l'appareil) vers les champs du moteur.
   Règles simples et vérifiables : prix en euros, paires « durée + distance », mots-clés d'approche et de trajet.
   Les formats réels de chaque plateforme se calibrent sur les captures des chauffeurs (à faire). */
(function (racine, fabrique) {
  if (typeof module === "object" && module.exports) module.exports = fabrique();
  else racine.LecteurOffre = fabrique();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  var MOTS_APPROCHE = /(prise\s*en\s*charge|approche|jusqu.au\s*client|pick.?up|vers\s*le\s*client)/i;
  var MOTS_COURSE = /(trajet|course|dur[ée]e|destination|voyage)/i;
  var DUREE = /(?:(\d{1,2})\s*h\s*(?:et\s*)?)?(\d{1,3})\s*(?:min|mn|mins|minutes?)\b/i;
  var DUREE_HEURES_SEULES = /(\d{1,2})\s*h(?!\s*\d)/i;
  var DISTANCE = /(\d{1,4}(?:[.,]\d{1,2})?)\s*km\b/i;
  var PRIX = [/(\d{1,4}[.,]\d{2})\s*€/, /€\s*(\d{1,4}[.,]\d{2})/, /(\d{1,4}[.,]\d{2})\s*(?:eur|euros?)\b/i];
  var PRIX_ENTIER = /(\d{1,5})\s*€/;   // virgule perdue par la lecture (capture floue) : contrôlé plus bas

  function num(s) { return parseFloat(String(s).replace(",", ".")); }

  function nettoyer(texte) {
    return String(texte || "")
      .replace(/\r/g, "")
      .replace(/[·•|]/g, " ")
      .replace(/(\d)\s*[,.]\s*(\d)/g, "$1,$2")        // « 7 ,0 » -> « 7,0 »
      .replace(/(\d)[oO](?=\d|\s*(km|min|€))/g, "$10") // O lu à la place de 0 au milieu d'un nombre
      .replace(/€\s*\.?/g, "€ ")
      .replace(/[ \t]+/g, " ");
  }

  function lire(texte) {
    var lignes = nettoyer(texte).split("\n").map(function (l) { return l.trim(); }).filter(Boolean);
    var res = { prixNet: null, approcheMin: null, approcheKm: null, courseMin: null, courseKm: null };
    var trace = [];
    for (var i = 0; i < lignes.length && res.prixNet === null; i++) {
      for (var j = 0; j < PRIX.length; j++) {
        var m = lignes[i].match(PRIX[j]);
        if (m) { res.prixNet = num(m[1]); trace.push({ champ: "prixNet", ligne: lignes[i] }); break; }
      }
    }
    var prixEntier = false;
    if (res.prixNet === null) {
      for (var n = 0; n < lignes.length; n++) {
        var e = lignes[n].match(PRIX_ENTIER);
        if (e) { res.prixNet = +e[1]; prixEntier = true; trace.push({ champ: "prixNet", ligne: lignes[n] }); break; }
      }
    }
    var paires = [];
    lignes.forEach(function (l) {
      var d = l.match(DUREE), k = l.match(DISTANCE), minutes = null;
      if (d) minutes = (d[1] ? +d[1] * 60 : 0) + (+d[2]);
      else { var h = l.match(DUREE_HEURES_SEULES); if (h && k) minutes = +h[1] * 60; }
      if (minutes !== null || k) paires.push({ ligne: l, minutes: minutes, km: k ? num(k[1]) : null, approche: MOTS_APPROCHE.test(l), course: MOTS_COURSE.test(l) && !MOTS_APPROCHE.test(l) });
    });
    var a = paires.filter(function (p) { return p.approche; })[0];
    var c = paires.filter(function (p) { return p.course; })[0];
    var reste = paires.filter(function (p) { return p !== a && p !== c; });
    if (!a && reste.length) a = reste.shift();        // sans mot-clé : la première paire est l'approche
    if (!c && reste.length) c = reste.shift();        // puis le trajet
    if (a) { res.approcheMin = a.minutes; res.approcheKm = a.km; trace.push({ champ: "approche", ligne: a.ligne }); }
    if (c) { res.courseMin = c.minutes; res.courseKm = c.km; trace.push({ champ: "course", ligne: c.ligne }); }
    // Contrôle de vraisemblance : un prix entier de 3 chiffres ou plus, à plus de 10 € du kilomètre, est presque toujours
    // une virgule perdue (« 780 € » pour 7,80 €). On corrige, et on le dit : le chauffeur vérifie.
    var alertes = [];
    var km = (res.approcheKm || 0) + (res.courseKm || 0);
    if (prixEntier && res.prixNet >= 100 && km > 0 && res.prixNet / km > 10) {
      alertes.push("Prix relu « " + res.prixNet + " € » : virgule probablement perdue, lu " + String(res.prixNet / 100).replace(".", ",") + " €. Vérifie.");
      res.prixNet = res.prixNet / 100;
    } else if (prixEntier) {
      alertes.push("Prix lu sans centimes : vérifie-le.");
    }
    var trouves = Object.keys(res).filter(function (k) { return res[k] !== null; }).length;
    return { offre: res, champsTrouves: trouves, confiance: trouves / 5, trace: trace, alertes: alertes };
  }

  return { lire: lire, nettoyer: nettoyer };
});
