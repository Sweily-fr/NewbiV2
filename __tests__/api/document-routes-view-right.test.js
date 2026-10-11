// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ObjectId } from "mongodb";

/**
 * Routes du site qui lisent un document de vente (`/api/<type>/data/[id]`,
 * `/api/<type>/generate-pdf`) et la liste des membres : le droit « Voir » de
 * la page est exigé, pas seulement l'appartenance à l'espace. Un rôle
 * personnalisé sans « Voir » ne doit rien lire. Puppeteer (secret interne,
 * sans session) garde son accès.
 */

const m = vi.hoisted(() => ({
  getSession: vi.fn(),
  memberFindOne: vi.fn(),
  memberAggregate: vi.fn(),
  storedRoles: vi.fn(async () => []),
  docFindOne: vi.fn(),
  invitations: vi.fn(async () => []),
  launchBrowser: vi.fn(),
}));

vi.mock("@/src/lib/auth", () => ({
  auth: { api: { getSession: (...args) => m.getSession(...args) } },
}));

const DOC_COLLECTIONS = [
  "invoices",
  "quotes",
  "creditnotes",
  "purchaseorders",
  "deliverynotes",
];

vi.mock("@/src/lib/mongodb", () => ({
  mongoDb: {
    collection: (name) => {
      if (name === "member") {
        return {
          findOne: m.memberFindOne,
          aggregate: () => ({ toArray: m.memberAggregate }),
        };
      }
      if (name === "organizationRole") {
        return { find: () => ({ toArray: m.storedRoles }) };
      }
      if (name === "invitation") {
        return { find: () => ({ toArray: m.invitations }) };
      }
      if (name === "clients") return { findOne: async () => null };
      if (DOC_COLLECTIONS.includes(name)) {
        return {
          findOne: (...args) => m.docFindOne(name, ...args),
          find: () => ({ toArray: async () => [] }),
        };
      }
      throw new Error(`Collection inattendue : ${name}`);
    },
  },
}));

vi.mock("@/src/lib/document-company-info", () => ({
  resolveCompanyInfo: async () => ({ name: "Espace" }),
  resolveBeneficiary: async () => ({
    beneficiaryNameType: null,
    userName: null,
  }),
}));

const PDF_BYTES = Buffer.from("%PDF-1.4 document");

vi.mock("@/src/lib/puppeteer", () => ({
  launchBrowser: (...args) => m.launchBrowser(...args),
  securePdfPage: async () => {},
}));
vi.mock("@/src/lib/vectorPdf", () => ({
  VECTOR_PDF_ENABLED: true,
  generateVectorPdf: async () => PDF_BYTES,
}));
vi.mock("@/src/lib/document-annex-server", () => ({
  appendDocumentAnnex: async (buffer) => buffer,
}));

const userId = "507f1f77bcf86cd799439011";
const orgId = "507f1f77bcf86cd799439022";
const docId = "507f1f77bcf86cd799439033";

const DOCUMENT_ROUTES = [
  {
    type: "invoices",
    collection: "invoices",
    moduleKey: "invoices",
    idKey: "invoiceId",
  },
  {
    type: "quotes",
    collection: "quotes",
    moduleKey: "quotes",
    idKey: "quoteId",
  },
  {
    type: "credit-notes",
    collection: "creditnotes",
    moduleKey: "creditNotes",
    idKey: "creditNoteId",
  },
  {
    type: "purchase-orders",
    collection: "purchaseorders",
    moduleKey: "purchaseOrders",
    idKey: "purchaseOrderId",
  },
  {
    type: "delivery-notes",
    collection: "deliverynotes",
    moduleKey: "deliveryNotes",
    idKey: "deliveryNoteId",
  },
];

function signIn() {
  m.getSession.mockResolvedValue({
    user: { id: userId, email: "u@x.fr" },
    session: { activeOrganizationId: orgId },
  });
}

function asRole(role, storedRoles = []) {
  m.memberFindOne.mockResolvedValue({
    userId: new ObjectId(userId),
    organizationId: new ObjectId(orgId),
    role,
  });
  m.storedRoles.mockResolvedValue(storedRoles);
}

/** Rôle personnalisé qui voit tout sauf la page `moduleKey`. */
function customRoleWithout(moduleKey) {
  const actions = {
    invoices: ["view"],
    creditNotes: ["view"],
    quotes: ["view"],
    purchaseOrders: ["view"],
    deliveryNotes: ["view"],
    team: ["view"],
    [moduleKey]: [],
  };
  asRole("role_terrain", [{ role: "role_terrain", actions }]);
}

function fakeBrowser() {
  const page = { goto: vi.fn(async () => {}) };
  return {
    newPage: vi.fn(async () => page),
    close: vi.fn(async () => {}),
  };
}

const dataRequest = (type, headers = {}) =>
  new Request(`http://localhost/api/${type}/data/${docId}`, { headers });

const pdfRequest = (type, body) =>
  new Request(`http://localhost/api/${type}/generate-pdf`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "log").mockImplementation(() => {});
  process.env.INTERNAL_API_SECRET = "secret-interne";
  m.storedRoles.mockResolvedValue([]);
  m.docFindOne.mockImplementation(async () => ({
    _id: new ObjectId(docId),
    workspaceId: new ObjectId(orgId),
    number: "0001",
    items: [],
  }));
  m.launchBrowser.mockImplementation(async () => fakeBrowser());
});

afterEach(() => {
  delete process.env.INTERNAL_API_SECRET;
});

