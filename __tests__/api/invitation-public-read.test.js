// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ObjectId } from "mongodb";

/**
 * GET /api/invitations/[id] : lisible sans session (page d'invitation avant
 * connexion), donc limitée par adresse et réduite à ce que la page affiche.
 */

const m = vi.hoisted(() => ({ invitation: null }));

vi.mock("@/src/lib/auth", () => ({ auth: { api: { getSession: vi.fn() } } }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("@/src/lib/auth-utils", () => ({ sendEmail: vi.fn() }));
vi.mock("@/src/lib/email-templates", () => ({ emailTemplates: {} }));
vi.mock("@/src/lib/mongodb", () => ({
  mongoDb: {
    collection: (name) => ({
      findOne: async () => {
        if (name === "invitation") return m.invitation;
        if (name === "organization") return { name: "Atelier Lumière" };
        return null;
      },
    }),
  },
}));

const orgId = new ObjectId();
const inviterId = new ObjectId();

let ip = 0;
const lire = async (id, adresse) => {
  const { GET } = await import("@/app/api/invitations/[id]/route");
  return GET(
    new Request(`http://localhost/api/invitations/${id}`, {
      headers: { "x-forwarded-for": adresse || `192.0.2.${(ip++ % 250) + 1}` },
    }),
    { params: Promise.resolve({ id }) },
  );
};

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  m.invitation = {
    _id: new ObjectId(),
    email: "invitee@exemple.fr",
    organizationId: orgId,
    inviterId,
    role: "member",
    status: "pending",
    expiresAt: new Date(Date.now() + 86_400_000),
  };
});

describe("GET /api/invitations/[id]", () => {
  it("renvoie seulement l'espace, le rôle, le statut et l'échéance", async () => {
    const res = await lire(m.invitation._id.toString());
    expect(res.status).toBe(200);
    const corps = await res.json();
    expect(Object.keys(corps).sort()).toEqual(
      [
        "expiresAt",
        "id",
        "organizationName",
        "role",
        "roleName",
        "status",
      ].sort(),
    );
    const texte = JSON.stringify(corps);
    expect(texte).not.toContain("invitee@exemple.fr");
    expect(texte).not.toContain(orgId.toString());
    expect(texte).not.toContain(inviterId.toString());
  });

  it("identifiant mal formé : 404 (pas d'erreur serveur)", async () => {
    expect((await lire("pas-un-id")).status).toBe(404);
    expect((await lire("../../x")).status).toBe(404);
  });

  it("invitation inexistante : 404", async () => {
    m.invitation = null;
    expect((await lire(new ObjectId().toString())).status).toBe(404);
  });

  it("lectures en série depuis une même adresse : 429 au-delà de 60", async () => {
    m.invitation = null;
    const statuts = [];
    for (let i = 0; i < 70; i++) {
      statuts.push(
        (await lire(new ObjectId().toString(), "198.51.100.42")).status,
      );
    }
    expect(statuts.slice(0, 60).every((s) => s === 404)).toBe(true);
    expect(statuts.slice(60).every((s) => s === 429)).toBe(true);
    // Une autre adresse n'est pas touchée
    expect(
      (await lire(new ObjectId().toString(), "198.51.100.43")).status,
    ).toBe(404);
  });
});
