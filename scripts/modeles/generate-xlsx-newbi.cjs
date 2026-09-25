// Excel (.xlsx) au gabarit Newbi.
//
// Le paquet `xlsx` installé est l'édition communautaire de SheetJS : elle lit
// les styles mais ne les ÉCRIT pas (fonction réservée à l'édition Pro). Or
// l'en-tête noir et la bande grise du total TTC font toute la différence entre
// un tableur quelconque et un document Newbi. On écrit donc le classeur à la
// main, ce qui donne au passage la main sur les formules et les largeurs.

const fs = require("fs");
const path = require("path");
const JSZip = require("jszip");
const { modeleDocument } = require("./modele-document.cjs");

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const colonne = (i) => String.fromCharCode(65 + i);
const ref = (c, l) => `${colonne(c)}${l}`;

// ---------------------------------------------------------------- styles ---
// Index utilisés dans les cellules (attribut s). L'ordre suit celui des
// <xf> écrits dans cellXfs.
const S = {
  NORMAL: 0,
  TITRE: 1,
  META_LIB: 2,
  META_VAL: 3,
  GRAS: 4,
  PETIT: 5,
  TETE_G: 6,
  TETE_D: 7,
  CORPS_G: 8,
  CORPS_D: 9,
  CORPS_EUR: 10,
  TOT_LIB: 11,
  TOT_EUR: 12,
  TTC_LIB: 13,
  TTC_EUR: 14,
  CONDITIONS: 15,
  PIED: 16,
  CORPS_PCT: 17,
};

const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0.00\\ &quot;€&quot;"/></numFmts>
<fonts count="7">
<font><sz val="10"/><color rgb="FF0A0A0A"/><name val="Helvetica"/></font>
<font><sz val="24"/><color rgb="FF0A0A0A"/><name val="Helvetica"/></font>
<font><b/><sz val="9"/><color rgb="FF0A0A0A"/><name val="Helvetica"/></font>
<font><sz val="9"/><color rgb="FF0A0A0A"/><name val="Helvetica"/></font>
<font><b/><sz val="9"/><color rgb="FFFFFFFF"/><name val="Helvetica"/></font>
<font><sz val="8"/><color rgb="FF6E6E6E"/><name val="Helvetica"/></font>
<font><b/><sz val="10"/><color rgb="FF0A0A0A"/><name val="Helvetica"/></font>
</fonts>
<fills count="5">
<fill><patternFill patternType="none"/></fill>
<fill><patternFill patternType="gray125"/></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FF0A0A0A"/><bgColor indexed="64"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFF2F2F2"/><bgColor indexed="64"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFE5E5E5"/><bgColor indexed="64"/></patternFill></fill>
</fills>
<borders count="2">
<border><left/><right/><top/><bottom/><diagonal/></border>
<border><left/><right/><top/><bottom style="thin"><color rgb="FFE5E5E5"/></bottom><diagonal/></border>
</borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="18">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="right"/></xf>
<xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="right"/></xf>
<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="0" fontId="4" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>
<xf numFmtId="0" fontId="4" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
<xf numFmtId="0" fontId="3" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>
<xf numFmtId="0" fontId="3" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
<xf numFmtId="164" fontId="3" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
<xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="164" fontId="3" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1" applyAlignment="1"><alignment horizontal="right"/></xf>
<xf numFmtId="0" fontId="6" fillId="3" borderId="0" xfId="0" applyFont="1" applyFill="1"/>
<xf numFmtId="164" fontId="6" fillId="3" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="right"/></xf>
<xf numFmtId="0" fontId="5" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
<xf numFmtId="0" fontId="5" fillId="4" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center"/></xf>
<xf numFmtId="9" fontId="3" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

