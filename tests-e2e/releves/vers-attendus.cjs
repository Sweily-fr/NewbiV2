// Usage : node tests-e2e/releves/vers-attendus.cjs <dossier des relevés téléchargés> <nom du relevé>
// Transforme un relevé (inventaire JSON) en description « boutons » pour verifierBoutons.
const fs = require("fs"), path = require("path");
const [dir, nom] = process.argv.slice(2);
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
const js = (v) => JSON.stringify(v);
function attendu(i) {
  if (!i) return "{ /* ? */ }";
  if (i.nonEssaye === "désactivé") return `{ desactive: "?" }`;
  if (i.nonEssaye) return `{ /* non essayé : ${i.nonEssaye} */ }`;
  const a = [];
  if (i.fenetres) a.push(`fenetre: ${js(i.fenetres[0])}`);
  if (i.menu && !i.fenetres) a.push(`menu: ${js(i.menu)}`);
  if (i.navigation) a.push(`navigation: ${js(i.navigation)}`);
  if (i.telechargements) a.push(`telechargement: /${i.telechargements[0].replace(/\d{4}-\d{2}-\d{2}_\d{2}-\d{2}/, "\\d{4}-\\d{2}-\\d{2}_\\d{2}-\\d{2}").replace(/\./g, "\\.")}$/`);
  if (i.notifications && !i.fenetres) a.push(`notification: /${i.notifications[0].replace(/^\w+ : /, "").replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")}/`);
  if (i.options) a.push(`options: ${js(i.options)}`);
  if (i.selecteurDeFichier) a.push(`selecteurDeFichier: true`);
  if (!a.length && i.etat) a.push(`etat: /${i.etat.split(" → ")[1].replace(/[[\]]/g, "\\$&")}/`);
  if (!a.length && i.contenuModifie) a.push(`contenu: true`);
  if (!a.length && i.rien) a.push(`sansEffet: "?"`);
  return `{ ${a.join(", ")} }`;
}
const lignes = [];
for (const e of r.elements) {
  const cle = e.role === "link" ? `link ${e.lien}` : `${e.role} ${e.nom}`;
  lignes.push(`  ${js(cle)}: ${attendu(e.issue)},`);
  for (const s of e.sousElements || []) lignes.push(`  ${js(cle + " > " + s.nom)}: ${attendu(s.issue)},`);
}
console.log(`// ${nom} (${r.url})\n{\n${lignes.join("\n")}\n}`);
