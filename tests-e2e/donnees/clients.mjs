/**
 * Contacts de l'organisation « Clients » (compte « clients ») : un contact par
 * situation (complet, particulier, à l'étranger, bloqué…) et un par action
 * des tests (à bloquer, à supprimer, à modifier…), pour que chaque test ait
 * le sien. Plus des contacts de remplissage pour la pagination, des listes,
 * des segments et des champs personnalisés. Mêmes formes qu'en prod (modèles
 * Client, ClientList, ClientSegment, ClientCustomField de newbi-api).
 */
import { COMPTES, DANS, MAINTENANT, oid } from "./base.mjs";
import { facture } from "./factures-liste.mjs";
import { ligne } from "./documents.mjs";

const compte = COMPTES.clients;
const proprietaire = compte.utilisateur;

/** Un contact « tel qu'enregistré » dans une organisation (par défaut « Clients »). */
function contact(n, { address = {}, organisation = "clients", ...champs }) {
  const { utilisateur, organisation: org } = COMPTES[organisation];
  return {
    _id: oid("client", n),
    type: "COMPANY",
    isInternational: false,
    isBlocked: false,
    hasDifferentShippingAddress: false,
    contacts: [],
    notes: [],
    customFields: [],
    activityLog: [],
    assignedMembers: [],
    ...champs,
    address: { fullName: champs.name, street: "1 rue du Test", city: "Paris", postalCode: "75001", country: "France", ...address },
    createdBy: utilisateur._id,
    workspaceId: org._id,
    // Ordre de création stable : les plus récents en premier dans la liste.
    createdAt: DANS(-(200 - n)),
    updatedAt: MAINTENANT,
  };
}

export const CHAMPS_CLIENTS = {
  secteur: {
    _id: oid("champClient", 1),
    name: "Secteur d'activité",
    fieldType: "SELECT",
    description: "Secteur principal du client",
    options: [
      { label: "Industrie", value: "industrie", color: "#5b50FF" },
      { label: "Commerce", value: "commerce", color: "#10b981" },
      { label: "Services", value: "services", color: "#f59e0b" },
    ],
    placeholder: "",
    isRequired: false,
    order: 0,
    showOnDocuments: false,
    isActive: true,
  },
  premierContact: {
    _id: oid("champClient", 2),
    name: "Date de premier contact",
    fieldType: "DATE",
    description: "",
    options: [],
    placeholder: "",
    isRequired: false,
    order: 1,
    showOnDocuments: false,
    isActive: true,
  },
  aSupprimer: {
    _id: oid("champClient", 3),
    name: "Champ à supprimer",
    fieldType: "TEXT",
    description: "",
    options: [],
    placeholder: "",
    isRequired: false,
    order: 2,
    showOnDocuments: false,
    isActive: true,
  },
};

export const CONTACTS = {
  complet: contact(100, {
    name: "Atelier Lumière SARL",
    email: "contact@atelier-lumiere.test",
    phone: "+33145678901",
    siret: "41234567800017",
    vatNumber: "FR41412345678",
    firstName: "Claire",
    lastName: "Fontaine",
    contactFunction: "Gérante",
    contactDepartment: "Direction",
    address: { street: "18 rue des Lilas", city: "Lyon", postalCode: "69003" },
    contacts: [
      {
        id: oid("client", 9100).toHexString(),
        firstName: "Marc",
        lastName: "Petit",
        email: "marc.petit@atelier-lumiere.test",
        phone: "+33612345601",
        position: "Comptable",
        department: "Finances",
      },
    ],
    customFields: [{ fieldId: CHAMPS_CLIENTS.secteur._id, value: "industrie" }],
    notes: [
      {
        id: oid("client", 9200).toHexString(),
        content: "Client fidèle depuis 2020, paie toujours à 30 jours.",
        userId: proprietaire._id,
        userName: proprietaire.name,
        createdAt: DANS(-10),
        updatedAt: DANS(-10),
      },
    ],
    assignedMembers: [proprietaire._id.toHexString()],
  }),
  particulier: contact(101, {
    type: "INDIVIDUAL",
    name: "Sophie Martin",
    firstName: "Sophie",
    lastName: "Martin",
    email: "sophie.martin@e2e.test",
    phone: "+33698765432",
    address: { street: "7 impasse des Roses", city: "Nantes", postalCode: "44000" },
  }),
  international: contact(102, {
    name: "Global Imports Ltd",
    email: "orders@global-imports.test",
    phone: "+44 20 7946 0958",
    isInternational: true,
    vatNumber: "GB123456789",
    address: { street: "221B Baker Street", city: "London", postalCode: "NW1 6XE", country: "Royaume-Uni" },
  }),
  bloque: contact(103, {
    name: "Client Bloqué SAS",
    email: "compta@client-bloque.test",
    isBlocked: true,
    blockedAt: DANS(-3),
    blockedReason: "Impayés répétés",
  }),
  aBloquer: contact(104, { name: "Client à bloquer SARL", email: "a-bloquer@e2e.test" }),
  aSupprimer: contact(105, { name: "Client à supprimer SARL", email: "a-supprimer@e2e.test" }),
  aModifier: contact(106, { name: "Client à modifier SARL", email: "a-modifier@e2e.test", siret: "52345678900012" }),
  aAssigner: contact(107, { name: "Client à assigner SARL", email: "a-assigner@e2e.test" }),
  aDebloquer: contact(108, {
    name: "Client à débloquer SAS",
    email: "a-debloquer@e2e.test",
    isBlocked: true,
    blockedAt: DANS(-1),
    blockedReason: "Litige en cours",
  }),
  avecFactures: contact(109, { name: "Client avec factures SAS", email: "factures@client-factures.test", siret: "62345678900015" }),
  aNoter: contact(110, { name: "Client à annoter SARL", email: "a-annoter@e2e.test" }),
  intrus: contact(150, { name: "Client de l'intrus SAS", email: "secret@intrus.test", organisation: "intrus" }),
};

