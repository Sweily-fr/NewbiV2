// Excel (.xlsx) au gabarit Newbi.
//
// Le paquet `xlsx` installé est l'édition communautaire de SheetJS : elle lit
// les styles mais ne les ÉCRIT pas (fonction réservée à l'édition Pro). Or
// l'en-tête noir et la bande grise du total TTC font toute la différence entre
// un tableur quelconque et un document Newbi. On écrit donc le classeur à la
// main, ce qui donne au passage la main sur les formules et les largeurs.
//
// Deux familles de classeurs :
//   - les documents chiffrés de rendus.json (facture, devis, avoir, reçu...),
//     une feuille au gabarit des factures ;
//   - les tableurs de tableurs.cjs (note de frais, plan de trésorerie, suivi
//     des factures), plusieurs feuilles construites avec la classe Feuille.
//     Leurs formules sont calculées par formules.cjs pour écrire la valeur en
//     cache : LibreOffice et les aperçus n'affichent que celle-ci.

const fs = require("fs");
const path = require("path");
const JSZip = require("jszip");
const { modeleDocument } = require("./modele-document.cjs");
const { evaluerClasseur, estErreur, serie, decoder, adresse } = require("./formules.cjs");

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
const escAttr = (s) => esc(s).replace(/"/g, "&quot;");

const colonne = (i) => String.fromCharCode(65 + i);
const ref = (c, l) => `${colonne(c)}${l}`;

// ---------------------------------------------------------------- styles ---
// Index utilisés dans les cellules (attribut s). L'ordre suit celui des
// <xf> écrits dans cellXfs. Les 18 premiers servent aux documents chiffrés ;
// les suivants ont été ajoutés pour les tableurs, à la suite pour ne pas
// décaler les index existants.
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
  TITRE_G: 18,
  TETE_G_W: 19,
  TETE_D_W: 20,
  CORPS_DATE: 21,
  CORPS_PCT2: 22,
  CORPS_ENTIER: 23,
  CORPS_C: 24,
  TTC_ENTIER: 25,
  SECTION: 26,
  PARAM_PCT: 27,
  PARAM_ENTIER: 28,
  PARAM_DATE: 29,
  TTC_PCT: 30,
  TOT_PCT: 31,
  TOT_ENTIER: 32,
  CORPS_G_W: 33,
  CORPS_COEF: 34,
};

const XF = [
  '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>',
  '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>',
  '<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="right"/></xf>',
  '<xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="right"/></xf>',
  '<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>',
  '<xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1"/>',
  '<xf numFmtId="0" fontId="4" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>',
  '<xf numFmtId="0" fontId="4" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>',
  '<xf numFmtId="0" fontId="3" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>',
  '<xf numFmtId="0" fontId="3" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>',
  '<xf numFmtId="164" fontId="3" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>',
  '<xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1"/>',
  '<xf numFmtId="164" fontId="3" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1" applyAlignment="1"><alignment horizontal="right"/></xf>',
  '<xf numFmtId="0" fontId="6" fillId="3" borderId="0" xfId="0" applyFont="1" applyFill="1"/>',
  '<xf numFmtId="164" fontId="6" fillId="3" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="right"/></xf>',
  '<xf numFmtId="0" fontId="5" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>',
  '<xf numFmtId="0" fontId="5" fillId="4" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center"/></xf>',
  '<xf numFmtId="9" fontId="3" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>',
  // Tableurs.
  '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>',
  '<xf numFmtId="0" fontId="4" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="left" vertical="center" wrapText="1"/></xf>',
  '<xf numFmtId="0" fontId="4" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="right" vertical="center" wrapText="1"/></xf>',
  '<xf numFmtId="165" fontId="3" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>',
  '<xf numFmtId="10" fontId="3" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>',
  '<xf numFmtId="3" fontId="3" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>',
  '<xf numFmtId="0" fontId="3" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>',
  '<xf numFmtId="3" fontId="6" fillId="3" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="right"/></xf>',
  '<xf numFmtId="0" fontId="2" fillId="4" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center"/></xf>',
  '<xf numFmtId="10" fontId="3" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1" applyAlignment="1"><alignment horizontal="right"/></xf>',
  '<xf numFmtId="3" fontId="3" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1" applyAlignment="1"><alignment horizontal="right"/></xf>',
  '<xf numFmtId="165" fontId="3" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1" applyAlignment="1"><alignment horizontal="right"/></xf>',
  '<xf numFmtId="10" fontId="6" fillId="3" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="right"/></xf>',
  '<xf numFmtId="10" fontId="3" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1" applyAlignment="1"><alignment horizontal="right"/></xf>',
  '<xf numFmtId="3" fontId="3" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1" applyAlignment="1"><alignment horizontal="right"/></xf>',
  '<xf numFmtId="0" fontId="3" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>',
  '<xf numFmtId="166" fontId="3" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>',
];

