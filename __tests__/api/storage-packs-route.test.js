// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ObjectId } from "mongodb";

/**
 * Route des packs de stockage : « Voir l'abonnement » pour lire,
 * « Gérer l'abonnement » pour acheter ou retirer.
 */

const m = vi.hoisted(() => ({
  getSession: vi.fn(),
  memberFindOne: vi.fn(),
  setStoragePacks: vi.fn(),
  paidByManager: vi.fn(async () => false),
}));

vi.mock("@/src/lib/auth", () => ({
  auth: { api: { getSession: (...args) => m.getSession(...args) } },
}));

vi.mock("@/src/lib/mongodb", () => ({
  mongoDb: {
    collection: (name) => {
      if (name === "member") return { findOne: m.memberFindOne };
      if (name === "organizationRole") {
        return { find: () => ({ toArray: async () => [] }) };
      }
      return {
        findOne: async () => null,
        find: () => ({ toArray: async () => [] }),
      };
    },
  },
}));

vi.mock("next/headers", () => ({ headers: async () => new Headers() }));

vi.mock("@/src/lib/manager-billing", () => ({
  isOrgPaidByManager: (...args) => m.paidByManager(...args),
}));

vi.mock("@/src/lib/storage-packs", async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    setStoragePacks: (...args) => m.setStoragePacks(...args),
  };
});

vi.mock("stripe", () => ({
  default: function Stripe() {
    return {};
  },
}));

const userId = "507f1f77bcf86cd799439011";
const orgId = "507f1f77bcf86cd799439022";

function signIn() {
  m.getSession.mockResolvedValue({
    user: { id: userId, email: "u@x.fr" },
    session: { activeOrganizationId: orgId },
  });
}

function asRole(role) {
  m.memberFindOne.mockResolvedValue({
    userId: new ObjectId(userId),
    organizationId: new ObjectId(orgId),
    role,
  });
}

const post = async (body) => {
  const { POST } = await import("@/app/api/billing/storage-packs/route");
  return POST(
    new Request("http://localhost/api/billing/storage-packs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
};

const get = async (query) => {
  const { GET } = await import("@/app/api/billing/storage-packs/route");
  return GET(
    new Request(`http://localhost/api/billing/storage-packs?${query}`),
  );
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  m.paidByManager.mockResolvedValue(false);
  vi.stubEnv("STRIPE_STORAGE_PACK_MONTHLY_PRICE_ID", "price_pack_m");
  vi.stubEnv("STRIPE_STORAGE_PACK_YEARLY_PRICE_ID", "");
});

afterEach(() => vi.unstubAllEnvs());

describe("GET /api/billing/storage-packs", () => {
  it("dit quels intervalles ont un prix de pack configuré", async () => {
    signIn();
    asRole("owner");
    const res = await get(`organizationId=${orgId}`);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      available: { month: true, year: false },
      packGb: 50,
    });
  });

  it("refuse un membre qui ne voit pas l'abonnement", async () => {
    signIn();
    asRole("viewer");
    expect((await get(`organizationId=${orgId}`)).status).toBe(403);
  });
});

describe("POST /api/billing/storage-packs", () => {
  it("refuse sans session", async () => {
    m.getSession.mockResolvedValue(null);
    expect((await post({ organizationId: orgId, quantity: 1 })).status).toBe(
      401,
    );
  });

  it("refuse un administrateur qui voit l'abonnement sans le gérer", async () => {
    signIn();
    asRole("admin");
    const res = await post({ organizationId: orgId, quantity: 1 });
    expect(res.status).toBe(403);
    expect(m.setStoragePacks).not.toHaveBeenCalled();
  });

  it("refuse un identifiant d'espace invalide", async () => {
    signIn();
    asRole("owner");
    expect((await post({ organizationId: "x", quantity: 1 })).status).toBe(400);
  });

  it("refuse l'espace payé par un cabinet", async () => {
    signIn();
    asRole("owner");
    m.paidByManager.mockResolvedValue(true);
    expect((await post({ organizationId: orgId, quantity: 1 })).status).toBe(
      409,
    );
    expect(m.setStoragePacks).not.toHaveBeenCalled();
  });

  it("modifie les packs pour le propriétaire", async () => {
    signIn();
    asRole("owner");
    m.setStoragePacks.mockResolvedValue({ quantity: 2, interval: "month" });
    const res = await post({ organizationId: orgId, quantity: 2 });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ success: true, quantity: 2 });
    expect(m.setStoragePacks.mock.calls[0][0]).toMatchObject({
      organizationId: orgId,
      quantity: 2,
    });
  });

  it("renvoie le refus lisible d'un retrait qui ferait dépasser", async () => {
    signIn();
    asRole("owner");
    const { StoragePackError } = await import("@/src/lib/storage-packs");
    m.setStoragePacks.mockRejectedValue(
      new StoragePackError(
        409,
        "Impossible de retirer ce stockage : l'espace utilisé dépasserait le quota.",
      ),
    );
    const res = await post({ organizationId: orgId, quantity: 0 });
    expect(res.status).toBe(409);
    expect((await res.json()).error).toMatch(/dépasserait le quota/);
  });
});