/** Contacts de remplissage : assez pour plusieurs pages de liste. */
export const REMPLISSAGE = Array.from({ length: 25 }, (_, i) =>
  contact(120 + i, { name: `Contact de remplissage ${String(i + 1).padStart(2, "0")}`, email: `remplissage${i + 1}@e2e.test` }),
);

const pourDocument = (c) => ({
  _id: c._id,
  name: c.name,
  email: c.email,
  type: c.type,
  siret: c.siret,
  vatNumber: c.vatNumber,
  firstName: c.firstName,
  lastName: c.lastName,
  isInternational: c.isInternational,
  isBlocked: false,
  address: c.address,
});

/** Factures du contact « avec factures » (onglet Factures de la fiche, suppression d'un contact facturé). */
export const FACTURES_CONTACTS = {
  payee: facture({ n: 301, numero: "0001", statut: "COMPLETED", emiseIlYa: 40, echeanceDans: -10, client: pourDocument(CONTACTS.avecFactures), articles: [ligne("Audit annuel", 1, 1500)], payeeLe: DANS(-12), compte: "clients" }),
  aEncaisser: facture({ n: 302, numero: "0002", statut: "PENDING", emiseIlYa: 5, echeanceDans: 25, client: pourDocument(CONTACTS.avecFactures), articles: [ligne("Accompagnement mensuel", 1, 800)], compte: "clients" }),
};

const enOrganisation = (organisation = "clients") => ({
  workspaceId: COMPTES[organisation].organisation._id,
  createdBy: COMPTES[organisation].utilisateur._id,
  createdAt: DANS(-20),
  updatedAt: MAINTENANT,
});

export const LISTES_CLIENTS = {
  prospects: {
    _id: oid("listeClients", 1),
    name: "Prospects 2026",
    description: "Entreprises à relancer au premier trimestre",
    clients: [CONTACTS.complet._id, CONTACTS.aModifier._id],
    color: "#5b50FF",
    isDefault: false,
    ...enOrganisation(),
  },
  aModifier: {
    _id: oid("listeClients", 2),
    name: "Liste à modifier",
    description: "",
    clients: [],
    color: "#10b981",
    isDefault: false,
    ...enOrganisation(),
  },
  aSupprimer: {
    _id: oid("listeClients", 3),
    name: "Liste à supprimer",
    description: "",
    clients: [CONTACTS.particulier._id],
    color: "#f59e0b",
    isDefault: false,
    ...enOrganisation(),
  },
};

export const SEGMENTS = {
  lyonnais: {
    _id: oid("segment", 1),
    name: "Clients lyonnais",
    description: "Contacts dont la ville est Lyon",
    matchType: "all",
    rules: [{ field: "address.city", operator: "equals", value: "Lyon" }],
    color: "#5b50FF",
    ...enOrganisation(),
  },
  aSupprimer: {
    _id: oid("segment", 2),
    name: "Segment à supprimer",
    description: "",
    matchType: "all",
    rules: [{ field: "isBlocked", operator: "is_true", value: null }],
    color: "#ef4444",
    ...enOrganisation(),
  },
};

export function donneesClients() {
  return {
    clients: [...Object.values(CONTACTS), ...REMPLISSAGE],
    invoices: Object.values(FACTURES_CONTACTS),
    clientlists: Object.values(LISTES_CLIENTS),
    clientsegments: Object.values(SEGMENTS),
    clientcustomfields: Object.values(CHAMPS_CLIENTS).map((c) => ({ ...c, ...enOrganisation() })),
  };
}
