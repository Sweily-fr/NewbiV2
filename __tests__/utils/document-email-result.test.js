import { describe, it, expect } from "vitest";
import {
  assertDocumentEmailSent,
  documentEmailErrorMessage,
} from "@/src/utils/document-email-result";

describe("Envoi d'un document par e-mail : résultat", () => {
  it("envoi réussi : rien à signaler", () => {
    expect(() =>
      assertDocumentEmailSent({
        data: { sendQuoteEmail: { success: true, messageId: "m1" } },
      }),
    ).not.toThrow();
  });

  it("refus de l'API (errorPolicy « all ») : l'envoi n'est pas annoncé réussi", () => {
    expect(() =>
      assertDocumentEmailSent({
        data: { sendInvoiceEmail: null },
        errors: [{ message: "Service d'e-mail injoignable" }],
      }),
    ).toThrow("Service d'e-mail injoignable");
  });

  it("success: false ou réponse vide : échec", () => {
    expect(() =>
      assertDocumentEmailSent({
        data: { sendDeliveryNoteEmail: { success: false } },
      }),
    ).toThrow("L'e-mail n'a pas pu être envoyé.");
    expect(() => assertDocumentEmailSent({ data: null })).toThrow();
  });

  it("message : refus rédigé par l'API, sinon message clair sans détail technique", () => {
    const refus = new Error("L'adresse du destinataire est invalide");
    refus.graphQLErrors = [
      {
        message: refus.message,
        extensions: { code: "VALIDATION_ERROR" },
      },
    ];
    expect(documentEmailErrorMessage(refus)).toBe(
      "L'adresse du destinataire est invalide",
    );

    const technique = new Error(
      "Erreur lors de la vérification des permissions: generateDocumentPdf désactivé",
    );
    technique.graphQLErrors = [
      { message: technique.message, extensions: { code: "INTERNAL_ERROR" } },
    ];
    expect(documentEmailErrorMessage(technique)).toBe(
      "L'e-mail n'a pas pu être envoyé. Réessayez dans quelques instants.",
    );
  });
});
