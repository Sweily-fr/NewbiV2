/**
 * Contacts : droits vérifiés à l'API, pas seulement à l'écran. Chaque
 * opération (contacts, notes, listes, segments, champs personnalisés,
 * automatisations) est appelée directement, avec la session du navigateur,
 * comme le ferait quelqu'un qui contourne l'interface :
 *   - « Membre » (lecture seule) : tout refus, rien ne change en base ;
 *   - « Éditeur » : ce que son rôle permet passe, la suppression et les
 *     champs personnalisés sont refusés ;
 *   - intrus (autre entreprise) : refus sur l'organisation des autres, et
 *     « introuvable » en visant leurs données depuis la sienne ;
 *   - visiteur sans session : refus.
 * Un refus doit être explicite (erreur de droits ou « introuvable ») et la
 * base doit rester identique.
 */
import { test, expect, etape } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import {
  BASE_URL,
  connecte,
  SESSION_TOKEN_CLIENTS,
  SESSION_TOKEN_EDITEUR,
  SESSION_TOKEN_INTRUS,
  SESSION_TOKEN_LECTEUR,
} from "../config.mjs";
import { COMPTES, MEMBRES } from "../donnees/base.mjs";
import {
  AUTOMATISATIONS,
  CHAMPS_CLIENTS,
  CONTACTS,
  LISTES_CLIENTS,
  SEGMENTS,
} from "../donnees/clients.mjs";
import { appelApi, verifierRefus, id } from "../securite.mjs";
import { base } from "../base.mjs";

const ORG = id(COMPTES.clients.organisation);
const ORG_INTRUS = id(COMPTES.intrus.organisation);
const adresse = {
  street: "1 rue du Contrôle",
  city: "Paris",
  postalCode: "75001",
  country: "France",
};
const _id = (doc) => doc._id;

/** Document(s) tels qu'en base, sans la date de mise à jour : un refus ne doit rien changer. */
async function photo([collection, filtre]) {
  const docs = await (await base())
    .collection(collection)
    .find(filtre)
    .sort({ _id: 1 })
    .toArray();
  return JSON.stringify(docs.map(({ updatedAt, ...d }) => d));
}

/**
 * Opérations d'écriture. `droit` : action requise sur `module` ;
 * `temoin` : ce qui ne doit pas bouger quand l'opération est refusée ;
 * `cible` : l'opération vise une donnée précise (variante « depuis son
 * organisation » de l'intrus).
 */
