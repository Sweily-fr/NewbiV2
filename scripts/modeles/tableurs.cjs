// Tableurs téléchargeables : note de frais, plan de trésorerie, suivi des
// factures. Chaque classeur est décrit cellule par cellule avec la classe
// Feuille de generate-xlsx-newbi.cjs, qui calcule ensuite toutes les formules
// (formules.cjs) pour écrire leur valeur en cache.
//
// Chaque classeur suit l'article de blog qui le propose : mêmes colonnes,
// mêmes formules, et un exemple chiffré identique à celui de l'article.

const { Feuille, S } = require("./generate-xlsx-newbi.cjs");
const { numVersCol } = require("./formules.cjs");

const col = (i) => numVersCol(i); // 1 = A
const MOIS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];
// Référence vers une autre feuille, toujours entre apostrophes (accents,
// espaces).
const ext = (feuille, a) => `'${feuille.replace(/'/g, "''")}'!${a}`;

// Ligne de notes fusionnée sur toute la largeur, hauteur estimée.
function note(f, ligne, texte, derniereCol, caracteres = 150) {
  f.set(`A${ligne}`, texte, S.CONDITIONS);
  f.fusion(`A${ligne}:${derniereCol}${ligne}`);
  f.hauteur(ligne, Math.max(14, Math.ceil(texte.length / caracteres) * 11 + 4));
}

// ============================================================ note de frais
// Article : modele-note-de-frais-excel-gratuit. Barème kilométrique calculé
// sur le cumul annuel, total par catégorie, récapitulatif mensuel, TVA
// récupérable limitée aux catégories qui y ouvrent droit (la TVA sur
// l'hébergement et le transport de personnes des dirigeants et du personnel
// n'est pas déductible), case justificatif joint, un onglet par mois et une
// synthèse annuelle.

const NF_PREMIERE = 8;
const NF_DERNIERE = 37;
const NF_TOTAL = 38;
const PARAM = "Paramètres";
const CATEGORIES = [
  ["Kilomètres", "Non", "Indemnité forfaitaire au barème : aucune TVA à récupérer, le barème couvre déjà carburant, entretien et assurance."],
  ["Repas", "Oui", "TVA déductible sur facture ou ticket de caisse détaillé."],
  ["Hébergement", "Non", "TVA non déductible pour l'hébergement des dirigeants et du personnel (art. 206, IV de l'annexe II au CGI)."],
  ["Transport", "Non", "Train, avion, taxi : TVA non déductible pour le transport de personnes (même article). Péages et stationnement d'une voiture particulière : non déductible non plus."],
  ["Fournitures", "Oui", "Petites fournitures et matériel achetés pour l'activité, sur facture."],
  ["Divers", "Non", "Par prudence : passez à « Oui » seulement si la dépense ouvre droit à déduction (facture conforme, dépense non exclue)."],
];
const CAT_DEBUT = 19;
const CAT_FIN = CAT_DEBUT + CATEGORIES.length - 1;
const BAREME = [
  [3, 0.529, 0.316, 1065, 0.37],
  [4, 0.606, 0.34, 1330, 0.407],
  [5, 0.636, 0.357, 1395, 0.427],
  [6, 0.665, 0.374, 1457, 0.447],
  [7, 0.697, 0.394, 1515, 0.47],
];

function feuilleParametresNF() {
  const f = new Feuille(PARAM, { largeurs: [30, 18, 20, 16, 20, 24] });
  f.set("A1", "Paramètres de la note de frais", S.TITRE_G).fusion("A1:F1").hauteur(1, 34);
  f.set("A3", "Bénéficiaire", S.GRAS).set("B3", "[Nom et prénom]", S.PETIT);
  f.set("A4", "Année", S.GRAS).set("B4", 2026, S.PETIT);
  f.set("A5", "Puissance fiscale du véhicule (CV)", S.GRAS).set("B5", 5, S.PETIT);
  f.set("A6", "Véhicule 100 % électrique (Oui ou Non)", S.GRAS).set("B6", "Non", S.PETIT);
  f.liste("B6", ["Oui", "Non"]);

  f.set("A8", "Barème kilométrique des voitures (d = distance professionnelle annuelle)", S.GRAS);
  const tete = ["Puissance (CV)", "Jusqu'à 5 000 km : d x", "De 5 001 à 20 000 km : d x", "+ montant fixe", "Au-delà de 20 000 km : d x"];
  tete.forEach((t, i) => f.set(`${col(i + 1)}9`, t, i === 0 ? S.TETE_G_W : S.TETE_D_W));
  f.hauteur(9, 26);
  BAREME.forEach((b, i) => {
    const l = 10 + i;
    f.set(`A${l}`, b[0], S.CORPS_G);
    f.set(`B${l}`, b[1], S.CORPS_COEF);
    f.set(`C${l}`, b[2], S.CORPS_COEF);
    f.set(`D${l}`, b[3], S.CORPS_EUR);
    f.set(`E${l}`, b[4], S.CORPS_COEF);
  });
  note(
    f,
    15,
    "Barème repris de l'article (3 = 3 CV et moins, 7 = 7 CV et plus). Il est publié chaque année par l'administration fiscale : vérifiez-le et mettez ce tableau à jour. Pour une voiture 100 % électrique, le barème est majoré de 20 %.",
    "F",
    120
  );

  f.set("A17", "Catégories de dépenses", S.GRAS);
  ["Catégorie", "TVA déductible", "Explication"].forEach((t, i) => f.set(`${col(i + 1)}18`, t, S.TETE_G));
  ["D18", "E18", "F18"].forEach((a) => f.set(a, null, S.TETE_G));
  CATEGORIES.forEach(([nom, ded, expl], i) => {
    const l = CAT_DEBUT + i;
    f.set(`A${l}`, nom, S.CORPS_G);
    f.set(`B${l}`, ded, S.CORPS_C);
    f.set(`C${l}`, expl, S.CORPS_G_W);
    f.fusion(`C${l}:F${l}`);
    f.hauteur(l, expl.length > 80 ? 36 : 24);
  });
  f.liste(`B${CAT_DEBUT}:B${CAT_FIN}`, ["Oui", "Non"]);
  return f;
}

