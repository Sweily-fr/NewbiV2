/**
 * Contacts : ce que la base garde (espace « Contacts Intégrité »,
 * donnees/lot-clients-catalogue.mjs). Documents émis jamais réécrits, fiche
 * enregistrée sans changement sans effet, contact bloqué exclu des documents,
 * suppression cohérente, journal, notes, raison de blocage, champs
 * personnalisés, segments, listes, pagination, requêtes multipart et export.
 */
import { readFileSync } from "node:fs";
import { test, expect, etape, fenetre } from "../outils.mjs";
import { ouvrir, cliquer, attendreCalme } from "../navigation.mjs";
import { ouvrirEditeur } from "../editeur.mjs";
import { connecte, API_URL } from "../config.mjs";
import { base } from "../base.mjs";
import { lireCsv } from "../achats-banque.mjs";
import { appelApi, id } from "../securite.mjs";
import {
  COMPTES_CC,
  CONTACTS_INTEGRITE as C,
  FACTURES_CC,
  DEVIS_CC,
  BONS_COMMANDE_CC,
  LISTES_CC,
  SEGMENTS_CC,
  CHAMPS_CC,
  CRM_CC,
} from "../donnees/lot-clients-catalogue.mjs";

test.use({ storageState: connecte(COMPTES_CC.integrite.token) });

const COMPTE = COMPTES_CC.integrite;
const ORG = id(COMPTE.organisation);
const adresse = { street: "12 rue des Tests", city: "Lyon", postalCode: "69002", country: "France" };
const appel = (page, requete, variables = {}) => appelApi(page, requete, { w: ORG, ...variables }, { organisation: ORG });
const messages = (reponse) => reponse.errors.map((e) => e.message).join(" | ");
const enBase = async (collection, _id) => (await base()).collection(collection).findOne({ _id });
const contactEnBase = (c) => enBase("clients", c._id);
const sansDate = ({ updatedAt, ...d }) => d;

test.beforeEach(async ({ page }) => {
  await ouvrir(page, "/dashboard");
});

test.describe("Contacts : documents émis jamais réécrits", () => {
  test("Modifier le nom et l'adresse : factures, devis et bons de commande émis inchangés, brouillon mis à jour avec ses champs", async ({ page }) => {
    const emis = [
      ["invoices", FACTURES_CC.emise],
      ["invoices", FACTURES_CC.annulee],
      ["quotes", DEVIS_CC.signe],
      ["quotes", DEVIS_CC.annule],
      ["purchaseorders", BONS_COMMANDE_CC.annule],
    ];
    // Dates de mise à jour telles que semées (le processus qui sème a sa propre horloge)
    const datesAvant = new Map();
    for (const [collection, doc] of emis) datesAvant.set(id(doc), (await enBase(collection, doc._id)).updatedAt.getTime());
    const reponse = await appel(page, `mutation($w: String, $id: ID!, $input: ClientInput!) { updateClient(workspaceId: $w, id: $id, input: $input) { id } }`, {
      id: id(C.documents),
      input: { type: "COMPANY", name: "Maison Renommée SARL", email: C.documents.email, siret: C.documents.siret, address: { street: "99 avenue Nouvelle", city: "Bordeaux", postalCode: "33000", country: "France" } },
    });
    expect(reponse.errors).toEqual([]);
    await etape(page, "Documents émis en base", async () => {
      for (const [collection, doc] of emis) {
        const apres = await enBase(collection, doc._id);
        expect.soft(apres.client.name, `${collection} ${doc.number} (${doc.status}) : nom du client réécrit`).toBe(C.documents.name);
        expect.soft(apres.client.address.city, `${collection} ${doc.number} : adresse réécrite`).toBe(C.documents.address.city);
        expect.soft(apres.updatedAt.getTime(), `${collection} ${doc.number} : document modifié`).toBe(datesAvant.get(id(doc)));
      }
    });
    const brouillon = await enBase("invoices", FACTURES_CC.brouillon._id);
    expect(brouillon.client.name, "Brouillon mis à jour").toBe("Maison Renommée SARL");
    expect(brouillon.client.address.city).toBe("Bordeaux");
    expect(brouillon.client.documentFields, "Champs « sur les documents » du brouillon effacés").toEqual(FACTURES_CC.brouillon.client.documentFields);
  });

  test("Ouvrir la fiche, « Modifier » puis enregistrer sans rien changer : ni activité ni document modifié", async ({ page }) => {
    const dateDevis = (await enBase("quotes", DEVIS_CC.brouillonInchange._id)).updatedAt.getTime();
    await ouvrir(page, `/dashboard/clients/${id(C.inchange)}`, { pret: page.getByText(C.inchange.email).first() });
    await page.getByRole("button", { name: "Modifier", exact: true }).click();
    const modification = page.getByRole("dialog", { name: "Modifier le client" });
    await expect(modification).toBeVisible();
    await etape(page, "Enregistrer sans changement", async () => {
      await modification.getByRole("button", { name: "Modifier", exact: true }).click();
      await expect(modification).toBeHidden({ timeout: 15_000 });
    }, { capture: "ecran" });
    await page.waitForTimeout(1_000);
    const contact = await contactEnBase(C.inchange);
    expect(contact.activity.map((a) => a.description), "Activité écrite alors que rien n'a changé").toEqual([]);
    const devis = await enBase("quotes", DEVIS_CC.brouillonInchange._id);
    expect(devis.updatedAt.getTime(), "Brouillon du contact réécrit").toBe(dateDevis);
  });
});

