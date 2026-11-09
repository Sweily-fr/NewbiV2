// Modèle de document commun aux trois formats téléchargeables.
//
// Les PDF de public/modeles/ sont rendus par le vrai gabarit du produit
// (UniversalPreviewPDF, voir render-pdf-newbi.cjs). Le Word et l'Excel étaient
// eux dessinés à part, avec une mise en page générique : titre violet à
// gauche, intitulés « ÉMETTEUR » et « CLIENT », en-tête de tableau lavande.
// Le téléchargement ne ressemblait donc pas à ce que Newbi produit.
//
// Ce module dérive des MÊMES données (rendus.json) la structure que le gabarit
// affiche, pour que les trois fichiers montrent le même document : titre à
// droite, méta sous le titre, deux blocs d'adresses, tableau à en-tête noir,
// totaux à droite avec le TTC sur fond gris, conditions, puis bande de pied de
// page.
//
// Types gérés :
//   invoice, quote, purchaseOrder : factures, devis, bons de commande ;
//   creditNote : avoir, montants en négatif, référence de la facture d'origine
//     et motif dans la méta (comme le gabarit des avoirs du produit) ;
//   invoiceEn : facture en anglais, libellés doublés « anglais / français » ;
//   receipt : reçu de paiement, sans TVA, avec attestation et signature.

const EUR = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

const dateFr = (iso) => {
  if (!iso) return "";
  const [a, m, j] = iso.split("-");
  return `${j}/${m}/${a}`;
};

const ligneAdresse = (adr = {}) => [
  adr.street,
  [adr.postalCode, adr.city].filter(Boolean).join(" "),
  adr.country,
];

// Colonnes du tableau des factures, devis et bons de commande. Les largeurs
// Word sont en twips (total 9752, largeur utile d'une A4 à 20 mm de marge).
const COLONNES_FACTURE = [
  { libelle: "Description", docx: 4352, format: "texte" },
  { libelle: "Qté", docx: 1100, format: "quantite", align: "right" },
  { libelle: "Prix unitaire", docx: 1500, format: "eur", align: "right" },
  { libelle: "TVA (%)", docx: 1100, format: "pct", align: "right" },
  { libelle: "Total HT", docx: 1700, format: "eur", align: "right" },
];

// Ligne de facture : valeurs affichées dans Word et valeurs saisies dans
// Excel, colonne par colonne. `signe` vaut -1 pour un avoir.
function ligneFacture(i, signe = 1) {
  const quantite = Number(i.quantity || 0);
  const prixUnitaire = Number(i.unitPrice || 0);
  const tva = Number(i.vatRate || 0);
  const totalHt = signe * quantite * prixUnitaire;
  return {
    description: i.description || "",
    quantite,
    unite: i.unit || "unité",
    prixUnitaire,
    tva,
    totalHt,
    docx: [
      i.description || "",
      `${quantite} ${i.unit || "unité"}`,
      EUR.format(prixUnitaire),
      `${tva} %`,
      EUR.format(totalHt),
    ],
    xlsx: [i.description || "", quantite, prixUnitaire, tva / 100, totalHt],
  };
}

