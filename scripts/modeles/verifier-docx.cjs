// Contrôle de l'ordre des enfants dans les .docx produits.
//
// Word n'est pas tolérant : un élément placé hors de la séquence imposée par
// le schéma OOXML déclenche « Word a détecté un problème de contenu » et le
// fichier s'ouvre vide ou pas du tout. Aucun validateur n'étant installé sur
// la machine, on vérifie ici les séquences des conteneurs qu'on écrit.
const fs = require("fs");
const path = require("path");
const JSZip = require("jszip");

const SEQUENCES = {
  "w:rPr": ["w:rStyle", "w:rFonts", "w:b", "w:bCs", "w:i", "w:iCs", "w:caps",
    "w:smallCaps", "w:strike", "w:color", "w:spacing", "w:w", "w:kern",
    "w:position", "w:sz", "w:szCs", "w:highlight", "w:u", "w:vertAlign",
    "w:rtl", "w:lang"],
  "w:pPr": ["w:pStyle", "w:keepNext", "w:keepLines", "w:pageBreakBefore",
    "w:widowControl", "w:numPr", "w:pBdr", "w:shd", "w:tabs", "w:spacing",
    "w:ind", "w:contextualSpacing", "w:jc", "w:outlineLvl", "w:rPr"],
  "w:tcPr": ["w:cnfStyle", "w:tcW", "w:gridSpan", "w:hMerge", "w:vMerge",
    "w:tcBorders", "w:shd", "w:noWrap", "w:tcMar", "w:textDirection",
    "w:tcFitText", "w:vAlign", "w:hideMark"],
  "w:tblPr": ["w:tblStyle", "w:tblpPr", "w:tblOverlap", "w:bidiVisual",
    "w:tblStyleRowBandSize", "w:tblStyleColBandSize", "w:tblW", "w:jc",
    "w:tblCellSpacing", "w:tblInd", "w:tblBorders", "w:shd", "w:tblLayout",
    "w:tblCellMar", "w:tblLook"],
  "w:sectPr": ["w:headerReference", "w:footerReference", "w:footnotePr",
    "w:endnotePr", "w:type", "w:pgSz", "w:pgMar", "w:paperSrc", "w:pgBorders",
    "w:lnNumType", "w:pgNumType", "w:cols", "w:formProt", "w:vAlign",
    "w:noEndnote", "w:titlePg", "w:textDirection", "w:bidi", "w:rtlGutter",
    "w:docGrid", "w:printerSettings"],
  "w:tcBorders": ["w:top", "w:start", "w:left", "w:bottom", "w:end", "w:right",
    "w:insideH", "w:insideV", "w:tl2br", "w:tr2bl"],
  "w:tblBorders": ["w:top", "w:start", "w:left", "w:bottom", "w:end", "w:right",
    "w:insideH", "w:insideV"],
};

function enfants(xml, balise) {
  // Parcours à pile : pour chaque ouverture de `balise`, on collecte les noms
  // des éléments ouverts juste en dessous d'elle. Les expressions régulières
  // ne suffisent pas, les conteneurs s'imbriquent (w:tcBorders dans w:tcPr).
  const out = [];
  const pile = [];
  const re = /<(\/?)(w:[a-zA-Z0-9]+)((?:[^>"']|"[^"]*"|'[^']*')*?)(\/?)>/g;
  let m;
  while ((m = re.exec(xml))) {
    const [, fermeture, nom, , autoFerme] = m;
    const parent = pile[pile.length - 1];
    if (fermeture) {
      if (parent && parent.nom === nom) {
        const fini = pile.pop();
        if (fini.nom === balise) out.push(fini.enfants);
      }
      continue;
    }
    if (parent) parent.enfants.push(nom);
    if (!autoFerme) pile.push({ nom, enfants: [] });
  }
  return out;
}

let erreurs = 0;
const dossier = process.argv[2];

(async () => {
  for (const f of fs.readdirSync(dossier).filter((n) => n.endsWith(".docx"))) {
    const z = await JSZip.loadAsync(fs.readFileSync(path.join(dossier, f)));
    for (const part of ["word/document.xml", "word/footer1.xml"]) {
      if (!z.file(part)) continue;
      const xml = await z.file(part).async("string");
      for (const [balise, ordre] of Object.entries(SEQUENCES)) {
        for (const liste of enfants(xml, balise)) {
          const rangs = liste.map((e) => [e, ordre.indexOf(e)]);
          const inconnu = rangs.find(([, r]) => r === -1);
          if (inconnu) {
            console.log(`${f} ${part} ${balise} : enfant inconnu ${inconnu[0]}`);
            erreurs++;
            continue;
          }
          for (let i = 1; i < rangs.length; i++) {
            if (rangs[i][1] < rangs[i - 1][1]) {
              console.log(
                `${f} ${part} ${balise} : ${rangs[i][0]} après ${rangs[i - 1][0]} (ordre invalide)`
              );
              erreurs++;
            }
          }
        }
      }
    }
    if (!erreurs) console.log(`${f} : séquences vérifiées`);
  }
  if (erreurs) {
    console.log(`${erreurs} séquence(s) invalide(s) : Word refuserait ces fichiers.`);
    process.exit(1);
  }
})();