test.describe("Contacts : contact bloqué exclu des documents", () => {
  const client = { id: id(C.bloque), name: C.bloque.name, email: C.bloque.email, type: "COMPANY", address: adresse };
  const ligne = { description: "Prestation", quantity: 1, unitPrice: 100, vatRate: 20, unit: "unité" };
  const jour = new Date().toISOString().slice(0, 10);

  for (const [nom, champ, collection, requete, input] of [
    ["Facture", "createInvoice", "invoices", `mutation($w: ID!, $input: CreateInvoiceInput!) { createInvoice(workspaceId: $w, input: $input) { id } }`, { client, items: [ligne], issueDate: jour, dueDate: jour }],
    ["Devis", "createQuote", "quotes", `mutation($w: ID!, $input: CreateQuoteInput!) { createQuote(workspaceId: $w, input: $input) { id } }`, { client, items: [ligne], issueDate: jour }],
    ["Bon de commande", "createPurchaseOrder", "purchaseorders", `mutation($w: ID!, $input: CreatePurchaseOrderInput!) { createPurchaseOrder(workspaceId: $w, input: $input) { id } }`, { client, items: [ligne], issueDate: jour }],
    ["Bon de livraison", "createDeliveryNote", "deliverynotes", `mutation($w: ID!, $input: CreateDeliveryNoteInput!) { createDeliveryNote(workspaceId: $w, input: $input) { id } }`, { client, items: [{ description: "Palette", quantity: 1 }], issueDate: jour }],
  ]) {
    test(`${nom} créé(e) par l'API pour un contact bloqué : refusé avec un message, rien en base`, async ({ page }) => {
      const filtre = { workspaceId: COMPTE.organisation._id, "client.id": id(C.bloque) };
      const avant = await (await base()).collection(collection).countDocuments(filtre);
      const reponse = await appel(page, requete, { input });
      expect(reponse.data?.[champ] ?? null, `${nom} créé(e) pour un contact bloqué`).toBeNull();
      expect(messages(reponse)).toMatch(/bloqué/);
      expect(await (await base()).collection(collection).countDocuments(filtre)).toBe(avant);
    });
  }

  test("Envoyer par e-mail une facture existante à un contact bloqué : refusé avec un message", async ({ page }) => {
    const reponse = await appel(page, `mutation($w: ID!, $input: SendDocumentEmailInput!) { sendInvoiceEmail(workspaceId: $w, input: $input) { success } }`, {
      input: { documentId: id(FACTURES_CC.bloque), emailSubject: "Votre facture", emailBody: "Bonjour", recipientEmail: C.bloque.email },
    });
    expect(reponse.data?.sendInvoiceEmail?.success ?? null, "Facture envoyée à un contact bloqué").not.toBe(true);
    expect(messages(reponse)).toMatch(/bloqué/);
  });

  test("« Nouvelle facture » depuis la fiche d'un contact bloqué : l'éditeur ne reprend pas le contact", async ({ page }) => {
    await ouvrirEditeur(page, `/dashboard/outils/factures/new?clientId=${id(C.bloque)}`);
    await expect(page.locator("[data-sonner-toast]").filter({ hasText: "Ce contact est bloqué" })).toBeVisible();
    await etape(page, "Client de la facture", async () => {
      await expect(page.getByRole("combobox").filter({ hasText: C.bloque.name }), "Le contact bloqué est repris dans la facture").toHaveCount(0);
    }, { capture: "ecran" });
  });
});

