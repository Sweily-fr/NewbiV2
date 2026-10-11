import { describe, it, expect } from "vitest";
import { shippingVatRateOf } from "@/src/utils/shipping-vat-rate";

describe("shippingVatRateOf", () => {
  it("garde un port à 0 % (un `|| 20` le passait à 20 %)", () => {
    expect(shippingVatRateOf(0)).toBe(0);
    expect(shippingVatRateOf("0")).toBe(0);
  });

  it("reprend le taux saisi", () => {
    expect(shippingVatRateOf(5.5)).toBe(5.5);
    expect(shippingVatRateOf("10")).toBe(10);
  });

  it("prend 20 % quand le taux est absent ou illisible", () => {
    expect(shippingVatRateOf(undefined)).toBe(20);
    expect(shippingVatRateOf(null)).toBe(20);
    expect(shippingVatRateOf("")).toBe(20);
    expect(shippingVatRateOf("abc")).toBe(20);
  });
});
