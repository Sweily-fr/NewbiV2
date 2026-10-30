import { describe, it, expect } from "vitest";
import { findMerchant } from "@/lib/merchants-config";

describe("findMerchant", () => {
  it("« PRLV SEPA ADOBE SYSTEMS » est Adobe, pas Microsoft (« ms » de SYSTEMS)", () => {
    expect(findMerchant("PRLV SEPA ADOBE SYSTEMS")?.name).toBe("Adobe");
    expect(findMerchant("Adobe Systems")?.name).toBe("Adobe");
  });

  it("un motif court n'est reconnu que comme mot entier", () => {
    expect(findMerchant("MS*OFFICE 365")?.name).toBe("Microsoft");
    expect(findMerchant("PRLV EDF PRO")?.name).toBe("EDF");
    expect(findMerchant("AWS EMEA")?.name).toBe("AWS");
    expect(findMerchant("Cabinet des items")).toBeNull();
    expect(findMerchant("LAWS & CO")).toBeNull();
  });

  it("les motifs longs restent cherchés dans le libellé", () => {
    expect(findMerchant("CB AMAZON MARKETPLACE")?.name).toBe("Amazon");
    expect(findMerchant("UBEREATS PARIS")?.name).toBe("Uber");
    expect(findMerchant("CB SPOTIFY")?.name).toBe("Spotify");
  });

  it("libellé vide ou absent : aucun marchand", () => {
    expect(findMerchant("")).toBeNull();
    expect(findMerchant(null)).toBeNull();
  });
});