test.describe("Contacts : suppression", () => {
  const SUPPRIMER = `mutation($w: String, $id: ID!) { deleteClient(workspaceId: $w, id: $id) }`;

  test("Contact rangé dans deux listes : supprimé et retiré des listes, leur nombre de contacts reste juste", async ({ page }) => {
    const reponse = await appel(page, SUPPRIMER, { id: id(C.dansListes) });
    expect(reponse.errors).toEqual([]);
    expect(await contactEnBase(C.dansListes)).toBeNull();
    for (const l of [LISTES_CC.prospects, LISTES_CC.parDefaut]) {
      const liste = await enBase("clientlists", l._id);
      expect(liste.clients.map(String), `« ${l.name} » garde l'identifiant du contact supprimé`).not.toContain(id(C.dansListes));
    }
    const listes = await appel(page, `query($w: String!) { clientLists(workspaceId: $w) { id name clientCount } }`);
    const prospects = listes.data.clientLists.find((l) => l.id === id(LISTES_CC.prospects));
    const enBaseProspects = await enBase("clientlists", LISTES_CC.prospects._id);
    expect(prospects.clientCount).toBe(enBaseProspects.clients.length);
  });

  for (const [cas, contact] of [
    ["un bon de livraison", C.avecBl],
    ["un avoir", C.avecAvoir],
  ]) {
    test(`Contact qui n'a qu'${cas} : suppression refusée, comme avec une facture`, async ({ page }) => {
      const reponse = await appel(page, SUPPRIMER, { id: id(contact) });
      expect(reponse.data?.deleteClient ?? null).not.toBe(true);
      expect(messages(reponse)).not.toBe("");
      expect(await contactEnBase(contact), "Contact supprimé malgré son document").not.toBeNull();
    });
  }
});

