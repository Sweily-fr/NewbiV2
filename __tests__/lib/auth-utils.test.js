import { describe, it, expect, vi, beforeEach } from "vitest";

const { resendMock } = vi.hoisted(() => ({
  resendMock: {
    emails: {
      send: vi.fn().mockResolvedValue({ data: { id: "email-1" }, error: null }),
    },
  },
}));

vi.mock("@/src/lib/resend", () => ({ resend: resendMock }));

vi.mock("@/src/lib/email-templates", () => ({
  emailTemplates: {
    reactivation: (url) => `<a href="${url}">Reactivate</a>`,
    twoFactor: (otp) => `<p>Code: ${otp}</p>`,
    resetPassword: (url) => `<a href="${url}">Reset</a>`,
    emailVerification: (url) => `<a href="${url}">Verify</a>`,
    paymentFailed: (data) => `<p>Failed: ${data.amount}</p>`,
    subscriptionChanged: () => "<p>Changed</p>",
    subscriptionCreated: () => "<p>Created</p>",
    subscriptionCancelled: () => "<p>Cancelled</p>",
    seatLimitWarning: () => "<p>Limit</p>",
    additionalSeatAdded: () => "<p>Added</p>",
    renewalReminder: () => "<p>Renewal</p>",
    paymentSucceeded: () => "<p>Paid</p>",
    trialStarted: () => "<p>Trial</p>",
    trialEnding: () => "<p>Ending</p>",
    organizationInvitation: () => "<p>Invitation</p>",
  },
}));

import {
  generateReactivationToken,
  sendReactivationEmail,
  sendSMSInDevelopment,
  send2FAEmail,
  sendResetPasswordEmail,
  sendVerificationEmail,
  sendEmail,
  sendPaymentFailedEmail,
  sendSubscriptionChangedEmail,
  sendOrganizationInvitationEmail,
} from "@/src/lib/auth-utils";

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  process.env.NEXT_PUBLIC_BETTER_AUTH_URL = "https://newbi.fr";
});

describe("generateReactivationToken", () => {
  it("returns a base64 string", () => {
    const tok = generateReactivationToken("user-123");
    expect(typeof tok).toBe("string");
    // base64 decodable back to user:timestamp
    const decoded = Buffer.from(tok, "base64").toString();
    expect(decoded.startsWith("user-123:")).toBe(true);
  });

  it("returns different tokens at different times", async () => {
    const t1 = generateReactivationToken("u-1");
    await new Promise((r) => setTimeout(r, 5));
    const t2 = generateReactivationToken("u-1");
    expect(t1).not.toBe(t2);
  });
});

describe("sendReactivationEmail", () => {
  it("calls Resend with the user email and reactivation URL", async () => {
    await sendReactivationEmail({
      _id: { toString: () => "u-1" },
      email: "user@test.fr",
    });
    expect(resendMock.emails.send).toHaveBeenCalledTimes(1);
    const arg = resendMock.emails.send.mock.calls[0][0];
    expect(arg.to).toBe("user@test.fr");
    expect(arg.subject).toMatch(/Réactivez/);
    expect(arg.html).toContain("https://newbi.fr/reactivate-account");
  });
});

describe("sendSMSInDevelopment", () => {
  beforeEach(() => {
    process.env.NODE_ENV = "development";
  });

  it("logs in development", () => {
    sendSMSInDevelopment("+33612345678", "1234");
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("+33612345678"),
    );
  });

  it("does nothing in production", () => {
    process.env.NODE_ENV = "production";
    sendSMSInDevelopment("+33612345678", "1234");
    expect(console.log).not.toHaveBeenCalled();
  });
});

