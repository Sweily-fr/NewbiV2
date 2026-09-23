// Génère les modèles au format Excel (.xlsx) et PDF à partir de modeles.json.
// Les fichiers sont écrits dans public/modeles/ du worktree passé en argument.
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");
const { jsPDF } = require("jspdf");

const ROOT = process.argv[2];
const SPEC = JSON.parse(fs.readFileSync(process.argv[3], "utf8"));
const OUT = path.join(ROOT, "public", "modeles");
fs.mkdirSync(OUT, { recursive: true });

const VIOLET = [90, 80, 255];
const GRIS = [110, 110, 110];

/* ---------------------------------- Excel --------------------------------- */
function buildXlsx(m, commun) {
  const rows = [];
  rows.push([m.titre]);
  rows.push([]);
  rows.push(["ÉMETTEUR"]);
  commun.emetteur.forEach((l) => rows.push([l]));
  rows.push([]);
  rows.push(["CLIENT"]);
  commun.client.forEach((l) => rows.push([l]));
  rows.push([]);
  m.meta.forEach(([k, v]) => rows.push([k, v]));
  rows.push([]);

  rows.push(m.colonnes);
  const firstLine = rows.length;
  // Dans le classeur, les montants doivent être de vrais nombres, sinon les
  // formules ne calculent rien. Le PDF garde lui les chaînes formatées.
  const num = (c) => {
    if (typeof c !== "string") return c;
    const t = c.replace(/\u00a0/g, " ").trim();
    if (!/^[\d  ]+(,\d+)?$/.test(t)) return c;
    const v = parseFloat(t.replace(/[  ]/g, "").replace(",", "."));
    return Number.isNaN(v) ? c : v;
  };
  m.lignes.forEach((l) => rows.push(l.map(num)));
  const lastLine = rows.length;
  rows.push([]);
  const totalsStart = rows.length;
  m.totaux.forEach(([k, v]) => rows.push([k, v]));
  rows.push([]);
  rows.push(["MENTIONS OBLIGATOIRES"]);
  m.mentions.forEach((l) => rows.push([l]));
  rows.push([]);
  rows.push([
    "Modèle fourni par Newbi - https://www.newbi.fr - à compléter avec vos informations.",
  ]);

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Largeurs : première colonne large (désignations et mentions), les autres
  // dimensionnées pour des montants.
  ws["!cols"] = [{ wch: 46 }, { wch: 14 }, { wch: 18 }, { wch: 12 }, { wch: 16 }];

  // Une formule de total par ligne quand le modèle a une colonne « Total »
  // calculable : la personne saisit quantité et prix, Excel calcule.
  const nCols = m.colonnes.length;
  const qteCol = m.colonnes.findIndex((c) => /quantit/i.test(c));
  const puCol = m.colonnes.findIndex((c) => /prix unitaire/i.test(c));
  const totCol = nCols - 1;
  if (qteCol > 0 && puCol > 0) {
    // SheetJS n'écrit une formule que si la cellule porte aussi une valeur :
    // on met le résultat calculé, qu'Excel recalculera à la première saisie.
    let somme = 0;
    for (let r = firstLine; r < lastLine; r++) {
      const ref = XLSX.utils.encode_cell({ r, c: totCol });
      const q = XLSX.utils.encode_cell({ r, c: qteCol });
      const p = XLSX.utils.encode_cell({ r, c: puCol });
      const qv = rows[r][qteCol];
      const pv = rows[r][puCol];
      const v = typeof qv === "number" && typeof pv === "number" ? qv * pv : 0;
      somme += v;
      ws[ref] = { t: "n", v, f: `IF(${q}="",0,${q}*${p})`, z: "#  ##0.00" };
    }
    const from = XLSX.utils.encode_cell({ r: firstLine, c: totCol });
    const to = XLSX.utils.encode_cell({ r: lastLine - 1, c: totCol });
    const sumRef = XLSX.utils.encode_cell({ r: totalsStart, c: 1 });
    ws[sumRef] = {
      t: "n",
      v: somme,
      f: `SUM(${from}:${to})`,
      z: "#  ##0.00",
    };

    // TVA et total TTC suivent le total HT : si l'utilisateur change une
    // ligne, tout se recalcule. Le taux est lu dans le libellé (« TVA 20 % »).
    const htRef = sumRef;
    let htVal = somme;
    let tvaRef = null;
    let tvaVal = 0;
    m.totaux.forEach(([libelle], i) => {
      if (i === 0) return;
      const ref = XLSX.utils.encode_cell({ r: totalsStart + i, c: 1 });
      const taux = /TVA\s*(\d+(?:[.,]\d+)?)\s*%/i.exec(libelle);
      if (taux) {
        const t = parseFloat(taux[1].replace(",", ".")) / 100;
        tvaVal = Math.round(htVal * t * 100) / 100;
        tvaRef = ref;
        ws[ref] = { t: "n", v: tvaVal, f: `${htRef}*${t}`, z: "#  ##0.00" };
      } else if (/TTC/i.test(libelle)) {
        const f = tvaRef ? `${htRef}+${tvaRef}` : htRef;
        ws[ref] = {
          t: "n",
          v: Math.round((htVal + tvaVal) * 100) / 100,
          f,
          z: "#  ##0.00",
        };
      }
    });
  }

  ws["!ref"] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: rows.length, c: Math.max(4, nCols - 1) },
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, m.titre.slice(0, 28));
  const file = path.join(OUT, `${m.slug}.xlsx`);
  XLSX.writeFile(wb, file);
  return file;
}