// Une feuille mensuelle. `entete` : formules ou valeurs des cellules d'en-tête
// (bénéficiaire, mois, puissance, électrique, cumul) ; `lignes` : dépenses
// d'exemple.
function feuilleNoteDeFrais(nom, { entete, lignes = [] }) {
  const f = new Feuille(nom, {
    largeurs: [11, 14, 24, 28, 9, 12, 12, 9, 11, 12, 12, 11],
    figer: { lignes: 7 },
    paysage: true,
  });
  f.set("A1", "Note de frais", S.TITRE_G).fusion("A1:F1").hauteur(1, 34);
  f.set("A3", "Bénéficiaire :", S.GRAS).set("C3", entete.beneficiaire, S.PETIT);
  f.set("H3", "Mois :", S.GRAS).set("J3", entete.mois, S.PETIT);
  f.set("A4", "Puissance fiscale (CV) :", S.GRAS).set("C4", entete.cv, S.PETIT);
  f.set("H4", "Véhicule électrique :", S.GRAS).set("J4", entete.electrique, S.PETIT);
  f.set("A5", "Km professionnels cumulés au 1er du mois :", S.GRAS).set("D5", entete.cumul, S.PARAM_ENTIER);

  const tete = [
    "Date",
    "Catégorie",
    "Fournisseur ou établissement",
    "Motif professionnel",
    "Km parcourus",
    "Indemnité km",
    "Montant HT",
    "Taux de TVA",
    "TVA",
    "Montant TTC",
    "TVA récupérable",
    "Justificatif joint",
  ];
  tete.forEach((t, i) => f.set(`${col(i + 1)}7`, t, i < 4 ? S.TETE_G_W : S.TETE_D_W));
  f.hauteur(7, 28);

  // Indemnité km d'une ligne = barème(cumul après le trajet) - barème(cumul
  // avant le trajet) : le barème s'applique à la distance annuelle, un trajet
  // à cheval sur deux tranches est donc payé au bon taux.
  const bareme = (d) =>
    `IF(${d}<=5000,${d}*$C$59,IF(${d}<=20000,${d}*$C$60+$C$61,${d}*$C$62))`;
  for (let l = NF_PREMIERE; l <= NF_DERNIERE; l++) {
    const avant = `($D$5+SUM(E$7:E${l})-E${l})`;
    const apres = `($D$5+SUM(E$7:E${l}))`;
    const ex = lignes[l - NF_PREMIERE];
    f.set(`A${l}`, ex ? { date: ex.date } : null, S.CORPS_DATE);
    f.set(`B${l}`, ex ? ex.categorie : null, S.CORPS_G);
    f.set(`C${l}`, ex ? ex.fournisseur : null, S.CORPS_G);
    f.set(`D${l}`, ex ? ex.motif : null, S.CORPS_G);
    f.set(`E${l}`, ex && ex.km ? ex.km : null, S.CORPS_ENTIER);
    f.set(`F${l}`, { f: `IF(E${l}="","",ROUND((${bareme(apres)}-${bareme(avant)})*(1+$C$63),2))` }, S.CORPS_EUR);
    f.set(`G${l}`, ex && ex.ht ? ex.ht : null, S.CORPS_EUR);
    f.set(`H${l}`, ex && ex.tva !== undefined ? ex.tva : null, S.CORPS_PCT2);
    f.set(`I${l}`, { f: `IF(G${l}="","",ROUND(G${l}*H${l},2))` }, S.CORPS_EUR);
    f.set(`J${l}`, { f: `IF(AND(F${l}="",G${l}=""),"",SUM(F${l},G${l},I${l}))` }, S.CORPS_EUR);
    f.set(
      `K${l}`,
      {
        f: `IF(I${l}="","",IF(IFERROR(VLOOKUP(B${l},${ext(PARAM, `$A$${CAT_DEBUT}:$B$${CAT_FIN}`)},2,FALSE),"Non")="Oui",I${l},0))`,
      },
      S.CORPS_EUR
    );
    f.set(`L${l}`, ex ? ex.justificatif : null, S.CORPS_C);
  }
  f.liste(`B${NF_PREMIERE}:B${NF_DERNIERE}`, ext(PARAM, `$A$${CAT_DEBUT}:$A$${CAT_FIN}`));
  f.liste(`L${NF_PREMIERE}:L${NF_DERNIERE}`, ["Oui", "Non"]);

  const T = NF_TOTAL;
  const plage = (c) => `${c}${NF_PREMIERE}:${c}${NF_DERNIERE}`;
  f.set(`A${T}`, "Total du mois", S.TTC_LIB);
  ["B", "C", "D", "H", "L"].forEach((c) => f.set(`${c}${T}`, null, S.TTC_LIB));
  f.set(`E${T}`, { f: `SUM(${plage("E")})` }, S.TTC_ENTIER);
  ["F", "G", "I", "J", "K"].forEach((c) => f.set(`${c}${T}`, { f: `SUM(${plage(c)})` }, S.TTC_EUR));

  // Total par catégorie, dans les mêmes colonnes que le tableau.
  f.set("A40", "Total par catégorie", S.GRAS);
  const teteCat = { A: "Catégorie", E: "Km", F: "Indemnité km", G: "Montant HT", I: "TVA", J: "Montant TTC", K: "TVA récupérable" };
  for (let i = 1; i <= 12; i++) {
    const c = col(i);
    f.set(`${c}41`, teteCat[c] || null, c === "A" ? S.TETE_G : S.TETE_D);
  }
  CATEGORIES.forEach((_, i) => {
    const l = 42 + i;
    f.set(`A${l}`, { f: ext(PARAM, `A${CAT_DEBUT + i}`) }, S.CORPS_G);
    ["B", "C", "D", "H", "L"].forEach((c) => f.set(`${c}${l}`, null, S.CORPS_G));
    f.set(`E${l}`, { f: `SUMIF($B$${NF_PREMIERE}:$B$${NF_DERNIERE},$A${l},${plage("E")})` }, S.CORPS_ENTIER);
    ["F", "G", "I", "J", "K"].forEach((c) =>
      f.set(`${c}${l}`, { f: `SUMIF($B$${NF_PREMIERE}:$B$${NF_DERNIERE},$A${l},${plage(c)})` }, S.CORPS_EUR)
    );
  });
  const lc = 42 + CATEGORIES.length;
  f.set(`A${lc}`, "Total", S.TTC_LIB);
  ["B", "C", "D", "H", "L"].forEach((c) => f.set(`${c}${lc}`, null, S.TTC_LIB));
  f.set(`E${lc}`, { f: `SUM(E42:E${lc - 1})` }, S.TTC_ENTIER);
  ["F", "G", "I", "J", "K"].forEach((c) => f.set(`${c}${lc}`, { f: `SUM(${c}42:${c}${lc - 1})` }, S.TTC_EUR));

  // Récapitulatif mensuel.
  f.set("A50", "Récapitulatif du mois", S.GRAS);
  const recap = [
    ["Indemnités kilométriques", `F${T}`, S.TOT_EUR],
    ["Dépenses HT", `G${T}`, S.TOT_EUR],
    ["TVA payée", `I${T}`, S.TOT_EUR],
    ["dont TVA récupérable", `K${T}`, S.TOT_EUR],
    ["Justificatifs manquants (lignes marquées « Non »)", `COUNTIF(${plage("L")},"Non")`, S.TOT_ENTIER],
  ];
  recap.forEach(([lib, fo, s], i) => {
    f.set(`A${51 + i}`, lib, S.TOT_LIB);
    f.set(`D${51 + i}`, { f: fo }, s);
  });
  f.set("A56", "Total à rembourser (TTC)", S.TTC_LIB);
  ["B", "C"].forEach((c) => f.set(`${c}56`, null, S.TTC_LIB));
  f.set("D56", { f: `J${T}` }, S.TTC_EUR);

  // Barème appliqué, lu dans l'onglet Paramètres selon la puissance fiscale.
  f.set("A58", "Barème appliqué ce mois-ci", S.GRAS);
  const cle = `MAX(3,MIN(7,$C$4))`;
  const plageBareme = ext(PARAM, "$A$10:$E$14");
  [
    ["Jusqu'à 5 000 km : d x", 2],
    ["De 5 001 à 20 000 km : d x", 3],
    ["De 5 001 à 20 000 km : + fixe", 4],
    ["Au-delà de 20 000 km : d x", 5],
  ].forEach(([lib, k], i) => {
    f.set(`A${59 + i}`, lib, S.TOT_LIB);
    f.set(`C${59 + i}`, { f: `VLOOKUP(${cle},${plageBareme},${k},FALSE)` }, k === 4 ? S.TOT_EUR : S.PARAM_ENTIER);
  });
  // Les coefficients s'affichent à trois décimales.
  [59, 60, 62].forEach((l) => (f.cellules.get(`C${l}`).s = S.CORPS_COEF));
  f.set("A63", "Majoration véhicule électrique", S.TOT_LIB);
  f.set("C63", { f: `IF($J$4="Oui",0.2,0)` }, S.PARAM_PCT);

  note(
    f,
    65,
    "Indemnité kilométrique : calculée sur le cumul annuel des kilomètres, comme le prévoit le barème, à partir du cumul au 1er du mois. Ne déduisez pas en plus le carburant : le barème couvre déjà carburant, entretien et assurance.",
    "L",
    170
  );
  note(
    f,
    66,
    "TVA récupérable : seule la TVA des catégories marquées « Oui » dans l'onglet Paramètres est reprise. La TVA sur l'hébergement et le transport de personnes des dirigeants et du personnel n'est pas déductible (art. 206, IV de l'annexe II au CGI), et les indemnités kilométriques n'en comportent pas.",
    "L",
    170
  );
  note(
    f,
    67,
    "Justificatifs : joignez pour chaque ligne une facture ou un ticket de caisse détaillé, un ticket de carte bancaire seul ne suffit pas. Conservez notes de frais et justificatifs 10 ans.",
    "L",
    170
  );
  f.set("A69", "Date et signature du bénéficiaire :", S.GRAS);
  f.set("H69", "Visa du responsable :", S.GRAS);
  return f;
}

