import { expect as baseExpect } from "@playwright/test";

/**
 * Custom Playwright matchers for invoice/quote/credit-note flows.
 *
 * Currency parsing is FR-style: "1 234,56 €" or "1234,56 €" or "1234.56€".
 * Tolerance: 1 cent (0.01) — accommodates float arithmetic without being lax
 * enough to mask real bugs.
 *
 * Use via:
 *   import { expect } from "../matchers.js";
 *   await expect(row).toHaveInvoiceTotal(1200);
 *
 * The matcher's failure message includes the raw text so debug is one click.
 */
export const expect = baseExpect.extend({
  async toHaveInvoiceTotal(locator, expectedTTC) {
    const text = await locator.textContent();
    const match = text?.match(/([\d\s,.]+)\s*€/);
    let value = NaN;
    if (match) {
      // Strip thousands separators (spaces or NBSP), normalise comma to dot
      const normalised = match[1].replace(/[\s ]/g, "").replace(",", ".");
      value = parseFloat(normalised);
    }
    const pass = !Number.isNaN(value) && Math.abs(value - expectedTTC) < 0.01;
    return {
      pass,
      message: () =>
        pass
          ? `Expected total NOT to equal ${expectedTTC} €`
          : `Expected total ${expectedTTC} €, got ${value} € (raw: "${text?.trim()}")`,
    };
  },
});