/* ----------------------------------- PDF ---------------------------------- */
function buildPdf(m, commun) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const L = 18;
  const R = 192;
  let y = 22;

  const text = (s, x, yy, { size = 10, bold = false, color = [0, 0, 0], align } = {}) => {
    doc.setFontSize(size);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setTextColor(...color);
    doc.text(String(s), x, yy, align ? { align } : undefined);
  };

  text(m.titre, L, y, { size: 22, bold: true, color: VIOLET });
  y += 10;

  // Émetteur à gauche, client à droite
  const top = y;
  text("ÉMETTEUR", L, y, { size: 8, bold: true, color: GRIS });
  y += 5;
  commun.emetteur.forEach((l) => {
    text(l, L, y, { size: 9 });
    y += 4.6;
  });
  let y2 = top;
  text("CLIENT", 110, y2, { size: 8, bold: true, color: GRIS });
  y2 += 5;
  commun.client.forEach((l) => {
    text(l, 110, y2, { size: 9 });
    y2 += 4.6;
  });
  y = Math.max(y, y2) + 6;

  m.meta.forEach(([k, v]) => {
    text(`${k} :`, L, y, { size: 9, color: GRIS });
    text(v, 85, y, { size: 9, bold: true });
    y += 5;
  });
  y += 4;

  // Tableau des lignes
  const n = m.colonnes.length;
  // La première colonne (désignation) prend le reste ; les colonnes de
  // montants ont besoin d'au moins 26 mm pour que « Prix unitaire HT » et
  // « Quantité » ne se chevauchent pas à 8 pt.
  const wOther = Math.max(26, (R - L - 60) / (n - 1));
  const wFirst = R - L - wOther * (n - 1);
  const colX = [L];
  for (let i = 1; i < n; i++) colX.push(L + wFirst + (i - 1) * wOther);

  doc.setFillColor(242, 241, 255);
  doc.rect(L, y - 5, R - L, 8, "F");
  m.colonnes.forEach((c, i) => {
    const right = i > 0;
    text(c, right ? colX[i] + wOther - 2 : colX[i] + 2, y, {
      size: 8,
      bold: true,
      align: right ? "right" : undefined,
    });
  });
  y += 6;
  doc.setDrawColor(210, 210, 210);

  m.lignes.forEach((ligne) => {
    ligne.forEach((c, i) => {
      if (!c) return;
      const right = i > 0;
      text(c, right ? colX[i] + wOther - 2 : colX[i] + 2, y, {
        size: 9,
        align: right ? "right" : undefined,
      });
    });
    y += 5;
    doc.line(L, y - 3.2, R, y - 3.2);
    y += 2;
  });
  y += 4;

  // Le libellé démarre assez à gauche pour ne pas heurter le montant, qui est
  // aligné à droite (cas « Acompte à la commande [30 %] » sur le devis).
  m.totaux.forEach(([k, v]) => {
    const fort = /TTC|à payer/i.test(k);
    text(k, 98, y, { size: fort ? 11 : 9, bold: fort });
    text(`${v} €`, R, y, { size: fort ? 11 : 9, bold: fort, align: "right" });
    y += fort ? 7 : 5.5;
  });
  y += 4;

  text("MENTIONS OBLIGATOIRES", L, y, { size: 8, bold: true, color: GRIS });
  y += 5;
  m.mentions.forEach((l) => {
    const lines = doc.splitTextToSize(l, R - L);
    lines.forEach((ln) => {
      text(ln, L, y, { size: 8.5 });
      y += 4.2;
    });
    y += 1;
  });

  text(
    "Modèle fourni par Newbi - www.newbi.fr - à compléter avec vos informations.",
    L,
    285,
    { size: 8, color: GRIS }
  );

  const file = path.join(OUT, `${m.slug}.pdf`);
  fs.writeFileSync(file, Buffer.from(doc.output("arraybuffer")));
  return file;
}

/* ---------------------------------- main ---------------------------------- */
for (const m of SPEC.modeles) {
  const x = buildXlsx(m, SPEC.commun);
  const p = buildPdf(m, SPEC.commun);
  console.log(
    `${m.slug} : xlsx ${fs.statSync(x).size} o | pdf ${fs.statSync(p).size} o`
  );
}
