// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ObjectId } from "mongodb";

/**
 * Routes sans session : réactivation de compte (jeton signé), Factur-X,
 * documents/download, notification de lead (secret interne), renvoi de
 * l'email de vérification (limite et lien de retour).
 */

const m = vi.hoisted(() => ({
  getSession: vi.fn(),
  sendVerificationEmail: vi.fn(),
  userFindOne: vi.fn(),
  userUpdateOne: vi.fn(),
  resendSend: vi.fn(),
}));

vi.mock("@/src/lib/auth", () => ({
  auth: {
    api: {
      getSession: (...args) => m.getSession(...args),
      sendVerificationEmail: (...args) => m.sendVerificationEmail(...args),
    },
  },
}));
vi.mock("@/src/lib/mongodb", () => ({
  mongoDb: {
    collection: () => ({
      findOne: m.userFindOne,
      updateOne: m.userUpdateOne,
    }),
  },
}));
vi.mock("@/src/lib/resend", () => ({
  resend: { emails: { send: (...args) => m.resendSend(...args) } },
}));
vi.mock("@/src/lib/email-templates", () => ({
  emailTemplates: {
    guideLeadNotification: () => "<p>lead</p>",
    reactivation: () => "<p>x</p>",
  },
}));

let ipCounter = 0;
const jsonRequest = (body, headers = {}) =>
  new Request("http://localhost/api/x", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": `172.16.0.${++ipCounter}`,
      ...headers,
    },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "log").mockImplementation(() => {});
  process.env.BETTER_AUTH_SECRET = "secret-de-test";
  process.env.INTERNAL_API_SECRET = "interne";
  process.env.NEXT_PUBLIC_BETTER_AUTH_URL = "https://www.newbi.fr";
  m.getSession.mockResolvedValue(null);
});
afterEach(() => {
  delete process.env.INTERNAL_API_SECRET;
});

describe("POST /api/account/reactivate", () => {
  const userId = new ObjectId().toString();
  const call = async (body) => {
    const { POST } = await import("@/app/api/account/reactivate/route");
    return POST(jsonRequest(body));
  };

  it("refuse un jeton fabriqué (base64 de userId:horodatage)", async () => {
    const forged = Buffer.from(`${userId}:${Date.now()}`).toString("base64");
    m.userFindOne.mockResolvedValue({ _id: userId, isActive: false });
    const res = await call({ email: "victime@example.com", token: forged });
    expect(res.status).toBe(400);
    expect(m.userUpdateOne).not.toHaveBeenCalled();
  });

  it("réactive avec un jeton signé valide", async () => {
    const { generateReactivationToken } = await import("@/src/lib/auth-utils");
    m.userFindOne.mockResolvedValue({ _id: userId, isActive: false });
    const res = await call({
      email: "moi@example.com",
      token: generateReactivationToken(userId),
    });
    expect(res.status).toBe(200);
    expect(m.userUpdateOne).toHaveBeenCalled();
  });
});

describe("POST /api/generate-facturx", () => {
  it("refuse sans session ni secret interne", async () => {
    const { POST } = await import("@/app/api/generate-facturx/route");
    const res = await POST(
      jsonRequest({ pdfBase64: "JVBERi0=", xmlString: "<x/>" }),
    );
    expect(res.status).toBe(401);
  });
});

describe("POST /api/documents/download", () => {
  it("refuse sans session", async () => {
    const { POST } = await import("@/app/api/documents/download/route");
    const res = await POST(jsonRequest({ data: { a: 1 }, type: "invoice" }));
    expect(res.status).toBe(401);
  });
});

describe("POST /api/leads/notify", () => {
  const call = async (headers) => {
    const { POST } = await import("@/app/api/leads/notify/route");
    return POST(
      jsonRequest(
        { lead: { firstName: "A", lastName: "B" }, recipients: ["x@y.fr"] },
        headers,
      ),
    );
  };

  it("n'accepte plus l'ancien en-tête x-api-secret", async () => {
    const res = await call({ "x-api-secret": "interne" });
    expect(res.status).toBe(401);
    expect(m.resendSend).not.toHaveBeenCalled();
  });

  it("refuse un mauvais secret", async () => {
    const res = await call({ "x-internal-secret": "faux" });
    expect(res.status).toBe(401);
    expect(m.resendSend).not.toHaveBeenCalled();
  });

  it("envoie avec le secret interne", async () => {
    const res = await call({ "x-internal-secret": "interne" });
    expect(res.status).toBe(200);
    expect(m.resendSend).toHaveBeenCalled();
  });
});

describe("POST /api/auth/send-verification-email", () => {
  const call = async (body, ip) => {
    const { POST } =
      await import("@/app/api/auth/send-verification-email/route");
    return POST(
      new Request("http://localhost/api/auth/send-verification-email", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": ip || `172.17.0.${++ipCounter}`,
        },
        body: JSON.stringify(body),
      }),
    );
  };

  it("ignore un lien de retour vers un site tiers", async () => {
    m.sendVerificationEmail.mockResolvedValue({ status: true });
    await call({
      email: "a@example.com",
      callbackURL: "https://phishing.example/verify",
    });
    const [{ body }] = m.sendVerificationEmail.mock.calls[0];
    expect(body.callbackURL).toBe("https://www.newbi.fr/auth/verify-email");
  });

  it("garde un lien de retour sur le site", async () => {
    m.sendVerificationEmail.mockResolvedValue({ status: true });
    await call({
      email: "a@example.com",
      callbackURL: "https://www.newbi.fr/auth/verify-email",
    });
    const [{ body }] = m.sendVerificationEmail.mock.calls[0];
    expect(body.callbackURL).toBe("https://www.newbi.fr/auth/verify-email");
  });

  it("limite les envois par IP", async () => {
    m.sendVerificationEmail.mockResolvedValue({ status: true });
    let last;
    for (let i = 0; i < 6; i++) {
      last = await call({ email: "a@example.com" }, "10.9.9.9");
    }
    expect(last.status).toBe(429);
    expect(m.sendVerificationEmail).toHaveBeenCalledTimes(5);
  });
});
