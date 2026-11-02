/**
 * Contacts : droits des rôles personnalisés, du Comptable et des
 * automatisations d'e-mails, vérifiés à l'API (espace « Contacts Droits »,
 * donnees/lot-clients-catalogue.mjs). Chaque opération est appelée
 * directement avec la session du navigateur ; un refus doit être explicite
 * et laisser la base identique, une action permise doit être enregistrée.
 */
import { test, expect, etape } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { connecte } from "../config.mjs";
import { base } from "../base.mjs";
import { appelApi, verifierRefus, id } from "../securite.mjs";
import { COMPTES_CC, MEMBRES_CC, CONTACTS_DROITS, LISTES_CC, SEGMENTS_CC, CHAMPS_CC, CRM_CC } from "../donnees/lot-clients-catalogue.mjs";

const ORG = id(COMPTES_CC.droits.organisation);
const adresse = { street: "1 rue du Contrôle", city: "Paris", postalCode: "75001", country: "France" };

/** Documents tels qu'en base, sans la date de mise à jour. */
async function photo(collection, filtre) {
  const docs = await (await base()).collection(collection).find(filtre).sort({ _id: 1 }).toArray();
  return JSON.stringify(docs.map(({ updatedAt, ...d }) => d));
}

const appel = (page, requete, variables) => appelApi(page, requete, { w: ORG, ...variables }, { organisation: ORG });

/** Refus explicite, base inchangée. */
async function refuse(page, { requete, variables = {}, champ, temoin, contexte }) {
  const avant = await photo(...temoin);
  const reponse = await appel(page, requete, variables);
  verifierRefus(reponse, champ, contexte);
  expect(await photo(...temoin), `${contexte} : la base a changé malgré le refus`).toBe(avant);
}

/** Réussite sans erreur. */
async function permis(page, { requete, variables = {}, champ, contexte }) {
  const reponse = await appel(page, requete, variables);
  expect(reponse.errors, `${contexte} : doit être permis`).toEqual([]);
  expect(reponse.data?.[champ], `${contexte} : réponse vide`).toBeTruthy();
  return reponse.data[champ];
}

const contactEnBase = async (c) => (await base()).collection("clients").findOne({ _id: c._id });
const temoinContact = (c) => ["clients", { _id: c._id }];

const OP = {
  clientLists: `query($w: String!) { clientLists(workspaceId: $w) { id name clients { id email phone notes { content } } } }`,
  clientList: `query($w: String!, $id: ID!) { clientList(workspaceId: $w, id: $id) { id clients { email phone } } }`,
  clientsInList: `query($w: String!, $l: ID!) { clientsInList(workspaceId: $w, listId: $l) { items { email phone notes { content } } } }`,
  clientSegments: `query($w: String!) { clientSegments(workspaceId: $w) { id name } }`,
  clientsInSegment: `query($w: String!, $s: ID!) { clientsInSegment(workspaceId: $w, segmentId: $s) { items { email notes { content } } } }`,
  clients: `query($w: String) { clients(workspaceId: $w, page: 1, limit: 50) { items { id name } } }`,
  createClient: `mutation($w: String, $input: ClientInput!) { createClient(workspaceId: $w, input: $input) { id } }`,
  updateClient: `mutation($w: String, $id: ID!, $input: ClientInput!) { updateClient(workspaceId: $w, id: $id, input: $input) { id } }`,
  deleteClient: `mutation($w: String, $id: ID!) { deleteClient(workspaceId: $w, id: $id) }`,
  addClientNote: `mutation($w: String, $c: ID!, $input: ClientNoteInput!) { addClientNote(workspaceId: $w, clientId: $c, input: $input) { id } }`,
  blockClient: `mutation($w: String, $id: ID!, $r: String) { blockClient(workspaceId: $w, id: $id, reason: $r) { id } }`,
  assignClientMembers: `mutation($w: String, $id: ID!, $m: [String!]!) { assignClientMembers(workspaceId: $w, id: $id, memberIds: $m) { id } }`,
  createClientList: `mutation($w: String!, $input: CreateClientListInput!) { createClientList(workspaceId: $w, input: $input) { id } }`,
  deleteClientList: `mutation($w: String!, $id: ID!) { deleteClientList(workspaceId: $w, id: $id) }`,
  addClientToList: `mutation($w: String!, $l: ID!, $c: ID!) { addClientToList(workspaceId: $w, listId: $l, clientId: $c) { id } }`,
  createClientSegment: `mutation($w: String!, $input: CreateClientSegmentInput!) { createClientSegment(workspaceId: $w, input: $input) { id } }`,
  createClientCustomField: `mutation($w: ID!, $input: ClientCustomFieldInput!) { createClientCustomField(workspaceId: $w, input: $input) { id } }`,
  deleteClientCustomField: `mutation($w: ID!, $id: ID!) { deleteClientCustomField(workspaceId: $w, id: $id) }`,
  crmEmailAutomations: `query($w: ID!) { crmEmailAutomations(workspaceId: $w) { id name } }`,
  crmEmailAutomation: `query($w: ID!, $id: ID!) { crmEmailAutomation(workspaceId: $w, id: $id) { id name } }`,
  crmEmailAutomationLogs: `query($w: ID!) { crmEmailAutomationLogs(workspaceId: $w) { id } }`,
  createCrm: `mutation($w: ID!, $input: CreateCrmEmailAutomationInput!) { createCrmEmailAutomation(workspaceId: $w, input: $input) { id } }`,
  updateCrm: `mutation($w: ID!, $id: ID!, $input: UpdateCrmEmailAutomationInput!) { updateCrmEmailAutomation(workspaceId: $w, id: $id, input: $input) { id } }`,
  deleteCrm: `mutation($w: ID!, $id: ID!) { deleteCrmEmailAutomation(workspaceId: $w, id: $id) }`,
  toggleCrm: `mutation($w: ID!, $id: ID!) { toggleCrmEmailAutomation(workspaceId: $w, id: $id) { id isActive } }`,
  testCrm: `mutation($w: ID!, $id: ID!) { testCrmEmailAutomation(workspaceId: $w, id: $id) }`,
};