function classeurNoteDeFrais() {
  const exemple = feuilleNoteDeFrais("Exemple", {
    entete: {
      beneficiaire: "Consultant indépendant (exemple de l'article)",
      mois: "Janvier 2026",
      cv: 6,
      electrique: "Non",
      cumul: 0,
    },
    lignes: [
      { date: "2026-01-06", categorie: "Kilomètres", fournisseur: "Véhicule personnel", motif: "Aller-retour chez le client (2 x 180 km)", km: 360, justificatif: "Oui" },
      { date: "2026-01-06", categorie: "Hébergement", fournisseur: "Hôtel, nuit du 6 janvier", motif: "Mission chez le client", ht: 95, tva: 0.1, justificatif: "Oui" },
      { date: "2026-01-06", categorie: "Repas", fournisseur: "Restaurant, dîner", motif: "Repas en déplacement", ht: 26, tva: 0.1, justificatif: "Oui" },
      { date: "2026-01-07", categorie: "Repas", fournisseur: "Restaurant, déjeuner", motif: "Déjeuner de travail avec le client", ht: 30, tva: 0.1, justificatif: "Oui" },
      { date: "2026-01-20", categorie: "Kilomètres", fournisseur: "Véhicule personnel", motif: "Aller-retour chez le client (2 x 180 km)", km: 360, justificatif: "Oui" },
      { date: "2026-01-20", categorie: "Hébergement", fournisseur: "Hôtel, nuit du 20 janvier", motif: "Mission chez le client", ht: 95, tva: 0.1, justificatif: "Oui" },
      { date: "2026-01-20", categorie: "Repas", fournisseur: "Restaurant, dîner", motif: "Repas en déplacement", ht: 27, tva: 0.1, justificatif: "Oui" },
      { date: "2026-01-21", categorie: "Repas", fournisseur: "Restaurant, déjeuner", motif: "Déjeuner de travail avec le client", ht: 29, tva: 0.1, justificatif: "Oui" },
      { date: "2026-01-21", categorie: "Repas", fournisseur: "Restaurant, dîner", motif: "Repas en déplacement", ht: 28, tva: 0.1, justificatif: "Oui" },
    ],
  });
  const mois = MOIS.map((m, i) =>
    feuilleNoteDeFrais(m, {
      entete: {
        beneficiaire: { f: ext(PARAM, "B3") },
        mois: { f: `"${m} "&${ext(PARAM, "B4")}` },
        cv: { f: ext(PARAM, "B5") },
        electrique: { f: ext(PARAM, "B6") },
        // Le barème s'applique à la distance annuelle : le cumul repart de
        // zéro en janvier, puis reprend celui du mois précédent.
        cumul: i === 0 ? 0 : { f: `${ext(MOIS[i - 1], "D5")}+${ext(MOIS[i - 1], `E${NF_TOTAL}`)}` },
      },
    })
  );
  // Les feuilles mensuelles lisent la puissance dans Paramètres : la
  // cellule C4 y est une formule, le barème la lit de la même façon.

  const syn = new Feuille("Synthèse annuelle", { largeurs: [16, 12, 15, 15, 14, 15, 17, 14], figer: { lignes: 5 } });
  syn.set("A1", "Synthèse annuelle des notes de frais", S.TITRE_G).fusion("A1:H1").hauteur(1, 34);
  syn.set("A3", "Bénéficiaire :", S.GRAS).set("C3", { f: ext(PARAM, "B3") }, S.PETIT);
  ["Mois", "Km parcourus", "Indemnités km", "Dépenses HT", "TVA payée", "TVA récupérable", "Total à rembourser", "Justificatifs manquants"].forEach(
    (t, i) => syn.set(`${col(i + 1)}5`, t, i === 0 ? S.TETE_G_W : S.TETE_D_W)
  );
  syn.hauteur(5, 28);
  MOIS.forEach((m, i) => {
    const l = 6 + i;
    syn.set(`A${l}`, m, S.CORPS_G);
    syn.set(`B${l}`, { f: ext(m, `E${NF_TOTAL}`) }, S.CORPS_ENTIER);
    syn.set(`C${l}`, { f: ext(m, `F${NF_TOTAL}`) }, S.CORPS_EUR);
    syn.set(`D${l}`, { f: ext(m, `G${NF_TOTAL}`) }, S.CORPS_EUR);
    syn.set(`E${l}`, { f: ext(m, `I${NF_TOTAL}`) }, S.CORPS_EUR);
    syn.set(`F${l}`, { f: ext(m, `K${NF_TOTAL}`) }, S.CORPS_EUR);
    syn.set(`G${l}`, { f: ext(m, `J${NF_TOTAL}`) }, S.CORPS_EUR);
    syn.set(`H${l}`, { f: ext(m, "D55") }, S.CORPS_ENTIER);
  });
  syn.set("A18", "Total de l'année", S.TTC_LIB);
  syn.set("B18", { f: "SUM(B6:B17)" }, S.TTC_ENTIER);
  ["C", "D", "E", "F", "G"].forEach((c) => syn.set(`${c}18`, { f: `SUM(${c}6:${c}17)` }, S.TTC_EUR));
  syn.set("H18", { f: "SUM(H6:H17)" }, S.TTC_ENTIER);

  return [exemple, ...mois, syn, feuilleParametresNF()];
}

