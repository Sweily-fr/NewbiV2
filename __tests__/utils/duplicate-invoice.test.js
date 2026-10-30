import { describe, it, expect } from "vitest";
import { duplicateInvoiceData } from "@/app/dashboard/outils/factures/utils/duplicate-invoice";

describe("Dupliquer une facture", () => {
  it("reprend client, articles et conditions, sans numéro, dates ni liens", () => {
    const facture = {
      id: "f1",
      prefix: "F-092026",
      number: "0001",
      status: "PENDING",
      issueDate: "2026-10-12",
      dueDate: "2026-11-11",
      sourceQuote: { id: "q1" },
      purchaseOrderNumber: "D-092026-0004",
      paymentLink: "https://api.test/pay/invoice/f1",
      client: { id: "c1", name: "Boulangerie Lumière SARL" },
      items: [
        {
          description: "Accompagnement mensuel",
          quantity: 2,
          unitPrice: 450,
          vatRate: 20,
        },
      ],
      discount: 5,
      discountType: "PERCENTAGE",
      footerNotes: "Merci pour votre confiance.",
      termsAndConditions: "Paiement à 30 jours.",
    };

    const copie = duplicateInvoiceData(facture);

    expect(copie.client).toEqual(facture.client);
    expect(copie.items).toEqual(facture.items);
    expect(copie).toMatchObject({
      discount: 5,
      discountType: "PERCENTAGE",
      footerNotes: "Merci pour votre confiance.",
      termsAndConditions: "Paiement à 30 jours.",
    });
    for (const champ of [
      "id",
      "number",
      "prefix",
      "status",
      "issueDate",
      "dueDate",
      "sourceQuote",
      "purchaseOrderNumber",
      "paymentLink",
    ]) {
      expect(copie, champ).not.toHaveProperty(champ);
    }
  });
});