test.describe("Contacts : journal, notes et blocage", () => {
  const ACTIVITE = `mutation($w: String, $c: ID!, $input: ClientActivityInput!) { addClientActivity(workspaceId: $w, clientId: $c, input: $input) { id } }`;

  for (const type of ["invoice_created", "crm_email_sent", "blocked"]) {
    test(`Ajouter une activité « ${type} » par l'API : refusé, journal inchangé`, async ({ page }) => {
      const avant = (await contactEnBase(C.activite)).activity.filter((a) => a.type === type).length;
      const reponse = await appel(page, ACTIVITE, { c: id(C.activite), input: { type, description: "a payé 12 000 €" } });
      expect(reponse.data?.addClientActivity ?? null).toBeNull();
      expect(messages(reponse)).not.toBe("");
      expect((await contactEnBase(C.activite)).activity.filter((a) => a.type === type).length).toBe(avant);
    });
  }

  test("Ajouter un rappel au journal : permis", async ({ page }) => {
    const reponse = await appel(page, ACTIVITE, { c: id(C.activite), input: { type: "reminder_created", description: "Rappel du 12 novembre" } });
    expect(reponse.errors).toEqual([]);
    expect((await contactEnBase(C.activite)).activity.some((a) => a.type === "reminder_created")).toBe(true);
  });

  test("Note de plus de 20 000 caractères : refusée avec un message, le contact reste bloquable", async ({ page }) => {
    const reponse = await appel(page, `mutation($w: String, $c: ID!, $input: ClientNoteInput!) { addClientNote(workspaceId: $w, clientId: $c, input: $input) { id } }`, { c: id(C.notesLongues), input: { content: "n".repeat(20_001) } });
    expect(reponse.data?.addClientNote ?? null).toBeNull();
    expect(messages(reponse)).toMatch(/20\s?000/);
    expect((await contactEnBase(C.notesLongues)).notes).toEqual([]);
    const blocage = await appel(page, `mutation($w: String, $id: ID!) { blockClient(workspaceId: $w, id: $id, reason: "Test") { id } }`, { id: id(C.notesLongues) });
    expect(blocage.errors).toEqual([]);
  });

  test("Raison de blocage de 501 caractères par l'API : message « 500 caractères », pas « contactez le support »", async ({ page }) => {
    const reponse = await appel(page, `mutation($w: String, $id: ID!, $r: String) { blockClient(workspaceId: $w, id: $id, reason: $r) { id } }`, { id: id(C.raison), r: "r".repeat(501) });
    expect(messages(reponse)).toMatch(/500 caractères/);
    expect(messages(reponse)).not.toMatch(/support/);
    expect((await contactEnBase(C.raison)).isBlocked).toBe(false);
  });

  test("Raison de blocage saisie dans la fiche : limitée à 500 caractères, blocage enregistré", async ({ page }) => {
    await ouvrir(page, `/dashboard/clients/${id(C.raison)}`, { pret: page.getByText(C.raison.email).first() });
    await cliquer(page, page.locator("main button:has(svg.lucide-settings2)").first());
    await page.getByRole("menuitem", { name: "Bloquer le contact", exact: true }).click();
    const alerte = fenetre(page, "Bloquer ce contact ?");
    const raison = alerte.getByLabel("Raison du blocage (optionnel)");
    await raison.fill("x".repeat(600));
    expect((await raison.inputValue()).length, "La saisie dépasse 500 caractères").toBe(500);
    await alerte.getByRole("button", { name: "Bloquer" }).click();
    await expect(alerte).toBeHidden();
    await expect.poll(async () => (await contactEnBase(C.raison)).isBlocked).toBe(true);
    expect((await contactEnBase(C.raison)).blockedReason).toHaveLength(500);
  });
});

