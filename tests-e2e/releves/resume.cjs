// Usage : node tests-e2e/releves/resume.cjs <dossier des relevés téléchargés> <nom du relevé> [detail]
// Résume un relevé (inventaire JSON) : chaque élément de la page et ce qu'il fait.
const fs = require("fs"), path = require("path");
const [dir, nom, detail] = process.argv.slice(2);
// Le relevé `<nom>.json`, cherché dans tout le dossier (un sous-dossier par machine).
const chercher = (d) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { const t = chercher(p); if (t) return t; }
    else if (e.name === nom + ".json") return p;
  }
  return null;
};
const f = chercher(dir);
if (!f) throw new Error(`Relevé « ${nom} » introuvable dans ${dir}`);
const r = JSON.parse(fs.readFileSync(f));
const court = (i) => Object.entries(i || {}).filter(([k]) => k !== "contenuFenetre").map(([k, v]) => k + "=" + JSON.stringify(v).slice(0, 150)).join(" ");
console.log(`== ${nom} ${r.url} (${r.total} éléments) champs: ${JSON.stringify(r.champs.map((c) => c.role + ":" + c.nom))}`);
if (r.problemesAuChargement) console.log("  PROBLÈMES AU CHARGEMENT:", r.problemesAuChargement);
for (const e of r.elements) {
  console.log(`- ${e.role} « ${e.nom} »${e.lien ? " → " + e.lien : ""}${e.premiereLigne ? " [1re ligne]" : ""}${e.desactive ? " [désactivé]" : ""}: ${court(e.issue)}${e.problemes ? "  PROBLÈMES: " + JSON.stringify(e.problemes) : ""}`);
  if (detail && e.issue?.contenuFenetre) console.log("    champs:", JSON.stringify(e.issue.contenuFenetre.champs.map((c) => `${c.role}:${c.nom}${c.obligatoire ? "*" : ""}`)), "| boutons:", JSON.stringify(e.issue.contenuFenetre.boutons));
  for (const s of e.sousElements || []) {
    console.log(`    > « ${s.nom} »: ${court(s.issue)}${s.problemes ? "  PROBLÈMES: " + JSON.stringify(s.problemes) : ""}`);
    if (detail && s.issue?.contenuFenetre) console.log("        champs:", JSON.stringify(s.issue.contenuFenetre.champs.map((c) => `${c.role}:${c.nom}${c.obligatoire ? "*" : ""}`)), "| boutons:", JSON.stringify(s.issue.contenuFenetre.boutons));
  }
}
