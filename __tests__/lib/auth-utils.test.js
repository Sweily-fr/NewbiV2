import { describe, it, expect, vi, beforeEach } from "vitest";

const { resendMock, findOneMock, fetchMock } = vi.hoisted(() => ({
  resendMock: {
    emails: {
      send: vi.fn().mockResolvedValue({ data: { id: "email-1" }, error: null }),
    },
  },
  // Par défaut : invité sans compte → pas de push, pas d'appel réseau
  findOneMock: vi.fn().mockResolvedValue(null),
  fetchMock: vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }),
}));

vi.mock("@/src/lib/resend", () => ({ resend: resendMock }));

// sendInvitationPush (import dynamique) lit la collection `user` puis poste à
// l'API Expo — à mocker pour éviter tout appel Mongo/réseau réel en test
vi.mock("@/src/lib/mongodb", () => ({
  mongoDb: { collection: () => ({ findOne: findOneMock }) },
  mongoClient: {},
  getMongoDb: vi.fn(),
  ensureConnection: vi.fn(),
}));

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
  verifyReactivationToken,
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
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  process.env.NEXT_PUBLIC_BETTER_AUTH_URL = "https://newbi.fr";
});

describe("generateReactivationToken / verifyReactivationToken", () => {
  beforeEach(() => {
    process.env.BETTER_AUTH_SECRET = "secret-de-test";
  });

  it("produit un jeton signé, vérifiable", () => {
    const tok = generateReactivationToken("507f1f77bcf86cd799439011");
    const verified = verifyReactivationToken(tok);
    expect(verified?.userId).toBe("507f1f77bcf86cd799439011");
  });

  it("returns different tokens at different times", () => {
    const t1 = generateReactivationToken("u-1", 1000);
    const t2 = generateReactivationToken("u-1", 2000);
    expect(t1).not.toBe(t2);
  });

  it("refuse l'ancien jeton non signé (base64 de userId:horodatage)", () => {
    const forged = Buffer.from(
      `507f1f77bcf86cd799439011:${Date.now()}`,
    ).toString("base64");
    expect(verifyReactivationToken(forged)).toBeNull();
  });

  it("refuse un jeton dont l'id a été modifié", () => {
    const tok = generateReactivationToken("507f1f77bcf86cd799439011");
    const [, signature] = tok.split(".");
    const otherPayload = Buffer.from(
      `507f1f77bcf86cd799439099:${Date.now()}`,
    ).toString("base64url");
    expect(verifyReactivationToken(`${otherPayload}.${signature}`)).toBeNull();
  });

  it("refuse un jeton de plus de 24 h", () => {
    const now = Date.now();
    const tok = generateReactivationToken("u-1", now - 25 * 60 * 60 * 1000);
    expect(verifyReactivationToken(tok, now)).toBeNull();
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
    // Invité sans compte → aucun push envoyé
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends an Expo push when the invitee has push tokens", async () => {
    findOneMock.mockResolvedValueOnce({
      expoPushTokens: [{ token: "ExponentPushToken[abc123]" }],
    });
    await sendOrganizationInvitationEmail({
      id: "inv-2",
      email: "invitee@test.fr",
      role: "member",
      organization: { name: "Acme Corp" },
      inviter: { user: { name: "Alice", email: "alice@test.fr" } },
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toBe("https://exp.host/--/api/v2/push/send");
    const messages = JSON.parse(opts.body);
    expect(messages[0].to).toBe("ExponentPushToken[abc123]");
    expect(messages[0].body).toContain("Acme Corp");
  });

  it("does not throw when the push lookup fails (best-effort)", async () => {
    findOneMock.mockRejectedValueOnce(new Error("Mongo down"));
    await expect(
      sendOrganizationInvitationEmail({
        id: "inv-3",
        email: "invitee@test.fr",
        role: "member",
        organization: { name: "Acme Corp" },
        inviter: { user: { name: "Alice", email: "alice@test.fr" } },
      }),
    ).resolves.toBeUndefined();
    expect(resendMock.emails.send).toHaveBeenCalledTimes(1);
  });
});
