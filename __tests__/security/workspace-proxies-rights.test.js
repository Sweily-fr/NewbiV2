// @vitest-environment node
//
// Proxys du site vers l'API qui portent un espace choisi par le navigateur
// (en-tête x-workspace-id, paramètre organizationId, chemin d'annexe) :
// l'appartenance et le rôle sont vérifiés avant tout appel à l'API, et un
// refus de l'API ne laisse passer aucun octet du fichier.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

const USER_ID = "507f1f77bcf86cd799439011";
const ORG_ID = "507f1f77bcf86cd799439022";
const ORG_AUTRE = "507f1f77bcf86cd799439033";

const etat = vi.hoisted(() => {
  process.env.RESEND_API_KEY ||= "re_dummy";
  process.env.STRIPE_SECRET_KEY ||= "sk_test_dummy";
  // Rôle de l'utilisateur par espace ; absent = pas membre
  return { roles: {} };
});

vi.mock("@/src/lib/mongodb", () => ({
  mongoDb: {
    collection: (name) => {
      if (name === "member") {
        return {
          findOne: async ({ organizationId }) => {
            const role = etat.roles[String(organizationId)];
            return role ? { role } : null;
          },
        };
      }
      if (name === "organizationRole") {
        return {
          find: () => ({ toArray: async () => [] }),
          findOne: async () => null,
        };
      }
      return { findOne: async () => null };
    },
  },
}));

vi.mock("@/src/lib/security", async (importOriginal) => ({
  ...(await importOriginal()),
  requireSession: vi.fn(async () => ({
    user: { id: USER_ID, email: "moi@exemple.fr" },
    cookieHeader: "session=x",
  })),
  requireActiveSubscription: vi.fn(async () => true),
}));

const api = vi.fn(
  async () =>
    new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
);

beforeEach(() => {
  api.mockClear();
  vi.stubGlobal("fetch", api);
  etat.roles = { [ORG_ID]: "owner" };
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const requete = (url, { method = "GET", headers = {}, body } = {}) =>
  new NextRequest(`http://localhost${url}`, {
    method,
    headers: { cookie: "session=x", ...headers },
    body,
  });

// --- Banque : comptes, statut de connexion, synchronisations --------------------

const BANQUE = [
  ["banking/accounts", "GET"],
  ["banking-connect/status", "GET"],
  ["banking-sync/accounts", "POST"],
  ["banking-sync/full", "POST"],
  ["banking-sync/transactions", "POST"],
];

async function appelBanque(chemin, method, espace) {
  const mod = await import(`@/app/api/${chemin}/route`);
  return mod[method](
    requete(`/api/${chemin}`, {
      method,
      headers: espace ? { "x-workspace-id": espace } : {},
      body: method === "POST" ? "{}" : undefined,
    }),
  );
}

describe.each(BANQUE)("/api/%s", (chemin, method) => {
  it("espace d'une autre entreprise : 403 avant tout appel à l'API", async () => {
    const res = await appelBanque(chemin, method, ORG_AUTRE);
    expect(res.status).toBe(403);
    expect(api).not.toHaveBeenCalled();
  });

  it("sans en-tête d'espace : 400, aucun appel", async () => {
    const res = await appelBanque(chemin, method, null);
    expect(res.status).toBe(400);
    expect(api).not.toHaveBeenCalled();
  });

  it("identifiant d'espace mal formé : 400, aucun appel", async () => {
    const res = await appelBanque(chemin, method, "../admin");
    expect(res.status).toBe(400);
    expect(api).not.toHaveBeenCalled();
  });

  it("membre de l'espace : appel transmis avec cet espace seulement", async () => {
    const res = await appelBanque(chemin, method, ORG_ID);
    expect(res.status).toBe(200);
    expect(api).toHaveBeenCalledTimes(1);
    const [, options] = api.mock.calls[0];
    expect(new Headers(options.headers).get("x-workspace-id")).toBe(ORG_ID);
  });
});

it("synchronisation par un Membre en lecture seule : le refus de l'API est rendu tel quel", async () => {
  etat.roles = { [ORG_ID]: "viewer" };
  api.mockResolvedValueOnce(
    new Response(JSON.stringify({ error: "Droit « Synchroniser » requis" }), {
      status: 403,
      headers: { "content-type": "application/json" },
    }),
  );
  const res = await appelBanque("banking-sync/full", "POST", ORG_ID);
  expect(res.status).toBe(403);
  expect((await res.json()).error).toMatch(/Synchroniser/);
});

// --- Facturation électronique (SuperPDP) -----------------------------------------

async function superpdp(route, organizationId) {
  const mod = await import(`@/app/api/superpdp/${route}/route`);
  if (route === "disconnect") {
    return mod.POST(
      requete("/api/superpdp/disconnect", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ organizationId }),
      }),
    );
  }
  return mod.GET(
    requete(`/api/superpdp/${route}?organizationId=${organizationId}`),
  );
}

