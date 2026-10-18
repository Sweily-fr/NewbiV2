/**
 * Écrit toutes les données de test dans la base en mémoire (site et API
 * partagent la même base, comme en prod).
 */
import { socle } from "./base.mjs";
import { FACTURES_LISTE } from "./factures-liste.mjs";
import { DEVIS_LISTE } from "./devis-liste.mjs";
import { BONS_COMMANDE_LISTE } from "./bons-commande-liste.mjs";
import { BONS_LIVRAISON_LISTE } from "./bons-livraison-liste.mjs";
import { AVOIRS, FACTURES_AVOIRS } from "./avoirs.mjs";

export async function semer(db) {
  const collections = {
    ...socle(),
    invoices: [...Object.values(FACTURES_LISTE), ...Object.values(FACTURES_AVOIRS)],
    quotes: Object.values(DEVIS_LISTE),
    purchaseorders: Object.values(BONS_COMMANDE_LISTE),
    deliverynotes: Object.values(BONS_LIVRAISON_LISTE),
    creditnotes: Object.values(AVOIRS),
  };
  for (const [nom, docs] of Object.entries(collections)) {
    if (docs.length) await db.collection(nom).insertMany(docs);
  }
  return Object.entries(collections)
    .map(([nom, docs]) => `${docs.length} ${nom}`)
    .join(", ");
}