const ECRITURES = [
  {
    nom: "Créer un contact",
    module: "clients",
    droit: "create",
    champ: "createClient",
    requete: `mutation($w: String, $input: ClientInput!) { createClient(workspaceId: $w, input: $input) { id } }`,
    variables: (w, qui) => ({
      w,
      input: {
        type: "COMPANY",
        name: `Créé par ${qui} SARL`,
        email: `cree-par-${qui}@e2e.test`,
        siret: "12345678900011",
        address: adresse,
      },
    }),
    temoin: (qui) => ["clients", { name: `Créé par ${qui} SARL` }],
  },
  {
    nom: "Modifier un contact",
    module: "clients",
    droit: "edit",
    champ: "updateClient",
    cible: true,
    requete: `mutation($w: String, $id: ID!, $input: ClientInput!) { updateClient(workspaceId: $w, id: $id, input: $input) { id } }`,
    variables: (w, qui) => ({
      w,
      id: id(CONTACTS.cibleModifier),
      input: {
        type: "COMPANY",
        name: CONTACTS.cibleModifier.name,
        email: CONTACTS.cibleModifier.email,
        siret: "12345678900011",
        address: adresse,
        contactFunction: `Modifié par ${qui}`,
      },
    }),
    temoin: () => ["clients", { _id: _id(CONTACTS.cibleModifier) }],
  },
  {
    nom: "Supprimer un contact",
    module: "clients",
    droit: "delete",
    champ: "deleteClient",
    cible: true,
    requete: `mutation($w: String, $id: ID!) { deleteClient(workspaceId: $w, id: $id) }`,
    variables: (w) => ({ w, id: id(CONTACTS.cibleModifier) }),
    temoin: () => ["clients", { _id: _id(CONTACTS.cibleModifier) }],
  },
  {
    nom: "Ajouter une note",
    module: "clients",
    droit: "notes",
    champ: "addClientNote",
    cible: true,
    requete: `mutation($w: String, $c: ID!, $input: ClientNoteInput!) { addClientNote(workspaceId: $w, clientId: $c, input: $input) { id } }`,
    variables: (w, qui) => ({
      w,
      c: id(CONTACTS.cibleNoter),
      input: { content: `Note de ${qui}` },
    }),
    temoin: () => ["clients", { _id: _id(CONTACTS.cibleNoter) }],
  },
  {
    nom: "Modifier la note d'un autre membre",
    module: "clients",
    droit: "notes",
    // Seul l'auteur d'une note peut la modifier ou la supprimer.
    auteurSeulement: true,
    champ: "updateClientNote",
    cible: true,
    requete: `mutation($w: String, $c: ID!, $n: ID!, $t: String!) { updateClientNote(workspaceId: $w, clientId: $c, noteId: $n, content: $t) { id } }`,
    variables: (w, qui) => ({
      w,
      c: id(CONTACTS.cibleNoter),
      n: CONTACTS.cibleNoter.notes[0].id,
      t: `Note modifiée par ${qui}`,
    }),
    temoin: () => ["clients", { _id: _id(CONTACTS.cibleNoter) }],
  },
  {
    nom: "Supprimer la note d'un autre membre",
    module: "clients",
    droit: "notes",
    auteurSeulement: true,
    champ: "deleteClientNote",
    cible: true,
    requete: `mutation($w: String, $c: ID!, $n: ID!) { deleteClientNote(workspaceId: $w, clientId: $c, noteId: $n) { id } }`,
    variables: (w) => ({
      w,
      c: id(CONTACTS.cibleNoter),
      n: CONTACTS.cibleNoter.notes[1].id,
    }),
    temoin: () => ["clients", { _id: _id(CONTACTS.cibleNoter) }],
  },
  {
    nom: "Ajouter une activité",
    module: "clients",
    droit: "notes",
    champ: "addClientActivity",
    cible: true,
    requete: `mutation($w: String, $c: ID!, $input: ClientActivityInput!) { addClientActivity(workspaceId: $w, clientId: $c, input: $input) { id } }`,
    variables: (w, qui) => ({
      w,
      c: id(CONTACTS.cibleNoter),
      input: { type: "note_added", description: `Activité de ${qui}` },
    }),
    temoin: () => ["clients", { _id: _id(CONTACTS.cibleNoter) }],
  },
  {
    nom: "Assigner des membres",
    module: "clients",
    droit: "assign",
    champ: "assignClientMembers",
    cible: true,
    requete: `mutation($w: String, $id: ID!, $m: [String!]!) { assignClientMembers(workspaceId: $w, id: $id, memberIds: $m) { id } }`,
    variables: (w) => ({
      w,
      id: id(CONTACTS.cibleAssigner),
      m: [id(MEMBRES.editeur.utilisateur)],
    }),
    temoin: () => ["clients", { _id: _id(CONTACTS.cibleAssigner) }],
  },
  {
    nom: "Bloquer un contact",
    module: "clients",
    droit: "block",
    champ: "blockClient",
    cible: true,
    requete: `mutation($w: String, $id: ID!, $r: String) { blockClient(workspaceId: $w, id: $id, reason: $r) { id } }`,
    variables: (w, qui) => ({
      w,
      id: id(CONTACTS.cibleBloquer),
      r: `Bloqué par ${qui}`,
    }),
    temoin: () => ["clients", { _id: _id(CONTACTS.cibleBloquer) }],
  },
  {
    nom: "Débloquer un contact",
    module: "clients",
    droit: "block",
    champ: "unblockClient",
    cible: true,
    requete: `mutation($w: String, $id: ID!) { unblockClient(workspaceId: $w, id: $id) { id } }`,
    variables: (w) => ({ w, id: id(CONTACTS.cibleDebloquer) }),
    temoin: () => ["clients", { _id: _id(CONTACTS.cibleDebloquer) }],
  },
  {
    nom: "Créer une liste",
    module: "clientLists",
    droit: "create",
    champ: "createClientList",
    requete: `mutation($w: String!, $input: CreateClientListInput!) { createClientList(workspaceId: $w, input: $input) { id } }`,
    variables: (w, qui) => ({ w, input: { name: `Liste de ${qui}` } }),
    temoin: (qui) => ["clientlists", { name: `Liste de ${qui}` }],
  },
  {
    nom: "Modifier une liste",
    module: "clientLists",
    droit: "edit",
    champ: "updateClientList",
    cible: true,
    requete: `mutation($w: String!, $id: ID!, $input: UpdateClientListInput!) { updateClientList(workspaceId: $w, id: $id, input: $input) { id } }`,
    variables: (w, qui) => ({
      w,
      id: id(LISTES_CLIENTS.droits),
      input: { description: `Modifiée par ${qui}` },
    }),
    temoin: () => ["clientlists", { _id: _id(LISTES_CLIENTS.droits) }],
  },
  {
    nom: "Supprimer une liste",
    module: "clientLists",
    droit: "delete",
    champ: "deleteClientList",
    cible: true,
    requete: `mutation($w: String!, $id: ID!) { deleteClientList(workspaceId: $w, id: $id) }`,
    variables: (w) => ({ w, id: id(LISTES_CLIENTS.droits) }),
    temoin: () => ["clientlists", { _id: _id(LISTES_CLIENTS.droits) }],
  },
  {
    nom: "Supprimer plusieurs listes",
    module: "clientLists",
    droit: "delete",
    champ: "deleteClientLists",
    cible: true,
    requete: `mutation($w: String!, $ids: [ID!]!) { deleteClientLists(workspaceId: $w, ids: $ids) }`,
    variables: (w) => ({ w, ids: [id(LISTES_CLIENTS.droits)] }),
    temoin: () => ["clientlists", { _id: _id(LISTES_CLIENTS.droits) }],
    // Renvoie un nombre : 0 suppression vaut refus.
    nombre: true,
  },
  {
    nom: "Ajouter un contact à une liste",
    module: "clientLists",
    droit: "edit",
    champ: "addClientToList",
    cible: true,
    requete: `mutation($w: String!, $l: ID!, $c: ID!) { addClientToList(workspaceId: $w, listId: $l, clientId: $c) { id } }`,
    variables: (w) => ({
      w,
      l: id(LISTES_CLIENTS.droits),
      c: id(CONTACTS.cibleListe1),
    }),
    temoin: () => ["clientlists", { _id: _id(LISTES_CLIENTS.droits) }],
  },
  {
    nom: "Retirer un contact d'une liste",
    module: "clientLists",
    droit: "edit",
    champ: "removeClientFromList",
    cible: true,
    requete: `mutation($w: String!, $l: ID!, $c: ID!) { removeClientFromList(workspaceId: $w, listId: $l, clientId: $c) { id } }`,
    variables: (w) => ({
      w,
      l: id(LISTES_CLIENTS.droits),
      c: id(CONTACTS.cibleModifier),
    }),
    temoin: () => ["clientlists", { _id: _id(LISTES_CLIENTS.droits) }],
  },
  {
    nom: "Ajouter des contacts à une liste",
    module: "clientLists",
    droit: "edit",
    champ: "addClientsToList",
    cible: true,
    requete: `mutation($w: String!, $l: ID!, $c: [ID!]!) { addClientsToList(workspaceId: $w, listId: $l, clientIds: $c) { id } }`,
    variables: (w) => ({
      w,
      l: id(LISTES_CLIENTS.droits),
      c: [id(CONTACTS.cibleListe2)],
    }),
    temoin: () => ["clientlists", { _id: _id(LISTES_CLIENTS.droits) }],
  },
  {
    nom: "Retirer des contacts d'une liste",
    module: "clientLists",
    droit: "edit",
    champ: "removeClientsFromList",
    cible: true,
    requete: `mutation($w: String!, $l: ID!, $c: [ID!]!) { removeClientsFromList(workspaceId: $w, listId: $l, clientIds: $c) { id } }`,
    variables: (w) => ({
      w,
      l: id(LISTES_CLIENTS.droits),
      c: [id(CONTACTS.cibleNoter)],
    }),
    temoin: () => ["clientlists", { _id: _id(LISTES_CLIENTS.droits) }],
  },
  {
    nom: "Ajouter un contact à des listes",
    module: "clientLists",
    droit: "edit",
    champ: "addClientToLists",
    cible: true,
    requete: `mutation($w: String!, $c: ID!, $l: [ID!]!) { addClientToLists(workspaceId: $w, clientId: $c, listIds: $l) { id } }`,
    variables: (w) => ({
      w,
      c: id(CONTACTS.cibleListe3),
      l: [id(LISTES_CLIENTS.droits)],
    }),
    temoin: () => ["clientlists", { _id: _id(LISTES_CLIENTS.droits) }],
  },
  {
    nom: "Retirer un contact de listes",
    module: "clientLists",
    droit: "edit",
    champ: "removeClientFromLists",
    cible: true,
    requete: `mutation($w: String!, $c: ID!, $l: [ID!]!) { removeClientFromLists(workspaceId: $w, clientId: $c, listIds: $l) { id } }`,
    variables: (w) => ({
      w,
      c: id(CONTACTS.cibleAssigner),
      l: [id(LISTES_CLIENTS.droits)],
    }),
    temoin: () => ["clientlists", { _id: _id(LISTES_CLIENTS.droits) }],
  },
  {
    nom: "Créer un segment",
    module: "clientSegments",
    droit: "create",
    champ: "createClientSegment",
    requete: `mutation($w: String!, $input: CreateClientSegmentInput!) { createClientSegment(workspaceId: $w, input: $input) { id } }`,
    variables: (w, qui) => ({
      w,
      input: {
        name: `Segment de ${qui}`,
        matchType: "all",
        rules: [{ field: "type", operator: "equals", value: "COMPANY" }],
      },
    }),
    temoin: (qui) => ["clientsegments", { name: `Segment de ${qui}` }],
  },
  {
    nom: "Modifier un segment",
    module: "clientSegments",
    droit: "edit",
    champ: "updateClientSegment",
    cible: true,
    requete: `mutation($w: String!, $id: ID!, $input: UpdateClientSegmentInput!) { updateClientSegment(workspaceId: $w, id: $id, input: $input) { id } }`,
    variables: (w, qui) => ({
      w,
      id: id(SEGMENTS.droits),
      input: { description: `Modifié par ${qui}` },
    }),
    temoin: () => ["clientsegments", { _id: _id(SEGMENTS.droits) }],
  },
  {
    nom: "Supprimer un segment",
    module: "clientSegments",
    droit: "delete",
    champ: "deleteClientSegment",
    cible: true,
    requete: `mutation($w: String!, $id: ID!) { deleteClientSegment(workspaceId: $w, id: $id) }`,
    variables: (w) => ({ w, id: id(SEGMENTS.droits) }),
    temoin: () => ["clientsegments", { _id: _id(SEGMENTS.droits) }],
  },
  {
    nom: "Créer un champ personnalisé",
    module: "clientCustomFields",
    droit: "create",
    champ: "createClientCustomField",
    requete: `mutation($w: ID!, $input: ClientCustomFieldInput!) { createClientCustomField(workspaceId: $w, input: $input) { id } }`,
    variables: (w, qui) => ({
      w,
      input: { name: `Champ de ${qui}`, fieldType: "TEXT" },
    }),
    temoin: (qui) => ["clientcustomfields", { name: `Champ de ${qui}` }],
  },
  {
    nom: "Modifier un champ personnalisé",
    module: "clientCustomFields",
    droit: "edit",
    champ: "updateClientCustomField",
    cible: true,
    requete: `mutation($w: ID!, $id: ID!, $input: ClientCustomFieldInput!) { updateClientCustomField(workspaceId: $w, id: $id, input: $input) { id } }`,
    variables: (w, qui) => ({
      w,
      id: id(CHAMPS_CLIENTS.aSupprimer),
      input: { name: `Renommé par ${qui}`, fieldType: "TEXT" },
    }),
    temoin: () => [
      "clientcustomfields",
      { _id: _id(CHAMPS_CLIENTS.aSupprimer) },
    ],
  },
  {
    nom: "Supprimer un champ personnalisé",
    module: "clientCustomFields",
    droit: "delete",
    champ: "deleteClientCustomField",
    cible: true,
    requete: `mutation($w: ID!, $id: ID!) { deleteClientCustomField(workspaceId: $w, id: $id) }`,
    variables: (w) => ({ w, id: id(CHAMPS_CLIENTS.aSupprimer) }),
    temoin: () => [
      "clientcustomfields",
      { _id: _id(CHAMPS_CLIENTS.aSupprimer) },
    ],
  },
  {
    nom: "Réordonner les champs personnalisés",
    module: "clientCustomFields",
    droit: "edit",
    champ: "reorderClientCustomFields",
    cible: true,
    requete: `mutation($w: ID!, $ids: [ID!]!) { reorderClientCustomFields(workspaceId: $w, fieldIds: $ids) { id } }`,
    variables: (w) => ({
      w,
      ids: Object.values(CHAMPS_CLIENTS).map(id).reverse(),
    }),
    temoin: () => [
      "clientcustomfields",
      { workspaceId: COMPTES.clients.organisation._id },
    ],
  },
  {
    nom: "Créer une automatisation",
    module: "automations",
    droit: "create",
    champ: "createClientAutomation",
    requete: `mutation($w: ID!, $input: CreateClientAutomationInput!) { createClientAutomation(workspaceId: $w, input: $input) { id } }`,
    variables: (w, qui) => ({
      w,
      input: {
        name: `Automatisation de ${qui}`,
        triggerType: "CLIENT_CREATED",
        actionType: "ADD_TO_LIST",
        targetListId: id(LISTES_CLIENTS.droits),
        isActive: false,
      },
    }),
    temoin: (qui) => [
      "clientautomations",
      { name: `Automatisation de ${qui}` },
    ],
  },
  {
    nom: "Modifier une automatisation",
    module: "automations",
    droit: "edit",
    champ: "updateClientAutomation",
    cible: true,
    requete: `mutation($w: ID!, $id: ID!, $input: UpdateClientAutomationInput!) { updateClientAutomation(workspaceId: $w, id: $id, input: $input) { id } }`,
    variables: (w, qui) => ({
      w,
      id: id(AUTOMATISATIONS.droits),
      input: { description: `Modifiée par ${qui}` },
    }),
    temoin: () => ["clientautomations", { _id: _id(AUTOMATISATIONS.droits) }],
  },
  {
    nom: "Activer ou couper une automatisation",
    module: "automations",
    droit: "edit",
    champ: "toggleClientAutomation",
    cible: true,
    requete: `mutation($w: ID!, $id: ID!) { toggleClientAutomation(workspaceId: $w, id: $id) { id } }`,
    variables: (w) => ({ w, id: id(AUTOMATISATIONS.droits) }),
    temoin: () => ["clientautomations", { _id: _id(AUTOMATISATIONS.droits) }],
  },
  {
    nom: "Appliquer une automatisation aux contacts existants",
    module: "automations",
    droit: "edit",
    champ: "applyClientAutomationToExisting",
    cible: true,
    requete: `mutation($w: ID!, $id: ID!) { applyClientAutomationToExisting(workspaceId: $w, id: $id) { __typename } }`,
    variables: (w) => ({ w, id: id(AUTOMATISATIONS.application) }),
    temoin: () => ["clientlists", { _id: _id(LISTES_CLIENTS.droits) }],
  },
  {
    nom: "Supprimer une automatisation",
    module: "automations",
    droit: "delete",
    champ: "deleteClientAutomation",
    cible: true,
    requete: `mutation($w: ID!, $id: ID!) { deleteClientAutomation(workspaceId: $w, id: $id) }`,
    variables: (w) => ({ w, id: id(AUTOMATISATIONS.droits) }),
    temoin: () => ["clientautomations", { _id: _id(AUTOMATISATIONS.droits) }],
  },
];

