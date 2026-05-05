/**
 * CRUD Factures — invariants de calcul backend (raw GraphQL).
 *
 * Bypass complet de l'UI pour vérifier que le moteur de calcul du
 * resolver createInvoice (newbi-api/src/resolvers/invoice.js:55-140)
 * applique correctement les règles métier documentées en §18 :
 *   - TVA par item après remise item, AVANT remise globale
 *   - Remise globale recalcule la VAT au prorata (totalVAT * finalHT/totalHT)
 *   - isReverseCharge force VAT à 0
 *   - shipping.billShipping ajoute HT + VAT au total
 *   - DRAFT préfixe le numéro avec "DRAFT-"
 *   - Numérotation séquentielle stricte sur PENDING (compliance FR §4)
 *   - items vide → erreur de validation
 *
 * Pourquoi raw GraphQL plutôt que UI : 10 variantes de calcul = 10×~30s en
 * UI vs 10×~1s en mutation directe. Et on teste la même chose au final
 * (le moteur de calcul est dans le resolver, pas dans le composant).
 */
import { test } from "../fixtures/auth.fixture";
import { expect } from "@playwright/test";
import { createInvoiceMutation } from "./helpers/invoice-mutations";
import { buildInvoiceInput, buildItem } from "./helpers/invoice-fixtures";