const entreeContact = (c, extra = {}) => ({ type: "COMPANY", name: c.name, email: c.email, siret: c.siret, address: adresse, ...extra });
const nouvelleCrm = (name, email = {}) => ({
  name,
  customFieldId: id(CHAMPS_CC.renouvellement),
  timing: { type: "ON_DATE", daysOffset: 0, sendHour: 9 },
  email: { subject: "Rappel {customFieldName}", body: "Bonjour {clientName}", ...email },
  isActive: false,
});

/** Aucune donnée personnelle d'un contact dans la réponse. */
function sansFicheContact(reponse, contexte) {
  const texte = JSON.stringify(reponse.data ?? {});
  for (const fuite of [CONTACTS_DROITS.perso.email, CONTACTS_DROITS.perso.phone, "Note confidentielle"]) {
    expect(texte, `${contexte} : « ${fuite} » renvoyé sans le droit « Mes clients »`).not.toContain(fuite);
  }
}

const sous = (membre) => {
  test.use({ storageState: connecte(membre.token) });
  test.beforeEach(async ({ page }) => {
    await ouvrir(page, "/dashboard");
  });
};

test.describe("Contacts : rôle « Listes : voir » sans « Mes clients »", () => {
  sous(MEMBRES_CC.listes);

  for (const [nom, champ, variables] of [
    ["Les listes avec leurs contacts", "clientLists", {}],
    ["Une liste avec ses contacts", "clientList", { id: id(LISTES_CC.droits) }],
    ["Les contacts d'une liste", "clientsInList", { l: id(LISTES_CC.droits) }],
  ]) {
    test(`${nom} : aucune fiche de contact renvoyée`, async ({ page }) => {
      const reponse = await appel(page, OP[champ], variables);
      sansFicheContact(reponse, nom);
    });
  }
});

test.describe("Contacts : rôle « Segments : voir » sans « Mes clients »", () => {
  sous(MEMBRES_CC.segments);

  test("Les segments : lisibles", async ({ page }) => {
    await permis(page, { requete: OP.clientSegments, champ: "clientSegments", contexte: "Lire les segments" });
  });

  test("Les contacts d'un segment : aucune fiche de contact renvoyée", async ({ page }) => {
    const reponse = await appel(page, OP.clientsInSegment, { s: id(SEGMENTS_CC.droits) });
    sansFicheContact(reponse, "Contacts d'un segment");
  });
});

