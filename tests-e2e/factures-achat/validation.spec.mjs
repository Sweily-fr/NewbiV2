/**
 * Factures d'achat, fiches fournisseurs et transactions : valeurs que l'API
 * doit refuser elle-même (appel direct, sans le formulaire du site), avec le
 * propriétaire de « Saisie Achats ». Refus avec un message, et rien
 * d'enregistré ; une valeur acceptée est enregistrée telle qu'attendue.
 */
import { ObjectId } from "mongodb";
import { test, expect } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { base } from "../base.mjs";
import { SESSION_TOKEN_SAISIE_ACHATS, connecte } from "../config.mjs";
import { VALIDATION } from "../donnees/lot-achats-banque.mjs";
import { appelApi, id } from "../securite.mjs";
import { ORG_SAISIE, photo } from "../achats-banque.mjs";

test.use({ storageState: connecte(SESSION_TOKEN_SAISIE_ACHATS) });

const ESPACE = new ObjectId(ORG_SAISIE);
const aujourdhui = () => new Date().toISOString().slice(0, 10);
const messages = (reponse) => reponse.errors.map((e) => e.message).join(" | ");
const appeler = (page, requete, variables) => appelApi(page, requete, variables, { organisation: ORG_SAISIE, delai: 15_000 });
const facturePar = (fournisseur) => base().then((db) => db.collection("purchaseinvoices").findOne({ workspaceId: ESPACE, supplierName: fournisseur }));

const CREER = `mutation($input: CreatePurchaseInvoiceInput!) { createPurchaseInvoice(input: $input) { id currency } }`;
const creer = (page, fournisseur, valeurs) =>
  appeler(page, CREER, { input: { workspaceId: ORG_SAISIE, supplierName: fournisseur, issueDate: aujourdhui(), amountHT: 50, amountTVA: 10, vatRate: 20, amountTTC: 60, forceCreate: true, ...valeurs } });

test.describe("Factures d'achat : valeurs refusées par l'API à la création", () => {
  test.beforeEach(async ({ page }) => {
    await ouvrir(page, "/dashboard");
  });

  for (const [nom, valeurs] of [
    ["Devise « EURO » (pas un code de devise)", { currency: "EURO" }],
    ["Devise piégée (balise HTML)", { currency: "<b>EUR</b>" }],
    ["Taux de TVA de 150 %", { vatRate: 150 }],
    ["Montant HT négatif", { amountHT: -50, amountTVA: 10, amountTTC: 60 }],
    ["TVA supérieure au TTC", { amountHT: 0, amountTVA: 80, amountTTC: 60 }],
    ["Date d'émission illisible (« abc »)", { issueDate: "abc" }],
    [
      "Détail de TVA avec un taux de 300 %",
      {
        vatBreakdown: [
          { rate: 300, baseHT: 10, amountTVA: 30 },
          { rate: 20, baseHT: 10, amountTVA: 2 },
        ],
        amountTTC: 52,
      },
    ],
    [
      "Détail de TVA avec une base négative",
      {
        vatBreakdown: [
          { rate: 20, baseHT: -10, amountTVA: -2 },
          { rate: 5.5, baseHT: 100, amountTVA: 5.5 },
        ],
        amountTTC: 93.5,
      },
    ],
    ["Notes de plus de 2 000 caractères", { notes: "n".repeat(2_001) }],
    ["Étiquette de plus de 30 caractères", { tags: ["e".repeat(31)] }],
    ["Numéro de facture de 10 000 caractères", { invoiceNumber: "9".repeat(10_000) }],
  ]) {
    test(`${nom} : refusé avec un message, rien en base`, async ({ page }) => {
      const fournisseur = `Validation ${nom}`.slice(0, 60);
      const reponse = await creer(page, fournisseur, valeurs);
      expect(reponse.data?.createPurchaseInvoice ?? null, `${nom} : facture créée (${JSON.stringify(reponse.data)?.slice(0, 200)})`).toBeNull();
      expect(messages(reponse), `${nom} : refus sans message`).not.toBe("");
      expect(await facturePar(fournisseur), `${nom} : facture enregistrée en base`).toBeNull();
    });
  }

  test("Nom de fournisseur de 10 000 caractères : refusé, ni facture ni fiche fournisseur", async ({ page }) => {
    const nom = `Fournisseur interminable ${"x".repeat(10_000)}`;
    const reponse = await creer(page, nom, {});
    expect(reponse.data?.createPurchaseInvoice ?? null).toBeNull();
    expect(await facturePar(nom)).toBeNull();
    expect(await (await base()).collection("suppliers").findOne({ workspaceId: ESPACE, name: nom })).toBeNull();
  });

  test("Devise « € » : enregistrée « EUR » ou refusée, jamais le symbole", async ({ page }) => {
    const fournisseur = "Validation devise symbole euro";
    await creer(page, fournisseur, { currency: "€" });
    const doc = await facturePar(fournisseur);
    if (doc) expect(doc.currency, "Devise enregistrée telle quelle : les montants ne s'affichent plus").toBe("EUR");
  });

  test("Devise « usd » en minuscules : enregistrée « USD »", async ({ page }) => {
    const fournisseur = "Validation devise minuscules";
    const reponse = await creer(page, fournisseur, { currency: "usd" });
    expect(messages(reponse)).toBe("");
    expect((await facturePar(fournisseur))?.currency).toBe("USD");
  });
});

