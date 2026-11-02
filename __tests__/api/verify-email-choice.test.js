import { describe, it, expect, vi, beforeEach } from "vitest";

const m = vi.hoisted(() => ({
  payload: { email: "titulaire@x.fr" },
  confirm: vi.fn(),
  replace: vi.fn(),
  verifyEmail: vi.fn(),
}));

vi.mock("better-auth/crypto", () => ({
  verifyJWT: vi.fn(async () => m.payload),
}));
vi.mock("@/src/lib/mongodb", () => ({ mongoDb: {} }));
vi.mock("@/src/lib/auth", () => ({
  auth: {
    $context: Promise.resolve({
      password: { hash: async (p) => `h:${p}`, verify: async () => true },
    }),
    api: { verifyEmail: (...a) => m.verifyEmail(...a) },
  },
}));
vi.mock("@/src/lib/unproven-account", async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    confirmSignupPassword: (...a) => m.confirm(...a),
    replaceUnprovenPassword: (...a) => m.replace(...a),
  };
});

const { POST } = await import("@/app/api/account/verify-email-choice/route.js");

const appel = (corps, ip = "10.0.0.1") =>
  POST(
    new Request("http://localhost/api/account/verify-email-choice", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": ip },
      body: JSON.stringify(corps),
    }),
  );

beforeEach(() => {
  m.payload = { email: "titulaire@x.fr" };
  m.confirm.mockReset();
  m.replace.mockReset();
  m.verifyEmail.mockReset();
  m.verifyEmail.mockResolvedValue({
    status: 200,
    headers: { getSetCookie: () => ["better-auth.session_token=s; Path=/"] },
  });
});

describe("POST /api/account/verify-email-choice", () => {
  it("mauvais mot de passe : message générique, adresse non vérifiée", async () => {
    m.confirm.mockResolvedValue({ ok: false });
    const r = await appel(
      { token: "jeton", action: "confirm", password: "faux" },
      "10.0.0.2",
    );
    expect(r.status).toBe(400);
    expect((await r.json()).error).toMatch(/Mot de passe incorrect/);
    expect(m.verifyEmail).not.toHaveBeenCalled();
  });

  it("bon mot de passe de l'inscription : adresse vérifiée, session ouverte", async () => {
    m.confirm.mockResolvedValue({ ok: true });
    const r = await appel(
      { token: "jeton", action: "confirm", password: "bon" },
      "10.0.0.3",
    );
    expect(r.status).toBe(200);
    expect(m.verifyEmail).toHaveBeenCalledTimes(1);
    expect(r.headers.get("set-cookie")).toMatch(/session_token/);
    expect(m.replace).not.toHaveBeenCalled();
  });

  it("au-delà de 10 essais depuis la même adresse IP : 429, plus aucun essai", async () => {
    m.confirm.mockResolvedValue({ ok: false });
    for (let i = 0; i < 10; i++)
      await appel(
        { token: "jeton", action: "confirm", password: "x" },
        "10.0.0.4",
      );
    m.confirm.mockClear();
    const r = await appel(
      { token: "jeton", action: "confirm", password: "x" },
      "10.0.0.4",
    );
    expect(r.status).toBe(429);
    expect(m.confirm).not.toHaveBeenCalled();
  });

  it("nouveau mot de passe : remplacé avant la vérification", async () => {
    m.replace.mockResolvedValue({ ok: true });
    const r = await appel({
      token: "jeton",
      action: "replace",
      password: "Nouveau-2026!",
    });
    expect(r.status).toBe(200);
    expect(m.replace.mock.calls[0][0].passwordHash).toBe("h:Nouveau-2026!");
    expect(m.replace.mock.invocationCallOrder[0]).toBeLessThan(
      m.verifyEmail.mock.invocationCallOrder[0],
    );
  });

  it("nouveau mot de passe trop court : refusé, rien n'est fait", async () => {
    const r = await appel({
      token: "jeton",
      action: "replace",
      password: "court",
    });
    expect(r.status).toBe(400);
    expect(m.replace).not.toHaveBeenCalled();
    expect(m.verifyEmail).not.toHaveBeenCalled();
  });

  it("lien invalide, lien de changement d'adresse ou action inconnue : refusé", async () => {
    m.payload = null;
    expect(
      (
        await appel(
          { token: "x", action: "confirm", password: "p" },
          "10.0.0.5",
        )
      ).status,
    ).toBe(400);
    m.payload = { email: "a@x.fr", updateTo: "b@x.fr" };
    expect(
      (
        await appel({
          token: "x",
          action: "replace",
          password: "Assez-long-2026",
        })
      ).status,
    ).toBe(400);
    m.payload = { email: "a@x.fr" };
    expect(
      (await appel({ token: "x", action: "autre", password: "p" })).status,
    ).toBe(400);
    expect(m.verifyEmail).not.toHaveBeenCalled();
  });
});