test.describe("Contacts : rôle personnalisé « Notes des contacts »", () => {
  sous(MEMBRES_CC.notes);
  const c = CONTACTS_DROITS.notes;

  test("Ajouter une note : permis et enregistré", async ({ page }) => {
    await permis(page, { requete: OP.addClientNote, variables: { c: id(c), input: { content: "Note du rôle notes" } }, champ: "addClientNote", contexte: "Ajouter une note" });
    expect((await contactEnBase(c)).notes.map((n) => n.content)).toContain("Note du rôle notes");
  });

  for (const [nom, champ, variables] of [
    ["Modifier le contact", "updateClient", { id: id(c), input: entreeContact(c, { contactFunction: "Modifié par le rôle notes" }) }],
    ["Bloquer le contact", "blockClient", { id: id(c), r: "Rôle notes" }],
    ["Assigner des membres", "assignClientMembers", { id: id(c), m: [id(MEMBRES_CC.notes.utilisateur)] }],
    ["Supprimer le contact", "deleteClient", { id: id(c) }],
    ["Créer un contact", "createClient", { input: entreeContact({ name: "Créé par le rôle notes SARL", email: "role-notes@droits.test", siret: "12345678900011" }) }],
  ]) {
    test(`${nom} : refusé`, async ({ page }) => {
      await refuse(page, { requete: OP[champ], variables, champ, temoin: champ === "createClient" ? ["clients", { email: "role-notes@droits.test" }] : temoinContact(c), contexte: nom });
    });
  }
});

test.describe("Contacts : rôle personnalisé « Import des contacts »", () => {
  sous(MEMBRES_CC.import);

  test("Créer un contact : permis et enregistré", async ({ page }) => {
    await permis(page, { requete: OP.createClient, variables: { input: entreeContact({ name: "Importé par le rôle SARL", email: "role-import@droits.test", siret: "12345678900011" }) }, champ: "createClient", contexte: "Créer un contact" });
    expect(await (await base()).collection("clients").findOne({ workspaceId: COMPTES_CC.droits.organisation._id, email: "role-import@droits.test" })).not.toBeNull();
  });

  test("Modifier un contact : refusé", async ({ page }) => {
    const c = CONTACTS_DROITS.modifier;
    await refuse(page, { requete: OP.updateClient, variables: { id: id(c), input: entreeContact(c, { contactFunction: "Modifié par le rôle import" }) }, champ: "updateClient", temoin: temoinContact(c), contexte: "Modifier un contact" });
  });
});

test.describe("Contacts : rôle personnalisé « Blocage des contacts »", () => {
  sous(MEMBRES_CC.blocage);

  test("Bloquer un contact : permis et enregistré", async ({ page }) => {
    await permis(page, { requete: OP.blockClient, variables: { id: id(CONTACTS_DROITS.bloquer), r: "Bloqué par le rôle" }, champ: "blockClient", contexte: "Bloquer" });
    expect((await contactEnBase(CONTACTS_DROITS.bloquer)).isBlocked).toBe(true);
  });

  for (const [nom, champ, variables] of [
    ["Supprimer un contact", "deleteClient", { id: id(CONTACTS_DROITS.modifier) }],
    ["Ajouter une note", "addClientNote", { c: id(CONTACTS_DROITS.modifier), input: { content: "Note du rôle blocage" } }],
  ]) {
    test(`${nom} : refusé`, async ({ page }) => {
      await refuse(page, { requete: OP[champ], variables, champ, temoin: temoinContact(CONTACTS_DROITS.modifier), contexte: nom });
    });
  }
});

test.describe("Contacts : rôle personnalisé « Listes, modification »", () => {
  sous(MEMBRES_CC.listesEdition);

  test("Ajouter un contact à une liste : permis et enregistré", async ({ page }) => {
    await permis(page, { requete: OP.addClientToList, variables: { l: id(LISTES_CC.droits), c: id(CONTACTS_DROITS.liste) }, champ: "addClientToList", contexte: "Ajouter à une liste" });
    const l = await (await base()).collection("clientlists").findOne({ _id: LISTES_CC.droits._id });
    expect(l.clients.map(String)).toContain(id(CONTACTS_DROITS.liste));
  });

  test("Créer une liste : refusé", async ({ page }) => {
    await refuse(page, { requete: OP.createClientList, variables: { input: { name: "Liste du rôle listes" } }, champ: "createClientList", temoin: ["clientlists", { name: "Liste du rôle listes" }], contexte: "Créer une liste" });
  });

  test("Supprimer une liste : refusé", async ({ page }) => {
    await refuse(page, { requete: OP.deleteClientList, variables: { id: id(LISTES_CC.aSupprimerComptable) }, champ: "deleteClientList", temoin: ["clientlists", { _id: LISTES_CC.aSupprimerComptable._id }], contexte: "Supprimer une liste" });
  });
});

