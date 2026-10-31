// @vitest-environment node
//
// Codes OTP : seuls les codes vraiment envoyés sont vérifiables.
//
// Seule la vérification d'adresse e-mail par code (application mobile)
// envoie un code. Les routes de connexion et de réinitialisation par code
// (e-mail ou SMS) sont fermées (404), et une demande de code d'un autre type
// que « email-verification » est refusée avant tout enregistrement.
//
// Vraie instance Better Auth (adaptateur mémoire), vrais plugins emailOTP et
// phoneNumber du site, vrai hook « before » et vraie liste de routes fermées.
import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { betterAuth } from "better-auth";
import { memoryAdapter } from "better-auth/adapters/memory";

process.env.STRIPE_SECRET_KEY ||= "sk_test_dummy";
process.env.STRIPE_WEBHOOK_SECRET ||= "whsec_dummy";
process.env.RESEND_API_KEY ||= "re_dummy";

const { sendVerificationOtpEmailMock } = vi.hoisted(() => ({
  sendVerificationOtpEmailMock: vi.fn(async () => {}),
}));

vi.mock("@/src/lib/auth-utils", () => ({
  sendReactivationEmail: vi.fn(),
  sendVerificationOtpEmail: sendVerificationOtpEmailMock,
  send2FAEmail: vi.fn(),
  sendSMSInDevelopment: vi.fn(),
  sendVerificationEmail: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
}));

const { beforeSignInHook, DISABLED_AUTH_PATHS } =
  await import("@/src/lib/auth-hooks");
const { emailOTPPlugin, phoneNumberPlugin } =
  await import("@/src/lib/auth-plugins");

const store = {
  user: [],
  session: [],
  account: [],
  verification: [],
};

const auth = betterAuth({
  database: memoryAdapter(store),
  secret: "secret-de-test-suffisamment-long-pour-better-auth",
  baseURL: "http://localhost:3000",
  emailAndPassword: { enabled: true },
  plugins: [phoneNumberPlugin, emailOTPPlugin],
  disabledPaths: DISABLED_AUTH_PATHS,
  hooks: { before: beforeSignInHook },
});

const EMAIL = "client@newbi.test";

const post = (path, body) =>
  auth.handler(
    new Request(`http://localhost:3000/api/auth${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );

beforeAll(async () => {
  await auth.api.signUpEmail({
    body: { email: EMAIL, password: "MotDePasse-Test-123", name: "Client" },
  });
});

beforeEach(() => {
  store.verification.length = 0;
  sendVerificationOtpEmailMock.mockClear();
  vi.spyOn(console, "log").mockImplementation(() => {});
});

describe("demande de code OTP par e-mail", () => {
  it.each(["sign-in", "forget-password", "change-email", undefined])(
    "refuse le type %s sans enregistrer ni envoyer de code",
    async (type) => {
      const res = await post("/email-otp/send-verification-otp", {
        email: EMAIL,
        type,
      });
      expect(res.status).toBe(400);
      expect(store.verification).toHaveLength(0);
      expect(sendVerificationOtpEmailMock).not.toHaveBeenCalled();
    },
  );

  it("envoie le code de vérification d'e-mail, vérifiable ensuite", async () => {
    const res = await post("/email-otp/send-verification-otp", {
      email: EMAIL,
      type: "email-verification",
    });
    expect(res.status).toBe(200);
    expect(sendVerificationOtpEmailMock).toHaveBeenCalledTimes(1);
    const [email, otp] = sendVerificationOtpEmailMock.mock.calls[0];
    expect(email).toBe(EMAIL);

    const verify = await post("/email-otp/verify-email", { email: EMAIL, otp });
    expect(verify.status).toBe(200);
    expect(store.user.find((u) => u.email === EMAIL)?.emailVerified).toBe(true);
  });
});

describe("routes de connexion et de réinitialisation par code", () => {
  it.each([
    ["/sign-in/email-otp", { email: EMAIL, otp: "123456" }],
    [
      "/email-otp/check-verification-otp",
      { email: EMAIL, otp: "123456", type: "sign-in" },
    ],
    ["/email-otp/request-password-reset", { email: EMAIL }],
    ["/forget-password/email-otp", { email: EMAIL }],
    [
      "/email-otp/reset-password",
      { email: EMAIL, otp: "123456", password: "Nouveau-123456" },
    ],
    ["/sign-in/phone-number", { phoneNumber: "+33600000000", password: "x" }],
    ["/phone-number/send-otp", { phoneNumber: "+33600000000" }],
    ["/phone-number/verify", { phoneNumber: "+33600000000", code: "123456" }],
    ["/phone-number/request-password-reset", { phoneNumber: "+33600000000" }],
    [
      "/phone-number/reset-password",
      {
        phoneNumber: "+33600000000",
        otp: "123456",
        newPassword: "Nouveau-123456",
      },
    ],
  ])("%s répond 404", async (path, body) => {
    const res = await post(path, body);
    expect(res.status).toBe(404);
    expect(store.verification).toHaveLength(0);
  });

  it("chaque route OTP de connexion ou de réinitialisation est fermée", () => {
    const routes = [
      ...Object.values(emailOTPPlugin.endpoints),
      ...Object.values(phoneNumberPlugin.endpoints),
    ]
      .map((endpoint) => endpoint.path)
      // Endpoints sans route HTTP (appels serveur seulement)
      .filter(Boolean);
    const open = routes.filter((path) => !DISABLED_AUTH_PATHS.includes(path));
    expect(open.sort()).toEqual([
      "/email-otp/send-verification-otp",
      "/email-otp/verify-email",
    ]);
  });
});

describe("configuration du site", () => {
  it("auth.js ferme les routes de la liste", () => {
    const code = readFileSync(join(process.cwd(), "src/lib/auth.js"), "utf8");
    expect(code).toMatch(/disabledPaths:\s*DISABLED_AUTH_PATHS/);
  });

  it("aucun code d'un autre type n'est envoyé par le plugin", async () => {
    // Le plugin ne remet jamais un code de connexion ou de réinitialisation
    const sendOtp = emailOTPPlugin.options.sendVerificationOTP;
    await expect(
      sendOtp({ email: EMAIL, otp: "123456", type: "sign-in" }),
    ).rejects.toThrow();
    expect(sendVerificationOtpEmailMock).not.toHaveBeenCalled();
  });
});
