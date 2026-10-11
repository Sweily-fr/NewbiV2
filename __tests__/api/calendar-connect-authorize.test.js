// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ObjectId } from "mongodb";

// Proxy OAuth des agendas Google et Microsoft : l'espace actif est transmis
// à l'API, qui y exige le droit « Modifier » du calendrier.

const mockGetSession = vi.fn();
vi.mock("@/src/lib/auth", () => ({
  auth: { api: { getSession: (...args) => mockGetSession(...args) } },
}));

const mockMongoFindOne = vi.fn();
vi.mock("@/src/lib/mongodb", () => ({
  mongoDb: { collection: () => ({ findOne: mockMongoFindOne }) },
}));

const userId = "507f1f77bcf86cd799439011";
const orgId = "507f1f77bcf86cd799439022";

function buildRequest(headers = {}) {
  return { headers: new Headers({ cookie: "session=abc", ...headers }) };
}

const fetchMock = vi.fn();

beforeEach(() => {
  mockGetSession.mockReset();
  mockMongoFindOne.mockReset();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  mockGetSession.mockResolvedValue({
    user: { id: userId, email: "u@x.fr" },
    session: { activeOrganizationId: orgId },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe.each(["google", "microsoft"])(
  "GET /api/calendar-connect/%s/authorize",
  (provider) => {
    const load = () =>
      import(`@/app/api/calendar-connect/${provider}/authorize/route`);

    it("exige l'espace actif", async () => {
      const { GET } = await load();
      const res = await GET(buildRequest());
      expect(res.status).toBe(400);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("refuse un espace dont l'utilisateur n'est pas membre", async () => {
      mockMongoFindOne.mockResolvedValue(null);
      const { GET } = await load();
      const res = await GET(buildRequest({ "x-workspace-id": orgId }));
      expect(res.status).toBe(403);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("transmet l'espace actif à l'API et relaie son refus", async () => {
      mockMongoFindOne.mockResolvedValue({
        userId: new ObjectId(userId),
        organizationId: new ObjectId(orgId),
        role: "viewer",
      });
      fetchMock.mockResolvedValue(
        new Response(
          JSON.stringify({ error: "FORBIDDEN", message: "Refusé" }),
          { status: 403 },
        ),
      );
      const { GET } = await load();
      const res = await GET(buildRequest({ "x-workspace-id": orgId }));
      expect(res.status).toBe(403);
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toContain(`/calendar-connect/${provider}/authorize`);
      expect(init.headers["x-workspace-id"]).toBe(orgId);
      expect(init.headers.Cookie).toBe("session=abc");
    });

    it("renvoie l'URL d'autorisation de l'API", async () => {
      mockMongoFindOne.mockResolvedValue({
        userId: new ObjectId(userId),
        organizationId: new ObjectId(orgId),
        role: "member",
      });
      fetchMock.mockResolvedValue(
        new Response(JSON.stringify({ authUrl: "https://oauth.test" }), {
          status: 200,
        }),
      );
      const { GET } = await load();
      const res = await GET(buildRequest({ "x-workspace-id": orgId }));
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ authUrl: "https://oauth.test" });
    });
  },
);
