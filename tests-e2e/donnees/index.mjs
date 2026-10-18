/**
 * Écrit toutes les données de test dans la base en mémoire (site et API
 * partagent la même base, comme en prod).
 */
import { socle } from "./base.mjs";
import { FACTURES_LISTE } from "./factures-liste.mjs";

export async function semer(db) {
  const collections = { ...socle(), invoices: Object.values(FACTURES_LISTE) };
  for (const [nom, docs] of Object.entries(collections)) {
    if (docs.length) await db.collection(nom).insertMany(docs);
  }
  return Object.entries(collections)
    .map(([nom, docs]) => `${docs.length} ${nom}`)
    .join(", ");
}