test.describe("Contacts : champs personnalisés contrôlés par l'API", () => {
  const CREER = `mutation($w: String, $input: ClientInput!) { createClient(workspaceId: $w, input: $input) { id } }`;
  for (const [cas, champ, value] of [
    ["e-mail « pas-un-email »", CHAMPS_CC.email, "pas-un-email"],
    ["nombre « abc »", CHAMPS_CC.nombre, "abc"],
    ["date « 31/02/2026 »", CHAMPS_CC.date, "2026-02-31"],
    ["choix hors des options", CHAMPS_CC.choix, "geant"],
    ["valeur objet", CHAMPS_CC.nombre, { $gt: "" }],
    ["champ d'un autre espace", CHAMPS_CC.renouvellement, "2026-05-01"],
  ]) {
    test(`Créer un contact avec ${cas} : refusé avec un message, rien en base`, async ({ page }) => {
      const email = `champ-${champ._id.toHexString().slice(-4)}-${cas.length}@integrite.test`;
      const reponse = await appel(page, CREER, { input: { type: "COMPANY", name: `Champ refusé ${cas}`.slice(0, 80), email, siret: "12345678900011", address: adresse, customFields: [{ fieldId: id(champ), value }] } });
      expect(reponse.data?.createClient ?? null, `Contact créé avec ${cas}`).toBeNull();
      expect(messages(reponse)).not.toBe("");
      expect(await (await base()).collection("clients").findOne({ workspaceId: COMPTE.organisation._id, email })).toBeNull();
    });
  }

  test("Modifier un contact avec un nombre « abc » : refusé, contact inchangé", async ({ page }) => {
    const avant = sansDate(await contactEnBase(C.champs));
    const reponse = await appel(page, `mutation($w: String, $id: ID!, $input: ClientInput!) { updateClient(workspaceId: $w, id: $id, input: $input) { id } }`, {
      id: id(C.champs),
      input: { type: "COMPANY", name: C.champs.name, email: C.champs.email, siret: C.champs.siret, address: adresse, customFields: [{ fieldId: id(CHAMPS_CC.nombre), value: "abc" }] },
    });
    expect(reponse.data?.updateClient ?? null).toBeNull();
    expect(sansDate(await contactEnBase(C.champs))).toEqual(avant);
  });

  test("Valeurs justes (e-mail, nombre, date, option) : enregistrées", async ({ page }) => {
    const email = "champs-justes@integrite.test";
    const reponse = await appel(page, CREER, {
      input: {
        type: "COMPANY",
        name: "Champs justes SARL",
        email,
        siret: "12345678900011",
        address: adresse,
        customFields: [
          { fieldId: id(CHAMPS_CC.email), value: "compta@champs-justes.test" },
          { fieldId: id(CHAMPS_CC.nombre), value: 12 },
          { fieldId: id(CHAMPS_CC.date), value: "2026-02-28" },
          { fieldId: id(CHAMPS_CC.choix), value: "pme" },
        ],
      },
    });
    expect(reponse.errors).toEqual([]);
    const doc = await (await base()).collection("clients").findOne({ workspaceId: COMPTE.organisation._id, email });
    expect(doc.customFields).toHaveLength(4);
  });

  test("Champ date utilisé par une automatisation d'e-mails : ni supprimé ni changé de type", async ({ page }) => {
    const avant = sansDate(await enBase("clientcustomfields", CHAMPS_CC.anniversaire._id));
    const suppression = await appel(page, `mutation($w: ID!, $id: ID!) { deleteClientCustomField(workspaceId: $w, id: $id) }`, { id: id(CHAMPS_CC.anniversaire) });
    expect(suppression.data?.deleteClientCustomField ?? null).not.toBe(true);
    expect(messages(suppression)).toContain(CRM_CC.anniversaire.name);
    const changement = await appel(page, `mutation($w: ID!, $id: ID!, $input: ClientCustomFieldInput!) { updateClientCustomField(workspaceId: $w, id: $id, input: $input) { id } }`, {
      id: id(CHAMPS_CC.anniversaire),
      input: { name: CHAMPS_CC.anniversaire.name, fieldType: "TEXT" },
    });
    expect(changement.data?.updateClientCustomField ?? null).toBeNull();
    expect(messages(changement)).toContain(CRM_CC.anniversaire.name);
    expect(sansDate(await enBase("clientcustomfields", CHAMPS_CC.anniversaire._id))).toEqual(avant);
  });
});

