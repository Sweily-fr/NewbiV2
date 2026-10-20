/**
 * Ce que l'accueil doit afficher, calculé depuis la base des tests (et non
 * relu depuis l'API) : règles écrites à partir de ce que dit l'écran
 * (« Ventes (TTC) » du mois, « En retard »…) et de la documentation du
 * cadre « Facturation » (mois calendaire, heure de Paris).
 */
import { base } from "../base.mjs";

const ESPACES_SPECIAUX = new RegExp(`[${String.fromCharCode(0x202f, 0xa0)}]`, "g");

/** Texte lu à l'écran, espaces insécables et fines remplacées par des espaces simples. */
export const texteSimple = (t) => String(t ?? "").replace(ESPACES_SPECIAUX, " ").replace(/\s+/g, " ").trim();

const FORMAT_EUROS = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
/** Montant tel que le site l'écrit (« 1 440,00 € »), en espaces simples. */
export const euros = (n) => texteSimple(FORMAT_EUROS.format(Math.round((n + Number.EPSILON) * 100) / 100));

export const arrondi = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const somme = (docs, f) => arrondi(docs.reduce((t, d) => t + (f(d) || 0), 0));

/** Minuit à Paris d'un jour donné, en instant UTC (même définition que le cadre « Facturation »). */
export function minuitParis(annee, moisIndex, jour = 1) {
  const utc = new Date(Date.UTC(annee, moisIndex, jour));
  const paris = new Date(utc.toLocaleString("en-US", { timeZone: "Europe/Paris" }));
  const commeUtc = new Date(utc.toLocaleString("en-US", { timeZone: "UTC" }));
  return new Date(utc.getTime() - (paris - commeUtc));
}

/** Mois en cours, heure de Paris : bornes [debut, fin[, minuit du jour, libellé « Octobre 2026 ». */
export function moisParis(maintenant = new Date()) {
  const [a, m, j] = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(maintenant).split("-").map(Number);
  const libelle = new Date(Date.UTC(a, m - 1, 15)).toLocaleDateString("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" });
  return {
    debut: minuitParis(a, m - 1, 1),
    fin: minuitParis(a, m, 1),
    aujourdhui: minuitParis(a, m - 1, j),
    libelle: libelle.charAt(0).toUpperCase() + libelle.slice(1),
  };
}

const ttc = (f) => f.finalTotalTTC ?? f.totalTTC ?? 0;
const ht = (f) => f.finalTotalHT ?? f.totalHT ?? 0;
const estDate = (d) => d instanceof Date && !Number.isNaN(d.getTime());

/** Cadre « Facturation » du mois : ventes et achats TTC, en cours (à payer) et en retard. */
export async function facturationDuMois(workspaceId) {
  const db = await base();
  const { debut, fin, aujourdhui } = moisParis();
  const dansLeMois = (d) => estDate(d) && d >= debut && d < fin;

  const factures = (await db.collection("invoices").find({ workspaceId }).toArray()).filter(
    (f) => ["PENDING", "OVERDUE", "COMPLETED"].includes(f.status) && dansLeMois(f.issueDate),
  );
  const importees = (await db.collection("imported_invoices").find({ workspaceId, status: { $in: ["VALIDATED", "COMPLETED"] } }).toArray()).filter((i) =>
    dansLeMois(i.invoiceDate),
  );
  const nonReglee = (f) => ["PENDING", "OVERDUE"].includes(f.status);
  const venteEnRetard = (f) => f.status === "OVERDUE" || (f.status === "PENDING" && estDate(f.dueDate) && f.dueDate < aujourdhui);

  const achats = (await db.collection("purchaseinvoices").find({ workspaceId }).toArray()).filter((a) => dansLeMois(a.issueDate));
  const aPayer = (a) => ["TO_PAY", "OVERDUE"].includes(a.status);
  const achatEnRetard = (a) => a.status === "OVERDUE" || (a.status === "TO_PAY" && estDate(a.dueDate) && a.dueDate < aujourdhui);

  return {
    ventes: {
      total: arrondi(somme(factures, ttc) + somme(importees, (i) => i.totalTTC)),
      enCours: somme(factures.filter(nonReglee), ttc),
      enRetard: somme(factures.filter(venteEnRetard), ttc),
      factures,
    },
    achats: {
      total: somme(achats, (a) => a.amountTTC),
      aPayer: somme(achats.filter(aPayer), (a) => a.amountTTC),
      enRetard: somme(achats.filter(achatEnRetard), (a) => a.amountTTC),
    },
  };
}