/**
 * Ce que l'« Éditeur » peut faire (rolePermissions.js de newbi-api) : ni
 * supprimer, ni gérer les champs personnalisés, ni toucher aux notes des autres.
 */
const editeurPeut = (op) =>
  op.droit !== "delete" &&
  op.module !== "clientCustomFields" &&
  !op.auteurSeulement;

/** Lectures : contacts et tout ce qui les entoure, pour l'intrus et le visiteur. */
const LECTURES = [
  [
    "Un contact",
    "client",
    `query($w: String, $id: ID!) { client(workspaceId: $w, id: $id) { id name email } }`,
    (w) => ({ w, id: id(CONTACTS.complet) }),
  ],
  [
    "La liste des contacts",
    "clients",
    `query($w: String) { clients(workspaceId: $w, page: 1, limit: 100) { items { id name } } }`,
    (w) => ({ w }),
  ],
  [
    "Les listes",
    "clientLists",
    `query($w: String!) { clientLists(workspaceId: $w) { id name } }`,
    (w) => ({ w }),
  ],
  [
    "Une liste",
    "clientList",
    `query($w: String!, $id: ID!) { clientList(workspaceId: $w, id: $id) { id name } }`,
    (w) => ({ w, id: id(LISTES_CLIENTS.prospects) }),
  ],
  [
    "Les contacts d'une liste",
    "clientsInList",
    `query($w: String!, $l: ID!) { clientsInList(workspaceId: $w, listId: $l) { items { id name } } }`,
    (w) => ({ w, l: id(LISTES_CLIENTS.prospects) }),
  ],
  [
    "Les listes d'un contact",
    "clientListsByClient",
    `query($w: String!, $c: ID!) { clientListsByClient(workspaceId: $w, clientId: $c) { id name } }`,
    (w) => ({ w, c: id(CONTACTS.complet) }),
  ],
  [
    "Les segments",
    "clientSegments",
    `query($w: String!) { clientSegments(workspaceId: $w) { id name } }`,
    (w) => ({ w }),
  ],
  [
    "Un segment",
    "clientSegment",
    `query($w: String!, $id: ID!) { clientSegment(workspaceId: $w, id: $id) { id name } }`,
    (w) => ({ w, id: id(SEGMENTS.lyonnais) }),
  ],
  [
    "Les contacts d'un segment",
    "clientsInSegment",
    `query($w: String!, $s: ID!) { clientsInSegment(workspaceId: $w, segmentId: $s) { items { id name } } }`,
    (w) => ({ w, s: id(SEGMENTS.lyonnais) }),
  ],
  [
    "Les champs personnalisés",
    "clientCustomFields",
    `query($w: ID!) { clientCustomFields(workspaceId: $w) { id name } }`,
    (w) => ({ w }),
  ],
  [
    "Un champ personnalisé",
    "clientCustomField",
    `query($w: ID!, $id: ID!) { clientCustomField(workspaceId: $w, id: $id) { id name } }`,
    (w) => ({ w, id: id(CHAMPS_CLIENTS.secteur) }),
  ],
  [
    "Les champs d'un contact pour les documents",
    "clientDocumentFields",
    `query($w: ID!, $c: ID!) { clientDocumentFields(workspaceId: $w, clientId: $c) { __typename } }`,
    (w) => ({ w, c: id(CONTACTS.complet) }),
  ],
  [
    "Les automatisations",
    "clientAutomations",
    `query($w: ID!) { clientAutomations(workspaceId: $w) { id name } }`,
    (w) => ({ w }),
  ],
  [
    "Une automatisation",
    "clientAutomation",
    `query($w: ID!, $id: ID!) { clientAutomation(workspaceId: $w, id: $id) { id name } }`,
    (w) => ({ w, id: id(AUTOMATISATIONS.droits) }),
  ],
];