test.describe("Contacts : rôle « Comptable »", () => {
  sous(MEMBRES_CC.comptable);

  for (const [nom, champ, requete, variables] of [
    ["Les contacts", "clients", OP.clients, {}],
    ["Les segments", "clientSegments", OP.clientSegments, {}],
    ["Les automatisations d'e-mails", "crmEmailAutomations", OP.crmEmailAutomations, {}],
  ]) {
    test(`Lire « ${nom} » : permis`, async ({ page }) => {
      await permis(page, { requete, variables, champ, contexte: nom });
    });
  }

  test("Créer puis supprimer une liste : permis", async ({ page }) => {
    const cree = await permis(page, { requete: OP.createClientList, variables: { input: { name: "Liste du comptable" } }, champ: "createClientList", contexte: "Créer une liste" });
    expect(await (await base()).collection("clientlists").findOne({ name: "Liste du comptable" })).not.toBeNull();
    expect(cree.id).toBeTruthy();
    await permis(page, { requete: OP.deleteClientList, variables: { id: id(LISTES_CC.aSupprimerComptable) }, champ: "deleteClientList", contexte: "Supprimer une liste" });
    expect(await (await base()).collection("clientlists").findOne({ _id: LISTES_CC.aSupprimerComptable._id })).toBeNull();
  });

  test("Créer puis supprimer un champ personnalisé : permis", async ({ page }) => {
    await permis(page, { requete: OP.createClientCustomField, variables: { input: { name: "Champ du comptable", fieldType: "TEXT" } }, champ: "createClientCustomField", contexte: "Créer un champ" });
    await permis(page, { requete: OP.deleteClientCustomField, variables: { id: id(CHAMPS_CC.aSupprimerComptable) }, champ: "deleteClientCustomField", contexte: "Supprimer un champ" });
    expect(await (await base()).collection("clientcustomfields").findOne({ _id: CHAMPS_CC.aSupprimerComptable._id })).toBeNull();
  });

  const c = CONTACTS_DROITS.modifier;
  for (const [nom, champ, requete, variables, temoin] of [
    ["Créer un contact", "createClient", OP.createClient, { input: entreeContact({ name: "Créé par le comptable SARL", email: "comptable@droits.test", siret: "12345678900011" }) }, ["clients", { email: "comptable@droits.test" }]],
    ["Modifier un contact", "updateClient", OP.updateClient, { id: id(c), input: entreeContact(c, { contactFunction: "Comptable" }) }, temoinContact(c)],
    ["Bloquer un contact", "blockClient", OP.blockClient, { id: id(c), r: "Comptable" }, temoinContact(c)],
    ["Ajouter une note", "addClientNote", OP.addClientNote, { c: id(c), input: { content: "Note du comptable" } }, temoinContact(c)],
    ["Créer un segment", "createClientSegment", OP.createClientSegment, { input: { name: "Segment du comptable", rules: [{ field: "name", operator: "contains", value: "a" }] } }, ["clientsegments", { name: "Segment du comptable" }]],
    ["Créer une automatisation d'e-mails", "createCrmEmailAutomation", OP.createCrm, { input: nouvelleCrm("Automatisation du comptable") }, ["crmemailautomations", { name: "Automatisation du comptable" }]],
  ]) {
    test(`${nom} : refusé`, async ({ page }) => {
      await refuse(page, { requete, variables, champ, temoin, contexte: nom });
    });
  }
});

test.describe("Automatisations d'e-mails : rôle « Membre » (lecture seule)", () => {
  sous(MEMBRES_CC.membre);
  const temoin = ["crmemailautomations", { workspaceId: COMPTES_CC.droits.organisation._id }];

  for (const [nom, champ, requete, variables] of [
    ["Les automatisations", "crmEmailAutomations", OP.crmEmailAutomations, {}],
    ["Une automatisation", "crmEmailAutomation", OP.crmEmailAutomation, { id: id(CRM_CC.droits) }],
    ["Le journal des envois", "crmEmailAutomationLogs", OP.crmEmailAutomationLogs, {}],
  ]) {
    test(`Lire « ${nom} » : permis`, async ({ page }) => {
      const reponse = await appel(page, requete, variables);
      expect(reponse.errors, nom).toEqual([]);
      expect(reponse.data?.[champ], nom).toBeTruthy();
    });
  }

  for (const [nom, champ, requete, variables] of [
    ["Créer", "createCrmEmailAutomation", OP.createCrm, { input: nouvelleCrm("Automatisation du membre") }],
    ["Modifier", "updateCrmEmailAutomation", OP.updateCrm, { id: id(CRM_CC.droits), input: { name: "Modifiée par le membre" } }],
    ["Activer ou couper", "toggleCrmEmailAutomation", OP.toggleCrm, { id: id(CRM_CC.droits) }],
    ["Supprimer", "deleteCrmEmailAutomation", OP.deleteCrm, { id: id(CRM_CC.droits) }],
    ["Envoyer un e-mail de test", "testCrmEmailAutomation", OP.testCrm, { id: id(CRM_CC.droits) }],
  ]) {
    test(`${nom} : refusé`, async ({ page }) => {
      await refuse(page, { requete, variables, champ, temoin, contexte: nom });
    });
  }
});