function modeleDocument(rendu) {
  if (rendu.type === "creditNote") return modeleAvoir(rendu);
  if (rendu.type === "invoiceEn") return modeleInvoiceEn(rendu);
  if (rendu.type === "receipt") return modeleRecu(rendu);

  const d = rendu.data;
  const estDevis = rendu.type === "quote";
  // Le bon de commande partage la mise en page du devis (seconde date = date
  // de validité) mais porte son propre titre et son propre libellé de numéro.
  // Libellés repris tels quels de UniversalPreviewPDF, pour que le modèle
  // téléchargé et le document produit par l'application soient identiques.
  const estBonCommande = rendu.type === "purchaseOrder";
  const estAcompte = Boolean(d.isDepositInvoice || d.invoiceType === "deposit");
  const items = d.items || [];

  // Franchise en base : le gabarit masque le numéro de TVA de l'émetteur, les
  // lignes de TVA du récapitulatif, et ajoute la mention au pied de page.
  const franchise = items.every((i) => Number(i.vatRate || 0) === 0);

  const titre = estBonCommande
    ? "Bon de commande"
    : estAcompte
      ? "Facture d'acompte"
      : estDevis
        ? "Devis"
        : "Facture";

  const meta = [
    [
      estBonCommande
        ? "Numéro de BC"
        : estDevis
          ? "Numéro de devis"
          : "Numéro de facture",
      `${d.prefix}-${d.number}`,
    ],
    ["Date d'émission", dateFr(d.issueDate)],
    estDevis || estBonCommande
      ? ["Date de validité", dateFr(d.validUntil)]
      : ["Date d'échéance", dateFr(d.dueDate)],
  ];

  const c = d.companyInfo || {};
  const emetteur = [
    c.name,
    ...ligneAdresse(c.address),
    c.email,
    c.siren ? `SIREN: ${c.siren}` : null,
    c.phone,
    franchise || !c.vatNumber ? null : `N° TVA: ${c.vatNumber}`,
  ].filter(Boolean);

  const cl = d.client || {};
  const client = [
    cl.name,
    ...ligneAdresse(cl.address),
    cl.email,
    cl.siret ? `SIREN: ${String(cl.siret).replace(/\D/g, "").slice(0, 9)}` : null,
  ].filter(Boolean);

  const lignes = items.map((i) => ligneFacture(i));

  const totalHt = lignes.reduce((s, l) => s + l.totalHt, 0);
  const parTaux = new Map();
  for (const l of lignes) {
    if (!l.tva) continue;
    parTaux.set(l.tva, (parTaux.get(l.tva) || 0) + (l.totalHt * l.tva) / 100);
  }
  const totalTva = [...parTaux.values()].reduce((s, v) => s + v, 0);

  const totaux = [{ libelle: "Total HT", montant: totalHt }];
  for (const [taux, montant] of [...parTaux.entries()].sort((a, b) => a[0] - b[0])) {
    totaux.push({ libelle: `TVA ${taux}%`, montant });
  }
  if (parTaux.size) totaux.push({ libelle: "Total TVA", montant: totalTva });
  totaux.push({ libelle: "Total TTC", montant: totalHt + totalTva, fort: true });

  // Le pied de page du gabarit sépare rue, code postal et ville par des
  // virgules, et n'y reprend pas le pays.
  const a = c.address || {};
  const siege = [a.street, a.postalCode, a.city].filter(Boolean).join(", ");
  const pied = [
    franchise
      ? [c.name, c.legalForm, siege].filter(Boolean).join(" • ")
      : [c.name, c.legalForm, `Siège: ${siege}`, `TVA intracom: ${c.vatNumber}`]
          .filter(Boolean)
          .join(" • "),
  ];
  if (franchise) pied.push("TVA non applicable, art. 293 B du CGI");

  return {
    slug: rendu.slug,
    titre,
    meta,
    emetteur,
    client,
    colonnes: COLONNES_FACTURE.map((col) => col.libelle),
    tableau: {
      colonnes: COLONNES_FACTURE,
      // Excel : la dernière colonne est une formule (quantité x prix).
      formule: (n) => `IF(B${n}="","",B${n}*C${n})`,
    },
    lignes,
    totaux,
    conditions: d.termsAndConditions || "",
    pied,
    franchise,
  };
}

// --------------------------------------------------------------- avoir ---
// Mise en page du gabarit des avoirs (UniversalPreviewPDF, type creditNote) :
// titre « Avoir », numéro d'avoir, date d'émission, facture d'origine, date
// de la facture d'origine et motif sous le titre, pas de date d'échéance,
// montants en négatif.
function modeleAvoir(rendu) {
  const d = rendu.data;
  const c = d.companyInfo || {};
  const cl = d.client || {};
  const o = d.originalInvoice || {};
  const lignes = (d.items || []).map((i) => ligneFacture(i, -1));
  const tot = totauxTva(lignes, { libelleHt: "Total HT", libelleTtc: "Total TTC" });

  const a = c.address || {};
  const siege = [a.street, a.postalCode, a.city].filter(Boolean).join(", ");
  return {
    slug: rendu.slug,
    titre: "Avoir",
    meta: [
      ["Numéro d'avoir", `${d.prefix}-${d.number}`],
      ["Date d'émission", dateFr(d.issueDate)],
      ["Facture d'origine", o.number],
      ["Date facture d'origine", dateFr(o.issueDate)],
      ["Motif", d.reason],
    ],
    emetteur: [
      c.name,
      ...ligneAdresse(c.address),
      c.email,
      c.siret ? `SIRET: ${c.siret}` : null,
      c.phone,
      c.vatNumber ? `N° TVA: ${c.vatNumber}` : null,
    ].filter(Boolean),
    client: [
      cl.name,
      ...ligneAdresse(cl.address),
      cl.email,
      cl.siret ? `SIRET: ${cl.siret}` : null,
    ].filter(Boolean),
    colonnes: COLONNES_FACTURE.map((col) => col.libelle),
    tableau: {
      colonnes: COLONNES_FACTURE,
      // Le prix unitaire est saisi en positif, le total de ligne est crédité.
      formule: (n) => `IF(B${n}="","",-B${n}*C${n})`,
    },
    lignes,
    totaux: tot,
    conditions: d.conditions || [],
    pied: [
      [c.name, c.legalForm, `Siège: ${siege}`, c.vatNumber ? `TVA intracom: ${c.vatNumber}` : null]
        .filter(Boolean)
        .join(" • "),
    ],
    franchise: false,
  };
}