test.describe("Contacts : segments et listes", () => {
  const CREER_SEGMENT = `mutation($w: String!, $input: CreateClientSegmentInput!) { createClientSegment(workspaceId: $w, input: $input) { id } }`;
  const CONTACTS_DU_SEGMENT = `query($w: String!, $s: ID!) { clientsInSegment(workspaceId: $w, segmentId: $s, page: 1, limit: 100) { items { id name } } }`;
  const segmentEnBase = async (name) => (await base()).collection("clientsegments").findOne({ workspaceId: COMPTE.organisation._id, name });

  test("Segment « Assigné à inclut » un membre : enregistré, contacts assignés listés", async ({ page }) => {
    const reponse = await appel(page, CREER_SEGMENT, { input: { name: "Assignés à Inès", rules: [{ field: "assignedMembers", operator: "assigned_to", value: id(COMPTE.utilisateur) }] } });
    expect(reponse.errors).toEqual([]);
    const contacts = await appel(page, CONTACTS_DU_SEGMENT, { s: reponse.data.createClientSegment.id });
    const noms = contacts.data.clientsInSegment.items.map((c) => c.name);
    expect(noms).toContain(C.assigne.name);
    expect(noms).not.toContain(C.nonAssigne.name);
  });

  test("Segment « Assigné à : aucun assigné » créé depuis la page : enregistré, contacts sans assigné listés", async ({ page }) => {
    await ouvrir(page, "/dashboard/clients/segments", { pret: page.getByText(SEGMENTS_CC.lyonnais.name).first() });
    await page.getByRole("button", { name: "Nouveau segment" }).first().click();
    const dialogue = page.getByRole("dialog", { name: "Nouveau segment" });
    await dialogue.getByPlaceholder("Ex: Entreprises parisiennes").fill("Sans assigné");
    const champs = dialogue.getByRole("combobox").filter({ hasText: /^(Champ|Type de client|Nom|Email|Ville|Pays|Code postal|Assigné à|Bloqué|International|Date de création)$/ }).first();
    const ligne = champs.locator("xpath=ancestor::div[count(.//*[@role='combobox'])>=2][1]");
    await champs.click();
    await page.getByRole("option", { name: "Assigné à", exact: true }).click();
    await ligne.getByRole("combobox").nth(1).click();
    await page.getByRole("option", { name: "aucun assigné", exact: true }).click();
    await etape(page, "Créer", async () => {
      await dialogue.getByRole("button", { name: "Créer", exact: true }).click();
      await expect(dialogue).toBeHidden();
    }, { capture: "ecran" });
    const doc = await segmentEnBase("Sans assigné");
    expect(doc, "Segment « aucun assigné » refusé").not.toBeNull();
    expect(doc.rules[0]).toEqual(expect.objectContaining({ field: "assignedMembers", operator: "is_empty" }));
    const contacts = await appel(page, CONTACTS_DU_SEGMENT, { s: doc._id.toHexString() });
    const noms = contacts.data.clientsInSegment.items.map((c) => c.name);
    expect(noms).toContain(C.nonAssigne.name);
    expect(noms).not.toContain(C.assigne.name);
  });

  for (const [cas, regle] of [
    ["« contient » un nombre", { field: "name", operator: "contains", value: 123 }],
    ["date « pas-une-date »", { field: "createdAt", operator: "before", value: "pas-une-date" }],
    ["nombre de jours « abc »", { field: "createdAt", operator: "in_last_days", value: "abc" }],
  ]) {
    test(`Segment avec ${cas} : refusé avec un message, rien en base`, async ({ page }) => {
      const nom = `Segment invalide ${cas}`;
      const reponse = await appel(page, CREER_SEGMENT, { input: { name: nom, rules: [regle] } });
      expect(reponse.data?.createClientSegment ?? null).toBeNull();
      expect(messages(reponse)).not.toBe("");
      expect(await segmentEnBase(nom)).toBeNull();
    });
  }

  test("Segment au nom déjà pris : « Un segment porte déjà ce nom. »", async ({ page }) => {
    const reponse = await appel(page, CREER_SEGMENT, { input: { name: SEGMENTS_CC.lyonnais.name, rules: [{ field: "address.city", operator: "equals", value: "Lyon" }] } });
    expect(messages(reponse)).toBe("Un segment porte déjà ce nom.");
  });

  test("Liste au nom déjà pris, à la création et au renommage : « Une liste porte déjà ce nom. »", async ({ page }) => {
    const creation = await appel(page, `mutation($w: String!, $input: CreateClientListInput!) { createClientList(workspaceId: $w, input: $input) { id } }`, { input: { name: LISTES_CC.vip.name } });
    expect(messages(creation)).toBe("Une liste porte déjà ce nom.");
    const renommage = await appel(page, `mutation($w: String!, $id: ID!, $input: UpdateClientListInput!) { updateClientList(workspaceId: $w, id: $id, input: $input) { id } }`, { id: id(LISTES_CC.gros), input: { name: LISTES_CC.vip.name } });
    expect(messages(renommage)).toBe("Une liste porte déjà ce nom.");
    expect((await enBase("clientlists", LISTES_CC.gros._id)).name).toBe(LISTES_CC.gros.name);
  });
});