// ====================================================== plan de trésorerie
// Article : modele-plan-de-tresorerie-excel-gratuit. 12 colonnes mensuelles,
// solde initial, encaissements, décaissements (dont TVA, URSSAF, impôts, CFE,
// emprunts), solde final chaîné au mois suivant, et scénarios.

const ENC = [
  "Règlements clients (TTC)",
  "Acomptes reçus",
  "Apports (capital, compte courant)",
  "Subventions et aides",
  "Emprunts reçus",
  "Autres encaissements",
];
const DEC = [
  "Fournisseurs et sous-traitance",
  "Loyer et charges locatives",
  "Salaires nets",
  "Rémunération ou prélèvements du dirigeant",
  "Cotisations sociales (URSSAF)",
  "TVA à reverser",
  "Impôt (IR ou IS, acomptes)",
  "CFE",
  "Remboursements d'emprunt",
  "Crédit-bail",
  "Assurances",
  "Abonnements et charges diverses",
  "Investissements",
  "Autres décaissements",
];
const PT = {
  initial: 5,
  encDebut: 7,
  encFin: 7 + ENC.length - 1, // 12
  encTotal: 13,
  decDebut: 15,
  decFin: 15 + DEC.length - 1, // 28
  decTotal: 29,
  flux: 30,
  final: 31,
};

