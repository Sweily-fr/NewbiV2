#!/usr/bin/env node
/**
 * Génère l'image d'exemple des articles « modèle » du blog :
 * public/blog/<slug>/exemple.webp, utilisée dans le corps de l'article
 * (bloc <Image>) et comme image de partage (champ `image` du frontmatter).
 *
 * Chaque image montre le document rempli avec les MÊMES données que
 * l'article (montants, numéros, dates, mentions). Si vous modifiez l'exemple
 * d'un article, modifiez la fiche correspondante ci-dessous puis relancez.
 * Les entreprises et personnes sont fictives ; les SIREN/SIRET inventés ont
 * le bon format mais une clé de contrôle invalide, ils ne peuvent donc
 * désigner aucune entreprise réelle.
 *
 * Rendu : une page HTML/CSS par type de document (A4, lettre, e-mail,
 * tableur), capturée par Chrome (puppeteer-core) à 1600 px de large, puis
 * convertie en WebP (sharp, qualité 82).
 *
 * Usage :
 *   node scripts/blog/generate-modele-images.mjs            → les 14 images
 *   node scripts/blog/generate-modele-images.mjs <slug>…    → seulement celles-ci
 *   CHROME_PATH=/chemin/vers/chrome node scripts/blog/…     → autre navigateur
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const LARGEUR_SORTIE = 1600;
const QUALITE_WEBP = 82;
const ACCENT = "#5a50ff";

// ---------------------------------------------------------------------------
// Outils de calcul et de mise en forme
// ---------------------------------------------------------------------------

const arrondi = (n) => Math.round(n * 100) / 100;

/** Vérifie qu'un montant calculé est bien celui de l'article. */
function verifie(libelle, calcule, attendu) {
  if (Math.abs(calcule - attendu) > 0.001) {
    throw new Error(`${libelle} : ${calcule} calculé, ${attendu} dans l'article`);
  }
  return calcule;
}

const fmtFr = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtFr0 = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
const fmtEn = new Intl.NumberFormat("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** 1 200,00 € ; les montants négatifs prennent le vrai signe moins. */
const eur = (n) => `${n < 0 ? "−" : ""}${fmtFr.format(Math.abs(n))} €`;
const nombre = (n) => `${n < 0 ? "−" : ""}${fmtFr.format(Math.abs(n))}`;
const entier = (n) => `${n < 0 ? "−" : ""}${fmtFr0.format(Math.abs(n))}`;
const eurEn = (n) => `€${fmtEn.format(n)}`;

/** Numéro de TVA intracommunautaire français (clé calculée sur le SIREN). */
function tvaIntra(siren) {
  const s = siren.replace(/\s/g, "");
  const cle = (12 + 3 * (Number(s) % 97)) % 97;
  return `FR${String(cle).padStart(2, "0")} ${s.slice(0, 3)} ${s.slice(3, 6)} ${s.slice(6)}`;
}

const sirenDe = (siret) => siret.replace(/\s/g, "").slice(0, 9).replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3");

/** Date jj/mm/aaaa à partir d'une date ISO, et ajout de jours. */
const jjmmaaaa = (iso) => iso.split("-").reverse().join("/");
function plusJours(iso, jours) {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + jours);
  return d.toISOString().slice(0, 10);
}
const ecartJours = (isoA, isoB) =>
  Math.round((new Date(`${isoA}T12:00:00Z`) - new Date(`${isoB}T12:00:00Z`)) / 86400000);

/** Un numéro de pièce (F-2026-0187…) ne se coupe jamais en fin de ligne. */
const insecables = (html) =>
  html
    .replace(/n° /g, "n°\u00a0")
    .replace(/\b[A-Z]{1,3}-\d{4}-\d{2,4}\b/g, (m) => `<span style="white-space:nowrap">${m}</span>`);