describe("SuperPDP : activer et désactiver demandent de gérer les applications", () => {
  for (const route of ["authorize", "disconnect"]) {
    for (const [libelle, role] of [
      ["Membre (lecture seule)", "viewer"],
      ["Comptable", "accountant"],
      ["Éditeur", "member"],
    ]) {
      it(`${route} par un ${libelle} : 403, aucun appel`, async () => {
        etat.roles = { [ORG_ID]: role };
        const res = await superpdp(route, ORG_ID);
        expect(res.status).toBe(403);
        expect(api).not.toHaveBeenCalled();
      });
    }

    it(`${route} sur l'espace d'une autre entreprise : 403, aucun appel`, async () => {
      const res = await superpdp(route, ORG_AUTRE);
      expect(res.status).toBe(403);
      expect(api).not.toHaveBeenCalled();
    });

    it(`${route} par le propriétaire : transmis pour son espace`, async () => {
      const res = await superpdp(route, ORG_ID);
      expect(res.status).toBe(200);
      const [url, options] = api.mock.calls[0];
      expect(`${url} ${options?.body || ""}`).toContain(ORG_ID);
    });
  }

  it("statut d'un espace dont on n'est pas membre : 403, aucun appel", async () => {
    const res = await superpdp("status", ORG_AUTRE);
    expect(res.status).toBe(403);
    expect(api).not.toHaveBeenCalled();
  });

  it("organizationId mal formé : 400, aucun appel", async () => {
    const res = await superpdp("status", "x%22%7D");
    expect(res.status).toBe(400);
    expect(api).not.toHaveBeenCalled();
  });
});

// --- Annexes des documents ----------------------------------------------------------

const UUID = "3f2b8a40-1c2d-4e5f-8a9b-0c1d2e3f4a5b";

async function annexe(workspaceId, fileId, { cookie = true } = {}) {
  const { GET } =
    await import("@/app/api/document-annex/[workspaceId]/[fileId]/route");
  return GET(
    new NextRequest(
      `http://localhost/api/document-annex/${workspaceId}/${fileId}`,
      {
        headers: cookie ? { cookie: "session=x" } : {},
      },
    ),
    { params: Promise.resolve({ workspaceId, fileId }) },
  );
}

describe("/api/document-annex/[workspaceId]/[fileId]", () => {
  it("sans cookie : 401, aucun appel", async () => {
    const res = await annexe(ORG_ID, `${UUID}.pdf`, { cookie: false });
    expect(res.status).toBe(401);
    expect(api).not.toHaveBeenCalled();
  });

  for (const fichier of [
    "../x.pdf",
    "x.pdf",
    `${UUID}.svg`,
    `${UUID}.pdf/../../y`,
    `${UUID.toUpperCase()}.pdf`,
  ]) {
    it(`fichier « ${fichier} » : 400, aucun appel`, async () => {
      const res = await annexe(ORG_ID, fichier);
      expect(res.status).toBe(400);
      expect(api).not.toHaveBeenCalled();
    });
  }

  it("espace mal formé : 400, aucun appel", async () => {
    expect((await annexe("..%2F..", `${UUID}.pdf`)).status).toBe(400);
    expect(api).not.toHaveBeenCalled();
  });

  it("refus de l'API (autre entreprise) : 403 rendu sans aucun octet du fichier", async () => {
    api.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Accès refusé" }), {
        status: 403,
        headers: { "content-type": "application/json" },
      }),
    );
    const res = await annexe(ORG_AUTRE, `${UUID}.pdf`);
    expect(res.status).toBe(403);
    expect(res.headers.get("content-type")).toMatch(/json/);
    expect(await res.text()).not.toContain("%PDF");
  });

  it("annexe servie : PDF, en-têtes fixés par le site, cache privé", async () => {
    api.mockResolvedValueOnce(
      new Response("%PDF-1.7 contenu", {
        status: 200,
        headers: {
          "content-type": "text/html",
          "content-disposition": "inline; filename=x.html",
        },
      }),
    );
    const res = await annexe(ORG_ID, `${UUID}.pdf`);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/pdf");
    expect(res.headers.get("content-disposition")).toBe(
      'inline; filename="annexe.pdf"',
    );
    expect(res.headers.get("cache-control")).toMatch(/^private/);
    expect(String(api.mock.calls[0][0])).toMatch(
      new RegExp(`/document-annexes/${ORG_ID}/${UUID}\\.pdf$`),
    );
  });
});