test.describe("[Factures] CRUD via GraphQL — invariants de calcul", () => {
  test.setTimeout(45000);

  test("Test 1 — TVA mixte 5.5% / 10% / 20% sur 3 articles", async ({
    authenticatedPage: page,
  }) => {
    const { status, json } = await createInvoiceMutation(page.request, {
      ...buildInvoiceInput({
        items: [
          buildItem({ description: "TVA 20", unitPrice: 100, vatRate: 20 }),
          buildItem({ description: "TVA 10", unitPrice: 100, vatRate: 10 }),
          buildItem({ description: "TVA 5.5", unitPrice: 100, vatRate: 5.5 }),
        ],
      }),
    });

    expect(status).toBe(200);
    expect(json.errors, JSON.stringify(json.errors)).toBeFalsy();
    const inv = json.data.createInvoice;

    // 100 + 100 + 100 = 300 HT
    expect(Number(inv.totalHT)).toBeCloseTo(300, 2);
    // 20 + 10 + 5.5 = 35.5 VAT
    expect(Number(inv.totalVAT)).toBeCloseTo(35.5, 2);
    expect(Number(inv.totalTTC)).toBeCloseTo(335.5, 2);
    // Pas de remise → finalTotal == total
    expect(Number(inv.finalTotalTTC)).toBeCloseTo(335.5, 2);
  });

  test("Test 2 — Remise par item PERCENTAGE appliquée AVANT TVA", async ({
    authenticatedPage: page,
  }) => {
    const { status, json } = await createInvoiceMutation(page.request, {
      ...buildInvoiceInput({
        items: [
          buildItem({
            description: "Item avec remise 10%",
            unitPrice: 1000,
            vatRate: 20,
            discount: 10,
            discountType: "PERCENTAGE",
          }),
        ],
      }),
    });

    expect(status).toBe(200);
    expect(json.errors, JSON.stringify(json.errors)).toBeFalsy();
    const inv = json.data.createInvoice;

    // itemHT = 1000 * 0.9 = 900 ; itemVAT = 900 * 0.20 = 180
    expect(Number(inv.totalHT)).toBeCloseTo(900, 2);
    expect(Number(inv.totalVAT)).toBeCloseTo(180, 2);
    expect(Number(inv.totalTTC)).toBeCloseTo(1080, 2);
  });

  test("Test 3 — Remise par item FIXED appliquée AVANT TVA", async ({
    authenticatedPage: page,
  }) => {
    const { status, json } = await createInvoiceMutation(page.request, {
      ...buildInvoiceInput({
        items: [
          buildItem({
            description: "Item avec remise fixe 100€",
            unitPrice: 1000,
            vatRate: 20,
            discount: 100,
            discountType: "FIXED",
          }),
        ],
      }),
    });

    expect(status).toBe(200);
    expect(json.errors, JSON.stringify(json.errors)).toBeFalsy();
    const inv = json.data.createInvoice;

    // itemHT = 1000 - 100 = 900 ; itemVAT = 180 ; TTC = 1080
    expect(Number(inv.totalHT)).toBeCloseTo(900, 2);
    expect(Number(inv.totalTTC)).toBeCloseTo(1080, 2);
  });

  test("Test 4 — Remise globale 10% : VAT recalculée au prorata", async ({
    authenticatedPage: page,
  }) => {
    const { status, json } = await createInvoiceMutation(page.request, {
      ...buildInvoiceInput({
        items: [
          buildItem({ description: "Base", unitPrice: 1000, vatRate: 20 }),
        ],
        discount: 10,
        discountType: "PERCENTAGE",
      }),
    });

    expect(status).toBe(200);
    expect(json.errors, JSON.stringify(json.errors)).toBeFalsy();
    const inv = json.data.createInvoice;

    // §18.1 : totalHT=1000, totalVAT=200, totalTTC=1200
    expect(Number(inv.totalHT)).toBeCloseTo(1000, 2);
    expect(Number(inv.totalVAT)).toBeCloseTo(200, 2);
    expect(Number(inv.totalTTC)).toBeCloseTo(1200, 2);

    // Après remise globale 10% :
    //   finalTotalHT = 900 (donc discount appliqué = 100)
    //   finalTotalVAT = 200 * (900/1000) = 180
    //   finalTotalTTC = 1080
    // Note : Invoice.discountAmount n'est pas persisté (pas de field resolver
    // dans newbi-api/src/resolvers/invoice.js). On le dérive via la différence.
    expect(Number(inv.finalTotalHT)).toBeCloseTo(900, 2);
    expect(Number(inv.finalTotalVAT)).toBeCloseTo(180, 2);
    expect(Number(inv.finalTotalTTC)).toBeCloseTo(1080, 2);
    expect(Number(inv.totalHT) - Number(inv.finalTotalHT)).toBeCloseTo(100, 2);
    expect(Number(inv.discount)).toBe(10);
    expect(inv.discountType).toBe("PERCENTAGE");
  });

  test("Test 5 — Remise par item + remise globale (combinaison)", async ({
    authenticatedPage: page,
  }) => {
    const { status, json } = await createInvoiceMutation(page.request, {
      ...buildInvoiceInput({
        items: [
          buildItem({
            description: "Item -10%",
            unitPrice: 1000,
            vatRate: 20,
            discount: 10,
            discountType: "PERCENTAGE",
          }),
        ],
        discount: 10,
        discountType: "PERCENTAGE",
      }),
    });

    expect(status).toBe(200);
    expect(json.errors, JSON.stringify(json.errors)).toBeFalsy();
    const inv = json.data.createInvoice;

    // Étape 1 (item) : itemHT = 1000 * 0.9 = 900 ; itemVAT = 180
    //   totalHT=900, totalVAT=180, totalTTC=1080
    expect(Number(inv.totalHT)).toBeCloseTo(900, 2);
    expect(Number(inv.totalVAT)).toBeCloseTo(180, 2);

    // Étape 2 (remise globale 10% sur totalHT=900) :
    //   finalTotalHT = 810 (donc discount global appliqué = 90)
    //   finalTotalVAT = 180 * (810/900) = 162
    //   finalTotalTTC = 972
    expect(Number(inv.finalTotalHT)).toBeCloseTo(810, 2);
    expect(Number(inv.finalTotalVAT)).toBeCloseTo(162, 2);
    expect(Number(inv.finalTotalTTC)).toBeCloseTo(972, 2);
    expect(Number(inv.totalHT) - Number(inv.finalTotalHT)).toBeCloseTo(90, 2);
  });

  test("Test 6 — Auto-liquidation : isReverseCharge=true force VAT=0", async ({
    authenticatedPage: page,
  }) => {
    const { status, json } = await createInvoiceMutation(page.request, {
      ...buildInvoiceInput({
        items: [
          buildItem({
            description: "Service intra-UE",
            unitPrice: 1000,
            vatRate: 20, // ignoré
          }),
        ],
        isReverseCharge: true,
      }),
    });

    expect(status).toBe(200);
    expect(json.errors, JSON.stringify(json.errors)).toBeFalsy();
    const inv = json.data.createInvoice;

    expect(inv.isReverseCharge).toBe(true);
    expect(Number(inv.totalHT)).toBeCloseTo(1000, 2);
    // VAT forcée à 0 malgré vatRate=20
    expect(Number(inv.totalVAT)).toBeCloseTo(0, 2);
    expect(Number(inv.finalTotalVAT)).toBeCloseTo(0, 2);
    expect(Number(inv.totalTTC)).toBeCloseTo(1000, 2);
    expect(Number(inv.finalTotalTTC)).toBeCloseTo(1000, 2);
  });

  test("Test 7 — Frais de livraison facturés : ajout au total", async ({
    authenticatedPage: page,
  }) => {
    const { status, json } = await createInvoiceMutation(page.request, {
      ...buildInvoiceInput({
        items: [
          buildItem({ description: "Produit", unitPrice: 1000, vatRate: 20 }),
        ],
        shipping: {
          billShipping: true,
          shippingAmountHT: 50,
          shippingVatRate: 20,
          shippingAddress: {
            street: "1 rue Livraison",
            city: "Paris",
            postalCode: "75001",
            country: "France",
          },
        },
      }),
    });

    expect(status).toBe(200);
    expect(json.errors, JSON.stringify(json.errors)).toBeFalsy();
    const inv = json.data.createInvoice;

    // §18.1 + livraison : totalHT = 1000 + 50 = 1050
    //   shippingVAT = 50 * 0.20 = 10 → totalVAT = 200 + 10 = 210
    //   totalTTC = 1260
    expect(Number(inv.totalHT)).toBeCloseTo(1050, 2);
    expect(Number(inv.totalVAT)).toBeCloseTo(210, 2);
    expect(Number(inv.totalTTC)).toBeCloseTo(1260, 2);
  });

  test("Test 8 — Création DRAFT : numéro préfixé DRAFT-", async ({
    authenticatedPage: page,
  }) => {
    const { status, json } = await createInvoiceMutation(page.request, {
      ...buildInvoiceInput({
        status: "DRAFT",
        items: [buildItem({ description: "Brouillon", unitPrice: 500 })],
      }),
    });

    expect(status).toBe(200);
    expect(json.errors, JSON.stringify(json.errors)).toBeFalsy();
    const inv = json.data.createInvoice;

    expect(inv.status).toBe("DRAFT");
    // §20.1 : numéro temporaire DRAFT-NNNN
    expect(inv.number).toMatch(/^DRAFT-/);
    // Préfixe au format F-YYYYMM (figé au mois de création, §46.9)
    expect(inv.prefix).toMatch(/^F-\d{6}$/);
  });

  test("Test 9 — Numérotation PENDING séquentielle stricte (compliance FR §4)", async ({
    authenticatedPage: page,
  }) => {
    const { json: r1 } = await createInvoiceMutation(page.request, {
      ...buildInvoiceInput({
        items: [buildItem({ description: "Seq #1", unitPrice: 100 })],
      }),
    });
    expect(r1.errors, JSON.stringify(r1.errors)).toBeFalsy();
    const inv1 = r1.data.createInvoice;

    const { json: r2 } = await createInvoiceMutation(page.request, {
      ...buildInvoiceInput({
        items: [buildItem({ description: "Seq #2", unitPrice: 100 })],
      }),
    });
    expect(r2.errors, JSON.stringify(r2.errors)).toBeFalsy();
    const inv2 = r2.data.createInvoice;

    expect(inv1.status).toBe("PENDING");
    expect(inv2.status).toBe("PENDING");
    expect(inv2.prefix).toBe(inv1.prefix);

    const n1 = parseInt(inv1.number, 10);
    const n2 = parseInt(inv2.number, 10);
    expect(Number.isFinite(n1)).toBe(true);
    expect(n2).toBe(n1 + 1);
  });

  test("Test 10 — Validation : items vide → erreur GraphQL", async ({
    authenticatedPage: page,
  }) => {
    // GraphQL est strict — items: [ItemInput!]! refuse [] côté schema mais
    // certains setups laissent passer côté validation app. On accepte les
    // deux cas : soit erreur GraphQL (parse), soit erreur métier.
    const { status, json } = await createInvoiceMutation(page.request, {
      ...buildInvoiceInput({ items: [] }),
    });

    // Status 200 ou 400 selon le mode d'erreur (validation vs schema)
    expect([200, 400]).toContain(status);
    expect(
      json.errors,
      "Une facture sans items doit être rejetée",
    ).toBeTruthy();
    expect(json.errors.length).toBeGreaterThan(0);

    const messages = json.errors.map((e) => e.message).join(" | ");
    // Wording: "La facture contient des erreurs de validation" est l'erreur
    // générique levée par mongoose-validation-handler quand items est vide
    // (validator `validateItemsExistence` sur le schema). On accepte ce
    // wording ou un message plus spécifique mentionnant "item"/"article".
    expect(messages.toLowerCase()).toMatch(/item|article|au moins|validation/i);
  });
});
