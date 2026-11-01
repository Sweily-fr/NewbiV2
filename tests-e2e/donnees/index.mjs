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
import { donneesClients } from "./clients.mjs";
import { donneesFactures } from "./lot-factures.mjs";
import { donneesDevisBcBl } from "./lot-devis-bc-bl.mjs";
import { donneesAchatsBanque } from "./lot-achats-banque.mjs";
import { donneesParametresAuth } from "./lot-parametres-auth.mjs";
import { donneesCollaboration } from "./lot-collaboration.mjs";
import { donneesKanban } from "./lot-kanban.mjs";
import { donneesCalendrier } from "./lot-calendrier.mjs";
import { donneesRendezVous } from "./lot-rendez-vous.mjs";
import { donneesReseauxSociaux } from "./lot-reseaux-sociaux.mjs";
import { donneesEmailsEnvoyes } from "./lot-emails-envoyes.mjs";
import { donneesPilotage } from "./lot-pilotage.mjs";
import { donneesClientsCatalogue } from "./lot-clients-catalogue.mjs";
import { donneesCompteEspaces } from "./lot-compte-espaces.mjs";

/** Rassemble les données de plusieurs fonctionnalités, collection par collection. */
function fusionner(...sources) {
  const collections = {};
  for (const source of sources) {
    for (const [nom, docs] of Object.entries(source)) collections[nom] = [...(collections[nom] || []), ...docs];
  }
  return collections;
}

export async function semer(db) {
  const collections = fusionner(
    socle(),
    {
      invoices: [...Object.values(FACTURES_LISTE), ...Object.values(FACTURES_AVOIRS)],
      quotes: Object.values(DEVIS_LISTE),
      purchaseorders: Object.values(BONS_COMMANDE_LISTE),
      deliverynotes: Object.values(BONS_LIVRAISON_LISTE),
      creditnotes: Object.values(AVOIRS),
    },
    donneesClients(),
    donneesFactures(),
    donneesDevisBcBl(),
    donneesAchatsBanque(),
    donneesParametresAuth(),
    donneesCollaboration(),
    donneesKanban(),
    donneesCalendrier(),
    donneesRendezVous(),
    donneesReseauxSociaux(),
    donneesEmailsEnvoyes(),
    donneesPilotage(),
    donneesClientsCatalogue(),
    donneesCompteEspaces(),
  );
  for (const [nom, docs] of Object.entries(collections)) {
    if (docs.length) await db.collection(nom).insertMany(docs);
  }
  return Object.entries(collections)
    .map(([nom, docs]) => `${docs.length} ${nom}`)
    .join(", ");
}