/** Minuit (heure de Paris) du jour : « en retard » = échéance avant aujourd'hui. */
export const aujourdhuiParis = () => moisParis().aujourdhui;

/** Compteurs du cadre « À traiter » attendus. */
export async function aTraiter({ workspaceId, utilisateurId }) {
  const db = await base();
  const aujourdhui = aujourdhuiParis();
  const factures = await db.collection("invoices").find({ workspaceId }).toArray();
  const devis = await db.collection("quotes").find({ workspaceId }).toArray();
  const achats = await db.collection("purchaseinvoices").find({ workspaceId }).toArray();
  const notifications = await db.collection("notifications").find({ workspaceId, userId: utilisateurId, read: false }).toArray();
  const transactions = await db.collection("transactions").find({ workspaceId: workspaceId.toHexString(), deletedAt: null }).toArray();
  const sansLien = (t) => ["linkedInvoiceIds", "linkedPurchaseInvoiceIds", "linkedImportedInvoiceIds"].every((c) => !(t[c] || []).length);
  return {
    rapprochements: transactions.filter((t) => t.amount > 0 && !["matched", "ignored"].includes(t.reconciliationStatus) && sansLien(t) && !(t.receiptFiles || []).length).length,
    facturesEnRetard: factures.filter((f) => f.status === "PENDING" && estDate(f.dueDate) && f.dueDate < aujourdhui).length,
    facturesAEnvoyer: factures.filter((f) => f.status === "PENDING" && !f.emailTracking?.emailSentAt).length,
    // Un devis dont la validité est passée est « Expiré » dans la liste des devis, plus en attente
    devisEnAttente: devis.filter((d) => ["PENDING", "IMPORTED"].includes(d.status) && !(estDate(d.validUntil) && d.validUntil < aujourdhui)).length,
    devisEnAttenteYComprisExpires: devis.filter((d) => ["PENDING", "IMPORTED"].includes(d.status)).length,
    notificationsNonLues: notifications.length,
    achatsAPayer: achats.filter((a) => ["TO_PAY", "OVERDUE"].includes(a.status)).length,
    transactionsSansCategorie: transactions.filter((t) => !t.category && !t.expenseCategory && t.provider !== "manual").length,
  };
}

/** Solde (comptes + espèces) et flux de l'année civile, comme le cadre « Solde du compte ». */
export async function soldeEtFlux(workspaceId) {
  const db = await base();
  const wid = workspaceId.toHexString();
  const comptes = await db.collection("accounts_bankings").find({ workspaceId: wid, status: { $in: ["active", "ACTIVE"] } }).toArray();
  const transactions = await db.collection("transactions").find({ workspaceId: wid, deletedAt: null }).toArray();
  const especes = somme(transactions.filter((t) => t.provider === "manual"), (t) => t.amount);
  const maintenant = new Date();
  const annee = maintenant.getUTCFullYear();
  const debut = new Date(Date.UTC(annee, 0, 1));
  const jour = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(maintenant);
  const fin = new Date(`${jour}T23:59:59.999Z`);
  const dansLAnnee = transactions.filter((t) => t.date >= debut && t.date <= fin);
  return {
    solde: arrondi(somme(comptes, (c) => (typeof c.balance === "number" ? c.balance : c.balance?.current)) + especes),
    encaissement: somme(dansLAnnee.filter((t) => t.amount > 0), (t) => t.amount),
    decaissement: somme(dansLAnnee.filter((t) => t.amount < 0), (t) => Math.abs(t.amount)),
  };
}

/** Les 5 dernières factures de vente (hors brouillons), des plus récentes aux plus anciennes. */
export async function dernieresFactures(workspaceId) {
  const db = await base();
  const factures = await db.collection("invoices").find({ workspaceId, status: { $ne: "DRAFT" } }).sort({ createdAt: -1 }).limit(5).toArray();
  return factures.map((f) => ({ client: f.client?.name || "Client", reference: `${f.prefix}-${f.number}`, ht: ht(f), payee: f.status === "COMPLETED" }));
}