function feuillePlan(nom, { titre, initial = null, valeurs = {} }) {
  const f = new Feuille(nom, {
    largeurs: [38, ...Array(12).fill(11.5), 13],
    figer: { lignes: 4, colonnes: 1 },
    paysage: true,
  });
  f.set("A1", titre, S.TITRE_G).fusion("A1:I1").hauteur(1, 34);
  f.set("A2", "Montants TTC, inscrits au mois où l'argent entre ou sort réellement du compte bancaire.", S.CONDITIONS);
  f.fusion("A2:I2");
  f.set("A3", "Exercice :", S.GRAS).set("B3", 2026, S.PETIT);

  f.set("A4", "Poste", S.TETE_G);
  MOIS.forEach((m, i) => f.set(`${col(i + 2)}4`, m, S.TETE_D));
  f.set("N4", "Total", S.TETE_D);
  f.hauteur(4, 20);

  const mois = (i) => col(i + 2); // B..M
  f.set(`A${PT.initial}`, "Solde de trésorerie initial", S.GRAS);
  for (let i = 0; i < 12; i++) {
    const c = mois(i);
    if (i === 0) f.set(`${c}${PT.initial}`, initial, S.CORPS_EUR);
    else f.set(`${c}${PT.initial}`, { f: `${mois(i - 1)}${PT.final}` }, S.CORPS_EUR);
  }
  f.set(`N${PT.initial}`, { f: `B${PT.initial}` }, S.CORPS_EUR);

  const section = (l, texte) => {
    f.set(`A${l}`, texte, S.SECTION);
    for (let i = 2; i <= 14; i++) f.set(`${col(i)}${l}`, null, S.SECTION);
  };
  const lignesPostes = (debut, postes) =>
    postes.forEach((p, k) => {
      const l = debut + k;
      f.set(`A${l}`, p, S.CORPS_G);
      const v = valeurs[p] || [];
      for (let i = 0; i < 12; i++) f.set(`${mois(i)}${l}`, v[i] || null, S.CORPS_EUR);
      f.set(`N${l}`, { f: `SUM(B${l}:M${l})` }, S.CORPS_EUR);
    });
  const total = (l, texte, de, a) => {
    f.set(`A${l}`, texte, S.TTC_LIB);
    for (let i = 0; i < 13; i++) {
      const c = col(i + 2);
      f.set(`${c}${l}`, { f: `SUM(${c}${de}:${c}${a})` }, S.TTC_EUR);
    }
  };

  section(6, "Encaissements");
  lignesPostes(PT.encDebut, ENC);
  total(PT.encTotal, "Total des encaissements", PT.encDebut, PT.encFin);
  section(14, "Décaissements");
  lignesPostes(PT.decDebut, DEC);
  total(PT.decTotal, "Total des décaissements", PT.decDebut, PT.decFin);

  f.set(`A${PT.flux}`, "Flux net du mois", S.CORPS_G);
  for (let i = 0; i < 13; i++) {
    const c = col(i + 2);
    f.set(`${c}${PT.flux}`, { f: `${c}${PT.encTotal}-${c}${PT.decTotal}` }, S.CORPS_EUR);
  }
  f.set(`A${PT.final}`, "Solde de trésorerie final", S.TTC_LIB);
  for (let i = 0; i < 12; i++) {
    const c = mois(i);
    f.set(`${c}${PT.final}`, { f: `${c}${PT.initial}+${c}${PT.flux}` }, S.TTC_EUR);
  }
  f.set(`N${PT.final}`, { f: `M${PT.final}` }, S.TTC_EUR);
  f.alerte(`B${PT.final}:M${PT.final}`, `B${PT.final}<0`);

  f.set("A33", "Point bas de l'année", S.TOT_LIB).set("B33", { f: `MIN(B${PT.final}:M${PT.final})` }, S.TOT_EUR);
  f.set("A34", "Mois du point bas", S.TOT_LIB).set("B34", { f: `INDEX($B$4:$M$4,MATCH(B33,B${PT.final}:M${PT.final},0))` }, S.META_VAL);
  f.set("A35", "Mois avec un solde négatif", S.TOT_LIB).set("B35", { f: `COUNTIF(B${PT.final}:M${PT.final},"<0")` }, S.TOT_ENTIER);

  note(f, 37, "Le solde final de chaque mois devient automatiquement le solde initial du mois suivant : saisissez le solde bancaire du 1er janvier, puis les montants attendus mois par mois. Un solde final négatif s'affiche en rouge.", "N", 200);
  note(f, 38, "TVA : si vous facturez TTC, la TVA collectée transite par votre compte mais ne vous appartient pas. Prévoyez son reversement sur la ligne « TVA à reverser », au mois de chaque échéance de déclaration (mensuelle, trimestrielle ou annuelle selon votre régime).", "N", 200);
  note(f, 39, "N'oubliez pas les charges annuelles (CFE en décembre, assurances) et mettez le tableau à jour chaque semaine en le comparant à vos relevés bancaires.", "N", 200);
  return f;
}

