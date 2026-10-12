/* À la place — démonstration : calcul du revenu d'un trajet à la place et fiche de trajet en format ouvert. Rien n'est envoyé. */
(function () {
  "use strict";
  function $(id) { return document.getElementById(id); }
  var PART_RESEAU = 0.10;   // exemple, affiché comme tel sur la page
  var euros = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });

  /* ---------- Calcul ---------- */
  var PRESETS = {
    ski: { capacite: 8, places: 6, prix: 55, trajets: 2, duree: 7, note: "Une journée : la descente du matin (station vers la gare) puis la montée de l'après-midi, avec le même van. Environ 2 h 45 de route par sens, plus l'attente." },
    nuit: { capacite: 4, places: 3, prix: 25, trajets: 1, duree: 1, note: "Un trajet de nuit après les derniers vols, environ 35 minutes, retour à vide compris dans l'heure." }
  };
  var noteBase = $("k-note").innerHTML;

  function plan(capacite, vendues, prix) {
    var p = $("plan"); while (p.firstChild) p.removeChild(p.firstChild);
    for (var i = 0; i < capacite; i++) {
      var s = document.createElement("span");
      s.className = "siege" + (i < vendues ? " vendu" : "");
      s.textContent = i < vendues ? String(prix) : "";
      p.appendChild(s);
    }
  }
  function calculer() {
    var cap = +$("k-capacite").value;
    var pl = $("k-places"); pl.max = String(cap); if (+pl.value > cap) pl.value = String(cap);
    var places = +pl.value, prix = Math.max(0, +$("k-prix").value || 0), trajets = Math.max(1, +$("k-trajets").value || 1);
    var duree = Math.max(0.5, +$("k-duree").value || 0.5), uber = Math.max(1, +$("k-uber").value || 1);
    var net = places * prix * trajets * (1 - PART_RESEAU), heure = net / duree;
    plan(cap, places, prix);
    $("k-heure").textContent = euros.format(heure) + " €/h";
    var max = Math.max(heure, uber);
    $("b-ap").style.width = (100 * heure / max) + "%";
    $("b-ub").style.width = (100 * uber / max) + "%";
    $("v-ap").textContent = euros.format(heure) + " €";
    $("v-ub").textContent = euros.format(uber) + " €";
    var r = heure / uber;
    $("k-ratio").textContent = places + " places × " + prix + " € × " + trajets + " trajet" + (trajets > 1 ? "s" : "") + ", moins 10 % = " + euros.format(net) + " € en " + String(duree).replace(".", ",") + " h, soit " + r.toFixed(1).replace(".", ",") + " fois ton heure Uber.";
  }
  $("k-trajet").addEventListener("change", function () {
    var p = PRESETS[this.value];
    if (p) {
      $("k-capacite").value = String(p.capacite); $("k-places").max = String(p.capacite); $("k-places").value = String(p.places);
      $("k-prix").value = String(p.prix); $("k-trajets").value = String(p.trajets); $("k-duree").value = String(p.duree);
      $("k-note").innerHTML = noteBase + " " + p.note;
    } else $("k-note").innerHTML = noteBase;
    calculer();
  });
  // Changer le véhicule, le prix, le nombre de trajets ou la durée sort du trajet type : la note du trajet type ne s'applique plus.
  ["k-capacite", "k-prix", "k-trajets", "k-duree"].forEach(function (id) {
    $(id).addEventListener("input", function () { if ($("k-trajet").value !== "perso") { $("k-trajet").value = "perso"; $("k-note").innerHTML = noteBase; } calculer(); });
  });
  ["k-places", "k-uber"].forEach(function (id) { $(id).addEventListener("input", calculer); });
  $("calc").addEventListener("submit", function (e) { e.preventDefault(); });
  $("k-note").innerHTML = noteBase + " " + PRESETS.ski.note;

  /* ---------- Fiche de trajet ---------- */
  var JOURS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
  var zoneJours = $("t-jours");
  JOURS.forEach(function (j) {
    var l = document.createElement("label"), c = document.createElement("input");
    c.type = "checkbox"; c.value = j; c.checked = (j === "vendredi" || j === "samedi");
    l.appendChild(c); l.appendChild(document.createTextNode(j));
    zoneJours.appendChild(l);
  });
  $("t-pc1").value = "22:30"; $("t-pc2").value = "23:30"; $("t-dp1").value = "23:00"; $("t-dp2").value = "00:30";

  function slug(s) {
    return String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "x";
  }
  function minutes(t) { var p = String(t || "").split(":"); return p.length < 2 ? null : (+p[0]) * 60 + (+p[1]); }
  function gtfs(m) { var h = Math.floor(m / 60), mm = m % 60; return (h < 10 ? "0" : "") + h + ":" + (mm < 10 ? "0" : "") + mm + ":00"; }

  function fiche() {
    var chauffeur = slug($("t-chauffeur").value), nom = slug($("t-nom").value), id = chauffeur + "." + nom;
    var de = $("t-de").value.trim() || "Départ", vers = $("t-vers").value.trim() || "Arrivée";
    var pc1 = minutes($("t-pc1").value), pc2 = minutes($("t-pc2").value), dp1 = minutes($("t-dp1").value), dp2 = minutes($("t-dp2").value);
    // Fenêtres qui passent minuit : on compte au-delà de 24:00, comme le format ouvert.
    if (pc1 !== null && pc2 !== null && pc2 <= pc1) pc2 += 1440;
    if (dp1 !== null && pc1 !== null && dp1 < pc1) dp1 += 1440;
    if (dp1 !== null && dp2 !== null && dp2 <= dp1) dp2 += 1440;
    var jours = Array.prototype.filter.call(zoneJours.querySelectorAll("input"), function (c) { return c.checked; }).map(function (c) { return c.value; });
    var cap = +$("t-cap").value, seuil = +$("t-seuil").value, prix = +$("t-prix").value;
    var controles = [
      ["ok", "Aucun horaire fixe : le départ est composé à partir des réservations (le format n'a pas de champ pour un horaire)."],
      [pc1 !== null && pc2 !== null && pc2 > pc1 ? "ok" : "ko", "Fenêtre de prise en charge valide."],
      [dp1 !== null && dp2 !== null && dp2 > dp1 && dp1 >= pc1 ? "ok" : "ko", "Fenêtre de dépose valide et après le début de la prise en charge."],
      [cap >= 1 && cap <= 8 ? "ok" : "ko", "Au plus 8 places passagers (VTC)."],
      [seuil >= 1 && seuil <= cap ? "ok" : "ko", "Seuil de départ compris entre 1 et le nombre de places."],
      [prix > 0 ? "ok" : "ko", "Prix de la place renseigné."],
      [jours.length ? "ok" : "ko", "Au moins un jour."],
      ["afaire", "Zones à dessiner sur la carte et numéro d'inscription au registre VTC à renseigner (étape suivante)."]
    ];
    var ul = $("t-controle"); while (ul.firstChild) ul.removeChild(ul.firstChild);
    controles.forEach(function (c) { var li = document.createElement("li"); li.className = c[0]; li.textContent = c[1]; ul.appendChild(li); });
    var trajet = {
      id: id, nom: de + " > " + vers,
      operateur: { id: chauffeur, nom: $("t-chauffeur").value.trim(), registre_evtc: "à renseigner" },
      mode: "a_la_demande",
      periode: { debut: "2026-12-01", fin: "2027-03-31", jours: jours },
      zones: [{ id: slug(de), nom: de, boite: "à dessiner sur la carte" }, { id: slug(vers), nom: vers, boite: "à dessiner sur la carte" }],
      trajets: [{ id: slug(de) + "-" + slug(vers), de: slug(de), vers: slug(vers),
        prise_en_charge: [$("t-pc1").value, gtfs(pc2 || 0).slice(0, 5)], depose: [gtfs(dp1 || 0).slice(0, 5), gtfs(dp2 || 0).slice(0, 5)] }],
      capacite: cap, seuil: seuil, prix_place_eur: prix,
      reservation: { jours_avant_min: 1, heure_limite: "18:00", ouverture_jours_avant: 60, url: "https://example.org/" + chauffeur + "/" + nom }
    };
    $("t-json").textContent = JSON.stringify(trajet, null, 2);
    var tid = id + ":" + trajet.trajets[0].id + ":fenetre", regle = id + ":reservation";
    $("t-gtfs").textContent = [
      "trip_id,stop_sequence,location_id,start_pickup_drop_off_window,end_pickup_drop_off_window,pickup_type,drop_off_type,pickup_booking_rule_id,drop_off_booking_rule_id",
      [tid, 1, id + ":" + slug(de), gtfs(pc1 || 0), gtfs(pc2 || 0), 2, 1, regle, ""].join(","),
      [tid, 2, id + ":" + slug(vers), gtfs(dp1 || 0), gtfs(dp2 || 0), 1, 2, "", regle].join(","),
      "",
      "# booking_rules.txt",
      "booking_rule_id,booking_type,prior_notice_last_day,prior_notice_last_time,message",
      [regle, 2, 1, "18:00:00", "\"Place à " + prix + " €. Départ composé à partir des réservations, confirmé dès " + seuil + " places payées.\""].join(",")
    ].join("\n");
  }
  ["t-chauffeur", "t-nom", "t-de", "t-vers", "t-pc1", "t-pc2", "t-dp1", "t-dp2", "t-cap", "t-seuil", "t-prix"].forEach(function (id) { $(id).addEventListener("input", fiche); });
  zoneJours.addEventListener("change", fiche);
  $("form-trajet").addEventListener("submit", function (e) { e.preventDefault(); });
  $("t-copier").addEventListener("click", function () {
    var t = $("t-json").textContent;
    function selectionner() {
      try { var r = document.createRange(); r.selectNodeContents($("t-json")); var s = getSelection(); s.removeAllRanges(); s.addRange(r); } catch (e) { /* rien */ }
      $("t-retour").textContent = "Le fichier est sélectionné : copie-le avec ton clavier.";
    }
    try { navigator.clipboard.writeText(t).then(function () { $("t-retour").textContent = "Fichier du trajet copié."; }, selectionner); } catch (e) { selectionner(); }
  });

  calculer();
  fiche();
})();