/** Une réponse ne contient aucune donnée de l'organisation « Clients ». */
function sansFuite(reponse) {
  const texte = JSON.stringify(reponse.data ?? {});
  for (const c of [CONTACTS.complet, CONTACTS.particulier]) {
    expect(texte, `Fuite : « ${c.name} » renvoyé à l'intrus`).not.toContain(
      id(c),
    );
    expect(texte).not.toContain(c.name);
  }
  for (const l of [
    LISTES_CLIENTS.prospects,
    SEGMENTS.lyonnais,
    CHAMPS_CLIENTS.secteur,
    AUTOMATISATIONS.droits,
  ]) {
    expect(texte, `Fuite : « ${l.name} » renvoyé à l'intrus`).not.toContain(
      id(l),
    );
  }
}

async function refusSansEffet(page, op, qui, w) {
  const avant = await photo(op.temoin(qui));
  const reponse = await appelApi(page, op.requete, op.variables(w, qui), {
    organisation: w,
  });
  if (op.nombre && reponse.data?.[op.champ] === 0) {
    // « 0 liste supprimée » : refus silencieux mais sans effet, vérifié par le témoin.
  } else {
    verifierRefus(reponse, op.champ, `${op.nom} (${qui})`);
  }
  expect(
    await photo(op.temoin(qui)),
    `${op.nom} (${qui}) : la base a changé malgré le refus`,
  ).toBe(avant);
}

