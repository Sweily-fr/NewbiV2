import { describe, it, expect } from "vitest";
import { isQuoteSignatureActive } from "@/src/utils/quote-signature";

describe("isQuoteSignatureActive", () => {
  it("vrai tant qu'une demande de signature est en cours", () => {
    for (const status of [
      "PENDING",
      "WAIT_VALIDATION",
      "WAIT_SIGN",
      "WAIT_SIGNER",
    ]) {
      expect(isQuoteSignatureActive(status)).toBe(true);
    }
  });

  it("faux sans demande, ou demande terminée, annulée ou en erreur", () => {
    for (const status of [null, undefined, "DONE", "CANCELLED", "ERROR"]) {
      expect(isQuoteSignatureActive(status)).toBe(false);
    }
  });
});