test.describe("Factures d'achat : valeurs refusées par l'API à la modification", () => {
  test.beforeEach(async ({ page }) => {
    await ouvrir(page, "/dashboard");
  });
  const temoin = ["purchaseinvoices", { _id: VALIDATION.facture._id }];
  const MODIFIER = `mutation($id: ID!, $input: UpdatePurchaseInvoiceInput!) { updatePurchaseInvoice(id: $id, input: $input) { id currency } }`;

  for (const [nom, valeurs] of [
    ["Devise « EURO »", { currency: "EURO" }],
    ["Taux de TVA négatif", { vatRate: -5 }],
    ["TVA supérieure au TTC", { amountTVA: 500 }],
    ["Nom de fournisseur de 10 000 caractères", { supplierName: "y".repeat(10_000) }],
  ]) {
    test(`${nom} : refusé, la facture ne change pas`, async ({ page }) => {
      const avant = await photo(temoin);
      const reponse = await appeler(page, MODIFIER, { id: id(VALIDATION.facture), input: valeurs });
      expect(reponse.data?.updatePurchaseInvoice ?? null, `${nom} : modification acceptée`).toBeNull();
      expect(await photo(temoin)).toBe(avant);
    });
  }
});

test.describe("Fiches fournisseurs : valeurs refusées par l'API", () => {
  test.beforeEach(async ({ page }) => {
    await ouvrir(page, "/dashboard");
  });
  const CREER_FICHE = `mutation($input: CreateSupplierInput!) { createSupplier(input: $input) { id } }`;
  const fiche = (nom) => base().then((db) => db.collection("suppliers").findOne({ workspaceId: ESPACE, name: nom }));

  for (const [nom, valeurs] of [
    ["E-mail invalide", { email: "pas-un-email" }],
    ["SIRET à 13 chiffres", { siret: "1234567890123" }],
    ["IBAN invalide", { iban: "FR00 1234" }],
    ["Notes de plus de 1 000 caractères", { notes: "n".repeat(1_001) }],
  ]) {
    test(`Création, ${nom} : refusée avec un message, rien en base`, async ({ page }) => {
      const nomFiche = `Fiche ${nom}`;
      const reponse = await appeler(page, CREER_FICHE, { input: { workspaceId: ORG_SAISIE, name: nomFiche, ...valeurs } });
      expect(reponse.data?.createSupplier ?? null, `${nom} : fiche créée`).toBeNull();
      expect(messages(reponse)).not.toBe("");
      expect(await fiche(nomFiche)).toBeNull();
    });
  }

  test("Création avec un IBAN valide saisi avec des espaces : fiche enregistrée", async ({ page }) => {
    const reponse = await appeler(page, CREER_FICHE, { input: { workspaceId: ORG_SAISIE, name: "Fiche IBAN avec espaces", iban: "FR76 3000 6000 0112 3456 7890 189", siret: "123 456 789 00011", email: "compta@fournisseur.test" } });
    expect(messages(reponse)).toBe("");
    expect(await fiche("Fiche IBAN avec espaces")).not.toBeNull();
  });

  test("Modification avec un e-mail invalide : refusée, la fiche ne change pas", async ({ page }) => {
    const temoin = ["suppliers", { _id: VALIDATION.fournisseur._id }];
    const avant = await photo(temoin);
    const reponse = await appeler(page, `mutation($id: ID!) { updateSupplier(id: $id, input: { email: "pas-un-email" }) { id } }`, { id: id(VALIDATION.fournisseur) });
    expect(reponse.data?.updateSupplier ?? null).toBeNull();
    expect(await photo(temoin)).toBe(avant);
  });
});

test.describe("Transactions : libellé et notes bornés par l'API", () => {
  test.beforeEach(async ({ page }) => {
    await ouvrir(page, "/dashboard");
  });
  const temoin = ["transactions", { _id: VALIDATION.transaction._id }];
  const MODIFIER = `mutation($id: ID!, $input: UpdateTransactionInput!) { updateTransaction(id: $id, input: $input) { id description } }`;

  test("Libellé vide : le libellé de la transaction n'est pas effacé", async ({ page }) => {
    await appeler(page, MODIFIER, { id: id(VALIDATION.transaction), input: { description: "" } });
    const doc = await (await base()).collection("transactions").findOne({ _id: VALIDATION.transaction._id });
    expect(doc.description).toBe(VALIDATION.transaction.description);
  });

  for (const [nom, valeurs] of [
    ["Libellé de 10 000 caractères", { description: "L".repeat(10_000) }],
    ["Notes de plus de 2 000 caractères", { notes: "n".repeat(2_001) }],
  ]) {
    test(`${nom} : refusé, la transaction ne change pas`, async ({ page }) => {
      const avant = await photo(temoin);
      const reponse = await appeler(page, MODIFIER, { id: id(VALIDATION.transaction), input: valeurs });
      expect(reponse.data?.updateTransaction ?? null, `${nom} : modification acceptée`).toBeNull();
      expect(messages(reponse)).not.toBe("");
      expect(await photo(temoin)).toBe(avant);
    });
  }
});