describe("send2FAEmail", () => {
  it("sends a 2FA email", async () => {
    await send2FAEmail({ email: "user@test.fr" }, "123456");
    expect(resendMock.emails.send).toHaveBeenCalled();
    const arg = resendMock.emails.send.mock.calls[0][0];
    expect(arg.html).toContain("123456");
  });

  it("throws when Resend returns an error", async () => {
    resendMock.emails.send.mockResolvedValueOnce({
      data: null,
      error: { message: "Bad email" },
    });
    await expect(send2FAEmail({ email: "x@y.fr" }, "111111")).rejects.toThrow(
      /Échec.*Bad email/,
    );
  });
});

describe("sendResetPasswordEmail / sendVerificationEmail", () => {
  it("sendResetPasswordEmail sends with the right subject", async () => {
    await sendResetPasswordEmail({ email: "u@x.fr" }, "https://reset/abc");
    const arg = resendMock.emails.send.mock.calls[0][0];
    expect(arg.subject).toMatch(/Réinitialisez/);
  });

  it("sendVerificationEmail sends with the right subject", async () => {
    await sendVerificationEmail({ email: "u@x.fr" }, "https://verify/abc");
    const arg = resendMock.emails.send.mock.calls[0][0];
    expect(arg.subject).toMatch(/Vérifiez/);
  });
});

describe("sendEmail (generic)", () => {
  it("uses default 'from' when not provided", async () => {
    await sendEmail({ to: "u@x.fr", subject: "S", html: "<p>X</p>" });
    expect(resendMock.emails.send.mock.calls[0][0].from).toMatch(
      /noreply@newbi/,
    );
  });

  it("respects custom 'from'", async () => {
    await sendEmail({
      to: "u@x.fr",
      subject: "S",
      html: "X",
      from: "Custom <c@x.fr>",
    });
    expect(resendMock.emails.send.mock.calls[0][0].from).toBe(
      "Custom <c@x.fr>",
    );
  });

  it("throws when Resend rejects", async () => {
    resendMock.emails.send.mockRejectedValueOnce(new Error("Network down"));
    await expect(
      sendEmail({ to: "u@x.fr", subject: "S", html: "X" }),
    ).rejects.toThrow("Network down");
  });
});

describe("sendPaymentFailedEmail", () => {
  it("sends with payment failure subject + dashboard URL", async () => {
    await sendPaymentFailedEmail({
      to: "u@x.fr",
      customerName: "Acme",
      amount: "12.50€",
      invoiceUrl: "https://stripe/inv",
    });
    const arg = resendMock.emails.send.mock.calls[0][0];
    expect(arg.subject).toMatch(/Échec/);
    expect(arg.to).toBe("u@x.fr");
  });
});

describe("sendSubscriptionChangedEmail", () => {
  it("uses the upgrade subject when isUpgrade=true", async () => {
    await sendSubscriptionChangedEmail({
      to: "u@x.fr",
      customerName: "Acme",
      oldPlan: "freelance",
      newPlan: "pme",
      newPrice: 30,
      isUpgrade: true,
      effectiveDate: new Date(),
    });
    expect(resendMock.emails.send.mock.calls[0][0].subject).toMatch(/amélioré/);
  });

  it("uses the downgrade subject when isUpgrade=false", async () => {
    await sendSubscriptionChangedEmail({
      to: "u@x.fr",
      customerName: "Acme",
      oldPlan: "pme",
      newPlan: "freelance",
      newPrice: 7,
      isUpgrade: false,
      effectiveDate: new Date(),
    });
    expect(resendMock.emails.send.mock.calls[0][0].subject).toMatch(/modifié/);
  });
});

describe("sendOrganizationInvitationEmail", () => {
  it("builds an invitation link with org/email/role params", async () => {
    await sendOrganizationInvitationEmail({
      id: "inv-1",
      email: "invitee@test.fr",
      role: "member",
      organization: { name: "Acme Corp" },
      inviter: { user: { name: "Alice", email: "alice@test.fr" } },
    });
    const arg = resendMock.emails.send.mock.calls[0][0];
    expect(arg.subject).toContain("Acme Corp");
    expect(arg.to).toBe("invitee@test.fr");
  });
});
