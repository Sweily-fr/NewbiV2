// Word (.docx) au gabarit Newbi.
//
// textutil (macOS) produit un .docx valide mais perd les tableaux : on
// réutilise donc son squelette d'archive (Content_Types, rels, theme,
// docProps) et on écrit à la main word/document.xml et word/footer1.xml.
// Le pied de page est un VRAI pied de page Word, référencé dans sectPr, pour
// qu'il reste en bas de page comme sur le PDF.

const fs = require("fs");
const path = require("path");
const JSZip = require("jszip");
const { modeleDocument, EUR } = require("./modele-document.cjs");

const NOIR = "0A0A0A";
const GRIS_TEXTE = "6E6E6E";
const GRIS_BANDE = "E5E5E5";
const GRIS_TTC = "F2F2F2";
const FILET = "E5E5E5";

const NS =
  'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ' +
  'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';

const FONT = '<w:rFonts w:ascii="Helvetica" w:hAnsi="Helvetica" w:cs="Helvetica"/>';

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

// `size` en demi-points : 18 = 9 pt.
function run(texte, { gras = false, size = 18, couleur = NOIR } = {}) {
  // L'ordre des éléments de rPr est imposé par le schéma OOXML
  // (rFonts, b, color, sz, szCs) : Word refuse d'ouvrir un fichier qui s'en
  // écarte, avec une boîte de dialogue de réparation.
  const rpr =
    FONT +
    (gras ? "<w:b/>" : "") +
    `<w:color w:val="${couleur}"/>` +
    `<w:sz w:val="${size}"/><w:szCs w:val="${size}"/>`;
  return `<w:r><w:rPr>${rpr}</w:rPr><w:t xml:space="preserve">${esc(texte)}</w:t></w:r>`;
}

function para(contenu, { apres = 100, align = null, avant = 0 } = {}) {
  let ppr = `<w:spacing w:before="${avant}" w:after="${apres}" w:line="240" w:lineRule="auto"/>`;
  if (align) ppr += `<w:jc w:val="${align}"/>`;
  return `<w:p><w:pPr>${ppr}</w:pPr>${contenu || ""}</w:p>`;
}

const texte = (t, opts = {}) =>
  para(t === "" ? "" : run(t, opts), {
    apres: opts.apres ?? 100,
    align: opts.align,
    avant: opts.avant,
  });

function cellule(contenu, { largeur, total, fond = null, bordureBas = null, align = null, marges = true } = {}) {
  // Largeur en cinquantièmes de pourcent (5000 = 100 %) plutôt qu'en twips :
  // c'est la seule écriture que tous les moteurs honorent, y compris le rendu
  // macOS qui sert à contrôler le résultat ici. Word accepte les deux.
  // Ordre imposé : tcW, tcBorders, shd, tcMar.
  let tcpr = total
    ? `<w:tcW w:w="${Math.round((largeur / total) * 5000)}" w:type="pct"/>`
    : `<w:tcW w:w="${largeur}" w:type="dxa"/>`;
  tcpr +=
    // Ordre imposé aussi à l'intérieur de tcBorders : top, left, bottom, right.
    "<w:tcBorders>" +
    '<w:top w:val="nil"/><w:left w:val="nil"/>' +
    (bordureBas
      ? `<w:bottom w:val="single" w:sz="4" w:color="${bordureBas}"/>`
      : '<w:bottom w:val="nil"/>') +
    '<w:right w:val="nil"/>' +
    "</w:tcBorders>";
  if (fond) tcpr += `<w:shd w:val="clear" w:color="auto" w:fill="${fond}"/>`;
  if (marges) {
    tcpr +=
      "<w:tcMar>" +
      '<w:top w:w="80" w:type="dxa"/><w:bottom w:w="80" w:type="dxa"/>' +
      '<w:left w:w="80" w:type="dxa"/><w:right w:w="80" w:type="dxa"/>' +
      "</w:tcMar>";
  }
  // Le contenu est soit des runs à envelopper dans un paragraphe, soit des
  // paragraphes déjà formés : imbriquer un <w:p> dans un <w:p> est invalide,
  // Word et les moteurs de rendu macOS affichent alors une cellule VIDE.
  const ppr = `<w:spacing w:after="0" w:line="240" w:lineRule="auto"/>${align ? `<w:jc w:val="${align}"/>` : ""}`;
  const interieur = String(contenu).startsWith("<w:p")
    ? contenu
    : `<w:p><w:pPr>${ppr}</w:pPr>${contenu}</w:p>`;
  return `<w:tc><w:tcPr>${tcpr}</w:tcPr>${interieur}</w:tc>`;
}