test.describe("Contacts : automatisations de listes déclenchées par les documents", () => {
  const CREER = `mutation($w: ID!, $input: CreateClientAutomationInput!) { createClientAutomation(workspaceId: $w, input: $input) { id } }`;
  const dansListe = async (liste, contact) => (await enBase("clientlists", liste._id)).clients.map(String).includes(id(contact));

  test("« Devis accepté → Ajouter à Clients actifs », puis accepter un devis : contact ajouté avec une activité", async ({ page }) => {
    const auto = await appel(page, CREER, { input: { name: "Devis accepté vers actifs", triggerType: "QUOTE_ACCEPTED", actionType: "ADD_TO_LIST", targetListId: id(LISTES_CC.actifs), isActive: true } });
    expect(auto.errors).toEqual([]);
    expect(await dansListe(LISTES_CC.actifs, C.devisAccepte), "Ajouté avant l'acceptation du devis").toBe(false);
    const acceptation = await appel(page, `mutation($id: ID!) { changeQuoteStatus(id: $id, status: COMPLETED) { id status } }`, { id: id(DEVIS_CC.aAccepter) });
    expect(acceptation.errors).toEqual([]);
    await expect.poll(() => dansListe(LISTES_CC.actifs, C.devisAccepte), { message: "Contact du devis accepté absent de « Clients actifs »" }).toBe(true);
    expect((await contactEnBase(C.devisAccepte)).activity.some((a) => a.type === "automation_executed")).toBe(true);
  });

  test("« Facture payée » avec un minimum de 500 € : seule la facture au-dessus déclenche", async ({ page }) => {
    const auto = await appel(page, CREER, { input: { name: "Grosse facture payée", triggerType: "INVOICE_PAID", triggerConfig: { minAmount: 500 }, actionType: "ADD_TO_LIST", targetListId: id(LISTES_CC.gros), isActive: true } });
    expect(auto.errors).toEqual([]);
    const payer = (f) => appel(page, `mutation($w: ID!, $id: ID!, $d: String!) { markInvoiceAsPaid(workspaceId: $w, id: $id, paymentDate: $d) { id status } }`, { id: id(f), d: new Date().toISOString().slice(0, 10) });
    expect((await payer(FACTURES_CC.payee400)).errors).toEqual([]);
    await page.waitForTimeout(1_000);
    expect(await dansListe(LISTES_CC.gros, C.facturePayee), "Facture de 400 € HT : déclenchée malgré le minimum").toBe(false);
    expect((await payer(FACTURES_CC.payee600)).errors).toEqual([]);
    await expect.poll(() => dansListe(LISTES_CC.gros, C.facturePayee), { message: "Facture de 600 € HT : non déclenchée" }).toBe(true);
  });
});

test.describe("Contacts : pagination hostile", () => {
  const LISTES = [
    ["clients", `query($w: String, $p: Int, $l: Int) { clients(workspaceId: $w, page: $p, limit: $l) { items { id } } }`, {}],
    ["clientsInList", `query($w: String!, $p: Int, $l: Int, $id: ID!) { clientsInList(workspaceId: $w, listId: $id, page: $p, limit: $l) { items { id } } }`, { id: id(LISTES_CC.prospects) }],
    ["clientsInSegment", `query($w: String!, $p: Int, $l: Int, $id: ID!) { clientsInSegment(workspaceId: $w, segmentId: $id, page: $p, limit: $l) { items { id } } }`, { id: id(SEGMENTS_CC.lyonnais) }],
  ];
  for (const [champ, requete, variables] of LISTES) {
    test(`${champ} avec page 0 ou -1, taille 0, -5 ou 100 000 : réponse bornée, jamais d'erreur technique`, async ({ page }) => {
      for (const [p, l] of [[0, 10], [-1, 10], [1, 0], [1, -5], [1, 100_000]]) {
        const reponse = await appel(page, requete, { ...variables, p, l });
        expect.soft(reponse.errors, `${champ} page ${p} taille ${l}`).toEqual([]);
        expect.soft(reponse.data?.[champ]?.items?.length ?? 0, `${champ} page ${p} taille ${l} : réponse géante`).toBeLessThanOrEqual(1000);
      }
    });
  }
});