const esc = (s) => insecables(String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"));

// ---------------------------------------------------------------------------
// Données des exemples (une fiche par article)
// ---------------------------------------------------------------------------

const IBAN = "FR76 3000 6000 0112 3456 7890 189";
const BIC = "AGRIFRPPXXX";
const MENTION_RETARD =
  "En cas de retard de paiement, pénalités au taux de trois fois le taux d'intérêt légal et indemnité forfaitaire pour frais de recouvrement de 40 € (art. L441-10 du Code de commerce).";

/* --- Avoir : Studio Pixel → Boutique Verte SARL ------------------------- */
const avoirHt = 600;
const avoirTva = verifie("Avoir, TVA", arrondi(avoirHt * 0.2), 120);
const avoirTtc = verifie("Avoir, TTC", avoirHt + avoirTva, 720);
const SIRET_PIXEL = "852 147 963 00028";

/* --- Devis plombier : chaudière à condensation ------------------------- */
const devisHt = 3200;
const devisTva = verifie("Devis, TVA 10 %", arrondi(devisHt * 0.1), 320);
const devisTtc = verifie("Devis, TTC", devisHt + devisTva, 3520);
const devisAcompte = verifie("Devis, acompte 30 %", arrondi(devisTtc * 0.3), 1056);
const devisSolde = verifie("Devis, solde", arrondi(devisTtc - devisAcompte), 2464);
const SIRET_PLOMBIER = "903 214 578 00014";

/* --- Facture d'acompte : 30 % de 8 000 € HT ---------------------------- */
const projetHt = 8000;
const projetTtc = verifie("Acompte, total TTC", arrondi(projetHt * 1.2), 9600);
const acompteHt = verifie("Acompte, HT", arrondi(projetHt * 0.3), 2400);
const acompteTva = verifie("Acompte, TVA", arrondi(acompteHt * 0.2), 480);
const acompteTtc = verifie("Acompte, TTC", acompteHt + acompteTva, 2880);
const soldeTtc = verifie("Acompte, solde TTC", projetTtc - acompteTtc, 6720);
const SIRET_RENOV = "533 681 249 00027";

/* --- Invoice : développeur freelance → client à Londres ---------------- */
const invoiceJours = 16;
const invoiceTaux = 500;
const invoiceTotal = verifie("Invoice, total", invoiceJours * invoiceTaux, 8000);
const SIRET_DEV = "814 792 563 00018";

/* --- Facture auto-entrepreneur : Julie Martin (données de l'article) --- */
const aeTotal = 1200;

/* --- Facture gratuite : graphiste freelance, TVA 20 % ------------------ */
const fgHt = 1200;
const fgTva = verifie("Facture, TVA", arrondi(fgHt * 0.2), 240);
const fgTtc = verifie("Facture, TTC", fgHt + fgTva, 1440);
const SIRET_GRAPHISTE = "487 159 632 00031";

/* --- Facture sans TVA : graphiste en franchise en base ----------------- */
const fsTotal = 1200;
const SIRET_GRAPHISTE_MICRO = "923 847 165 00026";

/* --- Reçu : plombier, 450 € en espèces --------------------------------- */
const recuMontant = 450;

/* --- Contrat : consultant SI, 650 € HT/jour × 20 jours ----------------- */
const contratTjm = 650;
const contratJours = 20;
const contratHt = contratTjm * contratJours;
const contratAcompteHt = verifie("Contrat, acompte 20 %", arrondi(contratHt * 0.2), 2600);
const SIRET_CONSULTANT = "791 452 386 00019";

/* --- Mise en demeure : facture de 3 200 € TTC échue depuis 30 jours ---- */
const SIRET_IMPRIMERIE = "882 563 417 00024";
const medEcheance = "2026-08-31";
const medDateLettre = "2026-09-30";
const medRetard = verifie("Mise en demeure, jours de retard", ecartJours(medDateLettre, medEcheance), 30);

/* --- Mail : modèle 1, facture F-2026-042 de 1 800 € TTC ----------------- */
const SIRET_MAIL = "518 372 649 00016";

/* --- Note de frais : consultant, 6 CV, 720 km -------------------------- */
const BAREME_6CV = 0.665;
const nfTrajetKm = 360; // aller-retour domicile ↔ client (2 × 180 km)
const nfRepas = [
  ["2026-10-06", "Déjeuner", "Brasserie du Centre", 26],
  ["2026-10-06", "Dîner", "Le Petit Bouchon", 31],
  ["2026-10-07", "Déjeuner", "Brasserie du Centre", 24],
  ["2026-10-20", "Déjeuner", "La Table du Marché", 29],
  ["2026-10-20", "Dîner", "Le Petit Bouchon", 30],
];
const nfNuits = [
  ["2026-10-06", "Hôtel de la Gare, 1 nuit", 95],
  ["2026-10-20", "Hôtel de la Gare, 1 nuit", 95],
];

/* --- Plan de trésorerie : graphiste freelance, mars = exemple de l'article */
const MOIS = ["Janv.", "Févr.", "Mars", "Avr.", "Mai", "Juin", "Juil.", "Août", "Sept.", "Oct.", "Nov.", "Déc."];
const ptSoldeJanvier = 2880;
const ptEncaissements = [3000, 2500, 3600, 2400, 3000, 3300, 2700, 1200, 3600, 3000, 2700, 3300];
const ptDecaissements = [
  ["Loyer de l'atelier", Array(12).fill(800)],
  ["Cotisations URSSAF", Array(12).fill(450)],
  ["TVA à reverser (trimestrielle)", [0, 0, 600, 0, 0, 900, 0, 0, 750, 0, 0, 800]],
  ["Acompte d'impôt sur le revenu", [0, 600, 0, 0, 600, 0, 0, 600, 0, 0, 600, 0]],
  ["Abonnements et charges diverses", Array(12).fill(300)],
  ["Assurance professionnelle", [480, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
  ["CFE", [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 320]],
];

/* --- Suivi des factures : graphiste, 12 factures, situation au 9/11 ---- */
const SUIVI_AU = "2026-11-09";
const suiviFactures = [
  // numéro, client, émission, HT, statut, date de paiement, mode, dernière relance
  ["F-2026-131", "Boulangerie Lenoir", "2026-09-01", 450, "Payée", "2026-09-28", "Virement", ""],
  ["F-2026-132", "Cabinet Arnaud Avocats", "2026-09-04", 1800, "Payée", "2026-10-06", "Virement", ""],
  ["F-2026-133", "Studio Équilibre", "2026-09-09", 300, "Payée", "2026-10-02", "Carte", ""],
  ["F-2026-134", "Domaine des Trois Chênes", "2026-09-15", 2500, "En retard", "", "", "2026-11-03"],
  ["F-2026-135", "Garage Martel", "2026-09-18", 650, "Payée", "2026-10-23", "Chèque", "2026-10-21"],
  ["F-2026-136", "Librairie du Parc", "2026-09-25", 380, "En retard", "", "", "2026-10-31"],
  ["F-2026-137", "Agence Cap Ouest", "2026-09-30", 1200, "Payée partiellement", "2026-10-30", "Virement", "2026-11-04"],
  ["F-2026-138", "Ferme Les Prés Verts", "2026-10-06", 520, "Payée", "2026-11-02", "Virement", ""],
  ["F-2026-139", "Cabinet Arnaud Avocats", "2026-10-12", 950, "En attente", "", "", ""],
  ["F-2026-140", "Hôtel Les Mouettes", "2026-10-19", 2100, "En attente", "", "", ""],
  ["F-2026-141", "Studio Équilibre", "2026-10-26", 300, "En attente", "", "", ""],
  ["F-2026-142", "Brasserie Le Comptoir", "2026-10-30", 780, "En attente", "", "", ""],
];

const EXEMPLES = {
  "modele-avoir-note-de-credit-gratuit": {
    gabarit: "document",
    titre: "Avoir",
    sousTitre: "Note de crédit",
    emetteur: {
      nom: "Studio Pixel SAS",
      lignes: [
        "18 rue des Tanneurs, 69007 Lyon",
        `SIRET ${SIRET_PIXEL}`,
        `TVA intracommunautaire ${tvaIntra(SIRET_PIXEL.slice(0, 11))}`,
        "01 99 00 42 18",
      ],
    },
    client: {
      label: "Client",
      nom: "Boutique Verte SARL",
      lignes: ["7 place du Marché", "69003 Lyon", "SIRET 481 263 957 00019"],
    },
    meta: [
      ["Numéro", "AV-2026-0042"],
      ["Date d'émission", "20 septembre 2026"],
    ],
    encadres: [
      ["Facture d'origine", "F-2026-0187 du 3 septembre 2026"],
      ["Motif", "Fonctionnalité non livrée, réduction accordée"],
    ],
    colonnes: [
      ["Désignation", "left", "auto"],
      ["Qté", "right", "44px"],
      ["Prix unit. HT", "right", "92px"],
      ["TVA", "right", "52px"],
      ["Total HT", "right", "92px"],
    ],
    lignes: [
      [
        {
          texte: "Réduction sur la refonte du site web",
          detail: "Fonctionnalité prévue au devis non développée (facture F-2026-0187)",
        },
        "1",
        eur(-avoirHt),
        "20 %",
        eur(-avoirHt),
      ],
    ],
    totaux: [
      ["Montant HT crédité", eur(-avoirHt)],
      ["TVA 20 %", eur(-avoirTva)],
      ["Montant TTC crédité", eur(-avoirTtc), true],
    ],
    notes: [
      ["Modalité", "Déduction sur la prochaine facture émise à Boutique Verte SARL."],
      [
        "Rappel",
        "Cet avoir annule partiellement la facture F-2026-0187 du 3 septembre 2026, qui reste inchangée. Taux de TVA identique à celui de la facture d'origine.",
      ],
    ],
    pied: `Studio Pixel SAS au capital de 5 000 € · RCS Lyon ${sirenDe(SIRET_PIXEL)} · ${tvaIntra(SIRET_PIXEL.slice(0, 11))}`,
  },

  "modele-devis-gratuit-word-excel-pdf": {
    gabarit: "document",
    titre: "Devis",
    emetteur: {
      nom: "Plomberie Garnier",
      lignes: [
        "Lucas Garnier EI, plombier chauffagiste",
        "24 rue des Artisans, 37000 Tours",
        `SIRET ${SIRET_PLOMBIER}`,
        `TVA intracommunautaire ${tvaIntra(SIRET_PLOMBIER.slice(0, 11))}`,
        "06 39 98 24 17",
      ],
    },
    client: {
      label: "Client",
      nom: "Mme Claire Fontaine",
      lignes: ["9 allée des Tilleuls", "37200 Tours"],
    },
    meta: [
      ["Numéro", "D-2026-032"],
      ["Date d'émission", "3 septembre 2026"],
      ["Validité", "30 jours (jusqu'au 3 octobre 2026)"],
    ],
    colonnes: [
      ["Désignation", "left", "auto"],
      ["Qté", "right", "44px"],
      ["Prix unit. HT", "right", "92px"],
      ["TVA", "right", "52px"],
      ["Total HT", "right", "92px"],
    ],
    lignes: [
      [
        {
          texte: "Fourniture et pose d'une chaudière à condensation",
          detail:
            "Taux de TVA de 10 % : travaux d'amélioration dans un logement achevé depuis plus de deux ans",
        },
        "1",
        eur(devisHt),
        "10 %",
        eur(devisHt),
      ],
    ],
    totaux: [
      ["Total HT", eur(devisHt)],
      ["TVA 10 %", eur(devisTva)],
      ["Total TTC", eur(devisTtc), true],
      ["Acompte à la signature (30 %)", eur(devisAcompte)],
      ["Solde à la livraison", eur(devisSolde)],
    ],
    notes: [
      [
        "Conditions",
        `Devis valable 30 jours à compter de sa date d'émission. Acompte de 30 %, soit ${eur(devisAcompte)} TTC, à la signature ; solde de ${eur(devisSolde)} TTC à la livraison.`,
      ],
    ],
    signature: {
      gauche: ["Plomberie Garnier", "Lucas Garnier"],
      droite: ["Bon pour accord", "Date et signature du client"],
    },
    pied: `Lucas Garnier EI · SIRET ${SIRET_PLOMBIER} · ${tvaIntra(SIRET_PLOMBIER.slice(0, 11))}`,
  },

  "modele-facture-acompte-gratuit": {
    gabarit: "document",
    titre: "Facture d'acompte",
    emetteur: {
      nom: "Moreau Rénovation SARL",
      lignes: [
        "5 rue de la Forge, 31200 Toulouse",
        `SIRET ${SIRET_RENOV}`,
        `TVA intracommunautaire ${tvaIntra(SIRET_RENOV.slice(0, 11))}`,
        "05 99 00 31 52",
      ],
    },
    client: {
      label: "Client",
      nom: "Cabinet Lefort Conseil SARL",
      lignes: ["16 boulevard des Minimes", "31200 Toulouse", "SIRET 795 314 862 00025"],
    },
    meta: [
      ["Numéro", "FA-2026-014"],
      ["Date d'émission", "6 avril 2026"],
      ["Acompte encaissé le", "3 avril 2026"],
      ["Devis de référence", "D-2026-009 du 1er avril 2026"],
    ],
    encadres: [
      ["Prestation", "Rénovation des bureaux (peinture, sols, cloisons)"],
      ["Montant total du devis", `${eur(projetHt)} HT, soit ${eur(projetTtc)} TTC`],
    ],
    colonnes: [
      ["Désignation", "left", "auto"],
      ["TVA", "right", "52px"],
      ["Montant HT", "right", "110px"],
    ],
    lignes: [
      [
        {
          texte: "Acompte de 30 % sur le devis D-2026-009",
          detail: `30 % de ${eur(projetHt)} HT`,
        },
        "20 %",
        eur(acompteHt),
      ],
    ],
    totaux: [
      ["Total HT", eur(acompteHt)],
      ["TVA 20 %", eur(acompteTva)],
      ["Total TTC de l'acompte", eur(acompteTtc), true],
      ["Déjà réglé le 3 avril 2026", eur(-acompteTtc)],
      ["Reste à payer", eur(0)],
    ],
    notes: [
      ["Nature du versement", "La somme versée constitue un acompte, et non des arrhes : elle engage fermement les deux parties."],
      [
        "Solde",
        `Le solde de ${eur(soldeTtc)} TTC sera facturé à l'achèvement des travaux, en déduction de la présente facture d'acompte, payable à 30 jours. ${MENTION_RETARD}`,
      ],
      ["Règlement par virement", `IBAN ${IBAN} · BIC ${BIC}`],
    ],
    pied: `Moreau Rénovation SARL au capital de 10 000 € · RCS Toulouse ${sirenDe(SIRET_RENOV)} · ${tvaIntra(SIRET_RENOV.slice(0, 11))}`,
  },

  "modele-facture-anglais-invoice": {
    gabarit: "document",
    langue: "en",
    titre: "Invoice",
    emetteur: {
      nom: "Hugo Lambert EI",
      lignes: [
        "Freelance web developer",
        "31 rue des Remparts, 33000 Bordeaux, France",
        `SIREN ${sirenDe(SIRET_DEV)}`,
        `VAT number ${tvaIntra(SIRET_DEV.slice(0, 11))}`,
        "+33 6 39 98 51 07",
      ],
    },
    client: {
      label: "Bill to",
      nom: "Northbridge Analytics Ltd",
      lignes: ["14 Harrow Lane", "London EC2A 4NE", "United Kingdom"],
    },
    meta: [
      ["Invoice number", "F-2026-118"],
      ["Issue date", "2026-10-05"],
      ["Due date", "2026-11-04"],
    ],
    colonnes: [
      ["Description", "left", "auto"],
      ["Qty", "right", "60px"],
      ["Unit price", "right", "92px"],
      ["Amount", "right", "92px"],
    ],
    lignes: [
      [
        {
          texte: "Web application development",
          detail: "Sprints 1 and 2, September 2026",
        },
        `${invoiceJours} days`,
        eurEn(invoiceTaux),
        eurEn(invoiceTotal),
      ],
    ],
    totaux: [
      ["Subtotal (excl. VAT)", eurEn(invoiceTotal)],
      ["VAT", "–"],
      ["Total due", eurEn(invoiceTotal), true],
    ],
    notes: [
      ["VAT", "VAT not applicable - export of services"],
      [
        "Payment terms",
        "Net 30 / Payment due within 30 days. Late payment penalties: three times the French legal interest rate. Fixed recovery compensation: €40.",
      ],
      ["Bank details", `IBAN ${IBAN} · BIC ${BIC}`],
    ],
    pied: `Hugo Lambert EI · SIREN ${sirenDe(SIRET_DEV)} · VAT number ${tvaIntra(SIRET_DEV.slice(0, 11))}`,
  },

  "modele-facture-auto-entrepreneur-gratuit": {
    gabarit: "document",
    titre: "Facture",
    emetteur: {
      nom: "Julie Martin EI",
      lignes: ["Développement web", "12 rue des Lilas, 44000 Nantes", "SIREN 812 345 678", "06 39 98 44 12"],
    },
    client: {
      label: "Client",
      nom: "Boulangerie Dupont SARL",
      lignes: ["5 avenue du Marché", "44100 Nantes"],
    },
    meta: [
      ["Numéro", "FA-2026-014"],
      ["Date d'émission", "12 septembre 2026"],
      ["Date de réalisation", "11 septembre 2026"],
      ["Échéance", "12 octobre 2026"],
    ],
    colonnes: [
      ["Désignation", "left", "auto"],
      ["Qté", "right", "70px"],
      ["Prix unitaire", "right", "96px"],
      ["Montant", "right", "96px"],
    ],
    lignes: [[{ texte: "Création d'un site vitrine" }, "1 forfait", eur(aeTotal), eur(aeTotal)]],
    totaux: [["Montant total", eur(aeTotal), true]],
    mention: "TVA non applicable, article 293 B du CGI",
    notes: [
      ["Conditions de règlement", `Paiement à 30 jours, par virement. ${MENTION_RETARD}`],
      ["Coordonnées bancaires", `IBAN ${IBAN} · BIC ${BIC}`],
    ],
    pied: "Julie Martin EI · 12 rue des Lilas, 44000 Nantes · SIREN 812 345 678",
  },

  "modele-facture-gratuit-word-excel-pdf": {
    gabarit: "document",
    titre: "Facture",
    emetteur: {
      nom: "Léa Rousseau EI",
      lignes: [
        "Graphiste freelance",
        "8 rue Saint-Rome, 31000 Toulouse",
        `SIRET ${SIRET_GRAPHISTE}`,
        `TVA intracommunautaire ${tvaIntra(SIRET_GRAPHISTE.slice(0, 11))}`,
        "06 39 98 70 25",
      ],
    },
    client: {
      label: "Client",
      nom: "Maison Delmas SAS",
      lignes: ["42 avenue de Lombez", "31300 Toulouse", "SIRET 845 927 316 00012"],
    },
    meta: [
      ["Numéro", "2026-014"],
      ["Date d'émission", "15 septembre 2026"],
      ["Échéance", "15 octobre 2026 (30 jours)"],
    ],
    colonnes: [
      ["Désignation", "left", "auto"],
      ["Qté", "right", "44px"],
      ["Prix unit. HT", "right", "92px"],
      ["TVA", "right", "52px"],
      ["Total HT", "right", "92px"],
    ],
    lignes: [[{ texte: "Création de logo et charte graphique" }, "1", eur(fgHt), "20 %", eur(fgHt)]],
    totaux: [
      ["Total HT", eur(fgHt)],
      ["TVA 20 %", eur(fgTva)],
      ["Total TTC", eur(fgTtc), true],
    ],
    notes: [
      [
        "Conditions de règlement",
        "Paiement à 30 jours, au plus tard le 15 octobre 2026. Pénalité de retard au taux de 10 % annuel. Indemnité forfaitaire pour frais de recouvrement de 40 €.",
      ],
      ["Règlement par virement", `IBAN ${IBAN} · BIC ${BIC}`],
    ],
    pied: `Léa Rousseau EI · SIRET ${SIRET_GRAPHISTE} · ${tvaIntra(SIRET_GRAPHISTE.slice(0, 11))}`,
  },

  "modele-facture-sans-tva-franchise-en-base": {
    gabarit: "document",
    titre: "Facture",
    emetteur: {
      nom: "Inès Morel EI",
      lignes: ["Graphiste indépendante", "3 rue des Capucins, 49100 Angers", `SIRET ${SIRET_GRAPHISTE_MICRO}`, "06 39 98 63 41"],
    },
    client: {
      label: "Client",
      nom: "Horizon Voyages SAS",
      lignes: ["27 boulevard Foch", "49100 Angers", "SIRET 507 284 913 00032"],
    },
    meta: [
      ["Numéro", "F-2026-027"],
      ["Date d'émission", "8 septembre 2026"],
      ["Échéance", "8 octobre 2026"],
    ],
    colonnes: [
      ["Désignation", "left", "auto"],
      ["Quantité", "right", "128px"],
      ["Prix unit. HT", "right", "100px"],
      ["Montant", "right", "92px"],
    ],
    lignes: [
      [{ texte: "Création d'un logo et d'une charte graphique" }, "1 prestation forfaitaire", eur(fsTotal), eur(fsTotal)],
    ],
    totaux: [["Total à payer", eur(fsTotal), true]],
    mention: "TVA non applicable, article 293 B du CGI",
    notes: [
      ["Conditions de règlement", `Paiement à 30 jours, par virement. ${MENTION_RETARD}`],
      ["Coordonnées bancaires", `IBAN ${IBAN} · BIC ${BIC}`],
    ],
    pied: `Inès Morel EI · 3 rue des Capucins, 49100 Angers · SIRET ${SIRET_GRAPHISTE_MICRO}`,
  },

  "modele-recu-paiement-quittance": {
    gabarit: "recu",
    emetteur: {
      nom: "Plomberie Garnier",
      lignes: ["Lucas Garnier EI, plombier chauffagiste", "24 rue des Artisans, 37000 Tours", `SIRET ${SIRET_PLOMBIER}`],
    },
    payeur: { nom: "M. Paul Lemoine", lignes: ["15 rue Nationale, 37000 Tours"] },
    montant: eur(recuMontant),
    montantLettres: "quatre cent cinquante euros",
    details: [
      ["Date du paiement", "12 novembre 2026"],
      ["Mode de règlement", "Espèces"],
      ["Motif", "Paiement de la facture n° F-2026-0342"],
    ],
    texte: `Je soussigné, Lucas Garnier, Plomberie Garnier, reconnais avoir reçu de M. Paul Lemoine la somme de ${nombre(recuMontant)} EUR (quatre cent cinquante euros), le 12 novembre 2026, en espèces, en paiement de la facture n° F-2026-0342.`,
    faitA: "Fait à Tours, le 12 novembre 2026.",
    signataire: "Lucas Garnier",
  },

  "modele-contrat-prestation-de-services": {
    gabarit: "contrat",
    titre: "Contrat de prestation de services",
    parties: [
      [
        "Le Prestataire",
        `Nicolas Perrin EI, consultant en systèmes d'information, 27 rue Victor-Hugo, 69002 Lyon, SIRET ${SIRET_CONSULTANT}, ci-après « le Prestataire ».`,
      ],
      [
        "Le Client",
        "Transports Vallée SAS, 140 avenue de l'Industrie, 69800 Saint-Priest, SIRET 609 813 274 00041, représentée par Mme Sophie Vallée, présidente, ci-après « le Client ».",
      ],
    ],
    articles: [
      [
        "Article 1. Objet",
        [
          "Le Prestataire réalise pour le Client une mission de conseil en système d'information : audit de l'existant, rédaction d'un rapport de préconisations et accompagnement de leur mise en œuvre. La mission représente 20 jours de travail répartis sur trois mois. Toute demande hors de ce périmètre fera l'objet d'un avenant.",
        ],
      ],
      [
        "Article 2. Prix et modalités de paiement",
        [
          `La mission est facturée ${eur(contratTjm)} HT par jour, soit ${eur(contratHt)} HT pour ${contratJours} jours, TVA au taux de 20 % en sus. Un acompte de 20 %, soit ${eur(contratAcompteHt)} HT, est facturé à la signature.`,
          "Les jours effectivement réalisés sont facturés chaque mois sur relevé, déduction faite de l'acompte sur la dernière facture. Les factures sont payables par virement à 30 jours.",
          "Tout retard de paiement entraîne de plein droit des pénalités au taux de trois fois le taux d'intérêt légal et une indemnité forfaitaire de recouvrement de 40 € (article L441-10 du Code de commerce).",
        ],
      ],
      [
        "Article 3. Délais",
        ["La mission débute le 4 janvier 2027 et s'achève au plus tard le 31 mars 2027. Tout report est convenu par écrit entre les parties."],
      ],
      [
        "Article 4. Propriété intellectuelle",
        [
          "Les droits patrimoniaux sur les livrables (rapports, préconisations) sont cédés au Client pour tous supports, pour le monde entier et pour la durée légale de protection. La cession des droits sur les livrables de chaque mois n'est effective qu'à compter du paiement intégral de la facture mensuelle correspondante. Jusqu'à cette date, le Prestataire conserve l'ensemble de ses droits sur les livrables produits.",
        ],
      ],
      [
        "Article 5. Résiliation",
        [
          "Chaque partie peut résilier le contrat pour convenance, par lettre recommandée avec accusé de réception, moyennant un préavis de 15 jours, sans indemnité si le préavis est respecté. En cas de manquement grave, le contrat peut être résilié pour faute après une mise en demeure restée sans effet. Dans tous les cas, les prestations réalisées jusqu'à la date de rupture restent dues.",
        ],
      ],
    ],
    faitA: "Fait à Lyon, le 14 décembre 2026, en deux exemplaires originaux.",
    signatures: [
      ["Le Prestataire", "Nicolas Perrin"],
      ["Le Client", "Sophie Vallée, présidente"],
    ],
  },

  "modele-mise-en-demeure-facture-impayee": {
    gabarit: "lettre",
    expediteur: ["Imprimerie Castel SARL", "11 rue des Papetiers", "33000 Bordeaux", `SIRET ${SIRET_IMPRIMERIE}`],
    destinataire: ["Rivage Événements SAS", "Service comptabilité", "58 avenue des Pins", "33700 Mérignac"],
    lieuDate: "Bordeaux, le 30 septembre 2026",
    objet: "Objet : Mise en demeure de payer - Facture n° FA-2026-087",
    envoi: "Lettre recommandée avec accusé de réception",
    corps: [
      "Madame, Monsieur,",
      `Malgré nos relances des 7 septembre 2026 et 21 septembre 2026, nous constatons que la facture n° <strong>FA-2026-087</strong>, d'un montant de <strong>3 200,00 EUR TTC</strong>, émise le <strong>1er août 2026</strong> et échue depuis le <strong>31 août 2026</strong>, demeure impayée à ce jour, soit un retard de <strong>${medRetard} jours</strong>.`,
      "Par la présente, nous vous <strong>mettons en demeure</strong> de procéder au règlement intégral de cette somme dans un délai de <strong>8 jours</strong> à compter de la réception de ce courrier.",
      "Conformément aux articles L441-10 et L441-16 du Code de commerce, ce retard entraîne de plein droit :",
      {
        liste: [
          "Des <strong>pénalités de retard</strong> calculées au taux de 8,25 % l'an, courant depuis le lendemain de la date d'échéance ;",
          "Une <strong>indemnité forfaitaire de recouvrement</strong> de <strong>40 €</strong>, due sans qu'un rappel soit nécessaire.",
        ],
      },
      "À défaut de règlement dans le délai imparti, nous nous verrons contraints d'engager toute action utile au recouvrement de cette créance, y compris une procédure d'injonction de payer, sans autre préavis, et aux frais de votre société.",
      "Nous restons naturellement à votre disposition pour tout échange permettant de régulariser cette situation avant l'expiration de ce délai.",
      "Veuillez agréer, Madame, Monsieur, l'expression de nos salutations distinguées.",
    ],
    signature: ["Marc Castel", "Gérant, Imprimerie Castel SARL"],
  },

  "modele-mail-envoi-facture-client": {
    gabarit: "mail",
    de: "Camille Roux <camille@atelier-roux.fr>",
    a: "Thomas Girard <thomas.girard@maison-girard.fr>",
    objet: "Facture n° F-2026-042 - Atelier Roux",
    date: "Mardi 6 octobre 2026, 09:12",
    corps: [
      "Bonjour Thomas,",
      "Merci pour votre confiance sur ce premier projet. Vous trouverez ci-joint la facture n° F-2026-042 d'un montant de 1 800 € TTC, correspondant à la prestation réalisée du 21 septembre au 2 octobre 2026, conformément au devis validé le 14 septembre 2026.",
      "Le règlement est attendu sous 30 jours, soit avant le 5 novembre 2026. Vous pouvez régler par virement aux coordonnées bancaires indiquées sur la facture.",
      "N'hésitez pas à revenir vers moi pour toute question.",
      "Cordialement,",
    ],
    signature: ["Camille Roux", "Atelier Roux, design graphique", "06 39 98 12 34 · SIRET " + SIRET_MAIL],
    pieceJointe: ["Facture-F2026-042-AtelierRoux.pdf", "PDF · 86 Ko"],
  },

  "modele-note-de-frais-excel-gratuit": { gabarit: "noteDeFrais" },
  "modele-plan-de-tresorerie-excel-gratuit": { gabarit: "planTresorerie" },
  "modele-tableau-suivi-factures-excel": { gabarit: "suiviFactures" },
};

// ---------------------------------------------------------------------------
// Styles communs
// ---------------------------------------------------------------------------

const POLICE = `-apple-system, BlinkMacSystemFont, "Inter", "Helvetica Neue", Arial, sans-serif`;

const CSS_BASE = `
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:#eceef3}
body{font-family:${POLICE};color:#17171f;-webkit-font-smoothing:antialiased;font-variant-numeric:tabular-nums;padding:30px 40px 40px}
.fictif{font-size:10px;color:#8a8b99;text-align:right;margin-bottom:8px;letter-spacing:.02em}
.feuille{background:#fff;border-radius:3px;box-shadow:0 1px 2px rgba(20,20,40,.06),0 10px 30px rgba(20,20,40,.10)}
strong{font-weight:600}
`;

function pageHtml(largeurCss, css, contenu, { fictif = "Exemple fictif" } = {}) {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<style>${CSS_BASE}body{width:${largeurCss}px}${css}</style></head>
<body><div class="fictif">${fictif}</div>${contenu}</body></html>`;
}

// ---------------------------------------------------------------------------
// Gabarit : document A4 (facture, devis, avoir, acompte, invoice)
// ---------------------------------------------------------------------------

const CSS_DOCUMENT = `
.doc{width:720px;min-height:1018px;padding:54px 54px 30px;display:flex;flex-direction:column;font-size:11px;line-height:1.45}
.entete{display:flex;justify-content:space-between;align-items:flex-start;gap:24px}
.emetteur .nom{font-size:15px;font-weight:600;margin-bottom:5px}
.emetteur .l{color:#55566a}
.titre{text-align:right}
.titre h1{font-size:28px;font-weight:600;letter-spacing:-.01em;line-height:1.1}
.titre .sous{color:#6b6c80;font-size:12px;margin-top:2px}
.titre .filet{width:36px;height:3px;background:${ACCENT};margin:10px 0 12px auto;border-radius:2px}
.meta{border-collapse:collapse;margin-left:auto}
.meta th{color:#6b6c80;font-weight:400;text-align:right;padding:1.5px 12px 1.5px 0;white-space:nowrap}
.meta td{text-align:right;font-weight:500;padding:1.5px 0;white-space:nowrap}
.parties{display:flex;gap:24px;margin-top:34px}
.carte{flex:1;border:1px solid #e6e7ee;border-radius:6px;padding:12px 14px}
.carte .label,.notes .label,.encadre .label{font-size:9.5px;text-transform:uppercase;letter-spacing:.07em;color:#7a7b8c;margin-bottom:4px}
.carte .nom{font-weight:600;font-size:12px;margin-bottom:2px}
.carte .l{color:#55566a}
.encadres{display:flex;gap:24px;margin-top:14px}
.encadre{flex:1;background:#f6f6f9;border-radius:6px;padding:10px 14px}
.encadre .v{font-weight:500}
table.lignes{width:100%;border-collapse:collapse;margin-top:28px}
table.lignes th{font-size:9.5px;text-transform:uppercase;letter-spacing:.06em;color:#55566a;font-weight:500;padding:0 8px 8px;border-bottom:1.5px solid #17171f}
table.lignes td{padding:11px 8px;border-bottom:1px solid #e6e7ee;vertical-align:top;white-space:nowrap}
table.lignes td.d{white-space:normal}
table.lignes th:first-child,table.lignes td:first-child{padding-left:0}
table.lignes th:last-child,table.lignes td:last-child{padding-right:0}
.d .t{font-weight:500}
.d .x{color:#6b6c80;font-size:10px;margin-top:2px}
.bas{display:flex;justify-content:space-between;align-items:flex-start;gap:28px;margin-top:18px}
.mention{font-weight:500;padding:8px 12px;border-left:3px solid ${ACCENT};background:#f6f6f9;border-radius:0 4px 4px 0;align-self:flex-start;margin-top:4px}
.totaux{border-collapse:collapse;margin-left:auto;min-width:290px}
.totaux td{padding:5px 0}
.totaux td:last-child{text-align:right;padding-left:24px;white-space:nowrap}
.totaux td:first-child{color:#55566a}
.totaux tr.fort td{font-weight:600;font-size:13px;color:#17171f;border-top:1.5px solid #17171f;padding-top:9px;padding-bottom:9px}
.totaux tr.fort td:last-child{color:${ACCENT}}
.notes{margin-top:30px;display:flex;flex-direction:column;gap:11px}
.notes .v{color:#33343f}
.sign{display:flex;gap:24px;margin-top:30px}
.sign .case{flex:1;border:1px dashed #c9cad6;border-radius:6px;padding:12px 14px;height:96px}
.sign .case .t{font-weight:600}
.sign .case .x{color:#7a7b8c;font-size:10px}
.espace{flex:1}
.pied{margin-top:28px;padding-top:12px;border-top:1px solid #e6e7ee;color:#8a8b99;font-size:9.5px;text-align:center}
`;

function rendreDocument(ex) {
  const cellule = (c, i) => {
    const [, align] = ex.colonnes[i];
    if (typeof c === "object") {
      return `<td class="d" style="text-align:${align}"><div class="t">${esc(c.texte)}</div>${c.detail ? `<div class="x">${esc(c.detail)}</div>` : ""}</td>`;
    }
    return `<td style="text-align:${align}">${esc(c)}</td>`;
  };
  const html = `
<div class="feuille doc">
  <div class="entete">
    <div class="emetteur"><div class="nom">${esc(ex.emetteur.nom)}</div>${ex.emetteur.lignes.map((l) => `<div class="l">${esc(l)}</div>`).join("")}</div>
    <div class="titre"><h1>${esc(ex.titre)}</h1>${ex.sousTitre ? `<div class="sous">${esc(ex.sousTitre)}</div>` : ""}<div class="filet"></div>
      <table class="meta">${ex.meta.map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join("")}</table>
    </div>
  </div>
  <div class="parties">
    <div class="carte"><div class="label">${esc(ex.client.label)}</div><div class="nom">${esc(ex.client.nom)}</div>${ex.client.lignes.map((l) => `<div class="l">${esc(l)}</div>`).join("")}</div>
  </div>
  ${ex.encadres ? `<div class="encadres">${ex.encadres.map(([k, v]) => `<div class="encadre"><div class="label">${esc(k)}</div><div class="v">${esc(v)}</div></div>`).join("")}</div>` : ""}
  <table class="lignes">
    <colgroup>${ex.colonnes.map(([, , w]) => `<col style="width:${w}">`).join("")}</colgroup>
    <thead><tr>${ex.colonnes.map(([t, a]) => `<th style="text-align:${a}">${esc(t)}</th>`).join("")}</tr></thead>
    <tbody>${ex.lignes.map((l) => `<tr>${l.map(cellule).join("")}</tr>`).join("")}</tbody>
  </table>
  <div class="bas">
    ${ex.mention ? `<div class="mention">${esc(ex.mention)}</div>` : "<div></div>"}
    <table class="totaux">${ex.totaux.map(([k, v, fort]) => `<tr class="${fort ? "fort" : ""}"><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join("")}</table>
  </div>
  <div class="notes">${ex.notes.map(([k, v]) => `<div><div class="label">${esc(k)}</div><div class="v">${esc(v)}</div></div>`).join("")}</div>
  ${ex.signature ? `<div class="sign">
      <div class="case"><div class="t">${esc(ex.signature.gauche[0])}</div><div class="x">${esc(ex.signature.gauche[1])}</div></div>
      <div class="case"><div class="t">${esc(ex.signature.droite[0])}</div><div class="x">${esc(ex.signature.droite[1])}</div></div>
    </div>` : ""}
  <div class="espace"></div>
  <div class="pied">${esc(ex.pied)}</div>
</div>`;
  const fictif = ex.langue === "en" ? "Fictitious example" : "Exemple fictif";
  return { largeur: 800, html: pageHtml(800, CSS_DOCUMENT, html, { fictif }) };
}

// ---------------------------------------------------------------------------
// Gabarit : reçu de paiement (demi-page)
// ---------------------------------------------------------------------------

const CSS_RECU = `
.recu{width:720px;padding:44px 54px 40px;font-size:11.5px;line-height:1.5}
.recu .haut{display:flex;justify-content:space-between;align-items:flex-start}
.recu .em .nom{font-size:15px;font-weight:600;margin-bottom:4px}
.recu .em .l{color:#55566a}
.recu h1{font-size:26px;font-weight:600;text-align:right;line-height:1.1}
.recu .filet{width:36px;height:3px;background:${ACCENT};margin:10px 0 0 auto;border-radius:2px}
.recu .grille{display:flex;gap:24px;margin-top:30px}
.recu .bloc{flex:1;border:1px solid #e6e7ee;border-radius:6px;padding:12px 14px}
.recu .label{font-size:9.5px;text-transform:uppercase;letter-spacing:.07em;color:#7a7b8c;margin-bottom:4px}
.recu .montant{font-size:24px;font-weight:600;color:${ACCENT};line-height:1.2}
.recu .lettres{color:#55566a}
.recu table{width:100%;border-collapse:collapse;margin-top:22px}
.recu td{padding:8px 0;border-bottom:1px solid #e6e7ee}
.recu td:first-child{color:#55566a;width:180px}
.recu td:last-child{font-weight:500}
.recu .texte{margin-top:22px;color:#2a2b36}
.recu .fin{display:flex;justify-content:space-between;align-items:flex-end;margin-top:26px}
.recu .sig{text-align:center;min-width:220px}
.recu .sig .trait{font-family:"Snell Roundhand","Brush Script MT",cursive;font-size:30px;color:#2c2d6b;line-height:1;margin-bottom:6px}
.recu .sig .x{border-top:1px solid #c9cad6;padding-top:5px;color:#7a7b8c;font-size:10px}
`;

function rendreRecu(ex) {
  const html = `
<div class="feuille recu">
  <div class="haut">
    <div class="em"><div class="nom">${esc(ex.emetteur.nom)}</div>${ex.emetteur.lignes.map((l) => `<div class="l">${esc(l)}</div>`).join("")}</div>
    <div><h1>Reçu de paiement</h1><div class="filet"></div></div>
  </div>
  <div class="grille">
    <div class="bloc"><div class="label">Reçu de</div><div style="font-weight:600">${esc(ex.payeur.nom)}</div>${ex.payeur.lignes.map((l) => `<div class="lettres">${esc(l)}</div>`).join("")}</div>
    <div class="bloc"><div class="label">Montant reçu</div><div class="montant">${esc(ex.montant)}</div><div class="lettres">${esc(ex.montantLettres)}</div></div>
  </div>
  <table>${ex.details.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join("")}</table>
  <p class="texte">${esc(ex.texte)}</p>
  <div class="fin">
    <div>${esc(ex.faitA)}</div>
    <div class="sig"><div class="trait">${esc(ex.signataire)}</div><div class="x">Signature de l'émetteur</div></div>
  </div>
</div>`;
  return { largeur: 800, html: pageHtml(800, CSS_RECU, html) };
}

// ---------------------------------------------------------------------------
// Gabarit : contrat
// ---------------------------------------------------------------------------

const CSS_CONTRAT = `
.contrat{width:720px;min-height:1018px;padding:52px 60px 40px;font-size:10.8px;line-height:1.55;color:#22232d}
.contrat h1{font-size:20px;font-weight:600;text-align:center;color:#17171f}
.contrat .filet{width:36px;height:3px;background:${ACCENT};margin:10px auto 22px;border-radius:2px}
.contrat .entre{font-weight:600;margin-bottom:6px}
.contrat .partie{margin-bottom:8px}
.contrat .partie b{font-weight:600}
.contrat .et{margin:2px 0 8px;font-weight:600}
.contrat .conv{margin:12px 0 4px;font-style:italic;color:#55566a}
.contrat h2{font-size:11.5px;font-weight:600;color:#17171f;margin:16px 0 4px}
.contrat p+p{margin-top:5px}
.contrat .fait{margin-top:20px}
.contrat .sign{display:flex;gap:24px;margin-top:12px}
.contrat .case{flex:1;border:1px dashed #c9cad6;border-radius:6px;padding:10px 14px;height:86px}
.contrat .case .t{font-weight:600}
.contrat .case .x{color:#7a7b8c;font-size:10px}
`;

function rendreContrat(ex) {
  const [prest, client] = ex.parties;
  const html = `
<div class="feuille contrat">
  <h1>${esc(ex.titre)}</h1><div class="filet"></div>
  <div class="entre">Entre les soussignés :</div>
  <p class="partie"><b>${esc(prest[0])}</b> : ${esc(prest[1])}</p>
  <div class="et">Et</div>
  <p class="partie"><b>${esc(client[0])}</b> : ${esc(client[1])}</p>
  <p class="conv">Il a été convenu ce qui suit.</p>
  ${ex.articles.map(([t, ps]) => `<h2>${esc(t)}</h2>${ps.map((p) => `<p>${esc(p)}</p>`).join("")}`).join("")}
  <p class="fait">${esc(ex.faitA)}</p>
  <div class="sign">${ex.signatures.map(([t, n]) => `<div class="case"><div class="t">${esc(t)}</div><div class="x">${esc(n)}</div><div class="x">« Lu et approuvé », signature</div></div>`).join("")}</div>
</div>`;
  return { largeur: 800, html: pageHtml(800, CSS_CONTRAT, html) };
}

// ---------------------------------------------------------------------------
// Gabarit : lettre (mise en demeure)
// ---------------------------------------------------------------------------

const CSS_LETTRE = `
.lettre{width:720px;min-height:1018px;padding:54px 64px 44px;font-size:11.3px;line-height:1.6;color:#22232d}
.lettre .exp div:first-child,.lettre .dest div:first-child{font-weight:600;color:#17171f}
.lettre .exp div{color:#55566a}
.lettre .dest{margin:26px 0 0 360px}
.lettre .lieu{margin:26px 0 0 360px}
.lettre .objet{margin-top:30px;font-weight:600;color:#17171f}
.lettre .envoi{font-weight:600;color:${ACCENT};font-size:10.5px;margin-top:2px}
.lettre .corps{margin-top:22px}
.lettre .corps p{margin-bottom:10px}
.lettre ul{margin:0 0 10px 18px}
.lettre li{margin-bottom:4px}
.lettre .signature{margin:22px 0 0 360px}
.lettre .signature .trait{font-family:"Snell Roundhand","Brush Script MT",cursive;font-size:28px;color:#2c2d6b;line-height:1;margin-bottom:6px}
.lettre .signature div:nth-child(2){font-weight:600}
.lettre .signature div:nth-child(3){color:#55566a}
`;

function rendreLettre(ex) {
  const corps = ex.corps
    .map((b) => (typeof b === "string" ? `<p>${insecables(b)}</p>` : `<ul>${b.liste.map((li) => `<li>${insecables(li)}</li>`).join("")}</ul>`))
    .join("");
  const html = `
<div class="feuille lettre">
  <div class="exp">${ex.expediteur.map((l) => `<div>${esc(l)}</div>`).join("")}</div>
  <div class="dest">${ex.destinataire.map((l) => `<div>${esc(l)}</div>`).join("")}</div>
  <div class="lieu">${esc(ex.lieuDate)}</div>
  <div class="objet">${esc(ex.objet)}</div>
  <div class="envoi">${esc(ex.envoi)}</div>
  <div class="corps">${corps}</div>
  <div class="signature"><div class="trait">${esc(ex.signature[0])}</div>${ex.signature.map((l) => `<div>${esc(l)}</div>`).join("")}</div>
</div>`;
  return { largeur: 800, html: pageHtml(800, CSS_LETTRE, html) };
}

// ---------------------------------------------------------------------------
// Gabarit : e-mail
// ---------------------------------------------------------------------------

const CSS_MAIL = `
.mail{width:720px;overflow:hidden;font-size:12.5px;line-height:1.55;border-radius:10px}
.mail .barre{height:34px;background:#f3f3f6;border-bottom:1px solid #e3e4ea;display:flex;align-items:center;padding:0 14px;gap:7px}
.mail .pt{width:11px;height:11px;border-radius:50%;background:#d6d7df}
.mail .barre .t{flex:1;text-align:center;color:#6b6c80;font-size:11.5px;margin-right:40px}
.mail .outils{display:flex;align-items:center;justify-content:space-between;padding:10px 22px;border-bottom:1px solid #eeeff3}
.mail .envoyer{background:${ACCENT};color:#fff;font-weight:600;font-size:11.5px;padding:6px 16px;border-radius:6px}
.mail .outils .x{color:#8a8b99;font-size:11px}
.mail .champ{display:flex;padding:8px 22px;border-bottom:1px solid #eeeff3}
.mail .champ .k{width:58px;color:#8a8b99}
.mail .champ .v{color:#22232d}
.mail .champ.obj .v{font-weight:600;color:#17171f}
.mail .corps{padding:20px 22px 8px}
.mail .corps p{margin-bottom:11px;color:#22232d}
.mail .sig{color:#55566a;margin-bottom:16px}
.mail .sig div:first-child{color:#22232d;font-weight:600}
.mail .pj{display:inline-flex;align-items:center;gap:10px;border:1px solid #e3e4ea;border-radius:8px;padding:8px 14px 8px 10px;margin:0 22px 22px}
.mail .pj .ic{width:28px;height:34px;border-radius:4px;background:#f1f0ff;color:${ACCENT};font-size:8.5px;font-weight:700;display:flex;align-items:flex-end;justify-content:center;padding-bottom:5px}
.mail .pj .n{font-weight:600;font-size:11.5px}
.mail .pj .s{color:#8a8b99;font-size:10.5px}
`;

function rendreMail(ex) {
  const html = `
<div class="feuille mail">
  <div class="barre"><span class="pt"></span><span class="pt"></span><span class="pt"></span><span class="t">Nouveau message</span></div>
  <div class="outils"><span class="envoyer">Envoyer</span><span class="x">${esc(ex.date)}</span></div>
  <div class="champ"><span class="k">De</span><span class="v">${esc(ex.de)}</span></div>
  <div class="champ"><span class="k">À</span><span class="v">${esc(ex.a)}</span></div>
  <div class="champ obj"><span class="k">Objet</span><span class="v">${esc(ex.objet)}</span></div>
  <div class="corps">${ex.corps.map((p) => `<p>${esc(p)}</p>`).join("")}
    <div class="sig">${ex.signature.map((l) => `<div>${esc(l)}</div>`).join("")}</div>
  </div>
  <div class="pj"><div class="ic">PDF</div><div><div class="n">${esc(ex.pieceJointe[0])}</div><div class="s">${esc(ex.pieceJointe[1])}</div></div></div>
</div>`;
  return { largeur: 800, html: pageHtml(800, CSS_MAIL, html) };
}

// ---------------------------------------------------------------------------
// Gabarit : tableur (note de frais, plan de trésorerie, suivi des factures)
// ---------------------------------------------------------------------------

const CSS_TABLEUR = `
.xl{overflow:hidden;font-size:11px;border-radius:8px}
.xl .barre{height:30px;background:#f3f3f6;border-bottom:1px solid #e3e4ea;display:flex;align-items:center;padding:0 12px;gap:6px}
.xl .pt{width:10px;height:10px;border-radius:50%;background:#d6d7df}
.xl .barre .t{flex:1;text-align:center;color:#55566a;font-size:11px;margin-right:36px}
.xl .fx{display:flex;align-items:center;border-bottom:1px solid #e3e4ea;height:28px;font-size:11px}
.xl .fx .ref{width:64px;text-align:center;border-right:1px solid #e3e4ea;height:100%;display:flex;align-items:center;justify-content:center;color:#33343f}
.xl .fx .f{padding:0 10px;color:#8a8b99;font-style:italic;border-right:1px solid #e3e4ea;height:100%;display:flex;align-items:center}
.xl .fx .v{padding:0 10px;color:#22232d;font-family:"SF Mono",Menlo,monospace;font-size:10.5px}
.xl table{border-collapse:collapse;table-layout:fixed;width:100%}
.xl th,.xl td{border-right:1px solid #e8e9ee;border-bottom:1px solid #e8e9ee;height:22px;padding:0 6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.xl thead th{background:#f6f6f9;color:#7a7b8c;font-weight:500;font-size:10px;text-align:center;height:20px}
.xl td.n{background:#f6f6f9;color:#7a7b8c;font-size:10px;text-align:center;padding:0}
.xl .r{text-align:right}
.xl .c{text-align:center}
.xl .b{font-weight:600}
.xl .h{background:#f1f2f6;font-weight:600;color:#33343f}
.xl .titre{font-weight:600;font-size:12.5px;color:#17171f}
.xl .gris{color:#7a7b8c}
.xl .tot{background:#f6f6f9;font-weight:600;border-top:1.5px solid #9a9bab}
.xl .fort{background:#efeeff;font-weight:700;color:#17171f;border-top:1.5px solid ${ACCENT}}
.xl .sel{outline:2px solid ${ACCENT};outline-offset:-2px}
.xl .acc{background:rgba(90,80,255,.06)}
.xl .formule{color:#8a8b99;font-weight:400;font-family:"SF Mono",Menlo,monospace;font-size:10px}
.xl .rouge{color:#c62828;font-weight:600}
.xl .orange{color:#b26a00;font-weight:600}
.xl .pill{display:inline-block;padding:1px 7px;border-radius:9px;font-size:10px;font-weight:600}
.xl .p-ok{background:#e7f5ec;color:#1f7a3d}
.xl .p-att{background:#eeeff3;color:#55566a}
.xl .p-ret{background:#fdeaea;color:#c62828}
.xl .p-part{background:#fff3df;color:#9a5b00}
.xl .onglets{display:flex;gap:2px;padding:0 10px;background:#f6f6f9;border-top:1px solid #e3e4ea;height:28px;align-items:stretch}
.xl .onglet{padding:0 14px;display:flex;align-items:center;color:#7a7b8c;font-size:10.5px}
.xl .onglet.on{background:#fff;color:${ACCENT};font-weight:600;border-bottom:2px solid ${ACCENT}}
`;

const LETTRES = "ABCDEFGHIJKLMNOP";

/**
 * Grille de tableur. `colonnes` : largeurs en px (après la colonne des
 * numéros de ligne). `lignes` : tableaux de cellules, chaque cellule étant
 * une chaîne ou { v, cls, html, span }.
 */
function grille({ fichier, ref, formule, colonnes, lignes, onglets, ongletActif }) {
  const tete = `<tr><th style="width:30px"></th>${colonnes.map((w, i) => `<th style="width:${w}px">${LETTRES[i]}</th>`).join("")}</tr>`;
  const corps = lignes
    .map((cells, i) => {
      let html = `<td class="n">${i + 1}</td>`;
      for (const c of cells) {
        const o = typeof c === "object" && c !== null ? c : { v: c ?? "" };
        const contenu = o.html ?? esc(o.v ?? "");
        html += `<td class="${o.cls ?? ""}"${o.span ? ` colspan="${o.span}"` : ""}>${contenu}</td>`;
      }
      return `<tr>${html}</tr>`;
    })
    .join("");
  return `
<div class="feuille xl">
  <div class="barre"><span class="pt"></span><span class="pt"></span><span class="pt"></span><span class="t">${esc(fichier)}</span></div>
  <div class="fx"><span class="ref">${esc(ref)}</span><span class="f">fx</span><span class="v">${esc(formule)}</span></div>
  <table><thead>${tete}</thead><tbody>${corps}</tbody></table>
  <div class="onglets">${onglets.map((o) => `<span class="onglet${o === ongletActif ? " on" : ""}">${esc(o)}</span>`).join("")}</div>
</div>`;
}

const vide = (n) => Array(n).fill("");
const formule = (f) => `<span class="formule">${esc(f)}</span>`;

function rendreNoteDeFrais() {
  const kmTotal = verifie("Note de frais, km", nfTrajetKm * 2, 720);
  const kmMontant = (km) => arrondi(km * BAREME_6CV);
  const kmTotalMontant = verifie("Note de frais, frais kilométriques", kmMontant(nfTrajetKm) * 2, 478.8);
  const hebHt = verifie("Note de frais, hébergement HT", nfNuits.reduce((s, n) => s + n[2], 0), 190);
  const hebTva = verifie("Note de frais, TVA hébergement", arrondi(hebHt * 0.1), 19);
  const repasHt = verifie("Note de frais, repas HT", nfRepas.reduce((s, r) => s + r[3], 0), 140);
  const repasTva = verifie("Note de frais, TVA repas", arrondi(repasHt * 0.1), 14);
  const totalTtc = verifie("Note de frais, total", kmTotalMontant + hebHt + hebTva + repasHt + repasTva, 841.8);
  const totalTva = verifie("Note de frais, TVA totale", hebTva + repasTva, 33);
  const totalHt = arrondi(kmTotalMontant + hebHt + repasHt);

  const depenses = [
    ["2026-10-06", "Déplacement", "Domicile ↔ site client (2 × 180 km)", nfTrajetKm, kmMontant(nfTrajetKm), null],
    ...nfRepas.slice(0, 2).map(([d, t, f, ht]) => [d, "Repas", `${t}, ${f}`, null, ht, 0.1]),
    [nfNuits[0][0], "Hébergement", nfNuits[0][1], null, nfNuits[0][2], 0.1],
    [nfRepas[2][0], "Repas", `${nfRepas[2][1]}, ${nfRepas[2][2]}`, null, nfRepas[2][3], 0.1],
    ["2026-10-20", "Déplacement", "Domicile ↔ site client (2 × 180 km)", nfTrajetKm, kmMontant(nfTrajetKm), null],
    ...nfRepas.slice(3).map(([d, t, f, ht]) => [d, "Repas", `${t}, ${f}`, null, ht, 0.1]),
    [nfNuits[1][0], "Hébergement", nfNuits[1][1], null, nfNuits[1][2], 0.1],
  ];
  const ligneDepense = ([d, nature, detail, km, ht, taux], i) => {
    const tva = taux ? arrondi(ht * taux) : 0;
    return [
      { v: jjmmaaaa(d), cls: "c" },
      nature,
      detail,
      { v: km ? entier(km) : "", cls: "r" },
      { v: nombre(ht), cls: `r${i === 0 ? " sel" : ""}` },
      { v: taux ? `${taux * 100} %` : "–", cls: "r gris" },
      { v: taux ? nombre(tva) : "–", cls: "r" },
      { v: nombre(ht + tva), cls: "r" },
      { v: km ? "Relevé km" : "Oui", cls: "c gris" },
    ];
  };
  const nb = 9;
  const lignes = [
    [{ v: "Note de frais, octobre 2026", cls: "titre", span: 4 }, ...vide(5)],
    [{ v: "Julien Faure, consultant indépendant", span: 4 }, ...vide(5)],
    [{ v: "Véhicule personnel : 6 CV · barème kilométrique 2026, jusqu'à 5 000 km : d × 0,665 €", cls: "gris", span: 9 }],
    ["Date", "Nature", "Détail", "Km", "Montant HT", "Taux TVA", "TVA", "Montant TTC", "Justificatif"].map((t, i) => ({ v: t, cls: `h${i >= 3 && i <= 7 ? " r" : i === 8 || i === 0 ? " c" : ""}` })),
    ...depenses.map(ligneDepense),
    vide(nb),
    [{ v: "Récapitulatif par catégorie", cls: "b", span: 3 }, ...vide(1), { v: "Total HT", cls: "h r" }, { v: "", cls: "h" }, { v: "TVA", cls: "h r" }, { v: "Total TTC", cls: "h r" }, { v: "", cls: "h" }],
    [{ v: "Frais kilométriques (barème)", span: 3 }, { v: entier(kmTotal), cls: "r" }, { v: nombre(kmTotalMontant), cls: "r" }, "", { v: "–", cls: "r" }, { v: nombre(kmTotalMontant), cls: "r" }, ""],
    [{ v: "Hébergement", span: 3 }, "", { v: nombre(hebHt), cls: "r" }, "", { v: nombre(hebTva), cls: "r" }, { v: nombre(hebHt + hebTva), cls: "r" }, ""],
    [{ v: "Repas", span: 3 }, "", { v: nombre(repasHt), cls: "r" }, "", { v: nombre(repasTva), cls: "r" }, { v: nombre(repasHt + repasTva), cls: "r" }, ""],
    [
      { v: "Total à rembourser", cls: "fort", span: 3 },
      { v: entier(kmTotal), cls: "fort r" },
      { v: nombre(totalHt), cls: "fort r" },
      { v: "", cls: "fort" },
      { v: nombre(totalTva), cls: "fort r" },
      { v: eur(totalTtc), cls: "fort r" },
      { v: "", cls: "fort" },
    ],
  ];
  const html = grille({
    fichier: "note-de-frais-octobre-2026.xlsx",
    ref: "E5",
    formule: "=D5*0,665",
    colonnes: [74, 86, 258, 50, 84, 66, 60, 92, 80],
    lignes,
    onglets: ["Octobre 2026", "Barème kilométrique", "Synthèse annuelle"],
    ongletActif: "Octobre 2026",
  });
  return { largeur: 1000, html: pageHtml(1000, CSS_TABLEUR, html) };
}

function rendrePlanTresorerie() {
  // Chaînage : le solde final d'un mois devient le solde initial du suivant.
  const initial = [];
  const final = [];
  const totalDec = MOIS.map((_, m) => ptDecaissements.reduce((s, [, v]) => s + v[m], 0));
  let solde = ptSoldeJanvier;
  for (let m = 0; m < 12; m++) {
    initial.push(solde);
    solde = solde + ptEncaissements[m] - totalDec[m];
    final.push(solde);
  }
  // Mars = exemple de l'article.
  verifie("Plan, solde initial de mars", initial[2], 4200);
  verifie("Plan, encaissements de mars", ptEncaissements[2], 3600);
  verifie("Plan, décaissements de mars", totalDec[2], 800 + 450 + 600 + 300);
  verifie("Plan, solde final de mars", final[2], 5650);

  const cel = (v, m, cls = "") => ({ v: v === 0 ? "–" : entier(v), cls: `r ${cls}${m === 2 ? " acc" : ""}${v === 0 ? " gris" : ""}` });
  const enTete = [{ v: "En euros", cls: "h gris" }, ...MOIS.map((mo, m) => ({ v: mo, cls: `h r${m === 2 ? " acc" : ""}`, html: m === 2 ? `<span style="color:${ACCENT}">${mo}</span>` : undefined }))];
  const rangee = (label, valeurs, cls = "", celCls = "") => [{ v: label, cls }, ...valeurs.map((v, m) => cel(v, m, celCls))];
  const lignes = [
    [{ v: "Plan de trésorerie 2026, graphiste freelance (scénario réaliste)", cls: "titre", span: 13 }],
    enTete,
    rangee("Solde de trésorerie initial", initial, "b", "b"),
    [{ v: "Encaissements", cls: "b gris" }, ...vide(12).map((_, m) => ({ v: "", cls: m === 2 ? "acc" : "" }))],
    rangee("Règlements clients (TTC)", ptEncaissements),
    rangee("Total encaissements", ptEncaissements, "tot", "tot"),
    [{ v: "Décaissements", cls: "b gris" }, ...vide(12).map((_, m) => ({ v: "", cls: m === 2 ? "acc" : "" }))],
    ...ptDecaissements.map(([label, v]) => rangee(label, v)),
    rangee("Total décaissements", totalDec, "tot", "tot"),
    [{ v: "Solde de trésorerie final", cls: "fort" }, ...final.map((v, m) => ({ v: entier(v), cls: `fort r${m === 2 ? " sel" : ""}` }))],
  ];
  const ligneSolde = lignes.length; // numéro de ligne Excel du solde final
  const ligneInit = 3;
  const ligneEnc = 6;
  const ligneDec = ligneSolde - 1;
  const html = grille({
    fichier: "plan-de-tresorerie-2026.xlsx",
    ref: `D${ligneSolde}`,
    formule: `=D${ligneInit}+D${ligneEnc}-D${ligneDec}`,
    colonnes: [208, ...Array(12).fill(56)],
    lignes,
    onglets: ["Réaliste", "Optimiste", "Pessimiste"],
    ongletActif: "Réaliste",
  });
  return { largeur: 1000, html: pageHtml(1000, CSS_TABLEUR, html) };
}

function rendreSuiviFactures() {
  let totalTtc = 0;
  let enAttente = 0;
  let enRetard = 0;
  const lignesFactures = suiviFactures.map(([num, client, emission, ht, statut, paiement, mode, relance], i) => {
    const ttc = arrondi(ht * 1.2);
    const echeance = plusJours(emission, 30);
    const impaye = statut !== "Payée";
    const retard = impaye ? Math.max(0, ecartJours(SUIVI_AU, echeance)) : 0;
    totalTtc += ttc;
    if (statut === "En attente") enAttente += ttc;
    if (statut === "En retard") enRetard += ttc;
    const pill = { Payée: "p-ok", "En attente": "p-att", "En retard": "p-ret", "Payée partiellement": "p-part" }[statut];
    return [
      num,
      client,
      { v: jjmmaaaa(emission), cls: "c" },
      { v: jjmmaaaa(echeance), cls: "c" },
      { v: nombre(ht), cls: "r" },
      { v: nombre(ttc), cls: "r" },
      { html: `<span class="pill ${pill}">${esc(statut)}</span>` },
      { v: paiement ? jjmmaaaa(paiement) : "", cls: "c" },
      { v: String(retard), cls: `r${retard > 15 ? " rouge" : retard > 0 ? " orange" : " gris"}${i === 3 ? " sel" : ""}` },
      mode,
      { v: relance ? jjmmaaaa(relance) : "", cls: "c" },
    ];
  });
  const totalHt = suiviFactures.reduce((s, f) => s + f[3], 0);
  const titres = ["N° facture", "Client", "Émission", "Échéance", "Montant HT", "Montant TTC", "Statut", "Paiement", "Retard (j)", "Mode", "Relance"];
  const n = lignesFactures.length;
  const lignes = [
    titres.map((t, i) => ({ v: t, cls: `h${[4, 5, 8].includes(i) ? " r" : [2, 3, 7, 10].includes(i) ? " c" : ""}` })),
    ...lignesFactures,
    [{ v: "Total facturé", cls: "tot", span: 4 }, { v: nombre(totalHt), cls: "tot r" }, { v: nombre(totalTtc), cls: "tot r" }, { v: "", cls: "tot", span: 5 }],
    [{ v: "Total en attente (non échu)", span: 5 }, { v: nombre(enAttente), cls: "r b" }, { html: formule('=SOMME.SI(G2:G13;"En attente";F2:F13)'), span: 5 }],
    [{ v: "Total en retard", cls: "fort", span: 5 }, { v: eur(enRetard), cls: "fort r" }, { html: formule('=SOMME.SI(G2:G13;"En retard";F2:F13)'), cls: "fort", span: 5 }],
  ];
  if (n !== 12) throw new Error("Le pied du tableau suppose 12 factures (lignes 2 à 13).");
  const html = grille({
    fichier: "suivi-factures-2026.xlsx",
    ref: "I5",
    formule: "=SI(D5<AUJOURDHUI();AUJOURDHUI()-D5;0)",
    colonnes: [84, 170, 82, 82, 88, 92, 136, 82, 68, 70, 82],
    lignes,
    onglets: ["Factures 2026", "Tableau de bord"],
    ongletActif: "Factures 2026",
  });
  return { largeur: 1160, html: pageHtml(1160, CSS_TABLEUR, html, { fictif: "Exemple fictif · situation au 09/11/2026" }) };
}

const GABARITS = {
  document: rendreDocument,
  recu: rendreRecu,
  contrat: rendreContrat,
  lettre: rendreLettre,
  mail: rendreMail,
  noteDeFrais: rendreNoteDeFrais,
  planTresorerie: rendrePlanTresorerie,
  suiviFactures: rendreSuiviFactures,
};

// ---------------------------------------------------------------------------
// Rendu
// ---------------------------------------------------------------------------

function trouverChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const base = path.join(os.homedir(), ".cache", "puppeteer");
  for (const produit of ["chrome-headless-shell", "chrome"]) {
    const dossier = path.join(base, produit);
    if (!fs.existsSync(dossier)) continue;
    for (const version of fs.readdirSync(dossier).sort().reverse()) {
      const candidats = [
        path.join(dossier, version, "chrome-headless-shell-mac-arm64", "chrome-headless-shell"),
        path.join(dossier, version, "chrome-headless-shell-mac-x64", "chrome-headless-shell"),
        path.join(dossier, version, "chrome-headless-shell-linux64", "chrome-headless-shell"),
        path.join(dossier, version, "chrome-mac-arm64", "Google Chrome for Testing.app", "Contents", "MacOS", "Google Chrome for Testing"),
        path.join(dossier, version, "chrome-mac-x64", "Google Chrome for Testing.app", "Contents", "MacOS", "Google Chrome for Testing"),
        path.join(dossier, version, "chrome-linux64", "chrome"),
      ];
      const trouve = candidats.find((c) => fs.existsSync(c));
      if (trouve) return trouve;
    }
  }
  throw new Error("Chrome introuvable dans ~/.cache/puppeteer : précisez CHROME_PATH.");
}

async function main() {
  const demandes = process.argv.slice(2);
  const slugs = demandes.length ? demandes : Object.keys(EXEMPLES);
  for (const s of slugs) if (!EXEMPLES[s]) throw new Error(`Slug inconnu : ${s}`);

  const navigateur = await puppeteer.launch({ executablePath: trouverChrome(), headless: true });
  try {
    const page = await navigateur.newPage();
    for (const slug of slugs) {
      const ex = EXEMPLES[slug];
      const { largeur, html } = GABARITS[ex.gabarit](ex);
      // Hauteur minimale : la capture pleine page prend la hauteur du contenu.
      await page.setViewport({ width: largeur, height: 100, deviceScaleFactor: LARGEUR_SORTIE / largeur });
      await page.setContent(html, { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);
      const png = await page.screenshot({ type: "png", fullPage: true });

      const dossier = path.join(ROOT, "public", "blog", slug);
      fs.mkdirSync(dossier, { recursive: true });
      const sortie = path.join(dossier, "exemple.webp");
      const info = await sharp(png).webp({ quality: QUALITE_WEBP }).toFile(sortie);
      console.log(`${slug} : ${info.width}×${info.height}, ${Math.round(info.size / 1024)} Ko`);
    }
  } finally {
    await navigateur.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