test.describe("Automatisations d'e-mails : rôle « Éditeur »", () => {
  sous(MEMBRES_CC.editeur);

  test("Créer, modifier, activer puis couper : permis et enregistré", async ({ page }) => {
    const cree = await permis(page, { requete: OP.createCrm, variables: { input: nouvelleCrm("Automatisation de l'éditeur") }, champ: "createCrmEmailAutomation", contexte: "Créer" });
    await permis(page, { requete: OP.updateCrm, variables: { id: cree.id, input: { description: "Modifiée par l'éditeur" } }, champ: "updateCrmEmailAutomation", contexte: "Modifier" });
    await permis(page, { requete: OP.toggleCrm, variables: { id: cree.id }, champ: "toggleCrmEmailAutomation", contexte: "Activer" });
    const doc = await (await base()).collection("crmemailautomations").findOne({ name: "Automatisation de l'éditeur" });
    expect(doc.description).toBe("Modifiée par l'éditeur");
    expect(doc.isActive).toBe(true);
  });

  test("Supprimer : refusé", async ({ page }) => {
    await refuse(page, { requete: OP.deleteCrm, variables: { id: id(CRM_CC.droits) }, champ: "deleteCrmEmailAutomation", temoin: ["crmemailautomations", { _id: CRM_CC.droits._id }], contexte: "Supprimer" });
  });
});

test.describe("Automatisations d'e-mails : expéditeur et adresse de réponse", () => {
  sous(COMPTES_CC.droits);
  const temoinNom = (name) => ["crmemailautomations", { name }];

  for (const [cas, email, message] of [
    ["adresse d'expéditeur étrangère à l'espace", { fromEmail: "direction@banque-exemple.fr" }, /expéditeur/i],
    ["adresse de réponse invalide", { replyTo: "pas-une-adresse" }, /réponse/i],
    ["nom d'expéditeur avec des guillemets", { fromName: 'Banque "Officielle"' }, /expéditeur/i],
  ]) {
    test(`Créer avec une ${cas} : refusé avec un message, rien en base`, async ({ page }) => {
      const nom = `Expéditeur refusé, ${cas}`;
      const avant = await photo(...temoinNom(nom));
      const reponse = await appel(page, OP.createCrm, { input: nouvelleCrm(nom, email) });
      expect(reponse.data?.createCrmEmailAutomation ?? null).toBeNull();
      expect(reponse.errors.map((e) => e.message).join(" | ")).toMatch(message);
      expect(await photo(...temoinNom(nom))).toBe(avant);
    });
  }

  test("Modifier avec une adresse d'expéditeur étrangère : refusé, automatisation inchangée", async ({ page }) => {
    const temoin = ["crmemailautomations", { _id: CRM_CC.droits._id }];
    const avant = await photo(...temoin);
    const reponse = await appel(page, OP.updateCrm, { id: id(CRM_CC.droits), input: { email: { subject: "Rappel", body: "Bonjour", fromEmail: "direction@banque-exemple.fr", replyTo: "fraude@exterieur.test" } } });
    expect(reponse.data?.updateCrmEmailAutomation ?? null).toBeNull();
    expect(reponse.errors.map((e) => e.message).join(" | ")).toMatch(/expéditeur/i);
    expect(await photo(...temoin)).toBe(avant);
  });

  test("Créer avec l'adresse de l'entreprise comme expéditeur : enregistré", async ({ page }) => {
    await etape(page, "Création", async () => {
      await permis(page, { requete: OP.createCrm, variables: { input: nouvelleCrm("Expéditeur de l'entreprise", { fromEmail: COMPTES_CC.droits.organisation.companyEmail, fromName: "Contacts Droits" }) }, champ: "createCrmEmailAutomation", contexte: "Créer" });
    });
    const doc = await (await base()).collection("crmemailautomations").findOne({ name: "Expéditeur de l'entreprise" });
    expect(doc.email.fromEmail).toBe(COMPTES_CC.droits.organisation.companyEmail);
  });

  test("Supprimer une automatisation : permis au propriétaire", async ({ page }) => {
    await permis(page, { requete: OP.deleteCrm, variables: { id: id(CRM_CC.aSupprimerProprietaire) }, champ: "deleteCrmEmailAutomation", contexte: "Supprimer" });
    expect(await (await base()).collection("crmemailautomations").findOne({ _id: CRM_CC.aSupprimerProprietaire._id })).toBeNull();
  });
});