test.describe("Contacts : droits du rôle « Membre » (lecture seule)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_LECTEUR) });
  test.beforeEach(async ({ page }) => {
    await ouvrir(page, "/dashboard");
  });

  test("Peut lire les contacts, listes, segments et champs", async ({
    page,
  }) => {
    for (const [nom, champ, requete, variables] of LECTURES) {
      const reponse = await appelApi(page, requete, variables(ORG), {
        organisation: ORG,
      });
      expect
        .soft(reponse.errors, `${nom} : le Membre doit pouvoir lire`)
        .toEqual([]);
      expect
        .soft(
          reponse.data?.[champ],
          `${nom} : aucune donnée renvoyée au Membre`,
        )
        .toBeTruthy();
    }
  });

  for (const op of ECRITURES) {
    test(`${op.nom} : refusé`, async ({ page }) => {
      await refusSansEffet(page, op, "lecteur", ORG);
    });
  }
});

test.describe("Contacts : droits du rôle « Éditeur »", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_EDITEUR) });
  test.beforeEach(async ({ page }) => {
    await ouvrir(page, "/dashboard");
  });

  for (const op of ECRITURES) {
    if (editeurPeut(op)) {
      test(`${op.nom} : permis`, async ({ page }) => {
        const reponse = await appelApi(
          page,
          op.requete,
          op.variables(ORG, "editeur"),
          { organisation: ORG },
        );
        expect(
          reponse.errors,
          `${op.nom} : l'Éditeur doit pouvoir le faire`,
        ).toEqual([]);
        expect(
          reponse.data?.[op.champ],
          `${op.nom} : réponse vide`,
        ).toBeTruthy();
      });
    } else {
      test(`${op.nom} : refusé`, async ({ page }) => {
        await refusSansEffet(page, op, "editeur", ORG);
      });
    }
  }
});