test.describe("Contacts : requêtes multipart", () => {
  /** Requête GraphQL envoyée en multipart/form-data (comme un envoi de fichier). */
  async function multipart(page, query, variables) {
    return page.evaluate(
      async ({ query, variables, api, org }) => {
        const jeton = await fetch("/api/auth/token", { credentials: "include" }).then((r) => r.json()).then((d) => d.token);
        const corps = new FormData();
        corps.append("operations", JSON.stringify({ query, variables }));
        corps.append("map", "{}");
        const res = await fetch(`${api}/graphql`, {
          method: "POST",
          credentials: "include",
          headers: { authorization: `Bearer ${jeton}`, "x-organization-id": org, "apollo-require-preflight": "true", "x-app-client": "web" },
          body: corps,
        });
        const json = await res.json().catch(() => ({}));
        return { statut: res.status, data: json.data ?? null, errors: json.errors ?? [] };
      },
      { query, variables, api: API_URL, org: ORG },
    );
  }

  for (const [cas, value] of [
    ["$ne", { $ne: null }],
    ["$regex", { $regex: "^(a|aa)+$" }],
  ]) {
    test(`Segment dont la valeur est un opérateur « ${cas} » : clé retirée ou refus`, async ({ page }) => {
      const nom = `Segment multipart ${cas}`;
      const reponse = await multipart(page, `mutation($w: String!, $input: CreateClientSegmentInput!) { createClientSegment(workspaceId: $w, input: $input) { id } }`, { w: ORG, input: { name: nom, rules: [{ field: "name", operator: "equals", value }] } });
      expect(reponse.statut, "Réponse du serveur").toBeLessThan(500);
      const doc = await (await base()).collection("clientsegments").findOne({ workspaceId: COMPTE.organisation._id, name: nom });
      if (doc) expect(JSON.stringify(doc.rules), "Opérateur MongoDB enregistré dans la règle").not.toContain(cas);
    });
  }

  test("Contact dont un champ personnalisé vaut un opérateur « $gt » : clé retirée ou refus", async ({ page }) => {
    const email = "multipart-gt@integrite.test";
    const reponse = await multipart(page, `mutation($w: String, $input: ClientInput!) { createClient(workspaceId: $w, input: $input) { id } }`, {
      w: ORG,
      input: { type: "COMPANY", name: "Multipart SARL", email, siret: "12345678900011", address: adresse, customFields: [{ fieldId: id(CHAMPS_CC.nombre), value: { $gt: "" } }] },
    });
    expect(reponse.statut).toBeLessThan(500);
    const doc = await (await base()).collection("clients").findOne({ workspaceId: COMPTE.organisation._id, email });
    if (doc) expect(JSON.stringify(doc.customFields)).not.toContain("$gt");
  });
});

test.describe("Contacts : export, formules et caractères spéciaux", () => {
  async function exporter(page, format) {
    await ouvrir(page, "/dashboard/clients", { pret: page.getByRole("button", { name: "Exporter" }) });
    await page.getByRole("button", { name: "Exporter" }).click();
    const [telechargement] = await Promise.all([page.waitForEvent("download"), page.getByRole("menuitem", { name: format, exact: true }).click()]);
    return readFileSync(await telechargement.path(), "utf8").replace(/^﻿/, "");
  }

  test("CSV : aucune cellule ne commence par « = », « + », « - » ou « @ »", async ({ page }) => {
    const texte = await exporter(page, "CSV");
    const cellules = lireCsv(texte.trimEnd()).find((l) => l.includes(C.formule.email));
    expect(cellules, "Ligne du contact aux formules").toBeTruthy();
    for (const c of cellules) expect.soft(c, "Cellule lue comme une formule par le tableur").not.toMatch(/^[=+\-@]/);
  });

  test("Excel : « < », « > » et « & » restent du texte dans leur cellule", async ({ page }) => {
    const html = await exporter(page, "Excel");
    const lignes = await page.evaluate((h) => [...new DOMParser().parseFromString(h, "text/html").querySelectorAll("tr")].map((tr) => [...tr.querySelectorAll("th,td")].map((c) => c.textContent)), html);
    const ligne = lignes.find((l) => l.includes(C.symboles.email));
    expect(ligne, "Ligne du contact aux symboles").toBeTruthy();
    expect(ligne).toContain(C.symboles.name);
    expect(ligne).toContain(C.symboles.contactFunction);
  });
});