function tableau(lignes, largeurs, { indent = 0 } = {}) {
  return (
    "<w:tbl><w:tblPr>" +
    // Ordre imposé : tblW, tblInd, tblBorders, tblLayout.
    '<w:tblW w:w="5000" w:type="pct"/>' +
    (indent ? `<w:tblInd w:w="${indent}" w:type="dxa"/>` : "") +
    '<w:tblBorders><w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="nil"/>' +
    '<w:right w:val="nil"/><w:insideH w:val="nil"/><w:insideV w:val="nil"/></w:tblBorders>' +
    '<w:tblLayout w:type="fixed"/>' +
    "</w:tblPr><w:tblGrid>" +
    largeurs.map((l) => `<w:gridCol w:w="${l}"/>`).join("") +
    "</w:tblGrid>" +
    lignes.map((c) => `<w:tr>${c}</w:tr>`).join("") +
    "</w:tbl>"
  );
}

// Largeur utile d'une A4 avec des marges de 20 mm : 9752 twips.
const UTILE = 9752;

function corps(m) {
  const b = [];

  // Titre et méta, alignés à droite.
  b.push(texte(m.titre, { size: 52, align: "right", apres: 140 }));
  for (const [libelle, valeur] of m.meta) {
    b.push(
      para(run(`${libelle}: `, { gras: true, size: 17 }) + run(valeur, { size: 17 }), {
        align: "right",
        apres: 40,
      })
    );
  }
  b.push(texte("", { apres: 320 }));

  // Émetteur et client côte à côte, sans bordure.
  const colonne = (lignes) =>
    lignes
      .map((l, i) =>
        i === 0
          ? para(run(l, { gras: true, size: 18 }), { apres: 120 })
          : para(run(l, { size: 17 }), { apres: 30 })
      )
      .join("");
  b.push(
    tableau(
      [
        cellule(colonne(m.emetteur), { largeur: 4876, total: 9752, marges: false }) +
          cellule(colonne(m.client), { largeur: 4876, total: 9752, marges: false }),
      ],
      [4876, 4876]
    )
  );
  b.push(texte("", { apres: 260 }));

  // Tableau des lignes : en-tête noir, texte blanc, filet clair sous chaque
  // ligne, aucune bordure verticale.
  const largeurs = [4352, 1100, 1500, 1100, 1700];
  const alignements = [null, "right", "right", "right", "right"];
  const rangs = [];
  rangs.push(
    m.colonnes
      .map((c, i) =>
        cellule(run(c, { gras: true, size: 16, couleur: "FFFFFF" }), {
          largeur: largeurs[i],
          total: UTILE,
          fond: NOIR,
          align: alignements[i],
        })
      )
      .join("")
  );
  const cellulesLigne = (valeurs) =>
    valeurs
      .map((v, i) =>
        cellule(v === "" ? "" : run(v, { size: 18 }), {
          largeur: largeurs[i],
          total: UTILE,
          bordureBas: FILET,
          align: alignements[i],
        })
      )
      .join("");
  for (const l of m.lignes) {
    rangs.push(
      cellulesLigne([
        l.description,
        `${l.quantite} ${l.unite}`,
        EUR.format(l.prixUnitaire),
        `${l.tva} %`,
        EUR.format(l.totalHt),
      ])
    );
  }
  // Trois lignes vides : le fichier est un modèle, on le remplit.
  for (let i = 0; i < 3; i++) rangs.push(cellulesLigne(["", "", "", "", ""]));
  b.push(tableau(rangs, largeurs));
  b.push(texte("", { apres: 200 }));

  // Totaux, alignés à droite sous le tableau.
  const largeursTot = [5452, 2600, 1700];
  const rangsTot = m.totaux.map(
    (t) =>
      cellule("", { largeur: largeursTot[0], total: UTILE, marges: false }) +
      cellule(run(t.libelle, { gras: Boolean(t.fort), size: t.fort ? 18 : 17 }), {
        largeur: largeursTot[1],
        total: UTILE,
        fond: t.fort ? GRIS_TTC : null,
      }) +
      cellule(run(EUR.format(t.montant), { gras: Boolean(t.fort), size: t.fort ? 18 : 17 }), {
        largeur: largeursTot[2],
        total: UTILE,
        fond: t.fort ? GRIS_TTC : null,
        align: "right",
      })
  );
  b.push(tableau(rangsTot, largeursTot));
  b.push(texte("", { apres: 300 }));

  if (m.conditions) b.push(texte(m.conditions, { size: 16, apres: 200 }));

  return b.join("");
}

