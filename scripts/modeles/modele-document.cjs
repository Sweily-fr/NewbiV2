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

function modeleDocument(rendu) {
  const d = rendu.data;
  const estDevis = rendu.type === "quote";
  const estAcompte = Boolean(d.isDepositInvoice || d.invoiceType === "deposit");
  const items = d.items || [];

  // Franchise en base : le gabarit masque le numéro de TVA de l'émetteur, les
  // lignes de TVA du récapitulatif, et ajoute la mention au pied de page.
  const franchise = items.every((i) => Number(i.vatRate || 0) === 0);

  const titre = estAcompte ? "Facture d'acompte" : estDevis ? "Devis" : "Facture";

  const meta = [
    [estDevis ? "Numéro de devis" : "Numéro de facture", `${d.prefix}-${d.number}`],
    ["Date d'émission", dateFr(d.issueDate)],
    estDevis
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

  const lignes = items.map((i) => {
    const ht = Number(i.quantity || 0) * Number(i.unitPrice || 0);
    return {
      description: i.description || "",
      quantite: Number(i.quantity || 0),
      unite: i.unit || "unité",
      prixUnitaire: Number(i.unitPrice || 0),
      tva: Number(i.vatRate || 0),
      totalHt: ht,
    };
  });

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
  if (franchise) pied.push("TVA non applicable, art. L. 223-3 du CIBS");

  return {
    slug: rendu.slug,
    titre,
    meta,
    emetteur,
    client,
    colonnes: ["Description", "Qté", "Prix unitaire", "TVA (%)", "Total HT"],
    lignes,
    totaux,
    conditions: d.termsAndConditions || "",
    pied,
    franchise,
  };
}

module.exports = { modeleDocument, EUR, dateFr };
