// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Icônes des signatures de mail : chacun ne touche que ses propres icônes
 * (dossier custom-icons/<son id>/<signature>/) et les couleurs insérées dans
 * les SVG sont des couleurs.
 */

const m = vi.hoisted(() => {
  process.env.CLOUDFLARE_ACCOUNT_ID = "compte";
  process.env.CLOUDFLARE_R2_ACCESS_KEY_ID = "cle";
  process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY = "secret";
  process.env.CLOUDFLARE_R2_BUCKET_NAME = "seau";
  return { getSession: vi.fn(), envois: [] };
});

vi.mock("@/src/lib/auth", () => ({
  auth: { api: { getSession: (...a) => m.getSession(...a) } },
}));

vi.mock("@aws-sdk/client-s3", () => {
  class Commande {
    constructor(input) {
      this.input = input;
    }
  }
  class ListObjectsV2Command extends Commande {}
  class DeleteObjectsCommand extends Commande {}
  class S3Client {
    async send(commande) {
      m.envois.push(commande);
      if (commande instanceof ListObjectsV2Command) {
        return { Contents: [{ Key: `${commande.input.Prefix}facebook.svg` }] };
      }
      return { Deleted: commande.input.Delete.Objects };
    }
  }
  return { S3Client, ListObjectsV2Command, DeleteObjectsCommand };
});

const MOI = "665f1f77bcf86cd799439011";
const AUTRE = "665f1f77bcf86cd799439099";

beforeEach(() => {
  m.envois = [];
  m.getSession.mockReset();
  m.getSession.mockResolvedValue({ user: { id: MOI } });
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

const requete = (method, body, { brut = false } = {}) =>
  new Request("http://localhost/api/x", {
    method,
    headers: { "content-type": "application/json" },
    body: brut ? body : JSON.stringify(body),
  });

const ROUTES = [
  [
    "/api/cloudflare/delete-icons",
    "DELETE",
    () => import("@/app/api/cloudflare/delete-icons/route"),
  ],
  [
    "/api/custom-social-icons/delete",
    "DELETE",
    () => import("@/app/api/custom-social-icons/delete/route"),
  ],
  [
    "/api/custom-social-icons/generate",
    "POST",
    () => import("@/app/api/custom-social-icons/generate/route"),
  ],
  [
    "/api/custom-social-icons/update",
    "PUT",
    () => import("@/app/api/custom-social-icons/update/route"),
  ],
];

describe.each(ROUTES)("%s", (_chemin, method, charger) => {
  const appel = async (body, options) =>
    (await charger())[method](requete(method, body, options));

  it("sans session : 401, rien supprimé", async () => {
    m.getSession.mockResolvedValue(null);
    expect((await appel({ userId: MOI, signatureId: "sig1" })).status).toBe(
      401,
    );
    expect(m.envois).toEqual([]);
  });

  it("icônes d'un autre compte : 403, rien supprimé", async () => {
    expect((await appel({ userId: AUTRE, signatureId: "sig1" })).status).toBe(
      403,
    );
    expect(m.envois).toEqual([]);
  });

  for (const signatureId of [
    "../" + AUTRE,
    "sig/../../x",
    "sig/sous-dossier",
    "..",
    "a".repeat(200),
    "sig 1",
  ]) {
    it(`signature « ${signatureId.slice(0, 30)} » : 400, rien supprimé`, async () => {
      expect((await appel({ userId: MOI, signatureId })).status).toBe(400);
      expect(m.envois).toEqual([]);
    });
  }

  it("objet à la place d'un identifiant : 400", async () => {
    expect(
      (await appel({ userId: { $ne: "" }, signatureId: "sig1" })).status,
    ).toBe(400);
    expect(
      (await appel({ userId: MOI, signatureId: { $ne: "" } })).status,
    ).toBe(400);
  });

  it("JSON invalide : 400 (pas d'erreur serveur)", async () => {
    expect((await appel("{x", { brut: true })).status).toBe(400);
  });
});

describe("/api/cloudflare/delete-icons : dossier visé", () => {
  it("ses propres icônes : seul custom-icons/<son id>/<signature>/ est listé et vidé", async () => {
    const { DELETE } = await import("@/app/api/cloudflare/delete-icons/route");
    const res = await DELETE(
      requete("DELETE", {
        userId: MOI,
        signatureId: "665f1f77bcf86cd7994390aa",
      }),
    );
    expect(res.status).toBe(200);
    const [liste, suppression] = m.envois;
    expect(liste.input.Prefix).toBe(
      `custom-icons/${MOI}/665f1f77bcf86cd7994390aa/`,
    );
    expect(
      suppression.input.Delete.Objects.every((o) =>
        o.Key.startsWith(`custom-icons/${MOI}/`),
      ),
    ).toBe(true);
  });
});

describe("Couleurs des icônes", () => {
  for (const [route, method, charger] of ROUTES.slice(2)) {
    for (const couleur of [
      'red"/><script>alert(1)</script>',
      "url(//x.example)",
      "#12345",
      "rgb(0,0,0)",
    ]) {
      it(`${route} : couleur « ${couleur.slice(0, 20)} » refusée`, async () => {
        const res = await (
          await charger()
        )[method](
          requete(method, {
            userId: MOI,
            signatureId: "sig1",
            socialNetworks: { facebook: "https://facebook.com/moi" },
            socialColors: { facebook: couleur },
          }),
        );
        expect(res.status).toBe(400);
      });
    }

    it(`${route} : couleur hexadécimale acceptée et appliquée`, async () => {
      const res = await (
        await charger()
      )[method](
        requete(method, {
          userId: MOI,
          signatureId: "sig1",
          socialNetworks: { facebook: "https://facebook.com/moi" },
          socialColors: { facebook: "#5B4FFF" },
        }),
      );
      expect(res.status).toBe(200);
      const { customIcons } = await res.json();
      expect(decodeURIComponent(customIcons.facebook)).toContain(
        'fill="#5B4FFF"',
      );
    });
  }
});