function classeurTresorerie() {
  const tous = (v) => Array(12).fill(v);
  const exemple = feuillePlan("Exemple", {
    titre: "Plan de trésorerie sur 12 mois (exemple)",
    initial: 3500,
    valeurs: {
      "Règlements clients (TTC)": [2600, 1700, 3600, 2400, 2900, 2500, 2100, 600, 1900, 3100, 2800, 3300],
      "Loyer et charges locatives": tous(800),
      "Cotisations sociales (URSSAF)": tous(450),
      "TVA à reverser": [0, 0, 600, 0, 0, 700, 0, 0, 450, 0, 0, 650],
      CFE: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 350],
      Assurances: [0, 0, 0, 0, 0, 0, 0, 0, 0, 400, 0, 0],
      "Abonnements et charges diverses": tous(300),
      Investissements: [0, 500, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
  });
  note(
    exemple,
    40,
    "Exemple de l'article : une graphiste indépendante démarre l'année avec 3 500 €. En mars, elle part de 4 200 €, encaisse 3 600 € TTC et règle 800 € de loyer, 450 € d'URSSAF, 600 € de TVA trimestrielle et 300 € d'abonnements : 5 650 € au 31 mars.",
    "N",
    200
  );
  const plan = feuillePlan("Plan de trésorerie", { titre: "Plan de trésorerie sur 12 mois" });

  // Scénarios : les montants du plan, encaissements et décaissements
  // augmentés ou réduits d'un pourcentage par scénario.
  const sc = new Feuille("Scénarios", {
    largeurs: [30, ...Array(12).fill(11.5), 13, 13],
    figer: { colonnes: 1 },
    paysage: true,
  });
  const P = "Plan de trésorerie";
  sc.set("A1", "Scénarios de trésorerie", S.TITRE_G).fusion("A1:I1").hauteur(1, 34);
  note(sc, 2, "Calculés à partir de l'onglet « Plan de trésorerie » : pour chaque scénario, les encaissements et les décaissements de chaque mois sont augmentés ou réduits du pourcentage indiqué ci-dessous.", "O", 200);
  sc.set("A4", "Hypothèses", S.TETE_G).set("B4", "Encaissements", S.TETE_D_W).set("C4", "Décaissements", S.TETE_D_W);
  sc.hauteur(4, 26);
  const hyp = [
    ["Optimiste", 0.1, 0],
    ["Réaliste", 0, 0],
    ["Pessimiste", -0.2, 0.05],
  ];
  hyp.forEach(([n, e, d], i) => {
    sc.set(`A${5 + i}`, n, S.CORPS_G).set(`B${5 + i}`, e, S.CORPS_PCT2).set(`C${5 + i}`, d, S.CORPS_PCT2);
  });
  sc.set("A9", "Solde de fin de mois", S.TETE_G);
  MOIS.forEach((m, i) => sc.set(`${col(i + 2)}9`, m, S.TETE_D));
  sc.set("N9", "Point bas", S.TETE_D).set("O9", "Mois négatifs", S.TETE_D_W);
  sc.hauteur(9, 26);
  hyp.forEach(([n], k) => {
    const l = 10 + k;
    const h = 5 + k;
    sc.set(`A${l}`, n, S.CORPS_G);
    for (let i = 0; i < 12; i++) {
      const c = col(i + 2);
      const depart = i === 0 ? ext(P, `B${PT.initial}`) : `${col(i + 1)}${l}`;
      sc.set(
        `${c}${l}`,
        { f: `${depart}+${ext(P, `${c}${PT.encTotal}`)}*(1+$B$${h})-${ext(P, `${c}${PT.decTotal}`)}*(1+$C$${h})` },
        S.CORPS_EUR
      );
    }
    sc.set(`N${l}`, { f: `MIN(B${l}:M${l})` }, S.CORPS_EUR);
    sc.set(`O${l}`, { f: `COUNTIF(B${l}:M${l},"<0")` }, S.CORPS_ENTIER);
  });
  sc.alerte("B10:M12", "B10<0");
  note(sc, 14, "Pour simuler un retard de paiement généralisé, dupliquez l'onglet « Plan de trésorerie » et décalez les encaissements d'un ou deux mois.", "O", 200);

  return [exemple, plan, sc];
}

// ======================================================= suivi des factures
// Article : modele-tableau-suivi-factures-excel. Colonnes de l'article
// (numéro, client, émission, échéance, HT et TTC, statut, date de paiement,
// retard) et colonnes ajoutées par la graphiste du cas pratique (mode de
// paiement, relance envoyée), prochaine action et indemnité de 40 €. Statut
// et retard sont calculés, alerte rouge au-delà d'un seuil, filtres, volet
// figé, listes déroulantes, onglet de tableau de bord.

const SF = "Suivi des factures";
const SF_PREMIERE = 8;
const SF_DERNIERE = 107;

function feuilleSuivi() {
  const f = new Feuille(SF, {
    largeurs: [13, 22, 9, 11, 11, 12, 8, 12, 12, 12, 11, 12, 16, 8, 11, 24, 11, 11, 10],
    figer: { lignes: 7, colonnes: 1 },
    filtre: `A7:S${SF_DERNIERE}`,
    paysage: true,
  });
  f.set("A1", "Suivi des factures", S.TITRE_G).fusion("A1:F1").hauteur(1, 34);
  f.set("A2", "Taux annuel des pénalités de retard :", S.GRAS).set("E2", 0.0825, S.PARAM_PCT);
  f.set("A3", "Indemnité forfaitaire de recouvrement :", S.GRAS).set("E3", 40, S.TOT_EUR);
  f.set("A4", "Seuil d'alerte (jours de retard) :", S.GRAS).set("E4", 15, S.PARAM_ENTIER);
  f.set("H2", "Date du jour :", S.GRAS).set("J2", { f: "TODAY()" }, S.PARAM_DATE);
  note(
    f,
    5,
    "Remplissez les colonnes de saisie. Montant TTC, reste dû, statut, retard, indemnité, pénalités et délai de paiement se calculent seuls ; une facture en retard au-delà du seuil passe en rouge. Pénalités : au moins trois fois le taux d'intérêt légal entre professionnels, soit 8,25 % au second semestre 2026.",
    "S",
    260
  );

  const tete = [
    "N° de facture",
    "Client",
    "Client pro",
    "Date d'émission",
    "Date d'échéance",
    "Montant HT",
    "Taux de TVA",
    "Montant TTC",
    "Montant encaissé",
    "Reste dû",
    "Date de paiement",
    "Mode de paiement",
    "Statut",
    "Retard (jours)",
    "Dernière relance",
    "Prochaine action",
    "Indemnité 40 €",
    "Pénalités estimées",
    "Délai de paiement (jours)",
  ];
  // Colonnes de texte alignées à gauche, colonnes chiffrées à droite.
  const texte = new Set([0, 1, 2, 11, 12, 15]);
  tete.forEach((t, i) => f.set(`${col(i + 1)}7`, t, texte.has(i) ? S.TETE_G_W : S.TETE_D_W));
  f.hauteur(7, 40);

  const exemples = [
    { n: "F-2026-041", client: "Client A", pro: "Oui", em: "2026-09-01", ech: "2026-10-01", ht: 1200, tva: 0.2, enc: 1440, pay: "2026-09-28", mode: "Virement" },
    { n: "F-2026-042", client: "Client B", pro: "Oui", em: "2026-10-15", ech: "2026-11-14", ht: 2500, tva: 0.2, enc: 1500, pay: "2026-10-20", mode: "Virement", action: "Solde attendu à l'échéance" },
    { n: "F-2026-043", client: "Client C", pro: "Oui", em: "2026-09-10", ech: "2026-10-10", ht: 800, tva: 0.2, relance: "2026-10-20", action: "Relance téléphonique, puis mise en demeure" },
    { n: "F-2026-044", client: "Client D (particulier)", pro: "Non", em: "2026-10-20", ech: "2026-11-19", ht: 450, tva: 0.2 },
    { n: "F-2026-045", client: "Client A", pro: "Oui", em: "2026-10-01", ech: "2026-10-31", ht: 300, tva: 0.2, enc: 360, pay: "2026-11-05", mode: "Carte" },
  ];
  for (let l = SF_PREMIERE; l <= SF_DERNIERE; l++) {
    const e = exemples[l - SF_PREMIERE];
    const d = (iso) => (iso ? { date: iso } : null);
    f.set(`A${l}`, e ? e.n : null, S.CORPS_G);
    f.set(`B${l}`, e ? e.client : null, S.CORPS_G);
    f.set(`C${l}`, e ? e.pro : null, S.CORPS_C);
    f.set(`D${l}`, d(e && e.em), S.CORPS_DATE);
    f.set(`E${l}`, d(e && e.ech), S.CORPS_DATE);
    f.set(`F${l}`, e ? e.ht : null, S.CORPS_EUR);
    f.set(`G${l}`, e ? e.tva : null, S.CORPS_PCT2);
    f.set(`H${l}`, { f: `IF(F${l}="","",ROUND(F${l}*(1+G${l}),2))` }, S.CORPS_EUR);
    f.set(`I${l}`, e && e.enc ? e.enc : null, S.CORPS_EUR);
    f.set(`J${l}`, { f: `IF(H${l}="","",H${l}-I${l})` }, S.CORPS_EUR);
    f.set(`K${l}`, d(e && e.pay), S.CORPS_DATE);
    f.set(`L${l}`, e && e.mode ? e.mode : null, S.CORPS_G);
    f.set(
      `M${l}`,
      {
        f: `IF(H${l}="","",IF(I${l}>=H${l},"Payée",IF(AND(E${l}<>"",TODAY()>E${l}),"En retard",IF(I${l}>0,"Payée partiellement","En attente"))))`,
      },
      S.CORPS_G
    );
    // Retard : jours écoulés depuis l'échéance tant que la facture n'est pas
    // soldée ; pour une facture payée, retard constaté au paiement. DATEDIF
    // plutôt qu'une soustraction de dates : Numbers en fait une durée, que
    // MAX ne sait pas comparer à zéro.
    f.set(
      `N${l}`,
      {
        f: `IF(OR(H${l}="",E${l}=""),"",IF(I${l}>=H${l},IF(K${l}="",0,IF(K${l}>E${l},DATEDIF(E${l},K${l},"D"),0)),IF(TODAY()>E${l},DATEDIF(E${l},TODAY(),"D"),0)))`,
      },
      S.CORPS_ENTIER
    );
    f.set(`O${l}`, d(e && e.relance), S.CORPS_DATE);
    f.set(`P${l}`, e && e.action ? e.action : null, S.CORPS_G);
    // Indemnité et pénalités de plein droit : entre professionnels seulement.
    f.set(`Q${l}`, { f: `IF(N${l}="","",IF(AND(C${l}="Oui",N${l}>0),$E$3,0))` }, S.CORPS_EUR);
    f.set(
      `R${l}`,
      { f: `IF(N${l}="","",IF(AND(C${l}="Oui",N${l}>0),ROUND(IF(J${l}>0,J${l},H${l})*$E$2*N${l}/365,2),0))` },
      S.CORPS_EUR
    );
    f.set(`S${l}`, { f: `IF(OR(K${l}="",D${l}=""),"",IF(K${l}>=D${l},DATEDIF(D${l},K${l},"D"),0))` }, S.CORPS_ENTIER);
  }
  f.liste(`C${SF_PREMIERE}:C${SF_DERNIERE}`, ["Oui", "Non"]);
  f.liste(`L${SF_PREMIERE}:L${SF_DERNIERE}`, ["Virement", "Carte", "Chèque", "Espèces", "Prélèvement"]);
  f.alerte(`A${SF_PREMIERE}:S${SF_DERNIERE}`, `AND(ISNUMBER($N${SF_PREMIERE}),$N${SF_PREMIERE}>$E$4,$M${SF_PREMIERE}="En retard")`);
  return f;
}

function feuilleTableauDeBord() {
  const f = new Feuille("Tableau de bord", { largeurs: [50, 16, 16, 16] });
  const r = (c) => ext(SF, `$${c}$${SF_PREMIERE}:$${c}$${SF_DERNIERE}`);
  f.set("A1", "Tableau de bord des factures", S.TITRE_G).fusion("A1:D1").hauteur(1, 34);
  f.set("A2", "Calculé à partir de l'onglet « Suivi des factures ».", S.CONDITIONS);
  f.set("A4", "Indicateur", S.TETE_G).set("B4", "Valeur", S.TETE_D);
  const lignes = [
    ["Nombre de factures", `COUNTA(${r("A")})`, S.CORPS_ENTIER],
    ["Total facturé HT", `SUM(${r("F")})`, S.CORPS_EUR],
    ["Total facturé TTC", `SUM(${r("H")})`, S.CORPS_EUR],
    ["Total encaissé", `SUM(${r("I")})`, S.CORPS_EUR],
    ["Reste à encaisser", `SUM(${r("J")})`, S.CORPS_EUR],
    ["Nombre de factures en retard", `COUNTIF(${r("M")},"En retard")`, S.CORPS_ENTIER],
    ["Montant en retard (reste dû)", `SUMIF(${r("M")},"En retard",${r("J")})`, S.CORPS_EUR],
    ["Seuil pour le taux d'impayés (jours de retard)", 10, S.CORPS_ENTIER],
    ["Montant HT des factures en retard au-delà du seuil", `SUMIFS(${r("F")},${r("M")},"En retard",${r("N")},">"&B12)`, S.CORPS_EUR],
    ["Taux d'impayés en cours (montant HT en retard / total HT)", `IFERROR(B13/B6,0)`, S.CORPS_PCT2],
    ["Délai moyen de paiement des factures payées (jours)", `IFERROR(ROUND(AVERAGE(${r("S")}),0),"")`, S.CORPS_ENTIER],
    ["Indemnités forfaitaires exigibles", `SUM(${r("Q")})`, S.CORPS_EUR],
    ["Pénalités de retard estimées", `SUM(${r("R")})`, S.CORPS_EUR],
  ];
  lignes.forEach(([lib, fo, s], i) => {
    const l = 5 + i;
    f.set(`A${l}`, lib, S.CORPS_G);
    f.set(`B${l}`, typeof fo === "number" ? fo : { f: fo }, s);
  });

  f.set("A19", "Répartition par statut", S.GRAS);
  ["Statut", "Nombre", "Montant TTC", "Reste dû"].forEach((t, i) => f.set(`${col(i + 1)}20`, t, i ? S.TETE_D : S.TETE_G));
  ["En attente", "Payée partiellement", "En retard", "Payée"].forEach((st, i) => {
    const l = 21 + i;
    f.set(`A${l}`, st, S.CORPS_G);
    f.set(`B${l}`, { f: `COUNTIF(${r("M")},A${l})` }, S.CORPS_ENTIER);
    f.set(`C${l}`, { f: `SUMIF(${r("M")},A${l},${r("H")})` }, S.CORPS_EUR);
    f.set(`D${l}`, { f: `SUMIF(${r("M")},A${l},${r("J")})` }, S.CORPS_EUR);
  });
  f.set("A25", "Total", S.TTC_LIB);
  f.set("B25", { f: "SUM(B21:B24)" }, S.TTC_ENTIER);
  f.set("C25", { f: "SUM(C21:C24)" }, S.TTC_EUR);
  f.set("D25", { f: "SUM(D21:D24)" }, S.TTC_EUR);

  f.set("A27", "Contrôle mensuel avec le relevé bancaire", S.GRAS);
  f.set("A28", "Mois contrôlé (saisissez le 1er jour du mois)", S.CORPS_G).set("B28", { date: "2026-10-01" }, S.CORPS_DATE);
  f.set("A29", "Encaissements du mois selon le tableau", S.CORPS_G).set(
    "B29",
    { f: `SUMIFS(${r("I")},${r("K")},">="&B28,${r("K")},"<"&DATE(YEAR(B28),MONTH(B28)+1,1))` },
    S.CORPS_EUR
  );
  f.set("A30", "Encaissements du mois selon le relevé bancaire", S.CORPS_G).set("B30", 1500, S.CORPS_EUR);
  f.set("A31", "Écart à expliquer", S.TTC_LIB).set("B31", { f: "B30-B29" }, S.TTC_EUR);
  note(
    f,
    32,
    "Le contrôle retient la date du dernier paiement saisie pour chaque facture : si une facture a été réglée en plusieurs fois sur des mois différents, vérifiez-la à la main.",
    "D",
    110
  );
  return f;
}

const TABLEURS = [
  { slug: "modele-note-de-frais", feuilles: classeurNoteDeFrais },
  { slug: "modele-plan-de-tresorerie", feuilles: classeurTresorerie },
  { slug: "modele-tableau-suivi-factures", feuilles: () => [feuilleSuivi(), feuilleTableauDeBord()] },
];

module.exports = { TABLEURS };