// Totaux HT, TVA par taux, total TVA et TTC, avec les formules Excel
// correspondantes. Contrairement aux modèles de facture historiques, la TVA
// est calculée ligne à ligne (SUMIF par taux, SUMPRODUCT pour le total) : un
// taux modifié dans le classeur reste juste.
function totauxTva(lignes, { libelleHt, libelleTaux, libelleTva = "Total TVA", libelleTtc }) {
  const totalHt = lignes.reduce((s, l) => s + l.totalHt, 0);
  const parTaux = new Map();
  for (const l of lignes) {
    parTaux.set(l.tva, (parTaux.get(l.tva) || 0) + (l.totalHt * l.tva) / 100);
  }
  const totalTva = [...parTaux.values()].reduce((s, v) => s + v, 0);
  const totaux = [
    {
      libelle: libelleHt,
      montant: totalHt,
      formule: ({ premiere, derniere }) => `SUM(E${premiere}:E${derniere})`,
      cle: "ht",
    },
  ];
  for (const taux of [...parTaux.keys()].sort((x, y) => x - y)) {
    if (!taux) continue;
    totaux.push({
      libelle: libelleTaux ? libelleTaux(taux) : `TVA ${taux}%`,
      montant: parTaux.get(taux),
      formule: ({ premiere, derniere }) =>
        `ROUND(SUMIF(D${premiere}:D${derniere},${taux / 100},E${premiere}:E${derniere})*${taux / 100},2)`,
    });
  }
  totaux.push({
    libelle: libelleTva,
    montant: totalTva,
    formule: ({ premiere, derniere }) =>
      `ROUND(SUMPRODUCT(D${premiere}:D${derniere},E${premiere}:E${derniere}),2)`,
    cle: "tva",
  });
  totaux.push({
    libelle: libelleTtc,
    montant: totalHt + totalTva,
    fort: true,
    formule: ({ refs }) => `${refs.ht}+${refs.tva}`,
  });
  return totaux;
}

// ------------------------------------------------------ facture anglaise ---
// Les libellés sont doublés « anglais / français » : l'article recommande de
// conserver toutes les mentions françaises, « simplement traduites ou doublées
// en anglais pour les libellés ». Dates au format AAAA-MM-JJ, comme il le
// conseille pour éviter la confusion jour/mois.
const COLONNES_INVOICE = [
  { libelle: "Description", docx: 4052, format: "texte" },
  { libelle: "Qty / Qté", docx: 1100, format: "quantite", align: "right" },
  { libelle: "Unit price / Prix unitaire", docx: 1600, format: "eur", align: "right" },
  { libelle: "VAT / TVA (%)", docx: 1200, format: "pct", align: "right" },
  { libelle: "Amount excl. VAT / Total HT", docx: 1800, format: "eur", align: "right" },
];