describe.each(DOCUMENT_ROUTES)(
  "GET /api/$type/data/[id]",
  ({ type, moduleKey }) => {
    const call = async (headers) => {
      const { GET } = await import(`@/app/api/${type}/data/[id]/route.js`);
      return GET(dataRequest(type, headers), {
        params: Promise.resolve({ id: docId }),
      });
    };

    it("refuse un rôle personnalisé sans « Voir » sur la page", async () => {
      signIn();
      customRoleWithout(moduleKey);
      const res = await call();
      expect(res.status).toBe(403);
    });

    it("sert le document au rôle « Membre » (lecture seule)", async () => {
      signIn();
      asRole("viewer");
      const res = await call();
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.id).toBe(docId);
      expect(body.number).toBe("0001");
    });

    it("refuse un utilisateur d'un autre espace", async () => {
      signIn();
      m.memberFindOne.mockResolvedValue(null);
      const res = await call();
      expect(res.status).toBe(403);
    });

    it("reste ouverte à Puppeteer avec le secret interne, sans session", async () => {
      const res = await call({ "x-internal-secret": "secret-interne" });
      expect(res.status).toBe(200);
      expect(m.getSession).not.toHaveBeenCalled();
      expect(m.memberFindOne).not.toHaveBeenCalled();
    });
  },
);

describe.each(DOCUMENT_ROUTES)(
  "POST /api/$type/generate-pdf",
  ({ type, moduleKey, idKey }) => {
    const call = async (body = { [idKey]: docId }) => {
      const { POST } = await import(`@/app/api/${type}/generate-pdf/route.js`);
      return POST(pdfRequest(type, body));
    };

    it("refuse un rôle personnalisé sans « Voir », avant de lancer Chromium", async () => {
      signIn();
      customRoleWithout(moduleKey);
      const res = await call();
      expect(res.status).toBe(403);
      expect(m.launchBrowser).not.toHaveBeenCalled();
    });

    it("génère le PDF pour un rôle qui voit la page (réponse inchangée)", async () => {
      signIn();
      asRole("member");
      const res = await call();
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toBe("application/pdf");
      expect(Buffer.from(await res.arrayBuffer())).toEqual(PDF_BYTES);
    });
  },
);

describe("POST /api/quotes/generate-pdf (app mobile)", () => {
  it("accepte un rôle personnalisé qui crée des devis (« Voir » déduit)", async () => {
    signIn();
    asRole("role_commercial", [
      { role: "role_commercial", actions: { quotes: ["create", "send"] } },
    ]);
    const { POST } = await import("@/app/api/quotes/generate-pdf/route.js");
    const res = await POST(pdfRequest("quotes", { quoteId: docId }));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-disposition")).toContain(
      `quote-${docId}.pdf`,
    );
  });
});

describe("GET /api/organizations/[organizationId]/members", () => {
  const ownerRow = {
    _id: new ObjectId(),
    id: "m-owner",
    role: "owner",
    status: "active",
    createdAt: new Date("2026-01-01"),
    email: "patron@x.fr",
    name: "Patron",
    avatar: "https://pub-x.r2.dev/patron.png",
    type: "member",
  };
  const colleagueRow = {
    _id: new ObjectId(),
    id: "m-colleague",
    role: "role_terrain",
    status: "active",
    createdAt: new Date("2026-02-01"),
    email: "collegue@x.fr",
    name: "Collègue",
    avatar: null,
    type: "member",
  };

  const call = async () => {
    const { GET } =
      await import("@/app/api/organizations/[organizationId]/members/route.js");
    return GET(
      new Request(`http://localhost/api/organizations/${orgId}/members`),
      {
        params: Promise.resolve({ organizationId: orgId }),
      },
    );
  };

  beforeEach(() => {
    m.memberAggregate.mockResolvedValue([ownerRow, colleagueRow]);
    m.invitations.mockResolvedValue([
      {
        _id: new ObjectId(),
        email: "invite@x.fr",
        role: "admin",
        status: "pending",
        createdAt: new Date(),
      },
    ]);
  });

  it("sans « Voir les membres » : identité des membres seulement", async () => {
    signIn();
    customRoleWithout("team");
    const res = await call();
    expect(res.status).toBe(200);
    const { success, data } = await res.json();
    expect(success).toBe(true);
    // Ni invitations, ni rôles des autres, ni statuts ou dates
    expect(data).toEqual([
      {
        id: "m-owner",
        email: "patron@x.fr",
        name: "Patron",
        avatar: "https://pub-x.r2.dev/patron.png",
        type: "member",
        role: "owner",
      },
      {
        id: "m-colleague",
        email: "collegue@x.fr",
        name: "Collègue",
        avatar: null,
        type: "member",
      },
    ]);
    expect(m.invitations).not.toHaveBeenCalled();
  });

  it("avec « Voir les membres » : rôles, statuts et invitations", async () => {
    signIn();
    asRole("viewer");
    const res = await call();
    expect(res.status).toBe(200);
    const { data } = await res.json();
    expect(data).toHaveLength(3);
    expect(data[1]).toMatchObject({ role: "role_terrain", status: "active" });
    expect(data[2]).toMatchObject({
      type: "invitation",
      email: "invite@x.fr",
      role: "admin",
    });
  });

  it("refuse un utilisateur d'un autre espace", async () => {
    signIn();
    m.memberFindOne.mockResolvedValue(null);
    const res = await call();
    expect(res.status).toBe(403);
    expect(m.memberAggregate).not.toHaveBeenCalled();
  });
});
