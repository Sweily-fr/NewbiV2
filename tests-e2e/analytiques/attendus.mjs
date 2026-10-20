/**
 * Indicateurs des pages Analytiques et Vue d'ensemble, recalculés depuis la
 * base pour une période [début, fin] (dates « AAAA-MM-JJ », fin incluse) avec
 * les règles annoncées à l'écran :
 *   - CA HT net : factures payées sur la période (date de paiement, à défaut
 *     d'émission) et factures importées encaissées, moins les avoirs des
 *     factures payées (« après déduction des avoirs ») ;
 *   - Dépenses HT : factures d'achat payées (HT) et sorties bancaires payées
 *     non rapprochées d'une facture d'achat ;
 *   - Factures émises : hors brouillons, par date d'émission, importées comprises ;
 *   - Créances / Factures en retard (TTC) : situation à ce jour.
 */
import { base } from "../base.mjs";

export const arrondi = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const somme = (docs, f) => arrondi(docs.reduce((t, d) => t + (f(d) || 0), 0));
const estDate = (d) => d instanceof Date && !Number.isNaN(d.getTime());

const ESPACES_SPECIAUX = new RegExp(`[${String.fromCharCode(0x202f, 0xa0)}]`, "g");
export const texteSimple = (t) => String(t ?? "").replace(ESPACES_SPECIAUX, " ").replace(/\s+/g, " ").trim();

/** Montant comme les indicateurs l'écrivent (« 6 869 », sans décimales, € à part). */
const SANS_DECIMALES = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
export const entier = (n) => texteSimple(SANS_DECIMALES.format(n || 0));
/** Montant avec centimes (« 12 550,00 € »), comme la Vue d'ensemble. */
const EUROS = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
export const euros = (n) => texteSimple(EUROS.format(arrondi(n || 0)));

/** Date du jour à Paris (« AAAA-MM-JJ ») et ses composantes. */
export function aujourdhui() {
  const jour = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date());
  const [a, m, j] = jour.split("-").map(Number);
  return { jour, a, m, j };
}

const aaaammjj = (a, m, j) => {
  const d = new Date(Date.UTC(a, m - 1, j));
  return d.toISOString().slice(0, 10);
};
const dernierJour = (a, m) => new Date(Date.UTC(a, m, 0)).getUTCDate();

/** Bornes d'une période prédéfinie du filtre (mêmes définitions que le filtre de la page). */
export function bornes(periode) {
  const { a, m } = aujourdhui();
  switch (periode) {
    case "Mois en cours":
      return { debut: aaaammjj(a, m, 1), fin: aaaammjj(a, m, dernierJour(a, m)) };
    case "3 derniers mois": {
      const debut = new Date(Date.UTC(a, m - 3, 1));
      return { debut: debut.toISOString().slice(0, 10), fin: aaaammjj(a, m, dernierJour(a, m)) };
    }
    case "Année en cours":
      return { debut: aaaammjj(a, 1, 1), fin: aaaammjj(a, 12, 31) };
    case "Année précédente":
      return { debut: aaaammjj(a - 1, 1, 1), fin: aaaammjj(a - 1, 12, 31) };
    case "Trimestre en cours": {
      const q = Math.floor((m - 1) / 3) * 3 + 1;
      return { debut: aaaammjj(a, q, 1), fin: aaaammjj(a, q + 2, dernierJour(a, q + 2)) };
    }
    default:
      throw new Error(`Période inconnue : ${periode}`);
  }
}

/** Indicateurs attendus pour la période [debut, fin] (fin incluse, journée entière). */
export async function indicateurs(workspaceId, { debut, fin }) {
  const db = await base();
  const d0 = new Date(`${debut}T00:00:00.000Z`);
  const d1 = new Date(`${fin}T23:59:59.999Z`);
  const dans = (d) => estDate(d) && d >= d0 && d <= d1;

  const factures = await db.collection("invoices").find({ workspaceId }).toArray();
  const importees = await db.collection("imported_invoices").find({ workspaceId, status: { $in: ["VALIDATED", "COMPLETED"] } }).toArray();
  const avoirs = await db.collection("creditnotes").find({ workspaceId }).toArray();
  const achats = await db.collection("purchaseinvoices").find({ workspaceId }).toArray();
  const transactions = await db.collection("transactions").find({ workspaceId: workspaceId.toHexString(), deletedAt: null }).toArray();
  const payees = new Set(factures.filter((f) => f.status === "COMPLETED").map((f) => String(f._id)));
  const rapprochees = new Set(achats.flatMap((a) => (a.linkedTransactionIds || []).map(String)));

  const caPaye = somme(factures.filter((f) => f.status === "COMPLETED" && dans(f.paymentDate ?? f.issueDate)), (f) => f.finalTotalHT);
  const caImporte = somme(importees.filter((i) => dans(i.paymentDate ?? i.invoiceDate)), (i) => (i.totalHT > 0 ? i.totalHT : i.totalTTC));
  const avoirsEncaisses = somme(avoirs.filter((a) => dans(a.issueDate) && payees.has(String(a.originalInvoice))), (a) => a.finalTotalHT);
  const caNet = arrondi(caPaye + caImporte + avoirsEncaisses);

  const sorties = somme(transactions.filter((t) => t.amount < 0 && t.status === "completed" && dans(t.date) && !rapprochees.has(String(t._id))), (t) => Math.abs(t.amount));
  const achatsPayes = somme(achats.filter((a) => a.status === "PAID" && dans(a.paymentDate ?? a.issueDate)), (a) => a.amountTTC - a.amountTVA);
  const depenses = arrondi(sorties + achatsPayes);

  const emises = factures.filter((f) => f.status !== "DRAFT" && dans(f.issueDate)).length + importees.filter((i) => dans(i.invoiceDate ?? i.createdAt)).length;

  const maintenant = new Date();
  const nonReglees = factures.filter((f) => ["PENDING", "OVERDUE"].includes(f.status));
  return {
    caNet,
    depenses,
    marge: arrondi(caNet - depenses),
    emises,
    creances: somme(nonReglees, (f) => f.finalTotalTTC),
    enRetard: somme(nonReglees.filter((f) => estDate(f.dueDate) && f.dueDate < maintenant), (f) => f.finalTotalTTC),
  };
}

/** Encours clients attendu (TTC) : factures émises non réglées, brouillons exclus. */
export async function encoursClients(workspaceId) {
  const factures = await (await base()).collection("invoices").find({ workspaceId, status: { $in: ["PENDING", "OVERDUE"] } }).toArray();
  return somme(factures, (f) => f.finalTotalTTC);
}

/** « À payer » de la Vue d'ensemble (TTC) : factures d'achat non payées (à traiter, à payer, en attente, en retard). */
export async function achatsAPayer(workspaceId) {
  const achats = await (await base()).collection("purchaseinvoices").find({ workspaceId, status: { $in: ["TO_PROCESS", "TO_PAY", "PENDING", "OVERDUE"] } }).toArray();
  return somme(achats, (a) => a.amountTTC);
}
