// Copie dans vendor/ les fichiers nécessaires à la lecture hors ligne (après « npm install »). Usage : npm run vendor
const fs = require("fs"), path = require("path");
const ici = path.resolve(__dirname, ".."), v = path.join(ici, "vendor");
const nm = path.join(ici, "node_modules");
const fichiers = [
  ["tesseract.js/dist/tesseract.min.js", "tesseract.min.js"],
  ["tesseract.js/dist/worker.min.js", "worker.min.js"],
  ["tesseract.js-core/tesseract-core-simd-lstm.wasm.js", "core/tesseract-core-simd-lstm.wasm.js"],
  ["tesseract.js-core/tesseract-core-lstm.wasm.js", "core/tesseract-core-lstm.wasm.js"],
  ["@tesseract.js-data/fra/4.0.0_best_int/fra.traineddata.gz", "lang/fra.traineddata.gz"],
];
for (const [src, dst] of fichiers) {
  const d = path.join(v, dst);
  fs.mkdirSync(path.dirname(d), { recursive: true });
  fs.copyFileSync(path.join(nm, src), d);
  console.log(dst, fs.statSync(d).size);
}

// Variante pour les hébergements qui ne servent pas les .gz : données de langue en base64 dans un .js.
const gz = fs.readFileSync(path.join(v, "lang/fra.traineddata.gz"));
fs.writeFileSync(path.join(v, "lang/fra-traineddata-gz.js"), "self.FRA_GZ_B64=" + JSON.stringify(gz.toString("base64")) + ";\n");
console.log("lang/fra-traineddata-gz.js", fs.statSync(path.join(v, "lang/fra-traineddata-gz.js")).size);