test.describe("Contacts : une autre entreprise n'atteint rien", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_INTRUS) });
  test.beforeEach(async ({ page }) => {
    await ouvrir(page, "/dashboard");
  });

  for (const [nom, champ, requete, variables] of LECTURES) {
    test(`Lire « ${nom} » des autres : refusé`, async ({ page }) => {
      await etape(page, "En visant leur organisation", async () => {
        const reponse = await appelApi(page, requete, variables(ORG), {
          organisation: ORG,
        });
        sansFuite(reponse);
        verifierRefus(reponse, champ, `${nom} (organisation des autres)`);
      });
      await etape(
        page,
        "Depuis sa propre organisation, avec leurs identifiants",
        async () => {
          const reponse = await appelApi(page, requete, variables(ORG_INTRUS), {
            organisation: ORG_INTRUS,
          });
          sansFuite(reponse);
        },
      );
    });
  }

  for (const op of ECRITURES) {
    test(`${op.nom} chez les autres : refusé`, async ({ page }) => {
      await etape(page, "En visant leur organisation", () =>
        refusSansEffet(page, op, "intrus", ORG),
      );
      if (op.cible) {
        await etape(
          page,
          "Depuis sa propre organisation, avec leurs identifiants",
          () => refusSansEffet(page, op, "intrus", ORG_INTRUS),
        );
      }
    });
  }

  test.describe(() => {
    // Refus attendu de l'API (« Client non trouvé »), que le site écrit dans la console.
    test.use({ erreursConsoleAutorisees: /Client non trouvé|NOT_FOUND/ });
    test("La fiche d'un contact des autres ne s'affiche pas", async ({
      page,
    }) => {
      await page.goto(`/dashboard/clients/${id(CONTACTS.complet)}`);
      await page.waitForTimeout(3_000);
      const texte = await page.locator("body").innerText();
      expect(texte, "Le nom du contact des autres est affiché").not.toContain(
        CONTACTS.complet.name,
      );
      expect(texte, "L'e-mail du contact des autres est affiché").not.toContain(
        CONTACTS.complet.email,
      );
    });
  });
});