const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="3"><numFmt numFmtId="164" formatCode="#,##0.00\\ &quot;€&quot;"/><numFmt numFmtId="165" formatCode="dd/mm/yyyy"/><numFmt numFmtId="166" formatCode="0.000"/></numFmts>
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
<cellXfs count="${XF.length}">
${XF.join("\n")}
</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
<dxfs count="1"><dxf><font><color rgb="FF9C0006"/></font><fill><patternFill patternType="solid"><bgColor rgb="FFFFC7CE"/></patternFill></fill></dxf></dxfs>
</styleSheet>`;

// Hauteur d'une ligne de texte fusionnée sur toute la largeur : Excel n'ajuste
// pas la hauteur des cellules fusionnées, on l'estime (texte de 8 pt).
const hauteurTexte = (t, caracteresParLigne = 125) =>
  Math.max(14, Math.ceil(String(t).length / caracteresParLigne) * 11 + 3);

// ------------------------------------------------- documents chiffrés ---
const STYLE_FORMAT = {
  texte: S.CORPS_G,
  quantite: S.CORPS_D,
  eur: S.CORPS_EUR,
  pct: S.CORPS_PCT,
  date: S.CORPS_DATE,
};

function feuille(m) {
  const lignes = [];
  const fusions = [];
  const hauteurs = {};
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

  // Émetteur à gauche, client au milieu, sous un intitulé discret pour les
  // modèles qui en ont un.
  if (m.intitulesBlocs) {
    pousser([txt(0, m.intitulesBlocs[0], S.CONDITIONS), txt(2, m.intitulesBlocs[1], S.CONDITIONS)]);
  }
  const hauteur = Math.max(m.emetteur.length, m.client.length);
  for (let i = 0; i < hauteur; i++) {
    const cellules = [];
    if (m.emetteur[i]) cellules.push(txt(0, m.emetteur[i], i === 0 ? S.GRAS : S.PETIT));
    if (m.client[i]) cellules.push(txt(2, m.client[i], i === 0 ? S.GRAS : S.PETIT));
    pousser(cellules);
  }
  pousser(null);

  // Tableau : en-tête noir puis les lignes, avec trois lignes vierges à
  // remplir. Le total de ligne est une formule pour que le classeur recalcule
  // dès la première saisie (sauf pour le reçu, où le montant se saisit).
  const cols = m.tableau.colonnes;
  const lTete = pousser(
    cols.map((c, i) => txt(i, c.libelle, i === 0 ? S.TETE_G : S.TETE_D))
  );
  const premiere = lTete + 1;
  const poserLigne = (l) => {
    const ligne = n + 1;
    const cellules = cols.map((col, i) => {
      const s = STYLE_FORMAT[col.format];
      const dernier = i === cols.length - 1;
      if (dernier && m.tableau.formule) {
        // Renvoie du vide et non zéro : sur les lignes vierges d'un modèle,
        // une colonne de « 0,00 € » fait sale.
        return num(i, l ? l.totalHt : "", s, m.tableau.formule(ligne));
      }
      const v = l ? l.xlsx[i] : "";
      if (v === "" || v === null || v === undefined) return txt(i, "", s);
      if (col.format === "date") return num(i, serie(v), s);
      return typeof v === "number" ? num(i, v, s) : txt(i, v, s);
    });
    pousser(cellules);
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
    if (t.formule) {
      f = t.formule({ premiere, derniere, refs });
      if (t.cle) refs[t.cle] = ref(4, ligne);
    } else {
      if (t.libelle === "Total HT") f = `SUM(E${premiere}:E${derniere})`;
      else if (/^TVA /.test(t.libelle)) {
        const taux = parseFloat(t.libelle.replace(/[^\d.,]/g, "").replace(",", ".")) / 100;
        f = `${refs.ht}*${taux}`;
      } else if (t.libelle === "Total TVA") f = refs.tva ? `${refs.tva}` : undefined;
      else if (t.libelle === "Total TTC") f = refs.tva ? `${refs.ht}+${refs.tva}` : `${refs.ht}`;
      if (t.libelle === "Total HT") refs.ht = ref(4, ligne);
      if (/^TVA /.test(t.libelle)) refs.tva = ref(4, ligne);
    }
    const fort = Boolean(t.fort);
    pousser([
      txt(3, t.libelle, fort ? S.TTC_LIB : S.TOT_LIB),
      num(4, t.montant, fort ? S.TTC_EUR : S.TOT_EUR, f),
    ]);
  }
  pousser(null);

  if (Array.isArray(m.conditions)) {
    for (const c of m.conditions) {
      const texteBrut = c.replace(/\*\*/g, "");
      const l = pousser([txt(0, texteBrut, S.CONDITIONS)]);
      fusions.push(`A${l}:E${l}`);
      hauteurs[l] = hauteurTexte(texteBrut);
    }
    pousser(null);
  } else if (m.conditions) {
    const l = pousser([txt(0, m.conditions, S.CONDITIONS)]);
    fusions.push(`A${l}:E${l}`);
    pousser(null);
  }
  if (m.signature) {
    for (const s of m.signature) pousser([txt(0, s.replace(/\*\*/g, ""), S.PETIT)]);
    pousser(null);
    pousser(null);
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
        l.n === lTitre
          ? ' ht="34" customHeight="1"'
          : l.n === lTete
            ? ' ht="20" customHeight="1"'
            : hauteurs[l.n]
              ? ` ht="${hauteurs[l.n]}" customHeight="1"`
              : "";
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

// ------------------------------------------------------------ tableurs ---
// Feuille construite cellule par cellule. Valeurs acceptées par `set` :
// nombre, texte, { f: "formule" }, { date: "AAAA-MM-JJ" }.
class Feuille {
  constructor(nom, { largeurs, figer = null, filtre = null, paysage = false, ajuster = true } = {}) {
    this.nom = nom;
    this.largeurs = largeurs;
    this.figer = figer;
    this.filtre = filtre;
    this.paysage = paysage;
    this.ajuster = ajuster;
    this.cellules = new Map();
    this.fusions = [];
    this.hauteurs = {};
    this.listes = [];
    this.alertes = [];
  }
  set(a, v, s = S.PETIT) {
    let cel;
    if (v && typeof v === "object" && "f" in v) cel = { f: v.f, s };
    else if (v && typeof v === "object" && "date" in v) cel = { v: serie(v.date), s };
    else cel = { v: v === undefined ? null : v, s };
    this.cellules.set(a, cel);
    return this;
  }
  fusion(plage) {
    this.fusions.push(plage);
    return this;
  }
  hauteur(l, ht) {
    this.hauteurs[l] = ht;
    return this;
  }
  // Liste déroulante : valeurs fixes (tableau) ou plage (texte).
  liste(plage, source) {
    this.listes.push({ plage, source });
    return this;
  }
  // Mise en forme conditionnelle : fond rouge quand la formule est vraie
  // (formule écrite pour la cellule en haut à gauche de la plage).
  alerte(plage, formule) {
    this.alertes.push({ plage, formule });
    return this;
  }
}

function xmlFeuille(f, valeurs, { active }) {
  const parLigne = new Map();
  let maxC = 1;
  let maxL = 1;
  for (const [a, cel] of f.cellules) {
    const { c, l } = decoder(a);
    maxC = Math.max(maxC, c);
    maxL = Math.max(maxL, l);
    if (!parLigne.has(l)) parLigne.set(l, []);
    parLigne.get(l).push({ a, c, cel });
  }
  const celluleXml = ({ a, cel }) => {
    const s = cel.s ?? 0;
    if (cel.f) {
      const v = valeurs.get(`${f.nom}!${a}`);
      if (estErreur(v)) throw new Error(`${f.nom}!${a} : ${v} (${cel.f})`);
      const fx = `<f>${esc(cel.f)}</f>`;
      if (typeof v === "number") return `<c r="${a}" s="${s}">${fx}<v>${+v.toFixed(10)}</v></c>`;
      if (typeof v === "boolean") return `<c r="${a}" s="${s}" t="b">${fx}<v>${v ? 1 : 0}</v></c>`;
      return `<c r="${a}" s="${s}" t="str">${fx}<v>${esc(v ?? "")}</v></c>`;
    }
    if (cel.v === null || cel.v === "") return `<c r="${a}" s="${s}"/>`;
    if (typeof cel.v === "number") return `<c r="${a}" s="${s}"><v>${cel.v}</v></c>`;
    return `<c r="${a}" s="${s}" t="inlineStr"><is><t xml:space="preserve">${esc(cel.v)}</t></is></c>`;
  };
  const lignesXml = [...parLigne.keys()]
    .sort((x, y) => x - y)
    .map((l) => {
      const ht = f.hauteurs[l] ? ` ht="${f.hauteurs[l]}" customHeight="1"` : "";
      const cels = parLigne.get(l).sort((x, y) => x.c - y.c).map(celluleXml).join("");
      return `<row r="${l}"${ht}>${cels}</row>`;
    })
    .join("");

  let vue = `<sheetView showGridLines="0"${active ? ' tabSelected="1"' : ""} workbookViewId="0"`;
  if (f.figer) {
    const { lignes = 0, colonnes = 0 } = f.figer;
    const haut = adresse(colonnes + 1, lignes + 1);
    const pane = colonnes && lignes ? "bottomRight" : lignes ? "bottomLeft" : "topRight";
    vue +=
      `><pane${colonnes ? ` xSplit="${colonnes}"` : ""}${lignes ? ` ySplit="${lignes}"` : ""}` +
      ` topLeftCell="${haut}" activePane="${pane}" state="frozen"/>` +
      `<selection pane="${pane}" activeCell="${haut}" sqref="${haut}"/></sheetView>`;
  } else vue += "/>";

  const cols = f.largeurs
    .map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`)
    .join("");
  const cf = f.alertes
    .map(
      (a, i) =>
        `<conditionalFormatting sqref="${a.plage}"><cfRule type="expression" dxfId="0" priority="${i + 1}">` +
        `<formula>${esc(a.formule)}</formula></cfRule></conditionalFormatting>`
    )
    .join("");
  const dv = f.listes.length
    ? `<dataValidations count="${f.listes.length}">` +
      f.listes
        .map(
          (l) =>
            `<dataValidation type="list" allowBlank="1" showErrorMessage="1" sqref="${l.plage}"><formula1>${
              Array.isArray(l.source) ? esc(`"${l.source.join(",")}"`) : esc(l.source)
            }</formula1></dataValidation>`
        )
        .join("") +
      "</dataValidations>"
    : "";

  // Ordre imposé des enfants de worksheet : sheetPr, dimension, sheetViews,
  // sheetFormatPr, cols, sheetData, autoFilter, mergeCells,
  // conditionalFormatting, dataValidations, pageMargins, pageSetup.
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<sheetPr>${f.ajuster ? '<pageSetUpPr fitToPage="1"/>' : ""}</sheetPr>
<dimension ref="A1:${adresse(maxC, maxL)}"/>
<sheetViews>${vue}</sheetViews>
<sheetFormatPr defaultRowHeight="14"/>
<cols>${cols}</cols>
<sheetData>${lignesXml}</sheetData>
${f.filtre ? `<autoFilter ref="${f.filtre}"/>` : ""}
${f.fusions.length ? `<mergeCells count="${f.fusions.length}">${f.fusions.map((x) => `<mergeCell ref="${x}"/>`).join("")}</mergeCells>` : ""}
${cf}${dv}
<pageMargins left="0.4" right="0.4" top="0.5" bottom="0.5" header="0.3" footer="0.3"/>
<pageSetup paperSize="9" orientation="${f.paysage ? "landscape" : "portrait"}"${f.ajuster ? ' fitToHeight="0"' : ""}/>
</worksheet>`;
}

// Évalue toutes les formules du classeur et renvoie le XML de chaque feuille.
function construireClasseur(feuilles, { aujourdhui, active = 0 } = {}) {
  const modele = new Map(feuilles.map((f) => [f.nom, f.cellules]));
  const valeurs = evaluerClasseur(modele, { aujourdhui });
  const noms = [];
  feuilles.forEach((f, i) => {
    if (f.filtre) {
      noms.push(
        `<definedName name="_xlnm._FilterDatabase" localSheetId="${i}" hidden="1">'${f.nom.replace(/'/g, "''")}'!${f.filtre
          .split(":")
          .map((a) => a.replace(/^([A-Z]+)(\d+)$/, "$$$1$$$2"))
          .join(":")}</definedName>`
      );
    }
  });
  return {
    feuilles: feuilles.map((f, i) => ({ nom: f.nom, xml: xmlFeuille(f, valeurs, { active: i === active }) })),
    nomsDefinis: noms,
    active,
    valeurs,
  };
}

// --------------------------------------------------------- écriture ---
async function ecrireClasseur({ feuilles, nomsDefinis = [], active = 0 }, sortie) {
  const zip = new JSZip();
  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
${feuilles
  .map(
    (_, i) =>
      `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
  )
  .join("\n")}
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
  const vues =
    feuilles.length > 1 ? `<bookViews><workbookView activeTab="${active}"/></bookViews>\n` : "";
  zip.file(
    "xl/workbook.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
${vues}<sheets>${feuilles
      .map((f, i) => `<sheet name="${escAttr(f.nom.slice(0, 31))}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`)
      .join("")}</sheets>
${nomsDefinis.length ? `<definedNames>${nomsDefinis.join("")}</definedNames>\n` : ""}<calcPr calcId="0" fullCalcOnLoad="1"/>
</workbook>`
  );
  zip.file(
    "xl/_rels/workbook.xml.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${feuilles
  .map(
    (_, i) =>
      `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`
  )
  .join("\n")}
<Relationship Id="rId${feuilles.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`
  );
  zip.file("xl/styles.xml", STYLES);
  feuilles.forEach((f, i) => zip.file(`xl/worksheets/sheet${i + 1}.xml`, f.xml));

  const buf = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  fs.mkdirSync(path.dirname(sortie), { recursive: true });
  fs.writeFileSync(sortie, buf);
  return sortie;
}

