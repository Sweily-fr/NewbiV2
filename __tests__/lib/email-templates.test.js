import { describe, it, expect } from "vitest";
import { emailTemplates } from "@/src/lib/email-templates";

describe("emailTemplates registry", () => {
  it("exposes all expected templates", () => {
    const expected = [
      "reactivation",
      "twoFactor",
      "resetPassword",
      "emailVerification",
      "organizationInvitation",
      "subscriptionChanged",
      "subscriptionCreated",
      "subscriptionCancelled",
      "renewalReminder",
      "trialStarted",
      "trialEnding",
      "paymentSucceeded",
      "paymentFailed",
      "invoicePaymentReceived",
      "seatLimitWarning",
      "additionalSeatAdded",
    ];
    for (const name of expected) {
      expect(emailTemplates).toHaveProperty(name);
      expect(typeof emailTemplates[name]).toBe("function");
    }
  });
});

describe("twoFactor template", () => {
  it("includes the OTP code", () => {
    const html = emailTemplates.twoFactor("123456");
    expect(html).toContain("123456");
    expect(html).toContain("Newbi");
  });

  it("includes 'expire dans 10 minutes' wording", () => {
    const html = emailTemplates.twoFactor("000000");
    expect(html).toMatch(/expire/i);
  });
});

describe("emailVerification template", () => {
  it("includes the verification URL", () => {
    const html = emailTemplates.emailVerification("https://verify/abc");
    expect(html).toContain("https://verify/abc");
  });
});

describe("resetPassword template", () => {
  it("includes the reset URL", () => {
    const html = emailTemplates.resetPassword("https://reset/abc");
    expect(html).toContain("https://reset/abc");
  });
});

describe("reactivation template", () => {
  it("includes the reactivation URL", () => {
    const html = emailTemplates.reactivation("https://reactivate/abc");
    expect(html).toContain("https://reactivate/abc");
  });
});

describe("paymentFailed template", () => {
  it("includes amount and customer name", () => {
    const html = emailTemplates.paymentFailed({
      customerName: "Acme Corp",
      amount: "29.99€",
      invoiceUrl: "https://invoice/x",
      updatePaymentUrl: "https://dash",
    });
    expect(html).toContain("Acme Corp");
    expect(html).toContain("29.99€");
  });
});

describe("trialStarted / trialEnding", () => {
  it("trialStarted mentions the customer name", () => {
    const html = emailTemplates.trialStarted({
      customerName: "Alice",
      plan: "pme",
      trialEndDate: new Date("2026-05-15"),
    });
    expect(html).toContain("Alice");
  });

  it("trialEnding mentions the amount", () => {
    const html = emailTemplates.trialEnding({
      customerName: "Bob",
      plan: "pme",
      trialEndDate: new Date("2026-05-15"),
      amount: "29.99€",
    });
    expect(html).toContain("Bob");
  });
});
