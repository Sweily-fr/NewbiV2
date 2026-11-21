import { describe, it, expect } from "vitest";
import {
  DECLARATION_PRESETS,
  declarationFilingSite,
  declarationPresetsFor,
  recommendedDeclarationKinds,
} from "@/src/utils/declaration-events";

const kinds = (org) => recommendedDeclarationKinds(org);
const offered = (org) =>
  declarationPresetsFor(org).map((p) => `${p.kind}${p.recommended ? "*" : ""}`);

describe("événements Newbi de déclaration", () => {
  it("SAS : la déclaration de TVA est conseillée", () => {
    expect(kinds({ legalForm: "SAS", isVatSubject: true })).toEqual(["VAT"]);
    expect(kinds({ legalForm: "SAS" })).toEqual(["VAT"]);
    expect(kinds({ legalForm: "SAS unipersonnelle (SASU)" })).toEqual(["VAT"]);
  });

  it("société en franchise ou non assujettie : rien de conseillé", () => {
    expect(kinds({ legalForm: "SARL", vatFranchise: true })).toEqual([]);
    expect(kinds({ legalForm: "SAS", isVatSubject: false })).toEqual([]);
  });

  it("micro-entrepreneur : Urssaf, plus la TVA s'il y est assujetti", () => {
    expect(kinds({ legalForm: "Auto-entrepreneur" })).toEqual(["URSSAF"]);
    expect(
      kinds({ legalForm: "EI", fiscalRegime: "micro-bnc", isVatSubject: true }),
    ).toEqual(["URSSAF", "VAT"]);
  });

  it("entrepreneur individuel au réel : la TVA", () => {
    expect(kinds({ legalForm: "EI", fiscalRegime: "reel-simplifie" })).toEqual([
      "VAT",
    ]);
  });

  it("les deux déclarations sont toujours proposées, les conseillées d'abord", () => {
    expect(offered({ legalForm: "SAS" })).toEqual(["VAT*", "URSSAF"]);
    expect(offered({ legalForm: "Auto-entrepreneur" })).toEqual([
      "URSSAF*",
      "VAT",
    ]);
    // Indivision en franchise : rien de conseillé, mais rien de masqué
    expect(offered({ legalForm: "Indivision", vatFranchise: true })).toEqual([
      "VAT",
      "URSSAF",
    ]);
    expect(offered(null)).toEqual(["VAT", "URSSAF"]);
  });

  it("chaque déclaration mène au site où la déposer", () => {
    expect(declarationFilingSite("VAT").url).toBe(
      "https://cfspro.impots.gouv.fr/mire/accueil.do",
    );
    expect(declarationFilingSite("URSSAF").url).toBe(
      "https://www.autoentrepreneur.urssaf.fr/portail/accueil.html",
    );
    expect(declarationFilingSite(null)).toBeNull();
    expect(DECLARATION_PRESETS.VAT.title).toBe("Déclaration de TVA");
  });
});