const ecrireXlsx = (m, sortie) =>
  ecrireClasseur({ feuilles: [{ nom: m.nomFeuille || m.titre.slice(0, 28), xml: feuille(m) }] }, sortie);

module.exports = { ecrireXlsx, ecrireClasseur, construireClasseur, Feuille, S };

if (require.main === module) {
  // node generate-xlsx-newbi.cjs [racine] [rendus.json] [slug...]
  // Sans slug, tous les modèles sont régénérés.
  const racine = process.argv[2] || path.join(__dirname, "..", "..");
  const spec = JSON.parse(
    fs.readFileSync(process.argv[3] || path.join(__dirname, "rendus.json"), "utf8")
  );
  const filtre = process.argv.slice(4);
  const garder = (slug) => !filtre.length || filtre.includes(slug);
  const { TABLEURS } = require("./tableurs.cjs");
  (async () => {
    for (const rendu of spec.rendus.filter((r) => garder(r.slug))) {
      const m = modeleDocument(rendu);
      const f = await ecrireXlsx(m, path.join(racine, "public", "modeles", `${m.slug}.xlsx`));
      console.log(`${path.basename(f)} : ${fs.statSync(f).size} o`);
    }
    for (const t of TABLEURS.filter((x) => garder(x.slug))) {
      // TODAY() est calculé à la date de génération pour la valeur en cache ;
      // Excel et Numbers le recalculent à l'ouverture.
      const j = new Date();
      const aujourdhui = serie(
        `${j.getFullYear()}-${String(j.getMonth() + 1).padStart(2, "0")}-${String(j.getDate()).padStart(2, "0")}`
      );
      const classeur = construireClasseur(t.feuilles(), { aujourdhui, active: t.active || 0 });
      const f = await ecrireClasseur(classeur, path.join(racine, "public", "modeles", `${t.slug}.xlsx`));
      console.log(`${path.basename(f)} : ${fs.statSync(f).size} o`);
    }
  })();
}