function modeleInvoiceEn(rendu) {
  const d = rendu.data;
  const c = d.companyInfo || {};
  const cl = d.client || {};
  const lignes = (d.items || []).map((i) => ligneFacture(i));
  const a = c.address || {};
  const siege = [a.street, a.postalCode, a.city].filter(Boolean).join(", ");
  return {
    slug: rendu.slug,
    titre: "Invoice / Facture",
    nomFeuille: "Invoice",
    meta: [
      ["Invoice number / N° de facture", `${d.prefix}-${d.number}`],
      ["Issue date / Date d'émission", d.issueDate],
      ["Date of supply / Date de la prestation", d.executionDate],
      ["Due date / Date d'échéance", d.dueDate],
    ],
    intitulesBlocs: ["Seller / Émetteur", "Bill to / Client"],
    emetteur: [
      c.name,
      ...ligneAdresse(c.address),
      c.email,
      c.siren ? `SIREN: ${c.siren}` : null,
      c.vatNumber ? `VAT number / N° TVA: ${c.vatNumber}` : null,
    ].filter(Boolean),
    client: [
      cl.name,
      ...ligneAdresse(cl.address),
      cl.email,
      cl.registration ? `Company number: ${cl.registration}` : null,
      cl.vatNumber ? `VAT number: ${cl.vatNumber}` : null,
    ].filter(Boolean),
    colonnes: COLONNES_INVOICE.map((col) => col.libelle),
    tableau: {
      colonnes: COLONNES_INVOICE,
      formule: (n) => `IF(B${n}="","",B${n}*C${n})`,
    },
    lignes,
    totaux: totauxTva(lignes, {
      libelleHt: "Subtotal / Total HT",
      libelleTaux: (t) => `VAT / TVA ${t}%`,
      libelleTva: "Total VAT / Total TVA",
      libelleTtc: "Total due / Total TTC",
    }),
    conditions: d.conditions || [],
    pied: [
      [
        c.name,
        c.legalForm,
        `Registered office / Siège: ${siege}`,
        c.vatNumber ? `VAT / TVA intracom: ${c.vatNumber}` : null,
      ]
        .filter(Boolean)
        .join(" • "),
    ],
    franchise: false,
  };
}

// ------------------------------------------------------------ reçu ---
// Un reçu n'est pas une facture : ni TVA ni numérotation légale. Le tableau
// détaille le ou les règlements reçus, puis l'attestation et la signature.
const COLONNES_RECU = [
  { libelle: "Motif du paiement", docx: 3652, format: "texte" },
  { libelle: "Date", docx: 1300, format: "date", align: "right" },
  { libelle: "Mode de règlement", docx: 1600, format: "texte" },
  { libelle: "Référence", docx: 1500, format: "texte" },
  { libelle: "Montant reçu", docx: 1700, format: "eur", align: "right" },
];

function modeleRecu(rendu) {
  const d = rendu.data;
  const c = d.companyInfo || {};
  const cl = d.client || {};
  const lignes = (d.payments || []).map((p) => ({
    totalHt: Number(p.amount || 0),
    docx: [p.reason, dateFr(p.date), p.method, p.reference, EUR.format(Number(p.amount || 0))],
    xlsx: [p.reason, p.date, p.method, p.reference, Number(p.amount || 0)],
  }));
  const total = lignes.reduce((s, l) => s + l.totalHt, 0);
  const a = c.address || {};
  const siege = [a.street, a.postalCode, a.city].filter(Boolean).join(", ");
  return {
    slug: rendu.slug,
    titre: "Reçu de paiement",
    meta: [
      ["Reçu n°", `${d.prefix}-${d.number}`],
      ["Date d'établissement", dateFr(d.issueDate)],
    ],
    intitulesBlocs: ["Émetteur (bénéficiaire du paiement)", "Payeur"],
    emetteur: [
      c.name,
      ...ligneAdresse(c.address),
      c.email,
      c.siret ? `SIRET: ${c.siret}` : null,
      c.phone,
    ].filter(Boolean),
    client: [cl.name, ...ligneAdresse(cl.address), cl.email].filter(Boolean),
    colonnes: COLONNES_RECU.map((col) => col.libelle),
    tableau: { colonnes: COLONNES_RECU, formule: null },
    lignes,
    totaux: [
      {
        libelle: "Total reçu",
        montant: total,
        fort: true,
        formule: ({ premiere, derniere }) => `SUM(E${premiere}:E${derniere})`,
      },
    ],
    conditions: d.conditions || [],
    signature: d.signature || null,
    pied: [[c.name, c.legalForm, siege, c.siret ? `SIRET: ${c.siret}` : null].filter(Boolean).join(" • ")],
    franchise: false,
  };
}

module.exports = { modeleDocument, EUR, dateFr };
