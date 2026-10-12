// @vitest-environment node
//
// Routes de création des clients d'un gestionnaire :
// - /api/admin-service/managed-clients : newbi-admin, jeton de service ;
// - /api/gestionnaire/clients : le cabinet connecté, pour ses seuls clients.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const state = vi.hoisted(() => {
  process.env.RESEND_API_KEY ||= "re_dummy";
  return { manager: null, sessionUser: null, created: [], audit: [] };
});

vi.mock("@/src/lib/mongodb", () => ({
  mongoDb: {
    collection: () => ({
      insertOne: async (doc) => {
        state.audit.push(doc);
      },
    }),
  },
}));

vi.mock("@/src/lib/managed-clients", async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    findActiveAccountManagerByUserId: async () => state.manager,
    listManagedClients: async () => [],
    createManagedClient: async (args) => {
      state.created.push(args);
      if (args.input.email === "pris@x.fr") {
        throw new original.ManagedClientError(409, "Déjà un compte");
      }
      return {
        organizationId: "o1",
        userId: "u1",
        email: args.input.email,
        payer: "manager",
        emailSent: true,
      };
    },
  };
});

vi.mock("@/src/lib/security/require-session", async () => {
  const { apiError } = await import("@/src/lib/security/api-error");
  return {
    requireSession: async () => {
      if (!state.sessionUser) throw apiError(401, "Non authentifié");
      return { user: state.sessionUser };
    },
  };
});

const TOKEN = "s".repeat(40);
const body = {
  managerId: "6acc7b3ced13cd1086578c5c",
  email: "a@b.fr",
  companyName: "X",
};

const adminCall = async ({
  token = TOKEN,
  admin = "admin@newbi.fr",
  payload = body,
} = {}) => {
  const { POST } =
    await import("@/app/api/admin-service/managed-clients/route");
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (admin) headers["x-admin-email"] = admin;
  return POST(
    new Request("http://localhost/api/admin-service/managed-clients", {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    }),
  );
};

const managerCall = async (payload = body) => {
  const { POST } = await import("@/app/api/gestionnaire/clients/route");
  return POST(
    new Request("http://localhost/api/gestionnaire/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  );
};

beforeEach(() => {
  process.env.ADMIN_SERVICE_TOKEN = TOKEN;
  state.manager = null;
  state.sessionUser = null;
  state.created = [];
  state.audit = [];
});
afterEach(() => {
  delete process.env.ADMIN_SERVICE_TOKEN;
});

describe("/api/admin-service/managed-clients", () => {
  it("fermée si le jeton n'est pas configuré", async () => {
    delete process.env.ADMIN_SERVICE_TOKEN;
    expect((await adminCall()).status).toBe(503);
    expect(state.created).toHaveLength(0);
  });

  it("refuse un mauvais jeton ou un admin non identifié", async () => {
    expect((await adminCall({ token: "x".repeat(40) })).status).toBe(401);
    expect((await adminCall({ token: null })).status).toBe(401);
    expect((await adminCall({ admin: null })).status).toBe(400);
    expect(state.created).toHaveLength(0);
  });

  it("crée le client pour le gestionnaire désigné et journalise l'admin", async () => {
    const res = await adminCall();
    expect(res.status).toBe(201);
    expect(state.created[0]).toMatchObject({
      managerId: body.managerId,
      actor: { type: "admin", email: "admin@newbi.fr" },
    });
    expect(state.audit[0]).toMatchObject({
      action: "managed_client_create",
      adminEmail: "admin@newbi.fr",
    });
  });

  it("renvoie le statut et le message d'une erreur métier", async () => {
    const res = await adminCall({ payload: { ...body, email: "pris@x.fr" } });
    expect(res.status).toBe(409);
    expect((await res.json()).error).toBe("Déjà un compte");
  });
});

describe("/api/gestionnaire/clients", () => {
  it("refuse un visiteur non connecté et un utilisateur qui n'est pas gestionnaire", async () => {
    expect((await managerCall()).status).toBe(401);
    state.sessionUser = { id: "u-x", email: "x@x.fr" };
    expect((await managerCall()).status).toBe(403);
    expect(state.created).toHaveLength(0);
  });

  it("crée pour SON gestionnaire, jamais celui envoyé dans la requête", async () => {
    state.sessionUser = { id: "u-sophie", email: "sophie@dupont.fr" };
    state.manager = { _id: "manager-de-sophie", name: "Compta Dupont" };
    const res = await managerCall({ ...body, managerId: "manager-d-un-autre" });
    expect(res.status).toBe(201);
    expect(state.created[0]).toMatchObject({
      managerId: "manager-de-sophie",
      actor: { type: "manager", email: "sophie@dupont.fr" },
    });
  });
});