// ------------------------------------------------------------ construction ---
function feuille(m) {
  const lignes = [];
  const fusions = [];
  let n = 0;

  const pousser = (cellules) => {
    n += 1;
    if (cellules) lignes.push({ n, cellules });
    return n;
  };
  const txt = (c, v, s = S.PETIT) => ({ c, v, s, type: "s" });
  const num = (c, v, s, f) => ({ c, v, s, type: "n", f });

  // Titre et méta, à droite comme sur le PDF.
  // Dans une plage fusionnée, seule la cellule en haut à GAUCHE porte la
  // valeur : mise en E1, elle est ignorée. L'alignement à droite vient du
  // style.
  const lTitre = pousser([txt(0, m.titre, S.TITRE)]);
  fusions.push(`A${lTitre}:E${lTitre}`);
  pousser(null);
  for (const [libelle, valeur] of m.meta) {
    pousser([txt(3, `${libelle}:`, S.META_LIB), txt(4, valeur, S.META_VAL)]);
  }
  pousser(null);

  // Émetteur à gauche, client au milieu.
  const hauteur = Math.max(m.emetteur.length, m.client.length);
  for (let i = 0; i < hauteur; i++) {
    const cellules = [];
    if (m.emetteur[i]) cellules.push(txt(0, m.emetteur[i], i === 0 ? S.GRAS : S.PETIT));
    if (m.client[i]) cellules.push(txt(2, m.client[i], i === 0 ? S.GRAS : S.PETIT));
    pousser(cellules);
  }
  pousser(null);

  // Tableau : en-tête noir puis les lignes, avec trois lignes vierges à
  // remplir. Les totaux de ligne sont des formules pour que le classeur
  // recalcule dès la première saisie.
  const lTete = pousser(
    m.colonnes.map((c, i) => txt(i, c, i === 0 ? S.TETE_G : S.TETE_D))
  );
  const premiere = lTete + 1;
  const poserLigne = (l) => {
    const ligne = n + 1;
    // Renvoie du vide et non zéro : sur les lignes vierges d'un modèle, une
    // colonne de « 0,00 € » fait sale.
    const formule = `IF(B${ligne}="","",B${ligne}*C${ligne})`;
    pousser([
      txt(0, l ? l.description : "", S.CORPS_G),
      l ? num(1, l.quantite, S.CORPS_D) : txt(1, "", S.CORPS_D),
      l ? num(2, l.prixUnitaire, S.CORPS_EUR) : txt(2, "", S.CORPS_EUR),
      l ? num(3, l.tva / 100, S.CORPS_PCT) : txt(3, "", S.CORPS_PCT),
      num(4, l ? l.totalHt : "", S.CORPS_EUR, formule),
    ]);
  };
  m.lignes.forEach(poserLigne);
  for (let i = 0; i < 3; i++) poserLigne(null);
  const derniere = n;
  pousser(null);

  // Totaux : le HT somme la colonne, la TVA et le TTC suivent le HT.
  const refs = {};
  for (const t of m.totaux) {
    const ligne = n + 1;
    let f;
    if (t.libelle === "Total HT") f = `SUM(E${premiere}:E${derniere})`;
    else if (/^TVA /.test(t.libelle)) {
      const taux = parseFloat(t.libelle.replace(/[^\d.,]/g, "").replace(",", ".")) / 100;
      f = `${refs.ht}*${taux}`;
    } else if (t.libelle === "Total TVA") f = refs.tva ? `${refs.tva}` : undefined;
    else if (t.libelle === "Total TTC") f = refs.tva ? `${refs.ht}+${refs.tva}` : `${refs.ht}`;
    const fort = Boolean(t.fort);
    pousser([
      txt(3, t.libelle, fort ? S.TTC_LIB : S.TOT_LIB),
      num(4, t.montant, fort ? S.TTC_EUR : S.TOT_EUR, f),
    ]);
    if (t.libelle === "Total HT") refs.ht = ref(4, ligne);
    if (/^TVA /.test(t.libelle)) refs.tva = ref(4, ligne);
  }
  pousser(null);

  if (m.conditions) {
    const l = pousser([txt(0, m.conditions, S.CONDITIONS)]);
    fusions.push(`A${l}:E${l}`);
    pousser(null);
  }
  for (const l of m.pied) {
    const num = pousser([txt(0, l, S.PIED)]);
    fusions.push(`A${num}:E${num}`);
  }

  const cellule = ({ c, v, s, type, f }, ligneNum) => {
    const r = ref(c, ligneNum);
    if (type === "n") {
      // Valeur en cache vide sur les lignes vierges : sans cela les aperçus
      // (Finder, Google Drive) affichent « 0,00 € » tant que le classeur n'a
      // pas été recalculé.
      if (v === "") return `<c r="${r}" s="${s}" t="str"><f>${esc(f)}</f><v></v></c>`;
      return `<c r="${r}" s="${s}">${f ? `<f>${esc(f)}</f>` : ""}<v>${v}</v></c>`;
    }
    if (v === "") return `<c r="${r}" s="${s}"/>`;
    return `<c r="${r}" s="${s}" t="inlineStr"><is><t xml:space="preserve">${esc(v)}</t></is></c>`;
  };

  const corps = lignes
    .map((l) => {
      const hauteurLigne =
        l.n === lTitre ? ' ht="34" customHeight="1"' : l.n === lTete ? ' ht="20" customHeight="1"' : "";
      return `<row r="${l.n}"${hauteurLigne}>${l.cellules
        .map((c) => cellule(c, l.n))
        .join("")}</row>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>
<dimension ref="A1:E${n}"/>
<sheetViews><sheetView showGridLines="0" tabSelected="1" workbookViewId="0"/></sheetViews>
<sheetFormatPr defaultRowHeight="14"/>
<cols>
<col min="1" max="1" width="46" customWidth="1"/>
<col min="2" max="2" width="12" customWidth="1"/>
<col min="3" max="3" width="16" customWidth="1"/>
<col min="4" max="4" width="14" customWidth="1"/>
<col min="5" max="5" width="16" customWidth="1"/>
</cols>
<sheetData>${corps}</sheetData>
${fusions.length ? `<mergeCells count="${fusions.length}">${fusions.map((f) => `<mergeCell ref="${f}"/>`).join("")}</mergeCells>` : ""}
<pageMargins left="0.5" right="0.5" top="0.5" bottom="0.5" header="0.3" footer="0.3"/>
<pageSetup paperSize="9" orientation="portrait"/>
</worksheet>`;
}

async function ecrireXlsx(m, sortie) {
  const zip = new JSZip();
  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`
  );
  zip.file(
    "_rels/.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`
  );
  zip.file(
    "xl/workbook.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets><sheet name="${esc(m.titre.slice(0, 28))}" sheetId="1" r:id="rId1"/></sheets>
<calcPr calcId="0" fullCalcOnLoad="1"/>
</workbook>`
  );
  zip.file(
    "xl/_rels/workbook.xml.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`
  );
  zip.file("xl/styles.xml", STYLES);
  zip.file("xl/worksheets/sheet1.xml", feuille(m));

  const buf = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  fs.mkdirSync(path.dirname(sortie), { recursive: true });
  fs.writeFileSync(sortie, buf);
  return sortie;
}

module.exports = { ecrireXlsx };

if (require.main === module) {
  const racine = process.argv[2] || path.join(__dirname, "..", "..");
  const spec = JSON.parse(
    fs.readFileSync(process.argv[3] || path.join(__dirname, "rendus.json"), "utf8")
  );
  (async () => {
    for (const rendu of spec.rendus) {
      const m = modeleDocument(rendu);
      const f = await ecrireXlsx(m, path.join(racine, "public", "modeles", `${m.slug}.xlsx`));
      console.log(`${path.basename(f)} : ${fs.statSync(f).size} o`);
    }
  })();
}
