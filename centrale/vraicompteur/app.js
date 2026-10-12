/* Vrai Compteur — démonstration. Tout est calculé dans le navigateur ; la lecture des captures se fait sur l'appareil. */
(function () {
  "use strict";
  var M = window.VraiCompteur, L = window.LecteurOffre;
  function $(id) { return document.getElementById(id); }
  var fmt = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
  var fmt2 = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var CLE = "vrai-compteur-profil";
  var EXEMPLES = [
    { id: "offre-1", destination: "centre" }, { id: "offre-2", destination: "centre" }, { id: "offre-3", destination: "isole" },
    { id: "offre-4", destination: "peripherie" }, { id: "offre-5", destination: "isole" }, { id: "offre-6", destination: "peripherie" }
  ];
  var CHAMPS = ["prixNet", "approcheMin", "approcheKm", "courseMin", "courseKm"];
  window.mesuresLecture = [];

  /* ---------- Profil (reste sur l'appareil) ---------- */
  try {
    var p = JSON.parse(localStorage.getItem(CLE) || "null");
    if (p) ["coutKm", "cotisations", "objectifHeure"].forEach(function (k) { if (p[k] !== undefined) $(k).value = p[k]; });
  } catch (e) { /* stockage indisponible : valeurs d'exemple */ }
  function profil() {
    var r = { coutKm: +$("coutKm").value || 0, cotisations: +$("cotisations").value || 0, objectifHeure: +$("objectifHeure").value || 1 };
    try { localStorage.setItem(CLE, JSON.stringify(r)); } catch (e) { /* rien */ }
    return r;
  }

  /* ---------- Verdict ---------- */
  var MOTS = { vert: "rentable", orange: "limite", rouge: "sous ton objectif", incomplet: "incomplet" };
  function lireOffre() {
    var o = { destination: $("destination").value };
    CHAMPS.forEach(function (k) { var v = $(k).value; o[k] = v === "" ? undefined : parseFloat(String(v).replace(",", ".")); });
    return o;
  }
  function afficher() {
    var r = M.evaluerOffre(lireOffre(), profil());
    var feu = $("feu");
    feu.className = "feu " + (r.verdict === "incomplet" ? "" : r.verdict);
    feu.textContent = r.verdict === "rouge" && r.netCourse <= 0 ? "tu perds" : MOTS[r.verdict];
    var ul = $("raisons"); while (ul.firstChild) ul.removeChild(ul.firstChild);
    if (r.verdict === "incomplet") {
      $("net-heure").innerHTML = "— <small>€/h net</small>";
      $("sous-chiffre").textContent = "Il manque des informations pour juger cette offre.";
    } else {
      $("net-heure").innerHTML = fmt.format(r.netHeure) + " <small>€/h net</small>";
      $("sous-chiffre").textContent = "Il te reste " + fmt2.format(r.netCourse) + " € pour " + r.minutesTotales + " min (approche, course et attente après la dépose). Ton objectif : " + fmt.format(r.objectifHeure) + " €/h.";
    }
    r.raisons.forEach(function (t) { var li = document.createElement("li"); li.textContent = t; ul.appendChild(li); });
    var acc = $("accord"); while (acc.firstChild) acc.removeChild(acc.firstChild);
    if (r.verdict !== "incomplet") {
      M.reperesAccord(lireOffre()).forEach(function (x) {
        var li = document.createElement("li"); li.className = x.respecte ? "ok" : "ko";
        li.textContent = (x.respecte ? "Respecté : " : "Sous le repère : ") + x.repere;
        acc.appendChild(li);
      });
    }
    return r;
  }
  CHAMPS.concat(["destination"]).forEach(function (k) { $(k).addEventListener("input", function () { $("c-" + k) && $("c-" + k).classList.remove("lu"); afficher(); }); });
  ["coutKm", "cotisations", "objectifHeure"].forEach(function (k) { $(k).addEventListener("input", afficher); });
  ["form-offre", "form-profil", "form-semaine"].forEach(function (id) { $(id).addEventListener("submit", function (e) { e.preventDefault(); }); });

  /* ---------- Onglets ---------- */
  var onglets = [$("o-capture"), $("o-saisie")];
  function montrer(i, focus) {
    onglets.forEach(function (o, j) { o.setAttribute("aria-selected", i === j ? "true" : "false"); o.tabIndex = i === j ? 0 : -1; });
    $("v-capture").hidden = i !== 0; $("v-saisie").hidden = i !== 1;
    if (focus) onglets[i].focus();
  }
  onglets.forEach(function (o, i) {
    o.addEventListener("click", function () { montrer(i); });
    o.addEventListener("keydown", function (e) { if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); montrer(1 - i, true); } });
  });

  /* ---------- Lecture sur l'appareil (Tesseract, WebAssembly) ---------- */
  var ocr = null;
  function charger(src) {
    return new Promise(function (ok, ko) { var s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = ko; document.head.appendChild(s); });
  }
  function moteurOCR() {
    if (ocr) return ocr;
    var local = { script: "vendor/tesseract.min.js", worker: "vendor/worker.min.js", core: "vendor/core", lang: "vendor/lang" };
    var cdn = { script: "https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/tesseract.min.js", worker: "https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/worker.min.js",
      core: "https://cdn.jsdelivr.net/npm/tesseract.js-core@6.0.0", lang: "https://cdn.jsdelivr.net/npm/@tesseract.js-data/fra@1.0.0/4.0.0_best_int" };
    function existe(u) { return fetch(u, { method: "HEAD" }).then(function (r) { return r.ok; }, function () { return false; }); }
    var base = new URL(".", location.href).href;
    ocr = Promise.all([existe(local.worker), existe(local.lang + "/fra.traineddata.gz"), existe(local.lang + "/fra-traineddata-gz.js")])
      .then(function (t) {
        if (!t[0]) return { src: cdn, workerPath: cdn.worker, blob: true };
        if (t[1]) return { src: local, workerPath: local.worker, blob: false };
        if (t[2]) {
          // Hébergement qui ne sert pas les fichiers .gz : les données de langue voyagent dans un .js, et un petit
          // travailleur les sert au moteur de lecture à la place du réseau. Tout reste sur l'appareil.
          var code = "importScripts(" + JSON.stringify(base + "vendor/lang/fra-traineddata-gz.js") + ");" +
            "var b=atob(self.FRA_GZ_B64),u=new Uint8Array(b.length);for(var i=0;i<b.length;i++)u[i]=b.charCodeAt(i);" +
            "var f0=self.fetch.bind(self);self.fetch=function(x,o){return String(x).indexOf('fra.traineddata')>=0?Promise.resolve(new Response(u.slice(0).buffer,{status:200})):f0(x,o);};" +
            "importScripts(" + JSON.stringify(base + local.worker) + ");";
          return { src: local, workerPath: URL.createObjectURL(new Blob([code], { type: "text/javascript" })), blob: false };
        }
        return { src: cdn, workerPath: cdn.worker, blob: true };
      })
      .then(function (c) {
        return charger(c.src.script).then(function () {
          return window.Tesseract.createWorker("fra", 1, { workerPath: c.workerPath, corePath: new URL(c.src.core, location.href).href, langPath: new URL(c.src.lang, location.href).href, gzip: true, workerBlobURL: c.blob });
        }).then(function (w) { return { worker: w, source: c.src === local ? "fichiers de la page" : "CDN au premier chargement" }; });
      });
    ocr.catch(function () { ocr = null; });
    return ocr;
  }
  function lireImage(image, destination) {
    $("etat").textContent = "Lecture sur ton appareil…";
    var t0 = performance.now(), chargement = !ocr;
    return moteurOCR().then(function (m) {
      var t1 = performance.now();
      return m.worker.recognize(image).then(function (res) {
        var ms = performance.now() - t1, tout = performance.now() - t0;
        var lu = L.lire(res.data.text);
        CHAMPS.forEach(function (k) {
          var v = lu.offre[k];
          $(k).value = v === null || v === undefined ? "" : String(v);
          $("c-" + k).classList.toggle("lu", v !== null && v !== undefined);
        });
        if (destination) $("destination").value = destination;
        var r = afficher();
        (lu.alertes || []).forEach(function (t) { var li = document.createElement("li"); li.textContent = t; li.className = "alerte"; $("raisons").insertBefore(li, $("raisons").firstChild); });
        window.mesuresLecture.push({ ms: ms, champs: lu.champsTrouves, texte: res.data.text });
        $("etat").innerHTML = "Lu en <b>" + (ms / 1000).toFixed(1).replace(".", ",") + " s</b> sur ton appareil" + (chargement ? " (plus " + ((tout - ms) / 1000).toFixed(1).replace(".", ",") + " s de démarrage du moteur, une seule fois)" : "") +
          " ; " + lu.champsTrouves + " champs sur 5 lus. Vérifie-les dans « Saisir l'offre ».";
        majPreuve();
        return r;
      });
    }).catch(function () {
      $("etat").textContent = "Lecture indisponible ici : saisis l'offre à la main.";
      montrer(1);
    });
  }
  function majPreuve() {
    var m = window.mesuresLecture; if (!m.length) return;
    var t = m.map(function (x) { return x.ms; }).sort(function (a, b) { return a - b; }), med = t[Math.floor(t.length / 2)];
    var li = $("preuve-mesure").children[1];
    li.textContent = "Lecture d'une capture sur l'appareil, sans réseau : " + m.length + " lecture" + (m.length > 1 ? "s" : "") + ", médiane " + (med / 1000).toFixed(1).replace(".", ",") + " s, " +
      m.reduce(function (s, x) { return s + x.champs; }, 0) + " champs lus sur " + (5 * m.length) + ".";
  }
  EXEMPLES.forEach(function (ex) {
    var b = document.createElement("button"); b.type = "button"; b.setAttribute("aria-pressed", "false"); b.setAttribute("aria-label", "Offre d'exemple " + ex.id.slice(-1));
    b.dataset.id = ex.id;
    var img = document.createElement("img"); img.src = "exemples/" + ex.id + ".png"; img.alt = ""; b.appendChild(img);
    b.addEventListener("click", function () {
      Array.prototype.forEach.call($("vignettes").children, function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      lireImage(img.src, ex.destination);
    });
    $("vignettes").appendChild(b);
  });
  $("capture").addEventListener("change", function () {
    var f = this.files && this.files[0]; if (!f) return;
    var url = URL.createObjectURL(f);
    lireImage(url).then(function () { URL.revokeObjectURL(url); });
  });

  /* ---------- La semaine ---------- */
  function semaine() {
    var s = M.semaine({ heures: +$("s-heures").value || 1, revenus: +$("s-revenus").value || 0, km: +$("s-km").value || 0,
      coutKm: +$("coutKm").value || 0, fixes: +$("s-fixes").value || 0, cotisations: +$("cotisations").value || 0 });
    $("s-brut").textContent = fmt.format(s.brutHeure) + " €/h";
    $("s-net").textContent = fmt.format(s.netHeure) + " €/h";
    var rev = +$("s-revenus").value || 0, e = rev > 0 ? rev : 1;
    var lignes = [["Revenus", 0, rev, rev, ""], ["Frais au kilomètre", rev - s.fraisKm, s.fraisKm, -s.fraisKm, ""], ["Charges fixes", rev - s.fraisKm - s.fixes, s.fixes, -s.fixes, ""],
      ["Cotisations", rev - s.fraisKm - s.fixes - s.cotisations, s.cotisations, -s.cotisations, ""], ["Il te reste", 0, Math.max(0, s.net), s.net, "net"]];
    var c = $("s-cascade"); while (c.firstChild) c.removeChild(c.firstChild);
    lignes.forEach(function (l) {
      var d = document.createElement("div"); d.className = "l " + l[4];
      var a = document.createElement("span"); a.textContent = l[0];
      var p = document.createElement("span"); p.className = "p";
      var i = document.createElement("i"); i.style.left = Math.max(0, 100 * l[1] / e) + "%"; i.style.width = Math.max(0, Math.min(100, 100 * l[2] / e)) + "%";
      p.appendChild(i);
      var v = document.createElement("span"); v.textContent = (l[3] < 0 ? "− " : "") + fmt.format(Math.abs(l[3])) + " €";
      d.appendChild(a); d.appendChild(p); d.appendChild(v); c.appendChild(d);
    });
  }
  ["s-heures", "s-revenus", "s-km", "s-fixes", "coutKm", "cotisations"].forEach(function (k) { $(k).addEventListener("input", semaine); });

  /* ---------- Hors ligne (dépôt seulement ; ignoré là où ce n'est pas permis) ---------- */
  try { if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(function () {}); } catch (e) { /* rien */ }

  afficher();
  semaine();
})();