/**
 * Texte piégé (XSS stockée) : un membre qui a le droit d'écrire des notes
 * enregistre, par l'API, une note contenant du HTML qui exécute du code.
 * Quand le propriétaire ouvre la fiche (activité, par défaut) ou les notes,
 * rien ne doit s'exécuter : sinon ce code agit avec la session du
 * propriétaire (supprimer, changer les rôles…). La surveillance des tests
 * échoue sur toute boîte de dialogue, et la page ne doit pas porter la marque
 * posée par le code.
 */
test.describe("Contacts : un texte piégé ne s'exécute jamais", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_CLIENTS) });
  const PIEGE = `<img src="x-piege" onerror="window.__piege = 'execute'; alert('code exécuté depuis une note')">Rendez-vous confirmé`;

  test.beforeAll(async ({ browser }) => {
    const contexte = await browser.newContext({
      baseURL: BASE_URL,
      storageState: connecte(SESSION_TOKEN_EDITEUR),
    });
    const page = await contexte.newPage();
    await page.goto("/dashboard");
    const reponse = await appelApi(
      page,
      `mutation($w: String, $c: ID!, $input: ClientNoteInput!) { addClientNote(workspaceId: $w, clientId: $c, input: $input) { id } }`,
      { w: ORG, c: id(CONTACTS.cibleXss), input: { content: PIEGE } },
      { organisation: ORG },
    );
    await contexte.close();
    expect(reponse.errors, "L'Éditeur doit pouvoir écrire une note").toEqual(
      [],
    );
  });

  for (const [nom, suffixe] of [
    ["Fiche du contact (activité)", ""],
    ["Onglet Notes", "?tab=notes"],
  ]) {
    test(`${nom} : la note s'affiche comme du texte, rien ne s'exécute`, async ({
      page,
    }) => {
      await ouvrir(
        page,
        `/dashboard/clients/${id(CONTACTS.cibleXss)}${suffixe}`,
        { pret: page.getByText(CONTACTS.cibleXss.email).first() },
      );
      await page.waitForTimeout(1_500);
      expect(
        await page.evaluate(() => window.__piege ?? null),
        "Le code de la note s'est exécuté",
      ).toBeNull();
    });
  }
});

test.describe("Contacts : sans session, rien", () => {
  // Refus attendus : le jeton est refusé (401), l'API répond « non authentifié ».
  test.use({
    storageState: { cookies: [], origins: [] },
    erreursConsoleAutorisees: /401.*\/api\/auth\/token/,
  });

  test("Lectures et écritures refusées", async ({ page }) => {
    await ouvrir(page, "/auth/login");
    for (const [nom, champ, requete, variables] of LECTURES) {
      const reponse = await appelApi(page, requete, variables(ORG), {
        organisation: ORG,
      });
      expect
        .soft(reponse.data?.[champ] ?? null, `${nom} : renvoyé sans session`)
        .toBeNull();
    }
    for (const op of ECRITURES) {
      const avant = await photo(op.temoin("visiteur"));
      const reponse = await appelApi(
        page,
        op.requete,
        op.variables(ORG, "visiteur"),
        { organisation: ORG },
      );
      expect
        .soft(
          reponse.data?.[op.champ] ?? null,
          `${op.nom} : accepté sans session`,
        )
        .toBeNull();
      expect
        .soft(
          await photo(op.temoin("visiteur")),
          `${op.nom} : la base a changé sans session`,
        )
        .toBe(avant);
    }
  });
});
