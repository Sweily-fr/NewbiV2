// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ObjectId } from "mongodb";

/**
 * Énumération de comptes : les deux routes publiques qui disent si une
 * adresse a un compte sont limitées par IP et ne répondent que le strict
 * nécessaire.
 */

const m = vi.hoisted(() => ({
  userFindOne: vi.fn(),
  invitationFindOne: vi.fn(),
}));

vi.mock("@/src/lib/mongodb", () => ({
  ensureConnection: async () => ({
    collection: (name) => {
      if (name === "user") return { findOne: m.userFindOne };
      if (name === "invitation") return { findOne: m.invitationFindOne };
      throw new Error(`Collection inattendue : ${name}`);
    },
  }),
}));

const invitationId = new ObjectId().toString();
let ipCounter = 0;
const nextIp = () => `10.0.0.${++ipCounter}`;

const post = (path, body, ip = nextIp()) =>
  new Request(`http://localhost${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("POST /api/users/check-email", () => {
  const call = async (body, ip) => {
    const { POST } = await import("@/app/api/users/check-email/route");
    return POST(post("/api/users/check-email", body, ip));
  };

  it("ne répond pas pour une adresse sans invitation", async () => {
    m.userFindOne.mockResolvedValue({ _id: "u1" });
    const res = await call({ email: "cible@example.com" });
    expect(res.status).toBe(400);
    expect(m.userFindOne).not.toHaveBeenCalled();
  });

  it("répond exists:false si l'adresse n'est pas celle de l'invitation", async () => {
    m.invitationFindOne.mockResolvedValue({
      email: "invite@example.com",
      status: "pending",
    });
    m.userFindOne.mockResolvedValue({ _id: "u1" });
    const res = await call({ email: "cible@example.com", invitationId });
    expect(await res.json()).toEqual({ exists: false });
    expect(m.userFindOne).not.toHaveBeenCalled();
  });

  it("répond exists:false pour une invitation déjà traitée", async () => {
    m.invitationFindOne.mockResolvedValue({
      email: "invite@example.com",
      status: "accepted",
    });
    m.userFindOne.mockResolvedValue({ _id: "u1" });
    const res = await call({ email: "invite@example.com", invitationId });
    expect(await res.json()).toEqual({ exists: false });
  });

  it("dit si l'adresse invitée a déjà un compte, sans la renvoyer", async () => {
    m.invitationFindOne.mockResolvedValue({
      email: "Invite@Example.com",
      status: "pending",
      expiresAt: new Date(Date.now() + 3600_000),
    });
    m.userFindOne.mockResolvedValue({ _id: "u1" });
    const res = await call({ email: "invite@example.com", invitationId });
    expect(await res.json()).toEqual({ exists: true });
  });

  it("limite le nombre de vérifications par IP", async () => {
    m.invitationFindOne.mockResolvedValue(null);
    const ip = "192.168.1.50";
    const statuses = [];
    for (let i = 0; i < 21; i++) {
      statuses.push(
        (await call({ email: `x${i}@e.fr`, invitationId }, ip)).status,
      );
    }
    expect(statuses.slice(0, 20).every((s) => s === 200)).toBe(true);
    expect(statuses[20]).toBe(429);
  });
});

describe("POST /api/auth/check-user", () => {
  const call = async (body, ip) => {
    const { POST } = await import("@/app/api/auth/check-user/route");
    return POST(post("/api/auth/check-user", body, ip));
  };

  it("ne révèle pas l'existence d'un compte vérifié", async () => {
    m.userFindOne.mockResolvedValue({ emailVerified: true });
    const res = await call({ email: "cible@example.com" });
    expect(await res.json()).toEqual({ needsVerification: false });
  });

  it("même réponse pour une adresse inconnue", async () => {
    m.userFindOne.mockResolvedValue(null);
    const res = await call({ email: "inconnu@example.com" });
    expect(await res.json()).toEqual({ needsVerification: false });
  });

  it("propose la vérification d'une adresse non vérifiée", async () => {
    m.userFindOne.mockResolvedValue({ emailVerified: false });
    const res = await call({ email: "a@example.com" });
    expect(await res.json()).toEqual({ needsVerification: true });
  });

  it("limite le nombre de vérifications par IP", async () => {
    m.userFindOne.mockResolvedValue(null);
    const ip = "192.168.1.60";
    let last;
    for (let i = 0; i < 21; i++) {
      last = await call({ email: `x${i}@e.fr` }, ip);
    }
    expect(last.status).toBe(429);
  });
});