function documentXml(m) {
  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    `<w:document ${NS}><w:body>` +
    corps(m) +
    '<w:sectPr><w:footerReference w:type="default" r:id="rId100"/>' +
    '<w:pgSz w:w="11906" w:h="16838"/>' +
    '<w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" ' +
    'w:header="709" w:footer="454" w:gutter="0"/></w:sectPr>' +
    "</w:body></w:document>"
  );
}

function footerXml(m) {
  const contenu = m.pied
    .map((l, i) =>
      para(run(l, { size: 15, couleur: GRIS_TEXTE }), {
        apres: i === m.pied.length - 1 ? 0 : 40,
      })
    )
    .join("");
  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    `<w:ftr ${NS}>` +
    tableau([cellule(contenu, { largeur: UTILE, total: UTILE, fond: GRIS_BANDE })], [UTILE]) +
    para("", { apres: 0 }) +
    "</w:ftr>"
  );
}

async function ecrireDocx(m, squelette, sortie) {
  const zip = await JSZip.loadAsync(fs.readFileSync(squelette));

  zip.file("word/document.xml", documentXml(m));
  zip.file("word/footer1.xml", footerXml(m));

  const types = await zip.file("[Content_Types].xml").async("string");
  zip.file(
    "[Content_Types].xml",
    types.replace(
      "</Types>",
      '<Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/></Types>'
    )
  );

  const rels = await zip.file("word/_rels/document.xml.rels").async("string");
  zip.file(
    "word/_rels/document.xml.rels",
    rels.replace(
      "</Relationships>",
      '<Relationship Id="rId100" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/></Relationships>'
    )
  );

  const buf = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  fs.mkdirSync(path.dirname(sortie), { recursive: true });
  fs.writeFileSync(sortie, buf);
  return sortie;
}

module.exports = { ecrireDocx };

if (require.main === module) {
  const racine = process.argv[2] || path.join(__dirname, "..", "..");
  const spec = JSON.parse(
    fs.readFileSync(process.argv[3] || path.join(__dirname, "rendus.json"), "utf8")
  );
  const squelette = path.join(__dirname, "squelette.docx");
  (async () => {
    for (const rendu of spec.rendus) {
      const m = modeleDocument(rendu);
      const f = await ecrireDocx(
        m,
        squelette,
        path.join(racine, "public", "modeles", `${m.slug}.docx`)
      );
      console.log(`${path.basename(f)} : ${fs.statSync(f).size} o`);
    }
  })();
}
