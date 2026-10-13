// Mise en cache pour un usage hors ligne (version hébergée du dépôt). Aucune donnée n'est envoyée.
const CACHE = "vrai-compteur-v2";
const FICHIERS = ["./", "index.html", "moteur.js", "strategie.js", "lecteur.js", "app.js", "manifest.webmanifest",
  "vendor/tesseract.min.js", "vendor/worker.min.js", "vendor/core/tesseract-core-simd-lstm.wasm.js", "vendor/core/tesseract-core-lstm.wasm.js", "vendor/lang/fra.traineddata.gz"];
self.addEventListener("install", (e) => e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FICHIERS)).catch(() => {})));
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request)));
});
